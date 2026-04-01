#!/usr/bin/env node

/**
 * Consolidate temp-additions-*.ts locale files into alphabetical bucket files (a.ts-z.ts, numeric.ts).
 *
 * Process:
 * 1. Read all temp-additions-*.ts files in a locale directory
 * 2. Extract strain ID -> translation data entries
 * 3. Sort entries into alphabetical buckets by first char of ID
 * 4. Merge into existing alphabetical files (skip duplicates)
 * 5. Delete temp files
 * 6. Report results
 *
 * Usage: node scripts/consolidate-locale-strains.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, unlinkSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const LOCALES_DIR = join(ROOT, 'apps', 'web', 'locales')
const LOCALES_TO_PROCESS = ['en', 'de']
const DRY_RUN = process.argv.includes('--dry-run')

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/**
 * Extract all "id": { ... } entries from a locale strain file.
 * Returns Map<strainId, rawObjectSource>.
 */
function extractEntries(content) {
    const entries = new Map()

    // Match top-level keys in the exported object:
    //   "some-id": { ... }  or  "some-id": {}
    // We need to handle nested braces properly.
    const keyPattern = /^\s*["']([a-z0-9][a-z0-9-]*)["']\s*:\s*\{/gm
    let match
    while ((match = keyPattern.exec(content)) !== null) {
        const id = match[1]
        const startIdx = match.index
        // Find the matching closing brace
        const objStart = content.indexOf('{', startIdx + match[0].indexOf(':'))
        if (objStart === -1) continue

        let depth = 0
        let objEnd = -1
        for (let i = objStart; i < content.length; i++) {
            if (content[i] === '{') depth++
            else if (content[i] === '}') {
                depth--
                if (depth === 0) {
                    objEnd = i
                    break
                }
            }
        }
        if (objEnd === -1) continue

        const objSource = content.slice(objStart, objEnd + 1)
        entries.set(id, objSource)
    }

    return entries
}

/**
 * Determine the alphabetical bucket for a strain ID.
 */
function getBucket(id) {
    const firstChar = id.charAt(0).toLowerCase()
    if (firstChar >= 'a' && firstChar <= 'z') return firstChar
    return 'numeric'
}

/**
 * Read existing entries from an alphabetical file.
 */
function readExistingKeys(filePath) {
    if (!existsSync(filePath)) return new Set()
    const content = readFileSync(filePath, 'utf-8')
    const keys = new Set()
    const keyPattern = /^\s*["']([a-z0-9][a-z0-9-]*)["']\s*:/gm
    let match
    while ((match = keyPattern.exec(content)) !== null) {
        keys.add(match[1])
    }
    return keys
}

/**
 * Insert new entries into an alphabetical locale file.
 * Entries are added before the final closing `};` or `}`.
 */
function mergeIntoFile(filePath, newEntries, exportName) {
    let content = readFileSync(filePath, 'utf-8')
    const existingKeys = readExistingKeys(filePath)

    // Filter out duplicates
    const toAdd = []
    for (const [id, objSource] of newEntries) {
        if (existingKeys.has(id)) continue
        toAdd.push([id, objSource])
    }

    if (toAdd.length === 0) return 0

    // Sort entries alphabetically
    toAdd.sort((a, b) => a[0].localeCompare(b[0]))

    // Build the new entries block
    const newBlock = toAdd
        .map(([id, objSource]) => {
            // Normalize object formatting
            if (objSource.trim() === '{}') {
                return `  "${id}": {}`
            }
            // Re-indent the object content for consistency
            const inner = objSource.slice(1, -1).trim()
            if (!inner) return `  "${id}": {}`
            // Indent each line of the inner content
            const indentedInner = inner
                .split('\n')
                .map((line) => {
                    const trimmed = line.trim()
                    if (!trimmed) return ''
                    return `    ${trimmed}`
                })
                .filter(Boolean)
                .join('\n')
            return `  "${id}": {\n${indentedInner}\n  }`
        })
        .join(',\n')

    // Find the last closing `}` of the exported object
    // Look for pattern: newline + `}` or `};` at end of file
    const closingMatch = content.match(/\n(\s*)\};\s*$/) || content.match(/\n(\s*)\}\s*$/)
    if (!closingMatch) {
        console.error(`  [FAIL] Could not find closing brace in ${filePath}`)
        return 0
    }

    const insertPos = closingMatch.index
    // Check if there's a trailing comma needed
    const beforeClosing = content.slice(0, insertPos).trimEnd()
    const needsComma = beforeClosing.endsWith('}') || beforeClosing.endsWith('{}')

    const insertion = (needsComma ? ',\n' : '\n') + newBlock
    content = content.slice(0, insertPos) + insertion + content.slice(insertPos)

    if (!DRY_RUN) {
        writeFileSync(filePath, content, 'utf-8')
    }

    return toAdd.length
}

