import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatStrain } from './generate-strain-files.mjs'

test('a missing type is not written as Hybrid, and a real zero stays zero', () => {
    const text = formatStrain({
        id: 'blank',
        name: 'Blank',
        thc: 0,
        cbd: null,
        floweringTime: 9,
    })
    assert.equal(text.includes('StrainType.Hybrid'), false)
    assert.match(text, /thc: 0,/)
    assert.equal(text.includes('cbd:'), false)
    assert.match(text, /floweringTime: 9,/)
})

test('lineage, seed form and provenance survive the generator', () => {
    const text = formatStrain({
        id: 'src',
        name: 'Sourced',
        type: 'Sativa',
        lineage: { breeder: 'Reported Breeder', parents: ['Parent A', 'Parent B'] },
        seedForm: 'Feminized',
        dataProvenance: [{ provider: 'community', labVerified: false, confidence: 0.4 }],
    })
    assert.match(text, /type: StrainType.Sativa,/)
    assert.match(text, /breeder: 'Reported Breeder'/)
    assert.match(text, /parents: \['Parent A', 'Parent B'\]/)
    assert.match(text, /seedForm: 'Feminized'/)
    assert.match(text, /provider: 'community'/)
    assert.match(text, /labVerified: false/)
    assert.match(text, /confidence: 0.4/)
})
