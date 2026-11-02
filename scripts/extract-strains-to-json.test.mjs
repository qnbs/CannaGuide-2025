import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
const { normalizeStrain, parseObjectLiteral, preserveProvenance, readCatalogFile } =
    await import('./extract-strains-to-json.mjs')

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
