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
import { fileURLToPath, pathToFileURL } from 'node:url'

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
export const parseObjectLiteral = (objStr) => {
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
const copyProvenance = (strain, raw) => {
    if (!Object.hasOwn(raw, 'dataProvenance')) return
    strain.dataProvenance = structuredClone(raw.dataProvenance)
}

const priorProvenance = (previous) => {
    const prior = new Map()
    for (const strain of previous) {
        if (!strain || !Object.hasOwn(strain, 'dataProvenance')) continue
        prior.set(strain.id, strain.dataProvenance)
    }
    return prior
}

const attachPriorProvenance = (strain, prior) => {
    if (Object.hasOwn(strain, 'dataProvenance') || !prior.has(strain.id)) return strain
    return { ...strain, dataProvenance: structuredClone(prior.get(strain.id)) }
}

export const preserveProvenance = (extracted, previous) => {
    const prior = priorProvenance(previous)
    return extracted.map((strain) => attachPriorProvenance(strain, prior))
}

export const normalizeStrain = (raw) => {
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

    copyProvenance(strain, raw)
    return strain
}

// -----------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------

const catalogArray = (text) => {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    throw new Error('previous catalog must be a JSON array')
}

export const readCatalogState = async (filePath) => {
    try {
        const text = await fs.readFile(filePath, 'utf8')
        return { exists: true, strains: catalogArray(text) }
    } catch (error) {
        if (error && error.code === 'ENOENT') return { exists: false, strains: [] }
        throw error
    }
}

export const readCatalogFile = async (filePath) => (await readCatalogState(filePath)).strains

const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value)

const pointerToken = (segment) => String(segment).replaceAll('~', '~0').replaceAll('/', '~1')

const arrayChanged = (previous, extracted) =>
    !Array.isArray(previous) || !Array.isArray(extracted) || previous.length !== extracted.length

const valueKind = (value) => {
    if (Array.isArray(value)) return 'array'
    if (isPlainObject(value)) return 'object'
    return 'scalar'
}

const diffArray = (previous, extracted, pointer, id, out) => {
    if (arrayChanged(previous, extracted)) {
        out.push({ pointer, id, reason: 'changed' })
        return
    }
    for (let index = 0; index < previous.length; index += 1) {
        diffValues(previous[index], extracted[index], `${pointer}/${index}`, id, out)
    }
}

const diffKey = (previous, extracted, pointer, id, key, out) => {
    const child = `${pointer}/${pointerToken(key)}`
    if (!Object.hasOwn(previous, key)) {
        out.push({ pointer: child, id, reason: 'added' })
        return
    }
    if (!Object.hasOwn(extracted, key)) {
        out.push({ pointer: child, id, reason: 'missing' })
        return
    }
    diffValues(previous[key], extracted[key], child, id, out)
}

const diffObject = (previous, extracted, pointer, id, out) => {
    if (!isPlainObject(previous) || !isPlainObject(extracted)) {
        out.push({ pointer, id, reason: 'changed' })
        return
    }
    const keys = new Set([...Object.keys(previous), ...Object.keys(extracted)])
    for (const key of keys) diffKey(previous, extracted, pointer, id, key, out)
}

const diffValues = (previous, extracted, pointer, id, out) => {
    if (Object.is(previous, extracted)) return
    const kind = valueKind(previous)
    if (kind !== valueKind(extracted)) {
        out.push({ pointer, id, reason: 'changed' })
        return
    }
    if (kind === 'array') {
        diffArray(previous, extracted, pointer, id, out)
        return
    }
    if (kind === 'object') {
        diffObject(previous, extracted, pointer, id, out)
        return
    }
    out.push({ pointer, id, reason: 'changed' })
}

const indexStrains = (strains, findings) => {
    const index = new Map()
    for (const strain of strains) {
        const id = strain && strain.id
        if (!id) {
            findings.push({ pointer: '', id: '', reason: 'normalize' })
            continue
        }
        if (index.has(id)) {
            findings.push({ pointer: `/${pointerToken(id)}`, id, reason: 'duplicate' })
            continue
        }
        index.set(id, strain)
    }
    return index
}

