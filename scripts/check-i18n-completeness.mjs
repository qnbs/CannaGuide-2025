#!/usr/bin/env node
// ---------------------------------------------------------------------------
// i18n Completeness Checker
// ---------------------------------------------------------------------------
// Compares translation key counts across all declared languages and namespaces.
// Exits with code 1 if any language is missing keys relative to English (reference).
// ---------------------------------------------------------------------------

import { readdirSync, statSync } from 'node:fs'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = resolve(__dirname, '..', 'apps', 'web', 'locales')

/**
 * Recursively count keys in a nested object.
 */
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

/**
 * Find missing keys in target that exist in reference (recursive).
 */
function findMissingKeys(reference, target, prefix = '') {
    const missing = []
    if (typeof reference !== 'object' || reference === null) return missing

    for (const [key, value] of Object.entries(reference)) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (!(key in (target || {}))) {
            missing.push(fullKey)
        } else if (typeof value === 'object' && value !== null) {
            missing.push(...findMissingKeys(value, target[key], fullKey))
        }
    }
    return missing
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const langs = readdirSync(LOCALES_DIR).filter((name) => {
        const fullPath = resolve(LOCALES_DIR, name)
        return statSync(fullPath).isDirectory()
    })

    if (!langs.includes('en')) {
        console.error('[FAIL] English (en) locale not found as reference.')
        process.exit(1)
    }

    console.log(`Languages found: ${langs.join(', ')}`)

    // Skip index.ts files, only check namespace files
    const SKIP_FILES = new Set(['index.ts', 'index.js'])

    // Load all namespace files for each language
    const languageData = {}
    for (const lang of langs) {
        languageData[lang] = {}
        const langDir = resolve(LOCALES_DIR, lang)
        const files = readdirSync(langDir).filter(
            (f) => (f.endsWith('.ts') || f.endsWith('.js')) && !SKIP_FILES.has(f),
        )

        for (const file of files) {
            const ns = basename(file, '.ts').replace('.js', '')
            try {
                const mod = await import(pathToFileURL(resolve(langDir, file)).href)
                languageData[lang][ns] = mod.default || mod
            } catch {
                // Skip files that cannot be imported (e.g., type-only files)
            }
        }
    }

    const enNamespaces = Object.keys(languageData['en'] || {})
    let hasErrors = false
    let totalMissing = 0

    for (const lang of langs) {
        if (lang === 'en') continue

        for (const ns of enNamespaces) {
            const enData = languageData['en'][ns]
            const langData = languageData[lang]?.[ns]

            if (!langData) {
                const enKeyCount = countKeys(enData)
                console.error(
                    `[FAIL] ${lang}/${ns}: namespace missing entirely (${enKeyCount} keys in en)`,
                )
                totalMissing += enKeyCount
                hasErrors = true
                continue
            }

            const enCount = countKeys(enData)
            const langCount = countKeys(langData)
            const missing = findMissingKeys(enData, langData)

            if (missing.length > 0) {
                const pct = Math.round(((enCount - missing.length) / enCount) * 100)
                console.error(
                    `[FAIL] ${lang}/${ns}: ${missing.length} missing keys (${pct}% complete)`,
                )
                if (missing.length <= 10) {
                    for (const key of missing) {
                        console.error(`       - ${key}`)
                    }
                }
                totalMissing += missing.length
                hasErrors = true
            } else if (langCount > enCount) {
                console.warn(`[WARN] ${lang}/${ns}: has ${langCount - enCount} extra keys`)
            }
        }
    }

    if (hasErrors) {
        console.error(`\n[FAIL] ${totalMissing} total missing translation keys.`)
        process.exit(1)
    } else {
        console.log('[OK] All languages have complete translations relative to English.')
    }
}

main().catch((err) => {
    console.error('[FAIL] i18n check crashed:', err)
    process.exit(1)
})
