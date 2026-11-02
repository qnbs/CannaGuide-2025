import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
    assessCatalog,
    buildStrainFiles,
    countValueNodes,
    formatStrain,
    replaceFile,
    resolveCatalogDir,
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
    assert.match(text, /'bad key\\n;': 'nope'/)
    assert.match(text, /'\u00dcnicode': 'kept'/)
    assert.equal(text.includes('['), false)
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

test('the canonical catalog keeps its oracle and admits typed sourceUrl nulls', () => {
    const raw = readFileSync(strainsPath)
    const sha256 = createHash('sha256').update(raw).digest('hex')
    const strains = JSON.parse(raw.toString('utf8'))
    assert.equal(sha256, BASELINE_SHA256)
    assert.equal(strains.length, BASELINE_IDS)
    assert.equal(new Set(strains.map((strain) => strain.id)).size, BASELINE_IDS)
    assert.equal(countValueNodes(strains) - 1, BASELINE_VALUE_NODES)

    const assessment = assessCatalog(strains)
    assert.equal(assessment.admitted, true)
    assert.equal(assessment.nullCount, 0)
    assert.equal(assessment.findings.length, 0)
    assert.equal(assessment.typedNullCount, BASELINE_IDS)
    assert.equal(assessment.typedPointers.length, BASELINE_IDS)
    assert.ok(
        assessment.typedPointers.every((pointer) =>
            /^\/\d+\/dataProvenance\/0\/sourceUrl$/.test(pointer),
        ),
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

    const strainsDir = path.dirname(strainsPath)
    const before = directoryManifest(strainsDir)
    assert.match(before, /^a\.ts /m)
    assert.match(before, /^index\.ts /m)
    assert.match(before, /^numeric\.ts /m)
    assert.match(before, /^strains\.json /m)
    assert.match(before, /^pending\/pending-strains\.json /m)
    assert.equal(
        resolveCatalogDir(['node', 'generate-strain-files.mjs'], strainsDir),
        strainsDir,
    )
    assert.equal(directoryManifest(strainsDir), before)
    assert.equal(createHash('sha256').update(readFileSync(strainsPath)).digest('hex'), sha256)
})

const manifestLines = (dir, prefix, lines) => {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((left, right) =>
        left.name.localeCompare(right.name),
    )
    for (const entry of entries) {
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) manifestLines(full, relative, lines)
        else if (entry.isFile()) {
            const bytes = readFileSync(full)
            lines.push(`${relative} ${createHash('sha256').update(bytes).digest('hex')}`)
        }
    }
    return lines
}

const directoryManifest = (dir) => manifestLines(dir, '', []).join('\n')

