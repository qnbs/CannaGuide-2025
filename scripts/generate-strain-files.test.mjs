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
    assert.equal(text.includes('type:'), false)
    assert.match(text, /thc: 0,/)
    assert.equal(text.includes('cbd:'), false)
    assert.match(text, /floweringTime: 9,/)
})

test('an explicit Hybrid is preserved, and inherited type names are not', () => {
    const hybrid = formatStrain({ id: 'hybrid', name: 'Hybrid', type: 'Hybrid' })
    assert.match(hybrid, /type: StrainType.Hybrid,/)
    const injected = formatStrain({ id: 'bad', name: 'Bad', type: 'constructor' })
    assert.equal(injected.includes('type:'), false)
    assert.equal(injected.includes('function'), false)
})

test('a non-identifier key is quoted and an unsafe key is dropped', () => {
    const text = formatStrain({
        id: 'seed',
        name: 'Seed',
        'seed-form': 'Regular',
        'bad key\n;': 'nope',
    })
    assert.match(text, /'seed-form': 'Regular'/)
    assert.equal(text.includes('bad key'), false)
})

test('lineage, seed form and provenance survive the generator', () => {
    const text = formatStrain({
        id: 'src',
        name: 'Sourced',
        type: 'Sativa',
        lineage: {
            breeder: 'Reported Breeder',
            parents: [{ name: 'Parent A' }, { name: 'Parent B' }],
        },
        seedForm: 'Feminized',
        dataProvenance: [{ provider: 'community', labVerified: false, confidence: 0.4 }],
    })
    assert.match(text, /type: StrainType.Sativa,/)
    assert.match(text, /breeder: 'Reported Breeder'/)
    assert.match(text, /name: 'Parent A'/)
    assert.match(text, /name: 'Parent B'/)
    assert.match(text, /seedForm: 'Feminized'/)
    assert.match(text, /provider: 'community'/)
    assert.match(text, /labVerified: false/)
    assert.match(text, /confidence: 0.4/)
})

test('line breaks stay inside the generated string and null array items are dropped', () => {
    const text = formatStrain({
        id: 'lines',
        name: 'Lines',
        description: "line1\nline2\r'end'",
        aromas: ['Sweet', null, undefined, 'Spice'],
    })
    assert.ok(text.includes("description: 'line1\\nline2\\r\\'end\\''"))
    assert.match(text, /aromas: \['Sweet', 'Spice'\]/)
    assert.equal(text.includes('undefined'), false)
})
