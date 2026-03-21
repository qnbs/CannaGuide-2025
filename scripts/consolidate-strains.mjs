#!/usr/bin/env node
/**
 * Strain Consolidation Script
 *
 * Merges all temp-additions-*.ts files into the proper alphabetical files (a.ts-z.ts, numeric.ts).
 * Each strain is sorted by the first character of its name.
 * After consolidation, temp files are deleted and index.ts is rewritten.
 */
import fs from 'node:fs'
import path from 'node:path'

const STRAINS_DIR = path.resolve(import.meta.dirname, '..', 'data', 'strains')

// --- Helpers -----------------------------------------------
function getLetterBucket(strainName) {
    const first = strainName.trim().charAt(0).toLowerCase()
    if (/[a-z]/.test(first)) return first
    return 'numeric' // 0-9", "#", etc.
}

/**
 * Extracts individual createStrainObject({...}) blocks from file content.
 * Returns array of { name, block } where block is the full createStrainObject(...) text.
 */
function extractStrainBlocks(content) {
    const blocks = []
    // Find all createStrainObject(...) calls with balanced parentheses
    let idx = 0
    while (idx < content.length) {
        const start = content.indexOf('createStrainObject(', idx)
        if (start === -1) break

        // Find balanced parens
        let depth = 0
        let end = start
        let foundOpen = false
        for (let i = start; i < content.length; i++) {
            if (content[i] === '(') {
                depth++
                foundOpen = true
            } else if (content[i] === ')') {
                depth--
                if (foundOpen && depth === 0) {
                    end = i + 1
                    break
                }
            }
        }

        if (end <= start) {
            idx = start + 1
            continue
        }

        const block = content.slice(start, end)

        // Extract name from the block
        const nameMatch = block.match(/["']name["']\s*:\s*["']([^"']+)["']/)
        const idMatch = block.match(/["']?id["']?\s*:\s*["']([^"']+)["']/)

        if (nameMatch) {
            blocks.push({
                name: nameMatch[1],
                id: idMatch ? idMatch[1] : null,
                block,
            })
        } else {
            console.log(`  [WARN] Could not extract name from block at position ${start}`)
        }

        idx = end
    }

    return blocks
}

/**
 * Extract existing strain IDs from an alphabetical file.
 */
function extractExistingIds(content) {
    const ids = new Set()
    const idRegex = /["']?id["']?\s*:\s*["']([^"']+)["']/g
    let match
    while ((match = idRegex.exec(content)) !== null) {
        ids.add(match[1])
    }
    return ids
}

// --- Main --------------------------------------------------
console.log('[PLANT] Strain Consolidation Script\n')
console.log(`[DIR] Working directory: ${STRAINS_DIR}\n`)

// 1. Find all temp files
const allFiles = fs.readdirSync(STRAINS_DIR).filter((f) => f.endsWith('.ts'))
const tempFiles = allFiles.filter((f) => f.startsWith('temp-'))
const alphaFiles = allFiles.filter((f) => /^[a-z]\.ts$/.test(f) || f === 'numeric.ts')

console.log(`[LIST] Found ${tempFiles.length} temp files to consolidate`)
console.log(`[LIST] Found ${alphaFiles.length} alphabetical files\n`)

// 2. Extract all strain blocks from temp files
const buckets = {} // letter -> [{ name, id, block }]
let totalExtracted = 0
let emptyTempFiles = 0

for (const tempFile of tempFiles) {
    const filePath = path.join(STRAINS_DIR, tempFile)
    const content = fs.readFileSync(filePath, 'utf-8')
    const blocks = extractStrainBlocks(content)

    if (blocks.length === 0) {
        console.log(`  [FILE] ${tempFile}: empty (0 strains)`)
        emptyTempFiles++
        continue
    }

    console.log(`  [FILE] ${tempFile}: ${blocks.length} strains`)

    for (const entry of blocks) {
        const letter = getLetterBucket(entry.name)
        if (!buckets[letter]) buckets[letter] = []
        buckets[letter].push({ ...entry, sourceFile: tempFile })
        totalExtracted++
    }
}

console.log(
    `\n[OK] Extracted ${totalExtracted} strains from ${tempFiles.length - emptyTempFiles} non-empty temp files`,
)
console.log(`[EMPTY] ${emptyTempFiles} empty temp files\n`)

// 3. Show distribution
console.log('[CHART] Distribution to alphabetical buckets:')
for (const [letter, items] of Object.entries(buckets).sort()) {
    console.log(
        `  ${letter.toUpperCase()}: ${items.length} strains (${items.map((i) => i.name).join(', ')})`,
    )
}
console.log()

// 4. Merge into alphabetical files - append before the closing ];
let mergedCount = 0
let skipCount = 0

for (const [letter, items] of Object.entries(buckets)) {
    const targetFile = letter === 'numeric' ? 'numeric.ts' : `${letter}.ts`
    const targetPath = path.join(STRAINS_DIR, targetFile)

    if (!fs.existsSync(targetPath)) {
        console.log(`  [WARN] Target file ${targetFile} does not exist, creating it.`)
        const varName = letter === 'numeric' ? 'strainsNumeric' : `strains${letter.toUpperCase()}`
        const newContent = `import { Strain, StrainType } from '@/types';\nimport { createStrainObject } from '@/services/strainFactory';\n\nexport const ${varName}: Strain[] = [\n];\n`
        fs.writeFileSync(targetPath, newContent, 'utf-8')
    }

    let content = fs.readFileSync(targetPath, 'utf-8')
    const existingIds = extractExistingIds(content)

    const newBlocks = []
    for (const item of items) {
        if (item.id && existingIds.has(item.id)) {
            console.log(
                `  [SKIP] Skipping duplicate: "${item.name}" (${item.id}) already in ${targetFile}`,
            )
            skipCount++
            continue
        }
        newBlocks.push(item)
    }

    if (newBlocks.length === 0) continue

    // Find the last ]; in the file and insert before it
    const closingIndex = content.lastIndexOf('];')
    if (closingIndex === -1) {
        console.error(`  [ERR] Could not find closing ]; in ${targetFile}`)
        continue
    }

    // Build the insertion text
    const insertion = newBlocks.map((item) => `    ${item.block},`).join('\n')

    // Check if there's content before the closing - add comma if needed
    const beforeClosing = content.slice(0, closingIndex).trimEnd()
    const needsTrailingComma = beforeClosing.endsWith(')') && !beforeClosing.endsWith(',')

    const prefix = needsTrailingComma ? ',\n' : '\n'
    content =
        content.slice(0, closingIndex) + prefix + insertion + '\n' + content.slice(closingIndex)

    fs.writeFileSync(targetPath, content, 'utf-8')
    console.log(`  [OK] Merged ${newBlocks.length} strains into ${targetFile}`)
    mergedCount += newBlocks.length
}

console.log(`\n[OK] Merged: ${mergedCount}, Skipped duplicates: ${skipCount}\n`)

// 5. Delete temp files
console.log('[DEL]  Deleting temp files...')
for (const tempFile of tempFiles) {
    fs.unlinkSync(path.join(STRAINS_DIR, tempFile))
    console.log(`  [DEL]  Deleted ${tempFile}`)
}

// 6. Rewrite index.ts with clean imports
console.log('\n[EDIT] Rewriting index.ts...')

const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
const imports = [
    `import type { Strain } from '@/types';`,
    ``,
    `import { strainsNumeric } from './numeric';`,
    ...letters.map((l) => `import { strains${l.toUpperCase()} } from './${l}';`),
]

const spreadLines = [
    `    ...strainsNumeric,`,
    ...letters.map((l) => `    ...strains${l.toUpperCase()},`),
]

const newIndexContent = `${imports.join('\n')}

/**
 * Combined strain catalog.
 * All strains are organized in alphabetical files (a.ts-z.ts, numeric.ts).
 * De-duplicated by ID to ensure data integrity.
 */
const combinedStrains: Strain[] = [
${spreadLines.join('\n')}
];

// De-duplicate strains by ID to ensure data integrity from the source.
export const allStrainsData: Strain[] = Array.from(
    new Map(combinedStrains.map(strain => [strain.id, strain])).values()
);
`

fs.writeFileSync(path.join(STRAINS_DIR, 'index.ts'), newIndexContent, 'utf-8')

// 7. Summary
const finalFiles = fs.readdirSync(STRAINS_DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts')
console.log(`\n[DONE] Consolidation complete!`)
console.log(
    `   [DIR] ${finalFiles.length} strain data files (was ${alphaFiles.length + tempFiles.length})`,
)
console.log(`   [PLANT] ${mergedCount} strains merged from temp files`)
console.log(`   [DEL]  ${tempFiles.length} temp files deleted`)
console.log(`   [EDIT] index.ts rewritten with ${finalFiles.length} clean imports\n`)
