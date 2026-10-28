// CG-AUD-20261028-A-S5: graphify and the MCP server never run unpinned.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

import {
    isNewerVersion,
    GRAPHIFYY_VERSION,
    MCP_VERSION,
    UV_EXCLUDE_NEWER,
    uvRunWithPins,
} from '../graphify-pins.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8')

test('the pins are exact versions and a past cut-off date', () => {
    assert.match(GRAPHIFYY_VERSION, /^\d+\.\d+\.\d+$/)
    assert.match(MCP_VERSION, /^\d+\.\d+\.\d+$/)
    assert.match(UV_EXCLUDE_NEWER, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
    assert.ok(Date.parse(UV_EXCLUDE_NEWER) < Date.now(), 'exclude-newer lies in the future')
})

test('uvRunWithPins pins both packages and their transitive dependencies', () => {
    assert.deepEqual(uvRunWithPins(), [
        'run',
        '--no-project',
        '--exclude-newer',
        UV_EXCLUDE_NEWER,
        '--with',
        `graphifyy==${GRAPHIFYY_VERSION}`,
        '--with',
        `mcp==${MCP_VERSION}`,
    ])
    assert.ok(uvRunWithPins({ graphifyy: '9.9.9' }).includes('graphifyy==9.9.9'))
    // A bump test may drop the cut-off, which would exclude the newer release.
    assert.ok(!uvRunWithPins({ excludeNewer: null }).includes('--exclude-newer'))
})

test('the doctor keeps the cut-off unless a version is actually bumped (#651 review)', () => {
    const doctor = read('scripts/graphify-mcp-doctor.mjs')
    assert.match(
        doctor,
        /bumped =\s+isNewerVersion\(graphifyy, GRAPHIFYY_VERSION\) \|\| isNewerVersion\(mcp, MCP_VERSION\)/,
    )
    assert.match(doctor, /GRAPHIFY_EXCLUDE_NEWER \|\| \(bumped \? null : UV_EXCLUDE_NEWER\)/)
})

test('the MCP launcher and the doctor run only through the pins', () => {
    for (const file of ['scripts/graphify-mcp-launcher.mjs', 'scripts/graphify-mcp-doctor.mjs']) {
        const source = read(file)
        assert.match(source, /uvRunWithPins\(/, `${file} does not use the shared pins`)
        assert.doesNotMatch(
            source,
            /['"]--with['"],\s*['"](?:graphifyy|mcp)['"]/,
            `${file} still passes an unpinned --with`,
        )
        assert.doesNotMatch(source, /:\s*['"]graphifyy['"]/, `${file} keeps an unpinned fallback`)
    }
})

test('the graphify-update workflow uses the same pins', () => {
    const workflow = read('.github/workflows/graphify-update.yml')
    assert.ok(
        workflow.includes(
            `uv run --no-project --exclude-newer ${UV_EXCLUDE_NEWER} --with graphifyy==${GRAPHIFYY_VERSION} `,
        ),
        'Update graph step is not on the shared pins',
    )
    assert.ok(workflow.includes(`GRAPHIFYY_VERSION: '${GRAPHIFYY_VERSION}'`))
    assert.ok(workflow.includes(`MCP_VERSION: '${MCP_VERSION}'`))
    assert.doesNotMatch(workflow, /--with graphifyy(?!==)/, 'an unpinned graphifyy remains')
})

test('the bash and Windows fallback launchers delegate to the pinned launcher (#651 review)', () => {
    for (const file of ['scripts/graphify-mcp-stdio.sh', 'scripts/graphify-mcp-stdio-windows.cmd']) {
        const source = read(file)
        assert.doesNotMatch(source, /\buvx?\b\s+(?:run|tool)|\buvx\b/, `${file} runs uv itself`)
        assert.match(source, /graphify-mcp-launcher\.mjs/, `${file} does not delegate`)
    }
})

test('only a newer release counts as a bump; an older pick keeps the cut-off (#651 review)', () => {
    assert.equal(isNewerVersion('0.9.90', '0.9.36'), true)
    assert.equal(isNewerVersion('0.10.0', '0.9.36'), true)
    assert.equal(isNewerVersion('0.9.36', '0.9.36'), false)
    assert.equal(isNewerVersion('0.9.4', '0.9.36'), false)
    assert.equal(isNewerVersion('1.9.0', '2.0.0'), false)
})
