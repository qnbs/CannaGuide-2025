// CG-AUD-20261027-N04: the benchmark now builds hidden source maps; deployed
// builds must never carry them. stamp-build-metadata --verify runs in every
// deploy path and fails on any map it finds.
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import { sourceMapLeaks } from '../stamp-build-metadata.mjs'

const ROOT = path.resolve(import.meta.dirname, '../..')

function fixtureDist(files) {
    const dir = mkdtempSync(path.join(tmpdir(), 'dist-fixture-'))
    for (const [name, content] of Object.entries(files)) {
        mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
        writeFileSync(path.join(dir, name), content)
    }
    return dir
}

test('a clean dist has no leaks', () => {
    const dir = fixtureDist({
        'index.html': '<html>',
        'assets/index-a.js': 'console.log(1)\n',
        'assets/a.css': 'a{}',
    })
    try {
        assert.deepEqual(sourceMapLeaks(dir), [])
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('map files and sourceMappingURL comments are reported', () => {
    const dir = fixtureDist({
        'assets/index-a.js': 'x\n//# sourceMappingURL=index-a.js.map\n',
        'assets/index-a.js.map': '{}',
        'assets/b.css': 'b{}\n/*# sourceMappingURL=b.css.map */\n',
        'assets/nested/c.mjs': 'y',
        'assets/nested/c.mjs.map': '{}',
        // No space after the marker, inline data URL: still a source map.
        'assets/d.js': 'z\n//#sourceMappingURL=data:application/json;base64,AA\n',
        'assets/e.cjs': 'w\n//# sourceMappingURL=data:application/json;base64,AA\n',
    })
    try {
        const leaks = sourceMapLeaks(dir)
            .map((file) => path.relative(dir, file))
            .sort()
        assert.deepEqual(leaks, [
            'assets/b.css',
            'assets/d.js',
            'assets/e.cjs',
            'assets/index-a.js',
            'assets/index-a.js.map',
            'assets/nested/c.mjs.map',
        ])
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
})

test('maps are opt-in: only BUILD_SOURCEMAP=hidden enables them, only the benchmark sets it', () => {
    const vite = readFileSync(path.join(ROOT, 'apps/web/vite.config.ts'), 'utf8')
    assert.match(vite, /sourcemap: process\.env\.BUILD_SOURCEMAP === 'hidden' \? 'hidden' : false/)
    const benchmark = readFileSync(path.join(ROOT, '.github/workflows/benchmark.yml'), 'utf8')
    assert.match(benchmark, /BUILD_SOURCEMAP: hidden/)
    for (const workflow of [
        'deploy.yml',
        'deploy-cloudflare.yml',
        'release-publish.yml',
        'ci.yml',
    ]) {
        const text = readFileSync(path.join(ROOT, '.github/workflows', workflow), 'utf8')
        assert.doesNotMatch(text, /BUILD_SOURCEMAP/, `${workflow} must not build source maps`)
    }
    assert.doesNotMatch(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'), /BUILD_SOURCEMAP/)
})
