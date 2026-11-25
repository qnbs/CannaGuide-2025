#!/usr/bin/env node
/**
 * Ensures localStorage/sessionStorage usage stays within the allowlist
 * (IndexedDB-first persistence; localStorage only for small non-secret flags).
 *
 * Every storage call in the web app's source is checked, whatever form its key takes:
 * - a string literal is checked directly;
 * - a constant is resolved in the same file, or through a named import or re-export;
 * - anything else (a call, a template, a parameter) has to be listed in
 *   REVIEWED_DYNAMIC_KEYS with the keys it produces, so a new dynamic key fails until
 *   someone reviews it, and an entry whose call is gone fails as stale;
 * - every zustand `persist(...)` call (also under an import alias or `ns.persist`) is a store
 *   written under its `name`, to localStorage unless a readable `storage` option says
 *   otherwise. A store whose name or storage cannot be read, or a `createJSONStorage` outside
 *   a persist call, counts as computed and needs a review entry.
 *
 * Before 2026-11-24 the check read literal keys only. On `main` at v1.12.2 that was 6 of
 * 106 storage calls: the other 100 pass a constant or a computed key and were never checked,
 * and the persisted IoT store was not seen at all.
 *
 * Exits 1 on an unknown key, an unreviewed dynamic key, or a stale review entry.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, normalize, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const APP = 'apps/web'

/**
 * Prefixes or exact keys permitted without an ADR exception. The list is exactly as wide
 * as the source needs: a pattern no key uses fails as stale, so a removed key cannot leave
 * an allowance behind. Sixteen such patterns were removed on 2026-11-24, among them
 * `gemini_key_`, `openai_key_`, `xai_key_` and `anthropic_key_`, which allowed raw provider
 * keys in localStorage long after they moved to encrypted IndexedDB.
 */
export const ALLOWED_PATTERNS = [
    /^cg\.onboarding\./,
    // The IoT MQTT settings exception (apps/web/CLAUDE.md, WEB-03): useIotStore persists
    // selected settings with encryptedPassword, never the plaintext password.
    /^cannaguide-iot-settings$/,
    /^cg\.ai\.provider\./,
    /^cg\.voice\./,
    /^cg\.localai\./,
    /^cg\.ageVerified/,
    /^cg\.geoLegal/,
    /^cg\.pwa\./,
    // Reviewed 2026-11-24, when the check first saw constant and computed keys. None
    // holds a secret or a user payload.
    // Recovery, persistence and device session flags.
    /^cannaguide\.(recoveryEpoch|safeRecoveryAttempted|persistenceTabId|batteryGatingNotified|ecoModeNotified)$/,
    /^cannaguide\.pendingSnapshotSaveFailure:/,
    // PWA install and banner state, command history, coach cooldown.
    /^cannaGuidePwaInstalled$/,
    /^cannaguide-pwa-banner-(dismissed|later)$/,
    /^cannaguide_recent_commands$/,
    /^cannaguide_coach_cooldown$/,
    // AI settings and usage counters; the audit log holds a timestamp and an endpoint,
    // never a prompt or a response, and the key metadata only its update time.
    /^cg\.ai\.(activeProvider|auditLog|costTracker|monthlyBudget|clear-on-exit\.pending)$/,
    /^cg\.ai\.consent\./,
    /^cg\.gemini\.apiKey\.meta\.v1$/,
    /^cg\.image\.ai\.consent\.v1$/,
    /^cg\.reminders\.lastNotified$/,
    // Caches of public data: the daily strain feed and the strain-lookup session cache.
    /^cg\.daily-drop\.(feed|dismissed)$/,
    /^cg\.sl\./,
    // Installed plugin manifests.
    /^installed_plugins_v1$/,
]

/**
 * Keys an older build wrote that current code only reads once and removes (migrations
 * to IndexedDB). Writing one again fails: it is not in ALLOWED_PATTERNS.
 */
export const LEGACY_READ_REMOVE = [/^cg\.crypto\.key\.v1$/, /^cg\.gdpr\.consent\.v1$/]

/**
 * Storage calls whose key is computed. Each entry names the file, the exact key
 * expression, the methods it may use, and an example key it produces; the example must
 * pass the allowlist unless the site only reads every key for the user's own export.
 */
