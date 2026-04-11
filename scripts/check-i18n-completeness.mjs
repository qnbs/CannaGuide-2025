#!/usr/bin/env node
// ---------------------------------------------------------------------------
// i18n Completeness Checker
// ---------------------------------------------------------------------------
// Compares translation keys across all 5 languages (EN, DE, ES, FR, NL).
// EN is the reference. DE is required (hard fail). ES/FR/NL are community
// translations (warn only).
//
// Usage:
//   npx tsx scripts/check-i18n-completeness.mjs          # full check
//   npx tsx scripts/check-i18n-completeness.mjs --verbose # show per-ns OK lines
//   npx tsx scripts/check-i18n-completeness.mjs --json    # machine-readable output
//
// The script imports the barrel files (locales/{lang}.ts) via tsx so it works
// with TypeScript source directly -- no build step required.
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = resolve(__dirname, '..', 'apps', 'web', 'locales')

const LANGS = ['en', 'de', 'es', 'fr', 'nl']
const REQUIRED_LANGS = new Set(['de'])

const verbose = process.argv.includes('--verbose')
const jsonMode = process.argv.includes('--json')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively count leaf (non-object) keys. */
function countKeys(obj) {
    if (typeof obj !== 'object' || obj === null) return 0
    let count = 0
    for (const value of Object.values(obj)) {
        if (typeof value === 'object' && value !== null) {
            count += countKeys(value)
        } else {
            count += 1
        }
    }
    return count
}

/** Recursively collect all leaf key paths from a nested object. */
function collectKeys(obj, prefix = '') {
    const keys = []
    if (typeof obj !== 'object' || obj === null) return keys
    for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof value === 'object' && value !== null) {
            keys.push(...collectKeys(value, fullKey))
        } else {
            keys.push(fullKey)
        }
    }
    return keys
}

/** Find keys present in reference but missing in target. */
function findMissingKeys(reference, target, prefix = '') {
    const missing = []
    if (typeof reference !== 'object' || reference === null) return missing
    for (const [key, value] of Object.entries(reference)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (target === undefined || target === null || !(key in target)) {
            if (typeof value === 'object' && value !== null) {
                missing.push(...collectKeys(value, fullKey))
            } else {
                missing.push(fullKey)
            }
        } else if (typeof value === 'object' && value !== null) {
            missing.push(...findMissingKeys(value, target[key], fullKey))
        }
    }
    return missing
}

