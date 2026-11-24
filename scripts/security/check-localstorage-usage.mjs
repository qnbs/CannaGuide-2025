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
const PERSIST_NAME = /\bname:\s*(['"`])([^'"`$\\\n]+)\1/g
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
        const key = IDENTIFIER.test(expression) ? resolveConstant(file, expression, root) : null
        calls.push(
            key === null
                ? { ...site, expression, kind: 'dynamic' }
                : { ...site, expression, kind: 'constant', key },
        )
    }
    for (const match of source.matchAll(PERSIST_STORAGE)) {
        // The persist options carry the name shortly before the storage option.
        const before = source.slice(Math.max(0, match.index - 600), match.index)
        const name = [...before.matchAll(PERSIST_NAME)].at(-1)?.[2]
        const line = source.slice(0, match.index).split('\n').length
        const site = { file, line, storage: match[1], method: 'setItem', expression: 'persist' }
        calls.push(name ? { ...site, kind: 'persist', key: name } : { ...site, kind: 'dynamic' })
    }
    return calls
}

/** The violations for a set of classified calls and the reviewed dynamic-key entries. */
export function violations(calls, reviewed = REVIEWED_DYNAMIC_KEYS) {
    const problems = []
    const used = new Set()
    for (const call of calls) {
        if (call.kind === 'literal' || call.kind === 'constant' || call.kind === 'persist') {
            const legacy =
                call.method !== 'setItem' &&
                LEGACY_READ_REMOVE.some((pattern) => pattern.test(call.key))
            if (!legacy && !isAllowed(call.key)) {
                problems.push({ ...call, reason: `key "${call.key}" not in allowlist` })
            }
            continue
        }
        const entry = reviewed.find(
            (candidate) => candidate.file === call.file && candidate.expression === call.expression,
        )
        if (!entry) {
            problems.push({
                ...call,
                reason: `computed key \`${call.expression}\` is not reviewed`,
            })
            continue
        }
        used.add(entry)
        if (!entry.methods.includes(call.method)) {
            problems.push({
                ...call,
                reason: `computed key \`${call.expression}\` is reviewed for ${entry.methods.join(', ')} only, not ${call.method}`,
            })
        } else if (entry.example !== null && !isAllowed(entry.example)) {
            problems.push({
                ...call,
                reason: `reviewed example "${entry.example}" not in allowlist`,
            })
        } else if (entry.example === null && call.method !== 'getItem') {
            problems.push({ ...call, reason: 'a reviewed read-every-key site may only read' })
        }
    }
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
