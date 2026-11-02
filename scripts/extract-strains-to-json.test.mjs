import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
    normalizeStrain,
    parseObjectLiteral,
    preserveProvenance,
} from './extract-strains-to-json.mjs'
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
const BASELINE_SHA256 = '90d9f688452094db0d0b3bbdb044e7c19271e12ffef04ed6723daea7abef6e27'

const objectBody = (text) => {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    return text.slice(start, end + 1)
}

const provenance = [{ sourceUrl: null, labVerified: false }]

test('importing the extractor leaves strains.json unchanged', () => {
    const hash = createHash('sha256').update(catalogBefore).digest('hex')
    assert.equal(hash, BASELINE_SHA256)
    assert.deepEqual(readFileSync(strainsPath), catalogBefore)
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
