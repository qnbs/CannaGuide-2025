/**
 * extract-strains-to-json.mjs
 *
 * Reads all strain .ts files (a.ts-z.ts, numeric.ts) and extracts
 * every createStrainObject({...}) call into a single, normalized
 * apps/web/data/strains.json -- the Single Source of Truth.
 *
 * Usage: node scripts/extract-strains-to-json.mjs
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const strainsDir = path.join(repoRoot, 'apps', 'web', 'data', 'strains')
const outputPath = path.join(strainsDir, 'strains.json')

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

/** Map StrainType.X enum references to plain strings */
const resolveEnumValue = (raw) => {
    if (!raw) return raw
    const str = String(raw).trim()
    const enumMap = {
        'StrainType.Sativa': 'Sativa',
        'StrainType.Indica': 'Indica',
        'StrainType.Hybrid': 'Hybrid',
    }
    return enumMap[str] ?? str
}

/**
 * Extract the object literal body from a createStrainObject({...}) call.
 * Handles nested braces correctly.
 */
const extractObjectBodies = (source) => {
    const bodies = []
    const marker = 'createStrainObject('
    let idx = 0

    while (true) {
        const start = source.indexOf(marker, idx)
        if (start === -1) break

        // Find the opening { after the marker
        let braceStart = source.indexOf('{', start + marker.length)
        if (braceStart === -1) break

        // Walk forward counting braces
        let depth = 0
        let i = braceStart
        while (i < source.length) {
            if (source[i] === '{') depth++
            else if (source[i] === '}') {
                depth--
                if (depth === 0) break
            }
            i++
        }

        if (depth === 0) {
            bodies.push(source.slice(braceStart, i + 1))
        }

        idx = i + 1
    }

    return bodies
}

/**
 * Parse JS-ish object literal into a plain JSON-safe object.
 * Uses a character-level tokenizer to handle: unquoted keys,
 * single-quoted strings (including apostrophes), trailing commas,
 * StrainType.X enums, nested objects/arrays, multi-line strings.
 */
const parseObjectLiteral = (objStr) => {
    // Tokenize character by character to correctly handle strings
    const tokens = []
    let i = 0
    const src = objStr

    while (i < src.length) {
        const ch = src[i]

        // Skip whitespace
        if (/\s/.test(ch)) {
            tokens.push(ch)
            i++
            continue
        }

        // Single or double quoted string
        if (ch === "'" || ch === '"') {
            const quote = ch
            let str = ''
            i++ // skip opening quote
            while (i < src.length) {
                if (src[i] === '\\') {
                    // Escaped character
                    str += src[i] + src[i + 1]
                    i += 2
                } else if (src[i] === quote) {
                    i++ // skip closing quote
                    break
                } else {
                    str += src[i]
                    i++
                }
            }
            // Normalize: escape double quotes inside, unescape single quotes
            str = str.replace(/\\'/g, "'")
            str = str.replace(/(?<!\\)"/g, '\\"')
            tokens.push(`"${str}"`)
            continue
        }

        // StrainType.X enum
        if (src.slice(i, i + 11) === 'StrainType.') {
            const rest = src.slice(i + 11)
            const m = rest.match(/^(\w+)/)
            if (m) {
                tokens.push(`"${m[1]}"`)
                i += 11 + m[1].length
                continue
            }
        }

        // Identifier (potential unquoted key)
        if (/[a-zA-Z_$]/.test(ch)) {
            let ident = ''
            while (i < src.length && /[\w$]/.test(src[i])) {
                ident += src[i]
                i++
            }
            // Look ahead: is this followed by ':'? (skip whitespace)
            let j = i
            while (j < src.length && /\s/.test(src[j])) j++
            if (src[j] === ':') {
                // It's a key -- quote it
                tokens.push(`"${ident}"`)
            } else {
                // It's a bare value (true, false, null) or something else
                tokens.push(ident)
            }
            continue
        }

        // Everything else (numbers, braces, colons, commas)
        tokens.push(ch)
        i++
    }

    let s = tokens.join('')

    // Remove trailing commas before } or ]
    s = s.replace(/,(\s*[}\]])/g, '$1')

    try {
        return JSON.parse(s)
    } catch (e) {
        const preview = s.slice(0, 200).replace(/\n/g, ' ')
        console.error(`[extract] JSON.parse failed: ${e.message}`)
        console.error(`[extract] Preview: ${preview}...`)
        return null
    }
}