export const REVIEWED_DYNAMIC_KEYS = [
    {
        file: 'apps/web/services/aiConsentService.ts',
        expression: 'consentKey(provider)',
        methods: ['getItem', 'setItem', 'removeItem'],
        example: 'cg.ai.consent.gemini',
    },
    {
        file: 'apps/web/services/aiProviderService.ts',
        expression: 'getProviderMetadataKey(provider)',
        methods: ['getItem', 'setItem', 'removeItem'],
        example: 'cg.ai.provider.gemini.meta.v1',
    },
    {
        file: 'apps/web/services/persistenceFailureMarker.ts',
        expression: 'markerKey(marker.tabId)',
        methods: ['setItem'],
        example: 'cannaguide.pendingSnapshotSaveFailure:tab-1',
    },
    {
        file: 'apps/web/services/persistenceFailureMarker.ts',
        expression: 'markerKey(tabId)',
        methods: ['getItem', 'removeItem'],
        example: 'cannaguide.pendingSnapshotSaveFailure:tab-1',
    },
    {
        // clearAllSnapshotSaveFailures: keys filtered by the marker prefix.
        file: 'apps/web/services/persistenceFailureMarker.ts',
        expression: 'key',
        methods: ['removeItem'],
        example: 'cannaguide.pendingSnapshotSaveFailure:tab-1',
    },
    {
        file: 'apps/web/services/strain-lookup/strainLookupCache.ts',
        expression: 'key',
        methods: ['getItem', 'setItem', 'removeItem'],
        example: 'cg.sl.blue dream',
    },
    {
        // The data export reads every key the app stored, for the user's own download.
        file: 'apps/web/services/privacyService.ts',
        expression: 'key',
        methods: ['getItem'],
        example: null,
    },
]

const SOURCE = /\.(ts|tsx|mjs)$/
const EXCLUDED =
    /(^|\/)(tests|__mocks__|__tests__)\/|\.(test|spec|ct|stories|bench)\.[cm]?[jt]sx?$|\.d\.ts$|^apps\/web\/(locales|public)\//