export const assessCatalogRoundTrip = (previous, extracted) => {
    const findings = []
    const prior = indexStrains(previous, findings)
    const next = indexStrains(extracted, findings)
    for (const [id, strain] of prior) {
        if (!next.has(id)) {
            findings.push({ pointer: `/${pointerToken(id)}`, id, reason: 'missing' })
            continue
        }
        diffValues(strain, next.get(id), `/${pointerToken(id)}`, id, findings)
    }
    for (const [id] of next) {
        if (!prior.has(id)) findings.push({ pointer: `/${pointerToken(id)}`, id, reason: 'added' })
    }
    return findings
}

export const planCatalogWrite = ({ previousExists, previous, extracted, failures }) => {
    const findings = failures.map((failure) => ({ ...failure }))
    if (previousExists) {
        for (const finding of assessCatalogRoundTrip(previous, extracted)) findings.push(finding)
    }
    return { write: findings.length === 0, findings }
}

const pushFailure = (failures, reason, fileName, id) => {
    failures.push({ pointer: '', id, reason, file: fileName })
}

const takeStrain = (parsed, fileName, seenIds, strains, failures) => {
    const strain = normalizeStrain(parsed)
    if (!strain) {
        pushFailure(failures, 'normalize', fileName, '')
        return false
    }
    if (seenIds.has(strain.id)) {
        pushFailure(failures, 'duplicate', fileName, strain.id)
        return false
    }
    seenIds.add(strain.id)
    strains.push(strain)
    return true
}

const collectBodies = (source, fileName, seenIds, strains, failures) => {
    let fileCount = 0
    for (const body of extractObjectBodies(source)) {
        const parsed = parseObjectLiteral(body)
        if (!parsed) {
            pushFailure(failures, 'parse', fileName, '')
            continue
        }
        if (takeStrain(parsed, fileName, seenIds, strains, failures)) fileCount += 1
    }
    return fileCount
}

const reportRefusal = (findings) => {
    console.error(
        `[extract] Refused: ${findings.length} finding(s). Catalog files were not modified.`,
    )
    for (const finding of findings.slice(0, 3)) {
        console.error(`[extract]   ${finding.pointer} id=${finding.id} reason=${finding.reason}`)
    }
}

const refuseExtract = (findings) => {
    reportRefusal(findings)
    const error = new Error('extract refused before writing the catalog')
    error.code = 'EXTRACT_REFUSED'
    error.findings = findings
    return error
}

const catalogText = (catalog) => `${JSON.stringify(catalog, null, 2)}\n`

export const runExtract = async ({ strainsDir: dir, outputPath: catalogPath }) => {
    const state = await readCatalogState(catalogPath)
    const files = (await fs.readdir(dir))
        .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
        .sort()

    console.log(`[extract] Scanning ${files.length} strain files...`)

    const strains = []
    const seenIds = new Set()
    const failures = []
    for (const fileName of files) {
        const source = await fs.readFile(path.join(dir, fileName), 'utf8')
        const fileCount = collectBodies(source, fileName, seenIds, strains, failures)
        console.log(`[extract]   ${fileName}: ${fileCount} strains`)
    }

    const catalog = preserveProvenance(strains, state.strains)
    catalog.sort((a, b) => a.id.localeCompare(b.id))
    const decision = planCatalogWrite({
        previousExists: state.exists,
        previous: state.strains,
        extracted: catalog,
        failures,
    })
    if (!decision.write) throw refuseExtract(decision.findings)

    const json = catalogText(catalog)
    if (state.exists) {
        const current = await fs.readFile(catalogPath, 'utf8')
        if (current !== json) throw refuseExtract([{ pointer: '', id: '', reason: 'format' }])
        console.log('[extract] Catalog already matches. No write.')
        return { written: false, count: catalog.length }
    }

    await fs.writeFile(catalogPath, json, 'utf8')
    console.log(`[extract] Total extracted: ${catalog.length} unique strains`)
    console.log(`[extract] Written to: ${catalogPath}`)
    return { written: true, count: catalog.length }
}

const run = () => runExtract({ strainsDir, outputPath })

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
    run().catch((err) => {
        console.error('[extract] Fatal error:', err)
        process.exit(1)
    })
}
