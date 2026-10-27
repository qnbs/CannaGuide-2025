import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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

test('macOS signing values reach Tauri only when the secrets exist', () => {
    // An unset secret expands to "", and tauri-bundler starts code signing for any
    // set APPLE_CERTIFICATE, then fails on the keychain import (run 40486452675).
    const build = step('Build Tauri')
    for (const name of APPLE_VARS) {
        assert.doesNotMatch(build, new RegExp(`\\b${name}:`), `${name} is passed to Build Tauri`)
    }

    const exporter = step('Export configured macOS signing secrets')
    assert.match(exporter, /if: runner\.os == 'macOS'/)
    assert.match(exporter, /\[ -n "\$value" \] \|\| continue/)
    assert.match(exporter, />> "\$GITHUB_ENV"/)
    for (const name of APPLE_VARS) {
        assert.match(exporter, new RegExp(`${name}: \\$\\{\\{ secrets\\.${name} \\}\\}`), name)
    }
    assert.ok(
        WORKFLOW.indexOf('- name: Export configured macOS signing secrets') <
            WORKFLOW.indexOf('- name: Build Tauri'),
        'the export step must run before the build',
    )
})
