import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

// desktop-build.yml has two failure modes that CI cannot reproduce without the
// hosted macOS runners, so its structure is pinned here.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WORKFLOW = readFileSync(resolve(REPO_ROOT, '.github/workflows/desktop-build.yml'), 'utf8')
const APPLE_VARS = [
    'APPLE_CERTIFICATE',
    'APPLE_CERTIFICATE_PASSWORD',
    'APPLE_SIGNING_IDENTITY',
    'APPLE_ID',
    'APPLE_PASSWORD',
    'APPLE_TEAM_ID',
]

// The text of one step, from its `- name:` line to the next step.
function step(name) {
    const start = WORKFLOW.indexOf(`- name: ${name}\n`)
    assert.notEqual(start, -1, `missing step "${name}"`)
    const next = WORKFLOW.indexOf('\n            - name: ', start + 1)
    return WORKFLOW.slice(start, next === -1 ? undefined : next)
}

test('the desktop build uses only actions the repository policy allows', () => {
    // pnpm/action-setup is not on the allowed-actions list; referencing it made every
    // run fail at startup (v1.8.2-v1.10.0 tags, run 40478116042).
    assert.doesNotMatch(WORKFLOW, /uses:\s*pnpm\/action-setup/)
    assert.match(
        step('Setup Node + install dependencies'),
        /uses: \.\/\.github\/actions\/setup-node-ci/,
    )
})

test('macOS signing values reach only the signed build step, and only with a certificate', () => {
    // An unset secret expands to "", and tauri-bundler starts code signing for any
    // set APPLE_CERTIFICATE, then fails on the keychain import (run 40486452675).
    // Credentials must also not be written to GITHUB_ENV, which would expose them to
    // every later step (CodeAnt review on #625).
    assert.match(WORKFLOW, /HAS_APPLE_CERTIFICATE: \$\{\{ secrets\.APPLE_CERTIFICATE != '' \}\}/)
    assert.doesNotMatch(WORKFLOW, /GITHUB_ENV/)

    const unsigned = step('Build Tauri')
    assert.match(unsigned, /if: runner\.os != 'macOS' \|\| env\.HAS_APPLE_CERTIFICATE != 'true'/)
    for (const name of APPLE_VARS) {
        assert.doesNotMatch(
            unsigned,
            new RegExp(`\\b${name}:`),
            `${name} reaches the unsigned build`,
        )
    }

    const signed = step('Build Tauri (signed macOS)')
    assert.match(signed, /if: runner\.os == 'macOS' && env\.HAS_APPLE_CERTIFICATE == 'true'/)
    for (const name of APPLE_VARS) {
        assert.match(signed, new RegExp(`${name}: \\$\\{\\{ secrets\\.${name} \\}\\}`), name)
    }

    // Both steps run the same build; only the credentials differ.
    const withBlock = (text) => {
        const start = text.indexOf('\n              with:\n')
        assert.notEqual(start, -1, 'build step has no with: block')
        return text.slice(start)
    }
    assert.equal(withBlock(signed), withBlock(unsigned))
    assert.match(withBlock(unsigned), /args: --target \$\{\{ matrix\.target \}\}/)
})

test('updater bundles are built and signed only by Desktop Build, through an overlay', () => {
    // CodeRabbit on #874: with createUpdaterArtifacts in tauri.conf.json, every local
    // `tauri build` demands TAURI_SIGNING_PRIVATE_KEY. The base config leaves it off;
    // Desktop Build merges tauri.updater.conf.json (Tauri merges only platform-named
    // tauri.<os>.conf.json files on its own, so this one applies only when passed).
    const readJson = (file) => JSON.parse(readFileSync(resolve(REPO_ROOT, file), 'utf8'))
    const base = readJson('apps/desktop/src-tauri/tauri.conf.json')
    assert.equal(base.bundle.createUpdaterArtifacts, undefined)
    assert.equal(typeof base.plugins.updater.pubkey, 'string')
    assert.deepEqual(readJson('apps/desktop/src-tauri/tauri.updater.conf.json'), {
        bundle: { createUpdaterArtifacts: true },
    })

    for (const name of ['Build Tauri', 'Build Tauri (signed macOS)']) {
        const text = step(name)
        const projectPath = /projectPath: (\S+)/.exec(text)?.[1]
        const overlay = /--config (\S+)/.exec(text)?.[1]
        assert.equal(projectPath, 'apps/desktop', name)
        // The CLI resolves --config from the script's working directory, projectPath.
        assert.equal(
            resolve(REPO_ROOT, projectPath, overlay ?? ''),
            resolve(REPO_ROOT, 'apps/desktop/src-tauri/tauri.updater.conf.json'),
            `${name} does not load the updater overlay`,
        )
        assert.match(
            text,
            /TAURI_SIGNING_PRIVATE_KEY: \$\{\{ secrets\.TAURI_SIGNING_PRIVATE_KEY \}\}/,
            name,
        )
    }
    // A calling workflow cannot start the release build without the signing key.
    assert.match(WORKFLOW, /TAURI_SIGNING_PRIVATE_KEY:\n\s+required: true\n/)
})

test('macOS builds carry at least an ad-hoc signature, and the webview cannot drive the updater', () => {
    const readJson = (file) => JSON.parse(readFileSync(resolve(REPO_ROOT, file), 'utf8'))
    // Apple silicon requires a code signature for apps downloaded from the internet.
    // Without an Apple certificate, "-" is Tauri's ad-hoc identity (v2.tauri.app,
    // macOS signing, "Ad-Hoc Signing"); users still allow the app once.
    assert.equal(
        readJson('apps/desktop/src-tauri/tauri.conf.json').bundle.macOS.signingIdentity,
        '-',
    )

    // src-tauri/src/update.rs is the only way to download or install an update: it
    // runs after the user's consent and a confirmed save. No capability may hand the
    // webview the plugin's own updater commands, which would skip both.
    const dir = 'apps/desktop/src-tauri/capabilities'
    // tauri.conf.json lists capabilities by identifier; a listed one without a file
    // fails the build script ("capability with identifier ... not found").
    const listed = readJson('apps/desktop/src-tauri/tauri.conf.json').app.security.capabilities
    const files = readdirSync(resolve(REPO_ROOT, dir)).map(
        (file) => readJson(`${dir}/${file}`).identifier,
    )
    assert.deepEqual([...listed].sort(), [...files].sort())
    for (const file of readdirSync(resolve(REPO_ROOT, dir))) {
        const permissions = readJson(`${dir}/${file}`).permissions ?? []
        for (const permission of permissions) {
            const id = typeof permission === 'string' ? permission : permission.identifier
            assert.ok(!String(id).startsWith('updater:'), `${file} grants ${id}`)
        }
    }
})
