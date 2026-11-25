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
 *   someone reviews it, and an entry whose call is gone fails as stale.
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
/** zustand's persist middleware writes under its `name`, with no visible getItem call. */
const PERSIST_STORAGE = /createJSONStorage\(\s*\(\)\s*=>\s*(localStorage|sessionStorage)\s*\)/g
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

/** The text of a call's first argument, read up to its top-level comma or closing paren. */
export function firstArgument(source, start) {
    let depth = 0
    let quote = null
    for (let index = start; index < source.length; index += 1) {
        const char = source[index]
        if (quote) {
            if (char === '\\') index += 1
            else if (char === quote) quote = null
            continue
        }
        if (char === "'" || char === '"' || char === '`') quote = char
        else if (char === '(' || char === '[' || char === '{') depth += 1
        else if (char === ')' || char === ']' || char === '}') {
            if (depth === 0) return source.slice(start, index).trim()
            depth -= 1
        } else if (char === ',' && depth === 0) return source.slice(start, index).trim()
    }
    return null
}

function moduleFile(fromFile, specifier, root) {
    let base
    if (specifier.startsWith('@/')) base = join(root, APP, specifier.slice(2))
    else if (specifier.startsWith('.')) base = resolve(dirname(join(root, fromFile)), specifier)
    else return null
    for (const suffix of ['', '.ts', '.tsx', '.mjs', '/index.ts', '/index.tsx']) {
        const candidate = `${base}${suffix}`
        if (existsSync(candidate) && SOURCE.test(candidate))
            return normalize(relative(root, candidate))
    }
    return null
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

const QUOTES = `'"\``
/**
 * Tokens after which a `/` starts a regex literal, not a division: an operator, a delimiter,
 * or a reserved word that is not a property name (`x.return / 2` divides). `of` is left out
 * because it can be a variable name.
 */
const BEFORE_REGEX =
    /(?:^|[(,=:[!&|?{};+\-*%<>~^]|(?<![.#$\w])(?:return|typeof|case|in|new|delete|void|throw|yield|await))$/

/** Where a regex literal opening at `at` ends, or -1 for a division or no closing `/`. */
function regexEnd(source, at) {
    if (source[at] !== '/') return -1
    const lineStart = source.lastIndexOf('\n', at - 1) + 1
    if (!BEFORE_REGEX.test(source.slice(lineStart, at).trimEnd())) return -1
    let inClass = false
    for (let end = at + 1; end < source.length; end += 1) {
        const char = source[end]
        if (char === '\n') return -1
        if (char === '\\') end += 1
        else if (char === '[') inClass = true
        else if (char === ']') inClass = false
        // A closing `/` that starts a `//` is more likely a division before a comment.
        else if (char === '/' && !inClass) return source[end + 1] === '/' ? -1 : end + 1
    }
    return -1
}

/** Where a comment opening at `at` ends, or -1 when none opens there (see maskComments). */
function commentEnd(source, at) {
    const line = source.startsWith('//', at)
    if (!line && !source.startsWith('/*', at)) return -1
    if (at > 0 && !/[\s;,(){}[\]]/.test(source[at - 1])) return -1
    const end = line ? source.indexOf('\n', at) : source.indexOf('*/', at + 2)
    if (end === -1) return source.length
    return line ? end : end + 2
}

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
    let source
    try {
        source = maskComments(readFileSync(join(root, file), 'utf8'))
    } catch {
        return null
    }
    const declaration = new RegExp(
        `(?:^|[\\n;])\\s*(?:export\\s+)?const\\s+${name}\\s*(?::[^=\\n]+)?=\\s*([^\\n;]+)`,
    ).exec(source)
    // An initializer that goes on past its line (`'a'\n + '.b'`) is not the literal it starts with.
    const continued =
        declaration &&
        CONTINUATION.test(source.slice(declaration.index + declaration[0].length).trimStart())
    if (continued) return null
    if (declaration) {
        const value = declaration[1]
            .trim()
            .replace(/\s+as\s+const$/, '')
            .replace(/,$/, '')
        const literal = LITERAL.exec(value)
        if (literal) return literal[2]
        if (IDENTIFIER.test(value)) return resolveConstant(file, value, root, depth + 1)
        return null
    }
    const imported = importedName(source, name)
    if (!imported) return null
    const target = moduleFile(file, imported.specifier, root)
    return target ? resolveConstant(target, imported.imported, root, depth + 1) : null
}

const isAllowed = (key) => ALLOWED_PATTERNS.some((pattern) => pattern.test(key))

/**
 * Whether a name is also bound as a parameter, a `let`/`var`/`catch` binding, or by a second
 * `const` in the file. A file-wide constant lookup cannot tell which binding a call sees, so a
 * shadowed name is treated as computed and needs a review (no scope analysis without a parser).
 */
export function isShadowed(source, name) {
    const word = new RegExp(`(?<![\\w$])${name}(?![\\w$])`)
    const parameterLists = [
        ...source.matchAll(/\bfunction\b[^(]*\(([^()]*)\)/g),
        // Not the condition of `if (...) {` and the like: that is an expression, not a parameter list.
        ...source.matchAll(
            /(?<!\b(?:if|while|for|switch|catch|with)\s*)\(([^()]*)\)\s*(?::[^=>{]+)?(?:=>|\{)/g,
        ),
    ].map((match) => match[1])
    // Any mention in a parameter list counts, destructured (`{ KEY }`, `[KEY]`) or as a
    // default: a call there may see the parameter, so the key is treated as computed.
    if (parameterLists.some((list) => word.test(list))) return true
    if (new RegExp(`\\b${name}\\s*=>`).test(source)) return true
    const destructured = new RegExp(
        `\\b(?:const|let|var)\\s*[{[][^=]*?(?<![\\w$.])${name}(?![\\w$])[^=]*?[}\\]]\\s*=`,
    )
    if (destructured.test(source)) return true
    if (new RegExp(`\\b(?:let|var)\\s+${name}\\b|\\bcatch\\s*\\(\\s*${name}\\s*\\)`).test(source))
        return true
    return (source.match(new RegExp(`\\bconst\\s+${name}\\b`, 'g')) ?? []).length > 1
}

/** Length of the comment or string literal that starts at `at`, or 0 for code. */
function nonCodeLength(text, at) {
    if (text.startsWith('//', at)) {
        const end = text.indexOf('\n', at)
        return (end === -1 ? text.length : end) - at
    }
    if (text.startsWith('/*', at)) {
        const end = text.indexOf('*/', at + 2)
        return (end === -1 ? text.length : end + 2) - at
    }
    const quote = text[at]
    if (quote !== "'" && quote !== '"' && quote !== '`') return 0
    let end = at + 1
    while (end < text.length && text[end] !== quote) end += text[end] === '\\' ? 2 : 1
    return Math.min(end + 1, text.length) - at
}

/**
 * The text of the object literal around an index, or null when it cannot be found. The walk
 * back does not tell braces inside strings apart; a persist options object holds none in this
 * code base, and its closing brace is found skipping comments and strings.
 */
function enclosingObject(source, index) {
    let depth = 0
    for (let at = index; at >= 0; at -= 1) {
        if (source[at] === '}') depth += 1
        if (source[at] === '{') {
            if (depth === 0) {
                const end = matchingBrace(source, at)
                return end === -1 ? null : source.slice(at + 1, end)
            }
            depth -= 1
        }
    }
    return null
}

function matchingBrace(source, start) {
    let depth = 0
    for (let at = start; at < source.length;) {
        const skipped = nonCodeLength(source, at)
        if (skipped > 0) {
            at += skipped
            continue
        }
        if (source[at] === '{') depth += 1
        if (source[at] === '}' && --depth === 0) return at
        at += 1
    }
    return -1
}

/**
 * The `name` property at the top level of an options object, wherever it stands. Comments are
 * skipped and keep the place of a property; strings are skipped and end it, so neither a
 * commented-out name nor a comma inside a string or comment can stand in for the real one.
 * The last `name` wins, as in JavaScript, and a spread after it may override it, so the name
 * is then unknown (undefined). A `name` that is not one complete literal (a concatenation, a
 * call, a shorthand) is unknown as well, even when it starts with an allowed literal.
 */
function topLevelName(objectText) {
    let depth = 0
    let propertyStart = true
    let name
    let spreadAfterName = false
    for (let at = 0; at < objectText.length;) {
        if (depth === 0 && propertyStart) {
            const rest = objectText.slice(at)
            const match = PERSIST_NAME.exec(rest)
            if (match) {
                name = match[2]
                spreadAfterName = false
            } else if (NAME_PROPERTY.test(rest)) {
                name = undefined
                spreadAfterName = false
            } else if (/^\s*\.\.\./.test(rest)) {
                spreadAfterName = true
            }
        }
        const skipped = nonCodeLength(objectText, at)
        if (skipped > 0) {
            if (objectText[at] !== '/') propertyStart = false
            at += skipped
            continue
        }
        const char = objectText[at]
        if ('{[('.includes(char)) depth += 1
        else if ('}])'.includes(char)) depth -= 1
        if (depth === 0 && char === ',') propertyStart = true
        else if (!/\s/.test(char)) propertyStart = false
        at += 1
    }
    return spreadAfterName ? undefined : name
}

/** Every storage call in one file, classified by how its key is known. */
export function storageCalls(file, source, root = ROOT) {
    const calls = []
    // A commented-out call is not a call: it must not keep an allowance or a review entry alive.
    const code = maskComments(source)
    for (const match of code.matchAll(STORAGE_CALL)) {
        // Read from the masked code (offsets are kept), so a comment in the call is no part of the key.
        const expression = firstArgument(code, match.index + match[0].length)
        const line = source.slice(0, match.index).split('\n').length
        const site = { file, line, storage: match[1], method: match[2] }
        if (expression === null) {
            calls.push({ ...site, expression: '', kind: 'unparsed' })
            continue
        }
        const literal = LITERAL.exec(expression)
        if (literal) {
            calls.push({ ...site, expression, kind: 'literal', key: literal[2] })
            continue
        }
        const key =
            IDENTIFIER.test(expression) && !isShadowed(code, expression)
                ? resolveConstant(file, expression, root)
                : null
        calls.push(
            key === null
                ? { ...site, expression, kind: 'dynamic' }
                : { ...site, expression, kind: 'constant', key },
        )
    }
    for (const match of code.matchAll(PERSIST_STORAGE)) {
        // The name comes from the same options object as the storage option, in any order.
        const options = enclosingObject(code, match.index)
        const name = options === null ? undefined : topLevelName(options)
        const line = source.slice(0, match.index).split('\n').length
        const site = { file, line, storage: match[1], method: 'setItem', expression: 'persist' }
        calls.push(name ? { ...site, kind: 'persist', key: name } : { ...site, kind: 'dynamic' })
    }
    return calls
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