/**
 * Create a new alphabetical file if it does not exist.
 */
function createBucketFile(filePath, exportName) {
    const content = `import type { StrainTranslationData } from '@/types';\n\nexport const ${exportName}: Record<string, StrainTranslationData> = {\n};\n`
    if (!DRY_RUN) {
        writeFileSync(filePath, content, 'utf-8')
    }
}

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------

let totalMerged = 0
let totalTempFiles = 0
let totalDeleted = 0

for (const locale of LOCALES_TO_PROCESS) {
    const strainsDir = join(LOCALES_DIR, locale, 'strains')
    if (!existsSync(strainsDir)) {
        console.error(`[SKIP] Directory not found: ${strainsDir}`)
        continue
    }

    console.log(`\n=== Processing locale: ${locale} ===`)

    // Find all temp-additions files
    const tempFiles = readdirSync(strainsDir)
        .filter((f) => f.startsWith('temp-additions-') && f.endsWith('.ts'))
        .sort()

    if (tempFiles.length === 0) {
        console.log('  No temp-additions files found.')
        continue
    }

    console.log(`  Found ${tempFiles.length} temp-additions files`)
    totalTempFiles += tempFiles.length

    // Collect all entries from all temp files, grouped by bucket
    const bucketEntries = new Map() // bucket -> Map<id, objSource>

    for (const tempFile of tempFiles) {
        const filePath = join(strainsDir, tempFile)
        const content = readFileSync(filePath, 'utf-8')
        const entries = extractEntries(content)

        if (entries.size === 0) {
            console.log(`  [EMPTY] ${tempFile} (no entries)`)
        }

        for (const [id, objSource] of entries) {
            const bucket = getBucket(id)
            if (!bucketEntries.has(bucket)) {
                bucketEntries.set(bucket, new Map())
            }
            // Last occurrence wins (same as data/strains/index.ts strategy)
            bucketEntries.get(bucket).set(id, objSource)
        }
    }

    // Merge entries into alphabetical files
    let localeMerged = 0
    for (const [bucket, entries] of [...bucketEntries.entries()].sort()) {
        const bucketFile = join(strainsDir, `${bucket}.ts`)
        // Determine export name: t.ts uses `strainsT`, all others use `strains`
        const exportName = bucket === 't' ? 'strainsT' : 'strains'

        if (!existsSync(bucketFile)) {
            console.log(`  [NEW] Creating ${bucket}.ts`)
            createBucketFile(bucketFile, exportName)
        }

        const count = mergeIntoFile(bucketFile, entries, exportName)
        if (count > 0) {
            console.log(`  [MERGE] ${bucket}.ts: +${count} entries`)
            localeMerged += count
        }
    }

    totalMerged += localeMerged

    // Delete temp files
    if (!DRY_RUN) {
        for (const tempFile of tempFiles) {
            const filePath = join(strainsDir, tempFile)
            unlinkSync(filePath)
            totalDeleted++
        }
        console.log(`  [DELETE] Removed ${tempFiles.length} temp files`)
    } else {
        console.log(`  [DRY-RUN] Would delete ${tempFiles.length} temp files`)
    }

    console.log(`  Locale ${locale}: ${localeMerged} entries merged`)
}

console.log(`\n=== Summary ===`)
console.log(`  Temp files processed: ${totalTempFiles}`)
console.log(`  Entries merged: ${totalMerged}`)
console.log(`  Temp files deleted: ${totalDeleted}`)
console.log(`  Mode: ${DRY_RUN ? 'DRY-RUN (no changes written)' : 'LIVE'}`)

if (DRY_RUN) {
    console.log('\nRe-run without --dry-run to apply changes.')
}