/**
 * Normalize a parsed strain object: ensure consistent field names
 * and strip any runtime-only fields.
 */
const normalizeStrain = (raw) => {
    if (!raw || !raw.id || !raw.name) return null

    const strain = {
        id: String(raw.id).trim(),
        name: String(raw.name).trim(),
        type: resolveEnumValue(raw.type) ?? 'Hybrid',
    }

    // Optional string fields
    const optStrings = [
        'typeDetails',
        'genetics',
        'floweringType',
        'thcRange',
        'cbdRange',
        'floweringTimeRange',
        'description',
    ]
    for (const key of optStrings) {
        if (raw[key] !== undefined && raw[key] !== null) {
            strain[key] = String(raw[key]).trim()
        }
    }

    // Default floweringType
    if (!strain.floweringType) strain.floweringType = 'Photoperiod'

    // Numeric fields
    if (raw.thc !== undefined) strain.thc = Number(raw.thc)
    if (raw.cbd !== undefined) strain.cbd = Number(raw.cbd)
    if (raw.cbg !== undefined) strain.cbg = Number(raw.cbg)
    if (raw.thcv !== undefined) strain.thcv = Number(raw.thcv)
    if (raw.floweringTime !== undefined) strain.floweringTime = Number(raw.floweringTime)

    // Agronomic
    if (raw.agronomic && typeof raw.agronomic === 'object') {
        strain.agronomic = {}
        if (raw.agronomic.difficulty) strain.agronomic.difficulty = String(raw.agronomic.difficulty)
        if (raw.agronomic.yield) strain.agronomic.yield = String(raw.agronomic.yield)
        if (raw.agronomic.height) strain.agronomic.height = String(raw.agronomic.height)
        if (raw.agronomic.yieldDetails) strain.agronomic.yieldDetails = raw.agronomic.yieldDetails
        if (raw.agronomic.heightDetails)
            strain.agronomic.heightDetails = raw.agronomic.heightDetails
    }

    // Arrays
    if (Array.isArray(raw.aromas)) strain.aromas = raw.aromas.map(String)
    if (Array.isArray(raw.dominantTerpenes))
        strain.dominantTerpenes = raw.dominantTerpenes.map(String)

    // Lineage (if present)
    if (raw.lineage && typeof raw.lineage === 'object') {
        strain.lineage = raw.lineage
    }

    return strain
}

// -----------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------

const run = async () => {
    const files = (await fs.readdir(strainsDir))
        .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
        .sort()

    console.log(`[extract] Scanning ${files.length} strain files...`)

    const allStrains = []
    const seenIds = new Set()
    let duplicateCount = 0

    for (const fileName of files) {
        const filePath = path.join(strainsDir, fileName)
        const source = await fs.readFile(filePath, 'utf8')
        const bodies = extractObjectBodies(source)

        let fileCount = 0
        for (const body of bodies) {
            const parsed = parseObjectLiteral(body)
            if (!parsed) {
                console.warn(`[extract] Failed to parse object in ${fileName}`)
                continue
            }

            const strain = normalizeStrain(parsed)
            if (!strain) {
                console.warn(`[extract] Failed to normalize strain in ${fileName}`)
                continue
            }

            if (seenIds.has(strain.id)) {
                console.warn(`[extract] Duplicate ID skipped: ${strain.id} (in ${fileName})`)
                duplicateCount++
                continue
            }

            seenIds.add(strain.id)
            allStrains.push(strain)
            fileCount++
        }

        console.log(`[extract]   ${fileName}: ${fileCount} strains`)
    }

    // Sort alphabetically by id
    allStrains.sort((a, b) => a.id.localeCompare(b.id))

    // Write JSON
    const json = JSON.stringify(allStrains, null, 2)
    await fs.writeFile(outputPath, `${json}\n`, 'utf8')

    console.log(`[extract] ----------------------------------------`)
    console.log(`[extract] Total extracted: ${allStrains.length} unique strains`)
    if (duplicateCount > 0) {
        console.log(`[extract] Duplicates removed: ${duplicateCount}`)
    }
    console.log(`[extract] Written to: ${path.relative(repoRoot, outputPath)}`)
}

run().catch((err) => {
    console.error('[extract] Fatal error:', err)
    process.exit(1)
})
