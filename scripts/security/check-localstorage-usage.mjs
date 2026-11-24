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
 * Before 2026-11-24 the check read literal keys only, in six directories: 91 calls that
 * pass a constant or a computed key were never checked.
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
const PERSIST_NAME = /^\s*name\s*:\s*(['"`])([^'"`$\\\n]+)\1/
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

/** The string a constant holds, following aliases, imports and re-exports; null when unknown. */
export function resolveConstant(file, name, root = ROOT, depth = 0) {
    if (depth > MAX_DEPTH) return null
    let source
    try {
        source = readFileSync(join(root, file), 'utf8')
    } catch {
        return null
    }
    const declaration = new RegExp(
        `(?:^|[\\n;])\\s*(?:export\\s+)?const\\s+${name}\\s*(?::[^=\\n]+)?=\\s*([^\\n;]+)`,
    ).exec(source)
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
    const parameterLists = [
        ...source.matchAll(/\bfunction\b[^(]*\(([^()]*)\)/g),
        ...source.matchAll(/\(([^()]*)\)\s*(?::[^=>{]+)?(?:=>|\{)/g),
    ].map((match) => match[1])
    const parameters = parameterLists.flatMap((list) =>
        list.split(',').map((part) => /^\s*(?:\.\.\.)?([A-Za-z_$][\w$]*)/.exec(part)?.[1]),
    )
    if (parameters.includes(name)) return true
    if (new RegExp(`\\b${name}\\s*=>`).test(source)) return true
    if (new RegExp(`\\b(?:let|var)\\s+${name}\\b|\\bcatch\\s*\\(\\s*${name}\\s*\\)`).test(source))
        return true
    return (source.match(new RegExp(`\\bconst\\s+${name}\\b`, 'g')) ?? []).length > 1
}

/**
 * The text of the object literal around an index, or null when it cannot be found. Braces
 * inside strings are not told apart; a persist options object holds none in this code base.
 */
function enclosingObject(source, index) {
    let depth = 0
    let start = -1
    for (let at = index; at >= 0; at -= 1) {
        if (source[at] === '}') depth += 1
        if (source[at] === '{') {
            if (depth === 0) {
                start = at
                break
            }
            depth -= 1
        }
    }
    if (start === -1) return null
    const end = matchingBrace(source, start)
    return end === -1 ? null : source.slice(start + 1, end)
}

function matchingBrace(source, start) {
    let depth = 0
    for (let at = start; at < source.length; at += 1) {
        if (source[at] === '{') depth += 1
        if (source[at] === '}' && --depth === 0) return at
    }
    return -1
}

/** The `name` property at the top level of an options object, wherever it stands. */
function topLevelName(objectText) {
    let depth = 0
    let lineStart = true
    for (let at = 0; at < objectText.length; at += 1) {
        const char = objectText[at]
        if ('{[('.includes(char)) depth += 1
        else if ('}])'.includes(char)) depth -= 1
        else if (depth === 0 && (lineStart || char === ',')) {
            const match = PERSIST_NAME.exec(objectText.slice(char === ',' ? at + 1 : at))
            if (match) return match[2]
        }
        lineStart = char === '\n'
    }
    return undefined
}

/** Every storage call in one file, classified by how its key is known. */
export function storageCalls(file, source, root = ROOT) {
    const calls = []
    for (const match of source.matchAll(STORAGE_CALL)) {
        const expression = firstArgument(source, match.index + match[0].length)
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
            IDENTIFIER.test(expression) && !isShadowed(source, expression)
                ? resolveConstant(file, expression, root)
                : null
        calls.push(
            key === null
                ? { ...site, expression, kind: 'dynamic' }
                : { ...site, expression, kind: 'constant', key },
        )
    }
    for (const match of source.matchAll(PERSIST_STORAGE)) {
        // The name comes from the same options object as the storage option, in any order.
        const options = enclosingObject(source, match.index)
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

/** The violations for a set of classified calls and the reviewed dynamic-key entries. */
/** Why one call fails, recording the review entry it uses; null when it passes. */
function callProblem(call, reviewed, used) {
    if (KNOWN_KINDS.has(call.kind)) return knownKeyProblem(call)
    const entry = reviewed.find(
        (candidate) => candidate.file === call.file && candidate.expression === call.expression,
    )
    if (entry) used.add(entry)
    return reviewedKeyProblem(call, entry)
}

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
