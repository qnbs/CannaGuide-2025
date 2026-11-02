import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { formatStrain } from './generate-strain-files.mjs'

const strainsPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'apps',
    'web',
    'data',
    'strains',
    'strains.json',
)
const catalogBefore = readFileSync(strainsPath)
const {
    assessCatalogRoundTrip,
    normalizeStrain,
    parseObjectLiteral,
    planCatalogWrite,
    preserveProvenance,
    readCatalogFile,
    runExtract,
} = await import('./extract-strains-to-json.mjs')

const objectBody = (text) => {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    return text.slice(start, end + 1)
}

const provenance = [{ sourceUrl: null, labVerified: false }]

test('importing the extractor leaves strains.json unchanged', () => {
    assert.deepEqual(readFileSync(strainsPath), catalogBefore)
})

test('a missing catalog is empty and a broken catalog is rejected', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'extract-catalog-'))
    try {
        const missing = path.join(dir, 'absent.json')
        assert.deepEqual(await readCatalogFile(missing), [])

        const file = path.join(dir, 'strains.json')
        writeFileSync(file, '[{"id":"a","dataProvenance":[{"sourceUrl":null}]}]\n')
        const rows = await readCatalogFile(file)
        assert.equal(rows[0].dataProvenance[0].sourceUrl, null)

        writeFileSync(file, '{')
        await assert.rejects(() => readCatalogFile(file), SyntaxError)
        writeFileSync(file, '{}')
        await assert.rejects(() => readCatalogFile(file), /JSON array/)
        await assert.rejects(() => readCatalogFile(dir), { code: 'EISDIR' })
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('a parsed module keeps explicit null provenance', () => {
    const source = formatStrain({
        id: 'kept',
        name: 'Kept',
        type: 'Hybrid',
        floweringType: 'Photoperiod',
        thc: 18,
        dataProvenance: provenance,
    })
    const parsed = parseObjectLiteral(objectBody(source))
    const strain = normalizeStrain(parsed)
    assert.deepEqual(strain.dataProvenance, provenance)
    assert.equal(strain.dataProvenance[0].sourceUrl, null)
    assert.equal(strain.dataProvenance[0].labVerified, false)
})

test('normalizeStrain does not invent provenance', () => {
    const strain = normalizeStrain({ id: 'bare', name: 'Bare', type: 'Hybrid' })
    assert.equal(Object.hasOwn(strain, 'dataProvenance'), false)
})

test('a missing module field is filled from the previous catalog', () => {
    const previous = [{ id: 'old', name: 'Old', dataProvenance: provenance }]
    const extracted = [{ id: 'old', name: 'Old', type: 'Hybrid' }]
    const [strain] = preserveProvenance(extracted, previous)
    assert.deepEqual(strain.dataProvenance, provenance)
    assert.equal(Object.hasOwn(extracted[0], 'dataProvenance'), false)
    strain.dataProvenance[0].sourceUrl = 'mutated'
    assert.equal(previous[0].dataProvenance[0].sourceUrl, null)
})

test('an extracted provenance value wins, including null', () => {
    const previous = [{ id: 'a', dataProvenance: [{ sourceUrl: 'https://old.example' }] }]
    const explicitNull = preserveProvenance(
        [{ id: 'a', name: 'A', dataProvenance: null }],
        previous,
    )
    assert.equal(explicitNull[0].dataProvenance, null)

    const explicitValue = preserveProvenance(
        [{ id: 'a', name: 'A', dataProvenance: [{ sourceUrl: 'https://new.example' }] }],
        previous,
    )
    assert.deepEqual(explicitValue[0].dataProvenance, [{ sourceUrl: 'https://new.example' }])
})

test('provenance stays absent when neither side has the field', () => {
    const [strain] = preserveProvenance(
        [{ id: 'bare', name: 'Bare' }],
        [{ id: 'bare', name: 'Bare' }],
    )
    assert.equal(Object.hasOwn(strain, 'dataProvenance'), false)
})

const manifest = (dir) => {
    const lines = []
    const walk = (current) => {
        for (const entry of readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name)
            if (entry.isDirectory()) {
                walk(full)
                continue
            }
            const hash = createHash('sha256').update(readFileSync(full)).digest('hex')
            lines.push(`${path.relative(dir, full)} ${hash}`)
        }
    }
    walk(dir)
    return lines.sort()
}

