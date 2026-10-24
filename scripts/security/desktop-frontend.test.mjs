import assert from 'node:assert/strict'
import {
    copyFileSync,
    existsSync,
    mkdtempSync,
    mkdirSync,
    readFileSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { resolveFrontendDist, verifyFrontendAssets } from '../../apps/desktop/scripts/frontend.mjs'

const repository = fileURLToPath(new URL('../../', import.meta.url))

test('Tauri embeds the actual monorepo web build directory', () => {
    assert.equal(
        resolveFrontendDist(
            join(repository, 'apps/desktop/src-tauri/tauri.conf.json'),
            join(repository, 'apps/web/dist'),
        ),
        join(repository, 'apps/web/dist'),
    )
})

function fixture(t, directoryPrefix = 'cannaguide-desktop-assets-') {
    const root = mkdtempSync(join(tmpdir(), directoryPrefix))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const config = join(root, 'apps/desktop/src-tauri/tauri.conf.json')
    const dist = join(root, 'apps/web/dist')
    mkdirSync(dirname(config), { recursive: true })
    mkdirSync(join(dist, 'assets'), { recursive: true })
    writeFileSync(config, JSON.stringify({ build: { frontendDist: '../../web/dist' } }))
    const html =
        '<script type="module" src="/assets/entry.js"></script><link rel="stylesheet" href="/assets/style.css">'
    writeFileSync(join(dist, 'index.html'), html)
    writeFileSync(join(dist, 'assets/entry.js'), 'export default 1')
    writeFileSync(join(dist, 'assets/style.css'), 'body { color: green }')
    return { root, config, dist, html }
}

test('accepts local entry assets with query/hash and ignores navigation/prefetch links', (t) => {
    const { config, dist, html } = fixture(t)
    writeFileSync(
        join(dist, 'index.html'),
        html.replace('entry.js', 'entry.js?v=1#entry') +
            '<link rel="canonical" href="https://example.invalid/"><link rel="dns-prefetch" href="https://example.invalid/">',
    )
    assert.equal(verifyFrontendAssets(config, dist).assets, 2)
})

test('rejects a missing frontend directory or index', (t) => {
    const { config, dist } = fixture(t)
    rmSync(join(dist, 'index.html'))
    assert.throws(() => verifyFrontendAssets(config, dist), /ENOENT/)
    rmSync(dist, { recursive: true })
    assert.throws(() => verifyFrontendAssets(config, dist), /ENOENT/)
})

test('rejects Pages-subpath assets that are absent from the embedded root', (t) => {
    const { config, dist, html } = fixture(t)
    writeFileSync(
        join(dist, 'index.html'),
        html.replace('/assets/entry.js', '/CannaGuide-2025/assets/entry.js'),
    )
    assert.throws(() => verifyFrontendAssets(config, dist), /ENOENT/)
})

test('rejects missing and zero-byte entry assets', (t) => {
    const { config, dist } = fixture(t)
    writeFileSync(join(dist, 'assets/entry.js'), '')
    assert.throws(() => verifyFrontendAssets(config, dist), /Empty\/non-file/)
    rmSync(join(dist, 'assets/entry.js'))
    assert.throws(() => verifyFrontendAssets(config, dist), /ENOENT/)
})

test('rejects remote entry scripts and styles without network access', (t) => {
    const { config, dist, html } = fixture(t)
    for (const source of [
        'https://example.invalid/entry.js',
        '//example.invalid/entry.js',
        'https://desktop.invalid/assets/entry.js',
        '//desktop.invalid/assets/entry.js',
        'data:text/javascript,1',
        '\\\\desktop.invalid\\assets\\entry.js',
    ]) {
        writeFileSync(join(dist, 'index.html'), html.replace('/assets/entry.js', source))
        assert.throws(() => verifyFrontendAssets(config, dist), /must be local/)
    }
    writeFileSync(
        join(dist, 'index.html'),
        html.replace('/assets/style.css', 'https://example.invalid/style.css'),
    )
    assert.throws(() => verifyFrontendAssets(config, dist), /must be local/)
})

test('rejects an entry file symlink that escapes the embedded directory', (t) => {
    const { root, config, dist } = fixture(t)
    const outside = join(root, 'outside.js')
    writeFileSync(outside, 'sensitive fixture')
    rmSync(join(dist, 'assets/entry.js'))
    try {
        symlinkSync(outside, join(dist, 'assets/entry.js'))
    } catch (error) {
        if (error.code === 'EPERM') {
            t.skip('symlink creation requires additional privileges on this host')
            return
        }
        throw error
    }
    assert.throws(() => verifyFrontendAssets(config, dist), /escapes frontendDist/)
})

test('rejects blank/stub HTML without a module entry', (t) => {
    const { config, dist } = fixture(t)
    writeFileSync(join(dist, 'index.html'), '')
    assert.throws(() => verifyFrontendAssets(config, dist), /no external module entry/)
    writeFileSync(join(dist, 'index.html'), '<div id="root"></div>')
    assert.throws(() => verifyFrontendAssets(config, dist), /no external module entry/)
    writeFileSync(
        join(dist, 'index.html'),
        '<!-- <script type="module" src="/assets/entry.js"></script> -->',
    )
    assert.throws(() => verifyFrontendAssets(config, dist), /no external module entry/)
})

test('skips complete comments and rejects unterminated comments before parsing tags', (t) => {
    const { config, dist, html } = fixture(t)
    writeFileSync(
        join(dist, 'index.html'),
        '<!-- fake <script type="module" src="https://desktop.invalid/assets/entry.js"></script> -->' +
            html,
    )
    assert.equal(verifyFrontendAssets(config, dist).assets, 2)

    writeFileSync(
        join(dist, 'index.html'),
        '<!-- fake <script type="module" src="/assets/entry.js"></script>' + html,
    )
    assert.throws(() => verifyFrontendAssets(config, dist), /Unterminated HTML comment/)
})

test('rejects empty script or resource-link sources', (t) => {
    const { config, dist, html } = fixture(t)
    for (const malformed of ['<script type="module" src=""></script>', '<link rel="stylesheet">']) {
        writeFileSync(join(dist, 'index.html'), html + malformed)
        assert.throws(() => verifyFrontendAssets(config, dist), /empty source/)
    }
})

test(
    'frontend hook preserves the child failure and supplies the desktop base',
    {
        skip:
            process.platform === 'win32'
                ? 'POSIX shim fixture; native Windows proof remains separate'
                : false,
    },
    (t) => {
        const { root } = fixture(t)
        const bin = join(root, 'bin')
        const resultFile = join(root, 'invocation.json')
        mkdirSync(bin)
        writeFileSync(
            join(bin, 'corepack'),
            `#!/usr/bin/env node
import fs from 'node:fs';
fs.writeFileSync(process.env.CANNAGUIDE_FRONTEND_PROBE, JSON.stringify({
    args: process.argv.slice(2), base: process.env.BUILD_BASE_PATH, cwd: process.cwd()
}));
process.exit(23);
`,
            { mode: 0o755 },
        )
        const result = spawnSync(
            process.execPath,
            [join(repository, 'apps/desktop/scripts/frontend.mjs'), 'build'],
            {
                env: {
                    ...process.env,
                    PATH: `${bin}${delimiter}${process.env.PATH}`,
                    BUILD_BASE_PATH: '/unwanted/',
                    CANNAGUIDE_FRONTEND_PROBE: resultFile,
                },
                encoding: 'utf8',
            },
        )
        assert.equal(result.status, 23, result.stderr)
        const invocation = JSON.parse(readFileSync(resultFile, 'utf8'))
        assert.deepEqual(invocation.args, ['pnpm', '--filter', '@cannaguide/web', 'build'])
        assert.equal(invocation.base, '/')
        assert.equal(invocation.cwd, repository.replace(/[\\/]$/, ''))
    },
)

test(
    'build hook handles repository paths with spaces and verifies generated entry assets',
    {
        skip:
            process.platform === 'win32'
                ? 'POSIX shim fixture; native Windows proof remains separate'
                : false,
    },
    (t) => {
        const { root } = fixture(t, 'Canna Guide desktop assets ')
        const appScript = join(root, 'apps/desktop/scripts/frontend.mjs')
        const pruneScript = join(root, 'scripts/prune-bundled-ort-wasm.mjs')
        const bin = join(root, 'bin')
        mkdirSync(dirname(appScript), { recursive: true })
        mkdirSync(dirname(pruneScript), { recursive: true })
        mkdirSync(bin)
        copyFileSync(join(repository, 'apps/desktop/scripts/frontend.mjs'), appScript)
        copyFileSync(join(repository, 'scripts/prune-bundled-ort-wasm.mjs'), pruneScript)
        writeFileSync(
            join(bin, 'corepack'),
            `#!/usr/bin/env node
import fs from 'node:fs';
fs.mkdirSync('apps/web/dist/assets', { recursive: true });
fs.writeFileSync('apps/web/dist/index.html', '<script type="module" src="/assets/entry.js"></script><link rel="stylesheet" href="/assets/style.css">');
fs.writeFileSync('apps/web/dist/assets/entry.js', 'export default 1');
fs.writeFileSync('apps/web/dist/assets/style.css', 'body {}');
fs.writeFileSync('apps/web/dist/assets/ort-wasm-simd-threaded.fixture.wasm', 'unused wasm');
if (process.env.BUILD_BASE_PATH !== '/') process.exit(24);
`,
            { mode: 0o755 },
        )
        const result = spawnSync(process.execPath, [appScript, 'build'], {
            env: {
                ...process.env,
                PATH: `${bin}${delimiter}${process.env.PATH}`,
                BUILD_BASE_PATH: '/wrong-before-hook/',
            },
            encoding: 'utf8',
        })
        assert.equal(result.status, 0, result.stderr)
        assert.match(result.stdout, /2 local entry assets/)
        assert.match(result.stdout, /Removed ort-wasm-simd-threaded\.fixture\.wasm/)
        assert.equal(
            existsSync(join(root, 'apps/web/dist/assets/ort-wasm-simd-threaded.fixture.wasm')),
            false,
        )
        assert.match(appScript, /Canna Guide desktop assets/)
    },
)
