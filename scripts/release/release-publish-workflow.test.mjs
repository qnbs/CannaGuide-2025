import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const WORKFLOW = readFileSync(
    path.join(import.meta.dirname, '../../.github/workflows/release-publish.yml'),
    'utf8',
)
const GUARD = 'Refuse attestations for a commit this run did not build'

/** The text of one job, from its key to the next top-level job. */
const job = (name) => {
    const start = WORKFLOW.indexOf(`\n    ${name}:\n`)
    assert.notEqual(start, -1, `missing job ${name}`)
    const next = WORKFLOW.slice(start + 1).search(/\n {4}[a-z][\w-]*:\n/)
    return WORKFLOW.slice(start, next === -1 ? undefined : start + 1 + next)
}

/** The dedented `run: |` script of one step. */
const runScript = (text, name) => {
    const start = text.indexOf(`- name: ${name}\n`)
    assert.notEqual(start, -1, `missing step ${name}`)
    const step = text.slice(start, text.indexOf('\n            - name: ', start + 1))
    const body = step.slice(step.indexOf('run: |\n') + 'run: |\n'.length)
    return body
        .split('\n')
        .map((line) => line.replace(/^ {18}/, ''))
        .join('\n')
}

test('the release job checks the run commit before every attestation', () => {
    // CodeRabbit on #874: attest-build-provenance names the run's OIDC sha. A manual run
    // from main for an older tag would attest main's HEAD for assets built from the tag.
    const release = job('release')
    const guardAt = release.indexOf(`- name: ${GUARD}`)
    assert.notEqual(guardAt, -1)
    const attestations = [...release.matchAll(/uses: actions\/attest-[\w-]+@/g)]
    assert.ok(attestations.length >= 3, 'expected the desktop, SBOM and tarball attestations')
    for (const { index } of attestations) assert.ok(guardAt < index, 'attestation before the guard')
    assert.match(release, /RUN_COMMIT: \$\{\{ github\.sha \}\}/)
    assert.match(release, /RELEASE_COMMIT: \$\{\{ needs\.build\.outputs\.commit \}\}/)
})

test('the guard passes only when the run commit is the release commit', () => {
    const script = runScript(job('release'), GUARD)
    const run = (env) =>
        spawnSync('bash', ['-c', script], {
            env: { PATH: process.env.PATH, TAG: 'v1.12.0', ...env },
            encoding: 'utf8',
        })
    const tagCommit = 'a'.repeat(40)
    const same = run({ RUN_COMMIT: tagCommit, RELEASE_COMMIT: tagCommit })
    assert.equal(same.status, 0, same.stdout)
    assert.match(same.stdout, /\[OK\]/)

    const mainHead = run({ RUN_COMMIT: 'b'.repeat(40), RELEASE_COMMIT: tagCommit })
    assert.equal(mainHead.status, 1)
    assert.match(mainHead.stdout, /did not build the release assets/)

    const unresolved = run({ RUN_COMMIT: tagCommit, RELEASE_COMMIT: '' })
    assert.equal(unresolved.status, 1)
})