const moduleSource = (body) =>
    `import { createStrainObject } from '@/services/strainFactory'\n${body}\n`

const writeFixture = (dir, { modules, catalog }) => {
    mkdirSync(dir, { recursive: true })
    for (const entry of readdirSync(dir)) {
        if (entry.endsWith('.ts')) rmSync(path.join(dir, entry))
    }
    mkdirSync(path.join(dir, 'pending'), { recursive: true })
    writeFileSync(path.join(dir, 'index.ts'), 'export const allStrainsData = []\n')
    writeFileSync(path.join(dir, 'pending', 'pending-strains.json'), '{}\n')
    for (const [name, body] of Object.entries(modules)) {
        writeFileSync(path.join(dir, name), moduleSource(body))
    }
    if (catalog !== undefined) writeFileSync(path.join(dir, 'strains.json'), catalog)
}

const matchedCatalog = (fields) => {
    const source = formatStrain({
        id: 'ok',
        name: 'Ok',
        type: 'Hybrid',
        floweringType: 'Photoperiod',
        ...fields,
    })
    const strain = normalizeStrain(parseObjectLiteral(objectBody(source)))
    return { source, text: `${JSON.stringify([strain], null, 2)}\n` }
}

const refused = async (dir) => {
    const before = manifest(dir)
    await assert.rejects(
        () => runExtract({ strainsDir: dir, outputPath: path.join(dir, 'strains.json') }),
        {
            code: 'EXTRACT_REFUSED',
        },
    )
    assert.deepEqual(manifest(dir), before)
}