test('a changed or added catalog file turns the manifest red', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'strain-nowrite-'))
    try {
        writeFileSync(path.join(dir, 'a.ts'), 'original')
        writeFileSync(path.join(dir, 'strains.json'), 'oracle')
        const before = directoryManifest(dir)
        writeFileSync(path.join(dir, 'a.ts'), 'rewritten')
        assert.notEqual(directoryManifest(dir), before)
        writeFileSync(path.join(dir, 'a.ts'), 'original')
        writeFileSync(path.join(dir, 'extra.ts'), 'new')
        assert.notEqual(directoryManifest(dir), before)
        rmSync(path.join(dir, 'extra.ts'))
        assert.equal(directoryManifest(dir), before)
        mkdirSync(path.join(dir, 'pending'))
        writeFileSync(path.join(dir, 'pending', 'pending-strains.json'), 'old')
        const nested = directoryManifest(dir)
        writeFileSync(path.join(dir, 'pending', 'pending-strains.json'), 'new')
        assert.notEqual(directoryManifest(dir), nested)
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

const resolvePointer = (document, pointer) => {
    let cursor = document
    for (const token of pointer.split('/').slice(1)) {
        const key = token.replaceAll('~1', '/').replaceAll('~0', '~')
        cursor = Array.isArray(cursor) ? cursor[Number(key)] : cursor[key]
    }
    return cursor
}

test('null pointers are array indexes and sparse slots stay undefined', () => {
    const strains = [{ id: 'first', cbd: null }, { id: 'second' }]
    const assessment = assessCatalog(strains)
    assert.equal(assessment.admitted, false)
    assert.equal(assessment.typedNullCount, 0)
    assert.deepEqual(assessment.pointers, ['/0/cbd'])
    assert.deepEqual(assessment.findings, [{ pointer: '/0/cbd', id: 'first' }])
    assert.equal(resolvePointer(strains, assessment.pointers[0]), null)

    const escaped = { id: 'esc/id' }
    escaped['a/b~c'] = null
    const escapedAssessment = assessCatalog([escaped])
    assert.deepEqual(escapedAssessment.findings, [{ pointer: '/0/a~1b~0c', id: 'esc/id' }])
    assert.equal(resolvePointer([escaped], escapedAssessment.pointers[0]), null)
    const sparse = []
    sparse.length = 2
    sparse[1] = 'Spice'
    const text = formatStrain({ id: 'hole', name: 'Hole', aromas: sparse })
    assert.match(text, /aromas: \[undefined, 'Spice'\]/)
    assert.deepEqual(readObject(text).aromas, [undefined, 'Spice'])
})

test('a catalog without null is admitted and still keeps zero and false', () => {
    const strains = [{ id: 'ok', name: 'Ok', thc: 0, labVerified: false }]
    const assessment = assessCatalog(strains)
    assert.equal(assessment.admitted, true)
    assert.equal(assessment.nullCount, 0)
    assert.equal(assessment.typedNullCount, 0)
    const rendered = buildStrainFiles(strains)
        .map((file) => file.content)
        .join('\n')
    assert.match(rendered, /thc: 0,/)
    assert.match(rendered, /labVerified: false,/)
    assert.equal(rendered.includes('null'), false)
})

const spawnGenerate = (args) =>
    spawnSync(process.execPath, [path.join(repoRoot, 'scripts/generate-strain-files.mjs'), ...args], {
        cwd: repoRoot,
        encoding: 'utf8',
    })

const catalogOracle = () => {
    const strainsDir = path.dirname(strainsPath)
    return {
        strainsDir,
        manifest: directoryManifest(strainsDir),
        sha256: createHash('sha256').update(readFileSync(strainsPath)).digest('hex'),
    }
}

test('the catalog directory flag resolves a fixture and rejects a missing path', () => {
    const fixture = path.join(tmpdir(), 'strain-fixture')
    assert.equal(
        resolveCatalogDir(['node', 'script', '--catalog-dir', fixture], path.dirname(strainsPath)),
        path.resolve(fixture),
    )
    assert.throws(
        () => resolveCatalogDir(['node', 'script', '--catalog-dir'], path.dirname(strainsPath)),
        /--catalog-dir needs a directory/,
    )
})

test('an unexpected null aborts before any module write', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'strain-quarantine-'))
    const oracle = catalogOracle()
    try {
        writeFileSync(
            path.join(dir, 'strains.json'),
            `${JSON.stringify([
                {
                    id: 'bad',
                    name: 'Bad',
                    cbd: null,
                    dataProvenance: [{ sourceUrl: null }],
                },
            ])}\n`,
        )
        writeFileSync(path.join(dir, 'a.ts'), 'sentinel')
        const result = spawnGenerate(['--catalog-dir', dir])
        assert.equal(result.status, 1)
        assert.match(result.stderr, /Quarantine: 1/)
        assert.match(result.stderr, /\/0\/cbd id=bad/)
        assert.equal(result.stderr.includes('sourceUrl'), false)
        assert.equal(readFileSync(path.join(dir, 'a.ts'), 'utf8'), 'sentinel')
        assert.equal(readdirSync(dir).includes('b.ts'), false)
        assert.equal(directoryManifest(oracle.strainsDir), oracle.manifest)
        assert.equal(
            createHash('sha256').update(readFileSync(strainsPath)).digest('hex'),
            oracle.sha256,
        )
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('a typed sourceUrl null is written only in the requested directory', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'strain-typed-null-'))
    const oracle = catalogOracle()
    try {
        const strains = [
            {
                id: 'ok',
                name: 'Ok',
                dataProvenance: [{ sourceUrl: 'https://example.com/old' }, { sourceUrl: null }],
            },
        ]
        writeFileSync(path.join(dir, 'strains.json'), `${JSON.stringify(strains)}\n`)
        const assessment = assessCatalog(strains)
        assert.equal(assessment.admitted, true)
        assert.deepEqual(assessment.typedPointers, ['/0/dataProvenance/1/sourceUrl'])
        const topLevel = assessCatalog([{ id: 'top', name: 'Top', sourceUrl: null }])
        assert.equal(topLevel.admitted, false)
        assert.deepEqual(topLevel.pointers, ['/0/sourceUrl'])
        const disguised = assessCatalog([
            {
                id: 'obj',
                name: 'Obj',
                dataProvenance: { 0: { sourceUrl: null } },
            },
        ])
        assert.equal(disguised.admitted, false)
        assert.equal(disguised.typedNullCount, 0)
        assert.deepEqual(disguised.pointers, ['/0/dataProvenance/0/sourceUrl'])

        const result = spawnGenerate(['--catalog-dir', dir])
        assert.equal(result.status, 0, result.stderr)
        const written = readFileSync(path.join(dir, 'o.ts'), 'utf8')
        assert.match(written, /sourceUrl: null/)
        assert.match(written, /sourceUrl: 'https:\/\/example.com\/old'/)
        assert.equal(directoryManifest(oracle.strainsDir), oracle.manifest)
        assert.equal(
            createHash('sha256').update(readFileSync(strainsPath)).digest('hex'),
            BASELINE_SHA256,
        )
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('the full 776 catalog trial writes only in the requested directory', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'strain-trial-776-'))
    const oracle = catalogOracle()
    try {
        writeFileSync(path.join(dir, 'strains.json'), readFileSync(strainsPath))
        writeFileSync(path.join(dir, 'sentinel.ts'), 'keep')
        const result = spawnGenerate(['--catalog-dir', dir])
        assert.equal(result.status, 0, result.stderr)
        assert.equal(result.stderr.includes('Quarantine'), false)
        assert.match(result.stdout, /Loaded 776 strains/)
        assert.match(result.stdout, /Total written: 776 strains/)
        const written = readdirSync(dir)
            .filter((name) => name.endsWith('.ts') && name !== 'sentinel.ts')
            .map((name) => readFileSync(path.join(dir, name), 'utf8'))
            .join('\n')
        assert.equal(written.match(/sourceUrl: null/g).length, BASELINE_IDS)
        const strains = JSON.parse(readFileSync(strainsPath, 'utf8'))
        for (const strain of strains) assert.ok(written.includes(`id: '${strain.id}',`), strain.id)
        assert.equal(readFileSync(path.join(dir, 'sentinel.ts'), 'utf8'), 'keep')
        assert.equal(
            readdirSync(dir).some((name) => name.endsWith('.tmp')),
            false,
        )
        assert.equal(
            createHash('sha256').update(readFileSync(path.join(dir, 'strains.json'))).digest('hex'),
            BASELINE_SHA256,
        )
        assert.equal(directoryManifest(oracle.strainsDir), oracle.manifest)
        assert.equal(
            createHash('sha256').update(readFileSync(strainsPath)).digest('hex'),
            BASELINE_SHA256,
        )
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('a failed module replace leaves the previous file and no temp file', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'strain-replace-'))
    try {
        const target = path.join(dir, 'a.ts')
        writeFileSync(target, 'original')
        await replaceFile(target, 'next')
        assert.equal(readFileSync(target, 'utf8'), 'next')
        assert.equal(
            readdirSync(dir).some((name) => name.endsWith('.tmp')),
            false,
        )

        rmSync(target)
        mkdirSync(target)
        writeFileSync(path.join(target, 'keep'), 'x')
        await assert.rejects(replaceFile(target, 'truncated'))
        assert.equal(readFileSync(path.join(target, 'keep'), 'utf8'), 'x')
        assert.equal(
            readdirSync(dir).some((name) => name.endsWith('.tmp')),
            false,
        )
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('a missing catalog directory argument writes nothing', () => {
    const oracle = catalogOracle()
    const result = spawnGenerate(['--catalog-dir'])
    assert.equal(result.status, 1)
    assert.match(result.stderr, /--catalog-dir needs a directory/)
    assert.equal(directoryManifest(oracle.strainsDir), oracle.manifest)
    assert.equal(
        createHash('sha256').update(readFileSync(strainsPath)).digest('hex'),
        oracle.sha256,
    )
})
