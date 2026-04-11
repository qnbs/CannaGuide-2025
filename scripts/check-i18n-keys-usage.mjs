#!/usr/bin/env node
// ---------------------------------------------------------------------------
// i18n Keys Usage Checker
// ---------------------------------------------------------------------------
// Cross-references t('...') calls in source code against actual locale keys.
// Detects keys used in code but missing from locale files -- the exact bug
// class that caused the SeedVault i18n namespace mismatch.
//
// Usage:
//   npx tsx scripts/check-i18n-keys-usage.mjs          # full check
//   npx tsx scripts/check-i18n-keys-usage.mjs --json    # machine-readable
//   npx tsx scripts/check-i18n-keys-usage.mjs --verbose  # show all matched keys
//
// Exit codes:
//   0 = all keys resolved
//   1 = missing keys found in EN locale
// ---------------------------------------------------------------------------

import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pathToFileURL } from 'node:url'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = resolve(__dirname, '..', 'apps', 'web', 'locales')
const SRC_DIR = resolve(__dirname, '..', 'apps', 'web')

const verbose = process.argv.includes('--verbose')
const jsonMode = process.argv.includes('--json')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Recursively collect all dot-path keys from a nested object. */
function collectKeys(obj, prefix = '') {
    const keys = new Set()
    if (typeof obj !== 'object' || obj === null) return keys
    for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key
        if (typeof value === 'object' && value !== null) {
            for (const k of collectKeys(value, path)) keys.add(k)
        } else {
            keys.add(path)
        }
    }
    return keys
}

/** Recursively find all .ts/.tsx files under a directory (skips node_modules, dist, tests). */
async function findSourceFiles(dir) {
    const results = []
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
            if (['node_modules', 'dist', 'tests', 'locales', '.git', 'public'].includes(entry.name))
                continue
            results.push(...(await findSourceFiles(fullPath)))
        } else if (
            /\.(tsx?|jsx?)$/.test(entry.name) &&
            !entry.name.endsWith('.test.ts') &&
            !entry.name.endsWith('.test.tsx')
        ) {
            results.push(fullPath)
        }
    }
    return results
}

/** Extract all t('...') key references from source content. */
function extractTKeys(content) {
    const keys = new Set()
    // Match t('key'), t("key"), t(`key`)
    const staticPattern = /\bt\(\s*['"`]([^'"`\n${}]+)['"`]/g
    let match
    while ((match = staticPattern.exec(content)) !== null) {
        keys.add(match[1])
    }
    return keys
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    // Load EN locale as reference
    const enBarrel = pathToFileURL(resolve(LOCALES_DIR, 'en.ts')).href
    const enModule = await import(enBarrel)
    const enFlat = {}
    for (const [, value] of Object.entries(enModule)) {
        if (typeof value === 'object' && value !== null) {
            Object.assign(enFlat, value)
        }
    }

    // Build full key set from EN
    const localeKeys = collectKeys(enFlat)

    // Scan source files for t() calls
    const sourceFiles = await findSourceFiles(SRC_DIR)
    const usedKeys = new Map() // key -> [files]

    for (const file of sourceFiles) {
        const content = await readFile(file, 'utf-8')
        const keys = extractTKeys(content)
        for (const key of keys) {
            if (!usedKeys.has(key)) usedKeys.set(key, [])
            usedKeys.get(key).push(relative(SRC_DIR, file))
        }
    }

    // Find keys used in code but missing from locale
    const missingKeys = []
    const resolvedKeys = []

    for (const [key, files] of usedKeys.entries()) {
        // Skip dynamic keys with interpolation patterns
        if (key.includes('${') || key.includes('{{')) continue
        // Allow plural suffixes -- check base key too
        const baseKey = key.replace(/_one$|_other$|_zero$|_few$|_many$/, '')
        if (localeKeys.has(key) || localeKeys.has(baseKey)) {
            resolvedKeys.push(key)
        } else {
            // Check if this is a partial key that matches a parent object
            const isParentKey = [...localeKeys].some((lk) => lk.startsWith(key + '.'))
            if (!isParentKey) {
                missingKeys.push({ key, files })
            } else {
                resolvedKeys.push(key)
            }
        }
    }

    // Output
    if (jsonMode) {
        console.log(
            JSON.stringify(
                {
                    totalKeysUsed: usedKeys.size,
                    totalLocaleKeys: localeKeys.size,
                    resolved: resolvedKeys.length,
                    missing: missingKeys,
                },
                null,
                2,
            ),
        )
    } else {
        console.log(`\ni18n Keys Usage Report`)
        console.log(`======================`)
        console.log(`Source files scanned: ${sourceFiles.length}`)
        console.log(`Unique t() keys found: ${usedKeys.size}`)
        console.log(`EN locale keys: ${localeKeys.size}`)
        console.log(`Resolved: ${resolvedKeys.length}`)
        console.log(`Missing from EN: ${missingKeys.length}`)

        if (verbose && resolvedKeys.length > 0) {
            console.log(`\n[OK] Resolved keys (${resolvedKeys.length}):`)
            for (const k of resolvedKeys.sort()) {
                console.log(`  ${k}`)
            }
        }

        if (missingKeys.length > 0) {
            console.log(`\n[FAIL] Keys used in code but missing from EN locale:`)
            for (const { key, files } of missingKeys.sort((a, b) => a.key.localeCompare(b.key))) {
                console.log(`  ${key}`)
                for (const f of files.slice(0, 3)) {
                    console.log(`    -> ${f}`)
                }
                if (files.length > 3) {
                    console.log(`    ... and ${files.length - 3} more`)
                }
            }
        } else {
            console.log(`\n[OK] All t() keys resolve to EN locale entries.`)
        }
    }

    process.exit(missingKeys.length > 0 ? 1 : 0)
}

main().catch((err) => {
    console.error('[FAIL] i18n keys usage check crashed:', err)
    process.exit(2)
})