/** Find keys present in target but not in reference (extras). */
function findExtraKeys(reference, target, prefix = '') {
    const extra = []
    if (typeof target !== 'object' || target === null) return extra
    for (const [key, value] of Object.entries(target)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (reference === undefined || reference === null || !(key in reference)) {
            if (typeof value === 'object' && value !== null) {
                extra.push(...collectKeys(value, fullKey))
            } else {
                extra.push(fullKey)
            }
        } else if (typeof value === 'object' && value !== null) {
            extra.push(...findExtraKeys(reference[key], value, fullKey))
        }
    }
    return extra
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    // Import barrel files via tsx (handles TypeScript natively)
    const langData = {}
    for (const lang of LANGS) {
        try {
            const mod = await import(pathToFileURL(resolve(LOCALES_DIR, `${lang}.ts`)).href)
            langData[lang] = mod[lang] || mod.default || mod
        } catch (err) {
            console.error(`[FAIL] Could not import locales/${lang}.ts: ${err.message}`)
            process.exit(1)
        }
    }

    const enData = langData['en']
    const enTopKeys = Object.keys(enData)
    const enTotalKeys = countKeys(enData)

    if (!jsonMode) {
        console.log(`Reference: en (${enTotalKeys} keys across ${enTopKeys.length} namespaces)`)
        console.log(`Languages: ${LANGS.join(', ')}`)
        console.log(`Required:  en, ${[...REQUIRED_LANGS].join(', ')}`)
        console.log('---')
    }

    let hasErrors = false
    let totalMissing = 0
    let totalExtra = 0
    const report = []

    for (const lang of LANGS) {
        if (lang === 'en') continue
        const isRequired = REQUIRED_LANGS.has(lang)
        const target = langData[lang]

        for (const ns of enTopKeys) {
            const enNs = enData[ns]
            const targetNs = target?.[ns]
            const enCount = countKeys(enNs)

            if (targetNs === undefined) {
                const tag = isRequired ? '[FAIL]' : '[WARN]'
                const msg = `${tag} ${lang}/${ns}: namespace missing entirely (${enCount} keys in en)`
                report.push({
                    lang,
                    ns,
                    status: isRequired ? 'fail' : 'warn',
                    missing: enCount,
                    extra: 0,
                    pct: 0,
                })
                if (!jsonMode) console.error(msg)
                totalMissing += enCount
                if (isRequired) hasErrors = true
                continue
            }

            const missing = findMissingKeys(enNs, targetNs)
            const extra = findExtraKeys(enNs, targetNs)
            const targetCount = countKeys(targetNs)
            const pct = enCount > 0 ? Math.round(((enCount - missing.length) / enCount) * 100) : 100

            if (missing.length > 0) {
                const tag = isRequired ? '[FAIL]' : '[WARN]'
                if (!jsonMode) {
                    console.error(
                        `${tag} ${lang}/${ns}: ${missing.length} missing keys (${pct}% complete)`,
                    )
                    const show = missing.slice(0, 20)
                    for (const key of show) {
                        console.error(`       - ${key}`)
                    }
                    if (missing.length > 20) {
                        console.error(`       ... and ${missing.length - 20} more`)
                    }
                }
                totalMissing += missing.length
                if (isRequired) hasErrors = true
            } else if (verbose && !jsonMode) {
                console.log(`[OK]   ${lang}/${ns}: ${targetCount}/${enCount} keys`)
            }

            if (extra.length > 0) {
                totalExtra += extra.length
                if (!jsonMode && verbose) {
                    console.warn(`[INFO] ${lang}/${ns}: ${extra.length} extra keys (not in en)`)
                }
            }

            report.push({
                lang,
                ns,
                status: missing.length > 0 ? (isRequired ? 'fail' : 'warn') : 'ok',
                missing: missing.length,
                extra: extra.length,
                pct,
            })
        }
    }

    if (jsonMode) {
        const summary = {
            reference: 'en',
            totalEnKeys: enTotalKeys,
            namespaces: enTopKeys.length,
            totalMissing,
            totalExtra,
            hasErrors,
            details: report,
        }
        console.log(JSON.stringify(summary, null, 2))
    } else {
        console.log('---')
        const langSummaries = []
        for (const lang of LANGS) {
            if (lang === 'en') continue
            const langMissing = report
                .filter((r) => r.lang === lang)
                .reduce((s, r) => s + r.missing, 0)
            const langExtra = report.filter((r) => r.lang === lang).reduce((s, r) => s + r.extra, 0)
            const langPct =
                enTotalKeys > 0
                    ? Math.round(((enTotalKeys - langMissing) / enTotalKeys) * 100)
                    : 100
            const tag = REQUIRED_LANGS.has(lang)
                ? langMissing > 0
                    ? '[FAIL]'
                    : '[OK]  '
                : langMissing > 0
                  ? '[WARN]'
                  : '[OK]  '
            langSummaries.push(
                `${tag} ${lang}: ${langPct}% (${langMissing} missing, ${langExtra} extra)`,
            )
        }
        for (const s of langSummaries) console.log(s)
        console.log('---')

        if (hasErrors) {
            console.error(
                `[FAIL] ${totalMissing} total missing keys. Required languages incomplete.`,
            )
            process.exit(1)
        } else if (totalMissing > 0) {
            console.log(
                `[WARN] ${totalMissing} missing keys in community languages (non-blocking).`,
            )
            console.log('[OK] All required languages (en, de) are complete.')
        } else {
            console.log(
                `[OK] All ${LANGS.length} languages have complete translations. (${enTotalKeys} keys each)`,
            )
        }
    }

    if (hasErrors) process.exit(1)
}

main().catch((err) => {
    console.error('[FAIL] i18n check crashed:', err)
    process.exit(1)
})
