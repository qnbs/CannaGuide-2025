import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { verifyFrontendAssets } from '../apps/desktop/scripts/frontend.mjs'

// The desktop build embeds apps/web/dist at Tauri's root URL and refuses any entry
// asset (module script, stylesheet, manifest, icon) that is not root-relative.
// desktop-build.yml failed on every target at `favicon.ico` (run 40482228738).

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RESOURCE_RELS = ['stylesheet', 'modulepreload', 'manifest', 'icon', 'apple-touch-icon']

function withDist(indexHtml, files, check) {
    const root = mkdtempSync(join(tmpdir(), 'desktop-frontend-'))
    try {
        const configDir = join(root, 'src-tauri')
        const dist = join(root, 'dist')
        mkdirSync(configDir)
        mkdirSync(dist)
        const config = join(configDir, 'tauri.conf.json')
        writeFileSync(config, JSON.stringify({ build: { frontendDist: '../dist' } }))
        writeFileSync(join(dist, 'index.html'), indexHtml)
        for (const [path, content] of Object.entries(files)) {
            mkdirSync(dirname(join(dist, path)), { recursive: true })
            writeFileSync(join(dist, path), content)
        }
        return check(config, dist)
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
}

const page = (head) =>
    `<!doctype html><html><head>${head}<script type="module" src="/assets/index.js"></script></head></html>`

test('a relative icon link is refused for the desktop bundle', () => {
    withDist(
        page('<link rel="icon" href="favicon.ico">'),
        { 'assets/index.js': 'x', 'favicon.ico': 'x' },
        (config, dist) => {
            assert.throws(
                () => verifyFrontendAssets(config, dist),
                /must be local and root-relative: favicon\.ico/,
            )
        },
    )
})

test('root-relative icon, manifest and entry links pass', () => {
    const head =
        '<link rel="manifest" href="/manifest.json"><link rel="icon" href="/favicon.ico">' +
        '<link rel="apple-touch-icon" href="/apple-touch-icon.png">'
    const files = {
        'assets/index.js': 'x',
        'manifest.json': '{}',
        'favicon.ico': 'x',
        'apple-touch-icon.png': 'x',
    }
    withDist(page(head), files, (config, dist) => {
        assert.equal(verifyFrontendAssets(config, dist).assets, 4)
    })
})

test('apps/web/index.html links every embedded resource through %BASE_URL%', () => {
    const source = readFileSync(resolve(REPO_ROOT, 'apps/web/index.html'), 'utf8')
    const links = [...source.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => tag)
    const resources = links.filter((tag) => {
        const rel = /\brel\s*=\s*"([^"]*)"/i.exec(tag)?.[1]?.toLowerCase() ?? ''
        return rel.split(/\s+/).some((value) => RESOURCE_RELS.includes(value))
    })
    assert.ok(resources.length >= 4, 'expected manifest and icon links')
    for (const tag of resources) {
        const href = /\bhref\s*=\s*"([^"]*)"/i.exec(tag)?.[1] ?? ''
        assert.match(href, /^%BASE_URL%[^/]/, tag)
    }

    // What Vite produces with BUILD_BASE_PATH=/ (the desktop build): the base becomes
    // `/` and the module entry is rewritten to a hashed asset.
    const built = source
        .replaceAll('%BASE_URL%', '/')
        .replace(/src="\.\/index\.tsx"/, 'src="/assets/index.js"')
    const files = { 'assets/index.js': 'x' }
    for (const tag of resources) {
        const href = /\bhref\s*=\s*"%BASE_URL%([^"]*)"/i.exec(tag)[1]
        files[href] = 'x'
    }
    withDist(built, files, (config, dist) => {
        assert.equal(verifyFrontendAssets(config, dist).assets, resources.length + 1)
    })
})