const STORAGE_CALL = /\b(localStorage|sessionStorage)\s*\.\s*(getItem|setItem|removeItem)\s*\(/g
const LITERAL = /^(['"`])([^'"`$\\\n]*)\1$/
/**
 * A `createJSONStorage` accessor this scan can read: `() => localStorage` or `sessionStorage`,
 * optionally through `window.`, `globalThis.` or `self.`. Any other storage is unknown.
 */
const KNOWN_ACCESSOR =
    /^createJSONStorage\(\s*\(\)\s*=>\s*(?:(?:window|globalThis|self)\.)?(localStorage|sessionStorage)\s*\)$/
const STORAGE_PROPERTY = /^storage\s*:([\s\S]*)$/
const ZUSTAND_MIDDLEWARE = String.raw`['"]zustand/middleware['"]`
/** A `name` that is one complete literal: the property ends right after the closing quote. */
const PERSIST_NAME = /^\s*name\s*:\s*(['"`])([^'"`$\\\n]+)\1(?=\s*(?:,|$))/
/** Any `name` property, including `name: prefix + suffix` and a shorthand `name`. */
const NAME_PROPERTY = /^\s*name\s*(?::|(?=,|$))/
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/
const MAX_DEPTH = 6

/** The app source the check covers: tracked files, without tests, locales and assets. */
export function appSourceFiles(root = ROOT) {
    const result = spawnSync('git', ['ls-files', '-z', '--', APP], { cwd: root, encoding: 'utf8' })
    if (result.status !== 0) throw new Error('git ls-files failed')
    return result.stdout
        .split('\0')
        .filter((file) => SOURCE.test(file) && !EXCLUDED.test(file))
        .sort()
}

/** How a character changes the bracket depth. */
const BRACKET_DELTA = { '(': 1, '[': 1, '{': 1, ')': -1, ']': -1, '}': -1 }
const QUOTES = `'"\``

/** The index just past the quoted string that opens at `index` (escapes skipped). */
function skipQuoted(source, index) {
    const quote = source[index]
    let at = index + 1
    while (at < source.length && source[at] !== quote) at += source[at] === '\\' ? 2 : 1
    return at + 1
}

/** The characters that end a first argument at the top level: a comma or a closer. */
const ARGUMENT_END = new Set([',', ')', ']', '}'])
const endsArgument = (char, depth) => depth === 0 && ARGUMENT_END.has(char)

/** The index of the top-level comma or closer that ends the argument at `start`, or -1. */
function argumentEnd(source, start) {
    let depth = 0
    for (let index = start; index < source.length;) {
        const char = source[index]
        if (QUOTES.includes(char)) {
            index = skipQuoted(source, index)
            continue
        }
        if (endsArgument(char, depth)) return index
        depth += BRACKET_DELTA[char] ?? 0
        index += 1
    }
    return -1
}

/** The text of a call's first argument, read up to its top-level comma or closing paren. */
export function firstArgument(source, start) {
    const end = argumentEnd(source, start)
    return end === -1 ? null : source.slice(start, end).trim()
}

const MODULE_SUFFIXES = ['', '.ts', '.tsx', '.mjs', '/index.ts', '/index.tsx']

/** The path an `@/` or relative import specifier starts from; null for a package. */
function moduleBase(fromFile, specifier, root) {
    if (specifier.startsWith('@/')) return join(root, APP, specifier.slice(2))
    return specifier.startsWith('.') ? resolve(dirname(join(root, fromFile)), specifier) : null
}

const isSourceFile = (candidate) => existsSync(candidate) && SOURCE.test(candidate)

function moduleFile(fromFile, specifier, root) {
    const base = moduleBase(fromFile, specifier, root)
    if (base === null) return null
    const found = MODULE_SUFFIXES.map((suffix) => `${base}${suffix}`).find(isSourceFile)
    return found === undefined ? null : normalize(relative(root, found))
}

function importedName(source, local) {
    const imports = /\b(?:import|export)\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g
    for (const [, names, specifier] of source.matchAll(imports)) {
        for (const part of names.split(',')) {
            const [imported, alias] = part
                .trim()
                .replace(/^type\s+/, '')
                .split(/\s+as\s+/)
            if ((alias ?? imported)?.trim() === local)
                return { imported: imported.trim(), specifier }
        }
    }
    return null
}

/** A next token that continues an expression onto the following line. */
const CONTINUATION = /^(?:[+\-*/%?:.[(|&^<>=`]|\?\?)/

/**
 * The source with every comment blanked out (newlines kept, so line numbers hold). A `//` or
 * `/*` opens a comment only at the start of a line or after whitespace or a delimiter, so the
 * slashes that end a regex literal such as `/https?:\/\//` do not. A regex literal is copied as
 * it is, so a quote or backtick inside it (`/`/`) opens no string. A quoted string ends at its
 * line at the latest, so a quote the regex check misses still cannot swallow the code below it.
 */
export function maskComments(source) {
    let out = ''
    for (let at = 0; at < source.length;) {
        const comment = commentEnd(source, at)
        if (comment !== -1) {
            out += source.slice(at, comment).replace(/[^\n]/g, ' ')
            at = comment
            continue
        }
        const regex = regexEnd(source, at)
        let next = at + 1
        if (regex !== -1) next = regex
        else if (QUOTES.includes(source[at])) next = quotedEnd(source, at)
        out += source.slice(at, next)
        at = next
    }
    return out
}

/**
 * Tokens after which a `/` starts a regex literal, not a division: an operator, a delimiter,
 * or a reserved word that is not a property name (`x.return / 2` divides). `of` is left out
 * because it can be a variable name.
 */
const BEFORE_REGEX =
    /(?:^|[(,=:[!&|?{};+\-*%<>~^]|(?<![.#$\w])(?:return|typeof|case|in|new|delete|void|throw|yield|await))$/

/** Whether a `/` at `at` opens a regex literal, judged by the code before it on its line. */
function opensRegex(source, at) {
    if (source[at] !== '/') return false
    const lineStart = source.lastIndexOf('\n', at - 1) + 1
    return BEFORE_REGEX.test(source.slice(lineStart, at).trimEnd())
}

/** Whether the scan is inside a `[...]` class after `char`. */
function classState(char, inClass) {
    if (char === '[') return true
    if (char === ']') return false
    return inClass
}

/**
 * Where a regex body starting at `from` closes, or -1 when its line ends first. A closing `/`
 * that starts a `//` is more likely a division before a comment, so it closes nothing.
 */
function regexClose(source, from) {
    let inClass = false
    for (let end = from; end < source.length; end += 1) {
        const char = source[end]
        if (char === '\n') return -1
        if (char === '\\') {
            end += 1
            continue
        }
        if (char === '/' && !inClass) return source[end + 1] === '/' ? -1 : end + 1
        inClass = classState(char, inClass)
    }
    return -1
}

/** Where a regex literal opening at `at` ends, or -1 for a division or no closing `/`. */
function regexEnd(source, at) {
    return opensRegex(source, at) ? regexClose(source, at + 1) : -1
}

/** Where a comment opening at `at` ends, or -1 when none opens there (see maskComments). */
function commentEnd(source, at) {
    if (!opensComment(source, at)) return -1
    if (source.startsWith('//', at)) return lineEnd(source, at)
    return source.startsWith('/*', at) ? blockEnd(source, at) : -1
}

/** Whether a comment may open at `at`: at the start, or after whitespace or a delimiter. */
const opensComment = (source, at) => at === 0 || /[\s;,(){}[\]]/.test(source[at - 1])

/** Where a quoted string opening at `at` ends; a ' or " string ends at its line at the latest. */
function quotedEnd(source, at) {
    const quote = source[at]
    let end = at + 1
    while (end < source.length && source[end] !== quote) {
        if (quote !== '`' && source[end] === '\n') break
        end += source[end] === '\\' ? 2 : 1
    }
    return Math.min(end + 1, source.length)
}

/** The string a constant holds, following aliases, imports and re-exports; null when unknown. */
export function resolveConstant(file, name, root = ROOT, depth = 0) {
    if (depth > MAX_DEPTH) return null
    const source = maskedSource(root, file)
    if (source === null) return null
    const declaration = constDeclaration(source, name)
    const context = { file, root, depth: depth + 1 }
    return declaration ? declaredValue(declaration, context) : importedValue(source, name, context)
}

/** A file's source with comments masked, or null when it cannot be read. */
function maskedSource(root, file) {
    try {
        return maskComments(readFileSync(join(root, file), 'utf8'))
    } catch {
        return null
    }
}

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * A pattern for `name` as one whole identifier. The name is escaped, because `$` is legal in
 * an identifier and an anchor in a pattern, and bounded by identifier characters rather than
 * `\b`, which sees no boundary before a leading `$`.
 */
const identifier = (name) => String.raw`(?<![\w$])${escapeRegExp(name)}(?![\w$])`

/** The one-line `const NAME = value` initializer of `name`, or null when none is declared. */
function constDeclaration(source, name) {
    const match = new RegExp(
        String.raw`(?:^|[\n;])\s*(?:export\s+)?const\s+${identifier(name)}\s*(?::[^=\n]+)?=\s*([^\n;]+)`,
    ).exec(source)
    if (!match) return null
    // An initializer that goes on past its line (`'a'\n + '.b'`) is not the literal it starts with.
    const rest = source.slice(match.index + match[0].length).trimStart()
    const value = match[1]
        .trim()
        .replace(/\s+as\s+const$/, '')
        .replace(/,$/, '')
    return { value, continued: CONTINUATION.test(rest) }
}

/** A declared constant's string: its literal, or the one the constant it aliases holds. */
function declaredValue({ value, continued }, { file, root, depth }) {
    if (continued) return null
    const literal = LITERAL.exec(value)
    if (literal) return literal[2]
    return IDENTIFIER.test(value) ? resolveConstant(file, value, root, depth) : null
}

/** The string an imported constant holds in the module it comes from. */
function importedValue(source, name, { file, root, depth }) {
    const imported = importedName(source, name)
    const target = imported ? moduleFile(file, imported.specifier, root) : null
    return target ? resolveConstant(target, imported.imported, root, depth) : null
}

const isAllowed = (key) => ALLOWED_PATTERNS.some((pattern) => pattern.test(key))

/**
 * Whether a name is also bound as a parameter, a `let`/`var`/`catch` binding, or by a second
 * `const` in the file. A file-wide constant lookup cannot tell which binding a call sees, so a
 * shadowed name is treated as computed and needs a review (no scope analysis without a parser).
 */
export function isShadowed(source, name) {
    const id = identifier(name)
    const word = new RegExp(id)
    const bindings = [
        // Any mention in a parameter list counts, destructured (`{ KEY }`, `[KEY]`) or as a
        // default: a call there may see the parameter, so the key is treated as computed.
        () => parameterLists(source).some((list) => word.test(list)),
        () => new RegExp(String.raw`${id}\s*=>`).test(source),
        () =>
            new RegExp(
                String.raw`\b(?:const|let|var)\s*[{[][^=]*?(?<!\.)${id}[^=]*?[}\]]\s*=`,
            ).test(source),
        () => new RegExp(String.raw`\b(?:let|var)\s+${id}|\bcatch\s*\(\s*${id}\s*\)`).test(source),
        () => (source.match(new RegExp(String.raw`\bconst\s+${id}`, 'g')) ?? []).length > 1,
    ]
    return bindings.some((binds) => binds())
}

/** The text of every function and arrow-function parameter list in `source`. */
function parameterLists(source) {
    return [
        ...source.matchAll(/\bfunction\b[^(]*\(([^()]*)\)/g),
        // Not the condition of `if (...) {` and the like: that is an expression, not a parameter list.
        ...source.matchAll(
            /(?<!\b(?:if|while|for|switch|catch|with)\s*)\(([^()]*)\)\s*(?::[^=>{]+)?(?:=>|\{)/g,
        ),
    ].map((match) => match[1])
}

/** Where the line holding `at` ends: at its newline, or at the end of the text. */
function lineEnd(text, at) {
    const index = text.indexOf('\n', at)
    return index === -1 ? text.length : index
}

/** Where the block comment opening at `at` ends: just past its `*\/`, or at the end. */
function blockEnd(text, at) {
    const index = text.indexOf('*/', at + 2)
    return index === -1 ? text.length : index + 2
}

// ---------------------------------------------------------------------------
// Persisted zustand stores. `persist` writes its state under the `name` option, with no
// visible getItem or setItem call, to `createJSONStorage(() => window.localStorage)` unless a
// `storage` option says otherwise (zustand 5 middleware). The scan runs on comment-masked code,
// so a commented-out option is blank and never counts.
// ---------------------------------------------------------------------------

/** The names a call to zustand's `persist` goes by: `persist`, an import alias, `ns.persist`. */
function persistCallees(code) {
    return ['persist', ...persistAliases(code), ...namespacePersist(code)]
}

function persistAliases(code) {
    const named = new RegExp(String.raw`\bimport\s*\{([^}]*)\}\s*from\s*${ZUSTAND_MIDDLEWARE}`, 'g')
    return [...code.matchAll(named)]
        .flatMap(([, specifiers]) => specifiers.split(','))
        .map((specifier) => specifier.trim().split(/\s+as\s+/))
        .filter(([imported, local]) => imported === 'persist' && local)
        .map(([, local]) => local.trim())
}

function namespacePersist(code) {
    const namespace = new RegExp(
        String.raw`\bimport\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s+from\s*${ZUSTAND_MIDDLEWARE}`,
        'g',
    )
    return [...code.matchAll(namespace)].map(([, alias]) => `${alias}.persist`)
}

/** Every `persist(...)` call: where it starts, its argument texts and where it ends. */
function persistCalls(code) {
    return persistCallees(code)
        .flatMap((callee) => {
            // Not a member call such as `navigator.storage.persist()`.
            const call = new RegExp(String.raw`(?<![\w$.])${escapeRegExp(callee)}\s*\(`, 'g')
            return [...code.matchAll(call)].map((match) => ({
                index: match.index,
                ...callArguments(code, match.index + match[0].length),
            }))
        })
        .sort((a, b) => a.index - b.index)
}

/** The top-level argument texts of a call read from just past its `(`, and where it ends. */
function callArguments(source, start) {
    const args = []
    for (let at = start; ;) {
        const end = argumentEnd(source, at)
        if (end === -1) return { args: null, end: source.length }
        args.push(source.slice(at, end).trim())
        if (source[end] !== ',') return { args, end }
        at = end + 1
    }
}

const isObjectLiteral = (text) => typeof text === 'string' && /^\{[\s\S]*\}$/.test(text)

/** The top-level property texts of an object literal, or null when `text` is not one. */
function objectProperties(text) {
    if (!isObjectLiteral(text)) return null
    const body = text.slice(1, -1)
    const properties = []
    for (let start = 0; start <= body.length;) {
        const end = argumentEnd(body, start)
        const stop = end === -1 ? body.length : end
        properties.push(body.slice(start, stop).trim())
        start = stop + 1
    }
    return properties.filter(Boolean)
}

/**
 * How one property changes what is known of the name: a literal `name` sets it, any other
 * `name` makes it unknown, and a spread may override an earlier name. The last `name` wins,
 * as in JavaScript, and a `name` that is not one complete literal is unknown even when it
 * starts with an allowed literal.
 */
function propertyEffect(property, state) {
    const literal = PERSIST_NAME.exec(property)
    if (literal) return { name: literal[2], spread: false }
    if (NAME_PROPERTY.test(property)) return { name: undefined, spread: false }
    return /^\s*\.\.\./.test(property) ? { ...state, spread: true } : state
}

function storeName(properties) {
    const initial = { name: undefined, spread: false }
    const state = properties.reduce((known, property) => propertyEffect(property, known), initial)
    return state.spread ? undefined : state.name
}

/** How one property changes the storage: a `storage` option, or a spread that may set one. */
function storageEffect(property, storage) {
    const option = STORAGE_PROPERTY.exec(property)
    if (option) return KNOWN_ACCESSOR.exec(option[1].trim())?.[1] ?? null
    return property.startsWith('...') ? null : storage
}

/** The storage a store writes to: zustand's default localStorage, a known accessor, or null. */
const storeStorage = (properties) =>
    properties.reduce((storage, p) => storageEffect(p, storage), 'localStorage')

/** The name and storage a `persist` options argument gives; unknown unless it is a literal. */
function storeOptions(optionsText) {
    const properties = objectProperties(optionsText)
    if (properties === null) return { storage: null, name: undefined }
    return { storage: storeStorage(properties), name: storeName(properties) }
}

/** One persisted store: a known key, or computed when its name or its storage is unknown. */
function persistedStore(site, optionsText) {
    const { storage, name } = storeOptions(optionsText)
    const store = {
        ...site,
        storage: storage ?? 'unknown',
        method: 'setItem',
        expression: 'persist',
    }
    return storage !== null && name
        ? { ...store, kind: 'persist', key: name }
        : { ...store, kind: 'dynamic' }
}

/** `createJSONStorage` outside a `persist` call: a store this scan cannot read, so computed. */
function strayStorages(code, calls) {
    const inside = (index) => calls.some((call) => index > call.index && index < call.end)
    return [...code.matchAll(/\bcreateJSONStorage\s*\(/g)].filter((match) => !inside(match.index))
}

const lineOf = (source, index) => source.slice(0, index).split('\n').length

/** A name to resolve as a constant: an identifier that no local binding shadows. */
const isResolvableName = (expression, code) =>
    IDENTIFIER.test(expression) && !isShadowed(code, expression)

/** How a call's first argument names its key: unparsed, literal, constant or dynamic. */
function classifyArgument(expression, { file, code, root }) {
    if (expression === null) return { expression: '', kind: 'unparsed' }
    const literal = LITERAL.exec(expression)
    if (literal) return { expression, kind: 'literal', key: literal[2] }
    const key = isResolvableName(expression, code) ? resolveConstant(file, expression, root) : null
    return key === null ? { expression, kind: 'dynamic' } : { expression, kind: 'constant', key }
}

/** The getItem, setItem and removeItem calls of one file. */
function directCalls(file, source, code, root) {
    return [...code.matchAll(STORAGE_CALL)].map((match) => ({
        file,
        line: lineOf(source, match.index),
        storage: match[1],
        method: match[2],
        // Read from the masked code (offsets are kept): a comment in the call is no part of it.
        ...classifyArgument(firstArgument(code, match.index + match[0].length), {
            file,
            code,
            root,
        }),
    }))
}

/** The zustand stores persisted to storage, keyed by the `name` of their options object. */
function persistedStores(file, source, code) {
    const calls = persistCalls(code)
    const site = (index) => ({ file, line: lineOf(source, index) })
    const stores = calls.map((call) => persistedStore(site(call.index), call.args?.[1]))
    const stray = strayStorages(code, calls).map((match) => ({
        ...site(match.index),
        storage: 'unknown',
        method: 'setItem',
        expression: 'createJSONStorage',
        kind: 'dynamic',
    }))
    return [...stores, ...stray]
}

/** Every storage call in one file, classified by how its key is known. */
export function storageCalls(file, source, root = ROOT) {
    // A commented-out call is not a call: it must not keep an allowance or a review entry alive.
    const code = maskComments(source)
    return [...directCalls(file, source, code, root), ...persistedStores(file, source, code)]
}

/** Why a literal, constant or persisted key fails; null when it is allowed. */
function knownKeyProblem(call) {
    const legacy =
        call.method !== 'setItem' && LEGACY_READ_REMOVE.some((pattern) => pattern.test(call.key))
    return legacy || isAllowed(call.key) ? null : `key "${call.key}" not in allowlist`
}

/** Why a computed key fails against its review entry; null when the entry covers it. */
function reviewedKeyProblem(call, entry) {
    if (!entry) return `computed key \`${call.expression}\` is not reviewed`
    if (!entry.methods.includes(call.method)) {
        return `computed key \`${call.expression}\` is reviewed for ${entry.methods.join(', ')} only, not ${call.method}`
    }
    if (entry.example === null) {
        return call.method === 'getItem' ? null : 'a reviewed read-every-key site may only read'
    }
    return isAllowed(entry.example) ? null : `reviewed example "${entry.example}" not in allowlist`
}

const KNOWN_KINDS = new Set(['literal', 'constant', 'persist'])

/** Why one call fails, recording the review entry it uses; null when it passes. */
function callProblem(call, reviewed, used) {
    if (KNOWN_KINDS.has(call.kind)) return knownKeyProblem(call)
    const entry = reviewed.find(
        (candidate) => candidate.file === call.file && candidate.expression === call.expression,
    )
    if (entry) used.add(entry)
    return reviewedKeyProblem(call, entry)
}

/** The violations for a set of classified calls and the reviewed dynamic-key entries. */
export function violations(calls, reviewed = REVIEWED_DYNAMIC_KEYS) {
    const used = new Set()
    const problems = calls
        .map((call) => ({ call, reason: callProblem(call, reviewed, used) }))
        .filter(({ reason }) => reason)
        .map(({ call, reason }) => ({ ...call, reason }))
    for (const entry of reviewed) {
        if (!used.has(entry)) {
            problems.push({
                file: entry.file,
                line: 0,
                reason: `stale review entry \`${entry.expression}\``,
            })
        }
    }
    return problems
}

/** Allowlist patterns that no key in the source, or no reviewed example, uses any more. */
export function stalePatterns(
    calls,
    patterns = ALLOWED_PATTERNS,
    reviewed = REVIEWED_DYNAMIC_KEYS,
) {
    const keys = [
        ...calls.filter((call) => call.key !== undefined).map((call) => call.key),
        ...reviewed.map((entry) => entry.example).filter(Boolean),
    ]
    return patterns
        .filter((pattern) => !keys.some((key) => pattern.test(key)))
        .map((pattern) => ({
            file: 'scripts/security/check-localstorage-usage.mjs',
            line: 0,
            reason: `allowlist pattern ${pattern} matches no key any more`,
        }))
}

function main() {
    const files = appSourceFiles()
    const calls = files.flatMap((file) =>
        storageCalls(file, readFileSync(join(ROOT, file), 'utf8')),
    )
    const problems = [...violations(calls), ...stalePatterns(calls)]
    const count = (kind) => calls.filter((call) => call.kind === kind).length

    console.log('\nLOCAL STORAGE ALLOWLIST CHECK')
    console.log('=============================')
    console.log(
        `Scanned ${files.length} files, ${calls.length} storage calls: ${count('literal')} literal, ${count('constant')} resolved constant, ${count('dynamic')} computed, ${count('persist')} persisted store, ${count('unparsed')} unparsed`,
    )
    if (problems.length === 0) {
        console.log('[OK] Every storage key is allowed')
        return 0
    }
    for (const problem of problems) {
        console.log(`[FAIL] ${problem.file}:${problem.line} -- ${problem.reason}`)
    }
    console.log(
        `\n[FAIL] ${problems.length} violation(s). localStorage holds small non-secret flags only (apps/web/CLAUDE.md, WEB-03): allow the key in ALLOWED_PATTERNS, or review the computed key in REVIEWED_DYNAMIC_KEYS.`,
    )
    return 1
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) process.exitCode = main()
