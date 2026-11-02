import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
    assessCatalog,
    buildStrainFiles,
    countValueNodes,
    formatStrain,
} from './generate-strain-files.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const strainsPath = path.join(repoRoot, 'apps', 'web', 'data', 'strains', 'strains.json')
const BASELINE_SHA256 = '90d9f688452094db0d0b3bbdb044e7c19271e12ffef04ed6723daea7abef6e27'
const BASELINE_IDS = 776
const BASELINE_VALUE_NODES = 30955

const readObject = (text) => {
    const objectText = text.replace(/^\s*createStrainObject\(/, '').replace(/\),\s*$/, '')
    return Function(`return (${objectText})`)()
}

test('a missing field stays missing, and explicit null, zero and false stay', () => {
    const missing = formatStrain({ id: 'blank', name: 'Blank', thc: 0, floweringTime: 9 })
    assert.equal(missing.includes('type:'), false)
    assert.equal(missing.includes('cbd:'), false)
    assert.match(missing, /thc: 0,/)
    assert.match(missing, /floweringTime: 9,/)

    const explicit = formatStrain({
        id: 'blank',
        name: 'Blank',
        thc: 0,
        cbd: null,
        labVerified: false,
        cbg: undefined,
    })
    assert.match(explicit, /cbd: null,/)
    assert.match(explicit, /labVerified: false,/)
    assert.equal(explicit.includes('cbg:'), false)
    assert.deepEqual(readObject(explicit).cbd, null)
})

test('an explicit Hybrid is preserved, and inherited type names are not', () => {
    const hybrid = formatStrain({ id: 'hybrid', name: 'Hybrid', type: 'Hybrid' })
    assert.match(hybrid, /type: StrainType.Hybrid,/)
    const injected = formatStrain({ id: 'bad', name: 'Bad', type: 'constructor' })
    assert.equal(injected.includes('type:'), false)
    assert.equal(injected.includes('function'), false)
})

test('a non-identifier key is quoted and an unsafe key is escaped', () => {
    const text = formatStrain({
        id: 'seed',
        name: 'Seed',
        'seed-form': 'Regular',
        'bad key\n;': 'nope',
        '\u00dcnicode': 'kept',
    })
    assert.match(text, /'seed-form': 'Regular'/)
    assert.match(text, /\['bad key\\n;'\]: 'nope'/)
    assert.match(text, /\['\u00dcnicode'\]: 'kept'/)
    assert.equal(text.includes('\n;'), false)
    const value = readObject(text)
    assert.equal(value['bad key\n;'], 'nope')
    assert.equal(value['\u00dcnicode'], 'kept')
})

test('an injection key stays data and does not run', () => {
    const marker = '__cgInjected7812'
    delete globalThis[marker]
    const key = `a'; globalThis.${marker} = 1; //`
    const payload = `'); globalThis.${marker} = 1; //`
    const record = { id: 'inj', name: 'Inj' }
    record[key] = payload
    const text = formatStrain(record)
    const value = readObject(text)
    assert.equal(globalThis[marker], undefined)
    assert.equal(Object.hasOwn(value, key), true)
    assert.equal(value[key], payload)
    assert.equal(Object.getPrototypeOf(value), Object.prototype)
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
    assert.match(text, /parents: \[\n\s+\{ name: 'Parent A' \},\n\s+\{ name: 'Parent B' \},\n\s+\]/)
    assert.match(text, /seedForm: 'Feminized'/)
    assert.match(text, /provider: 'community'/)
    assert.match(text, /labVerified: false/)
    assert.match(text, /confidence: 0.4/)
})

test('__proto__ is a computed own property, not a prototype setter', () => {
    const lineage = Object.assign(Object.create(null), { breeder: 'Lab' })
    lineage['__proto__'] = { note: 'kept' }
    const text = formatStrain({
        id: 'proto',
        name: 'Proto',
        lineage,
    })
    assert.match(text, /\['__proto__'\]:/)
    assert.equal(text.includes("'__proto__':"), false)
    const objectText = text.replace(/^\s*createStrainObject\(/, '').replace(/\),\s*$/, '')
    const value = Function(`return (${objectText})`)()
    assert.equal(Object.hasOwn(value.lineage, '__proto__'), true)
    assert.deepEqual(value.lineage['__proto__'], { note: 'kept' })
})

test('line breaks stay inside the string and null array positions stay', () => {
    const text = formatStrain({
        id: 'lines',
        name: 'Lines',
        description: "line1\nline2\r'end'",
        aromas: ['Sweet', null, undefined, 'Spice', null],
        lineage: { breeder: null },
    })
    assert.ok(text.includes("description: 'line1\\nline2\\r\\'end\\''"))
    assert.match(text, /aromas: \['Sweet', null, undefined, 'Spice', null\]/)
    assert.match(text, /breeder: null/)
    const value = readObject(text)
    assert.deepEqual(value.aromas, ['Sweet', null, undefined, 'Spice', null])
    assert.deepEqual(value.lineage, { breeder: null })
})

test('the canonical catalog keeps its oracle and blocks a null rewrite', () => {
    const raw = readFileSync(strainsPath)
    const sha256 = createHash('sha256').update(raw).digest('hex')
    const strains = JSON.parse(raw.toString('utf8'))
    assert.equal(sha256, BASELINE_SHA256)
    assert.equal(strains.length, BASELINE_IDS)
    assert.equal(new Set(strains.map((strain) => strain.id)).size, BASELINE_IDS)
    assert.equal(countValueNodes(strains) - 1, BASELINE_VALUE_NODES)

    const assessment = assessCatalog(strains)
    assert.equal(assessment.admitted, false)
    assert.equal(assessment.nullCount, BASELINE_IDS)
    assert.ok(
        assessment.pointers.every((pointer) => pointer.endsWith('/dataProvenance/0/sourceUrl')),
    )

    const fingerprint = (files) =>
        createHash('sha256')
            .update(files.map((file) => `${file.fileName}\0${file.content}`).join('\0'))
            .digest('hex')
    const first = buildStrainFiles(strains)
    const second = buildStrainFiles(strains)
    assert.equal(fingerprint(first), fingerprint(second))
    const rendered = first.map((file) => file.content).join('\n')
    assert.equal(rendered.match(/sourceUrl: null/g).length, BASELINE_IDS)
    for (const strain of strains) assert.ok(rendered.includes(`id: '${strain.id}',`), strain.id)

    const sentinel = path.join(repoRoot, 'apps/web/data/strains/numeric.ts')
    const before = readFileSync(sentinel)
    const result = spawnSync(
        process.execPath,
        [path.join(repoRoot, 'scripts/generate-strain-files.mjs')],
        { cwd: repoRoot, encoding: 'utf8' },
    )
    assert.equal(result.status, 1)
    assert.match(result.stderr, /Quarantine: 776/)
    assert.ok(readFileSync(sentinel).equals(before))
})

test('a catalog without null is admitted and still keeps zero and false', () => {
    const strains = [{ id: 'ok', name: 'Ok', thc: 0, labVerified: false }]
    const assessment = assessCatalog(strains)
    assert.equal(assessment.admitted, true)
    assert.equal(assessment.nullCount, 0)
    const rendered = buildStrainFiles(strains)
        .map((file) => file.content)
        .join('\n')
    assert.match(rendered, /thc: 0,/)
    assert.match(rendered, /labVerified: false,/)
    assert.equal(rendered.includes('null'), false)
})