test('a lossy extract leaves the previous catalog and index untouched', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'extract-guard-'))
    try {
        const { source, text } = matchedCatalog({ thc: 1, dataProvenance: provenance })
        const saved = JSON.parse(text)
        saved[0].labNote = 'kept'
        writeFixture(dir, {
            modules: { 'a.ts': source },
            catalog: `${JSON.stringify(saved, null, 2)}\n`,
        })
        await refused(dir)
        const findings = assessCatalogRoundTrip(saved, [
            normalizeStrain(parseObjectLiteral(objectBody(source))),
        ])
        assert.equal(
            findings.some(
                (finding) => finding.reason === 'missing' && finding.pointer.endsWith('/labNote'),
            ),
            true,
        )
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('explicit null and missing type or flowering type do not replace the catalog', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'extract-guard-'))
    try {
        const nullSource = formatStrain({
            id: 'ok',
            name: 'Ok',
            type: 'Hybrid',
            floweringType: 'Photoperiod',
            thc: null,
        })
        const previous = normalizeStrain(parseObjectLiteral(objectBody(nullSource)))
        previous.thc = null
        writeFixture(dir, {
            modules: { 'a.ts': nullSource },
            catalog: `${JSON.stringify([previous], null, 2)}\n`,
        })
        await refused(dir)

        const missing = formatStrain({ id: 'ok', name: 'Ok' })
        const bare = { id: 'ok', name: 'Ok' }
        writeFixture(dir, {
            modules: { 'a.ts': missing },
            catalog: `${JSON.stringify([bare], null, 2)}\n`,
        })
        await refused(dir)
        const invented = assessCatalogRoundTrip(
            [bare],
            [normalizeStrain(parseObjectLiteral(objectBody(missing)))],
        )
        assert.equal(
            invented.some((finding) => finding.reason === 'added'),
            true,
        )
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('parse errors, duplicate ids, and strains without an id do not write', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'extract-guard-'))
    try {
        const { source, text } = matchedCatalog({})
        writeFixture(dir, {
            modules: {
                'a.ts': `${source}\ncreateStrainObject({ id: 'ok', name: 'Ok', value: undefined })`,
            },
            catalog: text,
        })
        await refused(dir)

        writeFixture(dir, {
            modules: { 'a.ts': source, 'b.ts': source },
            catalog: text,
        })
        await refused(dir)

        writeFixture(dir, {
            modules: { 'a.ts': 'createStrainObject({ name: "NoId" })' },
            catalog: text,
        })
        await refused(dir)
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('an exact catalog is not rewritten and a missing catalog can be created', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'extract-guard-'))
    try {
        const { source, text } = matchedCatalog({ dataProvenance: provenance })
        writeFixture(dir, { modules: { 'a.ts': source }, catalog: text })
        const before = manifest(dir)
        const matched = await runExtract({
            strainsDir: dir,
            outputPath: path.join(dir, 'strains.json'),
        })
        assert.equal(matched.written, false)
        assert.deepEqual(manifest(dir), before)

        rmSync(path.join(dir, 'strains.json'))
        const created = await runExtract({
            strainsDir: dir,
            outputPath: path.join(dir, 'strains.json'),
        })
        assert.equal(created.written, true)
        assert.equal(readFileSync(path.join(dir, 'strains.json'), 'utf8'), text)
        assert.equal(
            readFileSync(path.join(dir, 'index.ts'), 'utf8'),
            'export const allStrainsData = []\n',
        )
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('a formatting-only catalog difference is left untouched', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'extract-guard-'))
    try {
        const { source, text } = matchedCatalog({})
        const compact = JSON.stringify(JSON.parse(text))
        writeFixture(dir, { modules: { 'a.ts': source }, catalog: compact })
        const before = readFileSync(path.join(dir, 'strains.json'), 'utf8')
        const result = await runExtract({
            strainsDir: dir,
            outputPath: path.join(dir, 'strains.json'),
        })
        assert.equal(result.written, false)
        assert.equal(readFileSync(path.join(dir, 'strains.json'), 'utf8'), before)
        const decision = planCatalogWrite({
            previousExists: true,
            previous: JSON.parse(text),
            extracted: JSON.parse(text),
            failures: [],
        })
        assert.equal(decision.write, true)
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('an omitted module provenance is retained from the previous catalog', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'extract-guard-'))
    try {
        const source = formatStrain({
            id: 'ok',
            name: 'Ok',
            type: 'Hybrid',
            floweringType: 'Photoperiod',
        })
        const strain = normalizeStrain(parseObjectLiteral(objectBody(source)))
        const text = `${JSON.stringify([{ ...strain, dataProvenance: provenance }], null, 4)}\n`
        writeFixture(dir, { modules: { 'a.ts': source }, catalog: text })
        const before = readFileSync(path.join(dir, 'strains.json'))
        const result = await runExtract({
            strainsDir: dir,
            outputPath: path.join(dir, 'strains.json'),
        })
        assert.equal(result.written, false)
        assert.deepEqual(readFileSync(path.join(dir, 'strains.json')), before)
        assert.equal(JSON.parse(before.toString())[0].dataProvenance[0].sourceUrl, null)
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('an unmatched createStrainObject call writes nothing', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'extract-guard-'))
    try {
        writeFixture(dir, {
            modules: { 'a.ts': 'createStrainObject({ id: "ok", name: "Ok"' },
        })
        rmSync(path.join(dir, 'strains.json'), { force: true })
        await assert.rejects(
            () => runExtract({ strainsDir: dir, outputPath: path.join(dir, 'strains.json') }),
            { code: 'EXTRACT_REFUSED' },
        )
        assert.equal(readdirSync(dir).includes('strains.json'), false)
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('the real strains catalog is unchanged by the extractor tests', () => {
    assert.deepEqual(readFileSync(strainsPath), catalogBefore)
})
