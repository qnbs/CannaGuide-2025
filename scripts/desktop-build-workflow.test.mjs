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

    // The app updates only through src-tauri/src/update.rs, after the user's consent
    // and a confirmed save. The plugin's own updater commands would skip both, so no
    // capability may grant them to the webview. (App commands stay callable by code
    // in the webview; that is no boundary, see the trust note in update.rs.)
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

test('every desktop build is launched before its bundles are kept, on PRs too', () => {
    // v1.12.0 compiled, bundled, signed and passed verify, then exited at startup on
    // every platform (PluginInitialization). A runtime smoke now gates the upload.
    const jobBlock = (name) => {
        const start = WORKFLOW.indexOf(`\n    ${name}:\n`)
        assert.notEqual(start, -1, `missing job ${name}`)
        const next = WORKFLOW.slice(start + 1).search(/\n    [a-z-]+:\n/)
        return next === -1 ? WORKFLOW.slice(start) : WORKFLOW.slice(start, start + 1 + next)
    }
    const stepIn = (block, name) => {
        const at = block.indexOf(`- name: ${name}\n`)
        assert.notEqual(at, -1, `missing step ${name}`)
        const next = block.indexOf('\n            - name: ', at + 1)
        return { at, text: next === -1 ? block.slice(at) : block.slice(at, next) }
    }
    const runsTheSmoke =
        /run: node scripts\/desktop-smoke-ci\.mjs --target "\$TARGET" --bundle-dir /

    const build = jobBlock('build')
    const smoke = stepIn(build, 'Runtime smoke')
    const upload = stepIn(build, 'Upload artifacts')
    assert.ok(smoke.at < upload.at, 'smoke runs before the upload')
    assert.match(smoke.text, runsTheSmoke)
    // The step has no continue-on-error: a failed launch fails the job.
    assert.doesNotMatch(smoke.text, /continue-on-error/)

    const pr = jobBlock('pr-smoke')
    assert.match(pr, /if: github\.event_name == 'pull_request'/)
    // CodeRabbit on #881: the PR smoke must block too, and run before its upload.
    const prSmoke = stepIn(pr, 'Runtime smoke')
    const prUpload = stepIn(pr, 'Upload smoke evidence and bundles')
    assert.ok(prSmoke.at < prUpload.at, 'PR smoke before upload')
    assert.match(prSmoke.text, runsTheSmoke)
    assert.doesNotMatch(prSmoke.text, /continue-on-error/)
    assert.doesNotMatch(pr, /secrets\./, 'the pull request smoke reads no secrets')
    assert.doesNotMatch(pr, /tauri\.updater\.conf\.json/, 'no updater bundles, so nothing to sign')
    // No workspace-relative action in the new job (zizmor self-repository ratchet).
    assert.doesNotMatch(pr, /uses: \.\//)
    for (const target of [
        'x86_64-unknown-linux-gnu',
        'x86_64-pc-windows-msvc',
        'aarch64-apple-darwin',
    ]) {
        assert.match(pr, new RegExp(`target: ${target}\\n`), target)
    }

    // A skipped smoke would upload untested bundles (CodeRabbit on #881).
    assert.doesNotMatch(smoke.text, /\n\s+if:/, 'the release smoke step always runs')
    assert.doesNotMatch(prSmoke.text, /\n\s+if:/, 'the PR smoke step always runs')

    const orchestrator = readFileSync(resolve(REPO_ROOT, 'scripts/desktop-smoke-ci.mjs'), 'utf8')
    const fn = (name) => {
        const at = orchestrator.indexOf(`function ${name}(`)
        assert.notEqual(at, -1, `missing ${name}()`)
        // Line comments removed: a flag or a branch that is only commented out is absent.
        return orchestrator
            .slice(at, orchestrator.indexOf('\n}\n', at))
            .replace(/^\s*\/\/.*$/gm, '')
    }
    for (const label of ['-deb', '-appimage', '-nsis', '-msi', '-app']) {
        assert.ok(orchestrator.includes(`\`\${target}${label}\``), label)
    }
    // Fail closed, checked on the branches themselves:
    // - Intel macOS without Rosetta returns failure right after saying so;
    assert.match(fn('macos'), /\[FAIL\] Rosetta 2 unavailable[^\n]*\n[^\n]*\n\s*return false/)
    // - the Linux harness arguments carry --require-screenshot;
    assert.match(fn('linux'), /const common = \[[^\]]*'--require-screenshot'[^\]]*\]/)
    // - a failed NSIS or MSI install, or NSIS uninstall, returns at once: the sequence
    //   stops, so nothing this run did not install is launched (marking the run failed
    //   and carrying on would not be enough).
    for (const failure of ['NSIS install exited', 'MSI install exited', 'NSIS uninstall:']) {
        assert.match(
            fn('windows'),
            new RegExp(`${failure}[^\\n]*\\n(?:[^\\n]*\\n){0,2}?\\s*return false\\n`),
            failure,
        )
    }
    // The orchestrator refuses to run outside a disposable runner (it resets app folders).
    assert.match(orchestrator, /if \(!isDisposableRunner\(\)\) \{/)
    // - and main() turns a failed platform run into exit 1.
    assert.match(orchestrator, /return passed \? 0 : 1/)
})
