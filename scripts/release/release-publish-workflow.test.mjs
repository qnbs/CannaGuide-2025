import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
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

test('a dispatch resolves exactly the tag its concurrency group names', (t) => {
    // CodeAnt on #874: the group keys on the raw input. Stripping "refs/tags/" put a
    // dispatch for v1.11.0 in another group than the v1.11.0 tag push, so both could
    // run at once. The prefixed form is now refused; an accepted input is the tag.
    assert.match(
        WORKFLOW,
        /group: release-publish-\$\{\{ github\.event\.inputs\.tag \|\| github\.ref_name \}\}/,
    )
    const script = runScript(job('tag'), 'Resolve tag name')
    const dir = mkdtempSync(path.join(tmpdir(), 'cannaguide-release-tag-'))
    t.after(() => rmSync(dir, { recursive: true, force: true }))
    const resolve = (env) => {
        const output = path.join(dir, `out-${Math.random().toString(36).slice(2)}`)
        const result = spawnSync('bash', ['-c', script], {
            env: { PATH: process.env.PATH, GITHUB_OUTPUT: output, ...env },
            encoding: 'utf8',
        })
        let name
        try {
            name = /^name=(.*)$/m.exec(readFileSync(output, 'utf8'))?.[1]
        } catch {}
        return { status: result.status, name }
    }
    for (const tag of ['v1.11.0', 'v1.12.0-rc.1']) {
        assert.deepEqual(resolve({ EVENT_NAME: 'workflow_dispatch', INPUT_TAG: tag }), {
            status: 0,
            name: tag,
        })
    }
    assert.deepEqual(resolve({ EVENT_NAME: 'push', REF_NAME: 'v1.11.0' }), {
        status: 0,
        name: 'v1.11.0',
    })
    for (const tag of ['refs/tags/v1.11.0', '1.11.0', 'v1.11', 'v1.11.0 ']) {
        const { status, name } = resolve({ EVENT_NAME: 'workflow_dispatch', INPUT_TAG: tag })
        assert.equal(status, 1, JSON.stringify(tag))
        assert.equal(name, undefined)
    }
})

test('an existing release stops the run before any attestation, and a failed lookup too', (t) => {
    // CodeAnt on #874: a dispatch that creates the tag also starts the tag's own run,
    // queued behind it; that run must stop at the existing draft before it attests.
    // CodeRabbit on #874: `gh release view` also fails on API, auth and network
    // errors, so a failed lookup must stop the run instead of reading as "no release".
    const name = 'Refuse an existing release before any attestation'
    const release = job('release')
    const at = release.indexOf(`- name: ${name}`)
    assert.notEqual(at, -1)
    for (const { index } of release.matchAll(/uses: actions\/attest-[\w-]+@/g)) {
        assert.ok(at < index, 'attestation before the existing-release check')
    }
    // Neither check may treat a gh error as "no release" again.
    assert.doesNotMatch(release, /if gh release view/)
    assert.equal(release.match(/if ! TAGS=\$\(gh api --paginate/g)?.length, 2)

    const bin = mkdtempSync(path.join(tmpdir(), 'cannaguide-fake-gh-'))
    t.after(() => rmSync(bin, { recursive: true, force: true }))
    // A stand-in gh that prints FAKE_TAGS for the release listing, or fails.
    writeFileSync(
        path.join(bin, 'gh'),
        '#!/bin/sh\n[ "$FAKE_GH_FAIL" = 1 ] && { echo "HTTP 502" >&2; exit 1; }\n[ "$1" = api ] || exit 3\nprintf "%s" "$FAKE_TAGS"\n',
    )
    chmodSync(path.join(bin, 'gh'), 0o755)
    const script = runScript(release, name)
    const run = (env) =>
        spawnSync('bash', ['-eo', 'pipefail', '-c', script], {
            env: {
                PATH: `${bin}:${process.env.PATH}`,
                TAG: 'v1.12.0',
                REPO: 'qnbs/CannaGuide-2025',
                ...env,
            },
            encoding: 'utf8',
        })
    const existing = run({ FAKE_TAGS: 'v1.11.0\nv1.12.0\nv1.9.0' })
    assert.equal(existing.status, 1)
    assert.match(existing.stdout, /already exists .*Nothing was attested/)
    // A prefix or a longer tag is not the same release.
    assert.equal(run({ FAKE_TAGS: 'v1.12.0-rc.1\nv1.12.00' }).status, 0)
    assert.equal(run({ FAKE_TAGS: '' }).status, 0)
    const failed = run({ FAKE_GH_FAIL: '1' })
    assert.equal(failed.status, 1)
    assert.match(failed.stdout, /Could not list the releases/)
})

test('only a commit on main reaches the signing key and the release', (t) => {
    // CodeAnt on #874: a v* tag can name any commit, and CI passing does not mean
    // reviewed. The build job -- which the desktop (signing key) and release
    // (attestation) jobs depend on -- refuses a commit that is not on main.
    const build = job('build')
    const name = 'Require the release commit to be on main'
    assert.ok(build.indexOf(`- name: ${name}`) > build.indexOf('- name: Resolve release commit'))
    assert.match(job('desktop'), /needs: \[build\]/)
    assert.match(job('release'), /needs: \[build, desktop\]/)

    const root = mkdtempSync(path.join(tmpdir(), 'cannaguide-release-main-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const env = {
        PATH: process.env.PATH,
        HOME: root,
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_AUTHOR_NAME: 'test',
        GIT_AUTHOR_EMAIL: 'test@example.invalid',
        GIT_COMMITTER_NAME: 'test',
        GIT_COMMITTER_EMAIL: 'test@example.invalid',
    }
    const work = path.join(root, 'work')
    mkdirSync(work)
    const git = (args, cwd = work) => {
        const result = spawnSync('git', ['-c', 'commit.gpgsign=false', ...args], {
            cwd,
            env,
            encoding: 'utf8',
        })
        assert.equal(result.status, 0, result.stderr)
        return result.stdout.trim()
    }
    git(['init', '--bare', '-q', path.join(root, 'origin.git')], root)
    git(['init', '-q', '-b', 'main'])
    git(['remote', 'add', 'origin', path.join(root, 'origin.git')])
    git(['commit', '-q', '--allow-empty', '-m', 'reviewed'])
    git(['push', '-q', 'origin', 'HEAD:refs/heads/main'])
    const onMain = git(['rev-parse', 'HEAD'])
    git(['switch', '-q', '-c', 'unreviewed'])
    git(['commit', '-q', '--allow-empty', '-m', 'not merged'])
    const offMain = git(['rev-parse', 'HEAD'])

    const script = runScript(build, name)
    const run = (commit, cwd = work) =>
        spawnSync('bash', ['-eo', 'pipefail', '-c', script], {
            cwd,
            env: { ...env, RELEASE_COMMIT: commit },
            encoding: 'utf8',
        })
    assert.equal(run(onMain).status, 0)
    const refused = run(offMain)
    assert.equal(refused.status, 1)
    assert.match(refused.stdout, /is not on main/)
    // No reachable main: refuse instead of assuming.
    git(['remote', 'set-url', 'origin', path.join(root, 'missing.git')])
    const unreachable = run(onMain)
    assert.equal(unreachable.status, 1)
    assert.match(unreachable.stdout, /Could not fetch main/)
})

test('a manual run that creates the tag hands off to the tag run instead of building twice', () => {
    const tag = job('tag')
    assert.match(tag, /created: \$\{\{ steps\.ensure\.outputs\.created \}\}/)
    // The tag job reads RELEASE_PAT, so it carries the main ref guard.
    assert.match(
        tag,
        /github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main'/,
    )
    const build = job('build')
    assert.match(build, /needs: \[tag\]/)
    assert.match(build, /needs\.tag\.outputs\.created != 'true'/)
    assert.match(build, /tag: \$\{\{ needs\.tag\.outputs\.name \}\}/)
    assert.doesNotMatch(build, /steps\.tag\.outputs/)
    // desktop and release follow build, so they are skipped with it.
    assert.match(job('desktop'), /needs: \[build\]/)
    assert.match(job('release'), /needs: \[build, desktop\]/)
})

test('Ensure tag exists reports created only for a tag it pushed', (t) => {
    const script = runScript(job('tag'), 'Ensure tag exists')
    const bin = mkdtempSync(path.join(tmpdir(), 'cannaguide-fake-git-'))
    t.after(() => rmSync(bin, { recursive: true, force: true }))
    // Stand-ins: ls-remote finds the tag only when FAKE_TAG_EXISTS=1, push fails
    // when FAKE_PUSH_FAILS=1, and gh reports write access.
    writeFileSync(
        path.join(bin, 'git'),
        [
            '#!/bin/sh',
            'case "$1" in',
            '  ls-remote) [ "$FAKE_TAG_EXISTS" = 1 ] && echo "abc refs/tags/$TAG"; exit 0 ;;',
            '  push) [ "$FAKE_PUSH_FAILS" = 1 ] && { echo "HTTP 403" >&2; exit 1; }; exit 0 ;;',
            '  config) [ "$2" = "--local" ] && [ "$3" = "--name-only" ] && exit 1; exit 0 ;;',
            '  *) exit 0 ;;',
            'esac',
            '',
        ].join('\n'),
    )
    writeFileSync(path.join(bin, 'gh'), '#!/bin/sh\necho true\n')
    chmodSync(path.join(bin, 'git'), 0o755)
    chmodSync(path.join(bin, 'gh'), 0o755)
    const run = (env) => {
        const output = path.join(bin, `out-${Math.random().toString(36).slice(2)}`)
        writeFileSync(output, '')
        const result = spawnSync('bash', ['-eo', 'pipefail', '-c', script], {
            env: {
                PATH: `${bin}:${process.env.PATH}`,
                TAG: 'v1.13.0',
                REPO: 'qnbs/CannaGuide-2025',
                RELEASE_PAT: 'token-for-test',
                GITHUB_OUTPUT: output,
                ...env,
            },
            encoding: 'utf8',
        })
        return { status: result.status, output: readFileSync(output, 'utf8') }
    }
    assert.deepEqual(run({ FAKE_TAG_EXISTS: '1' }), { status: 0, output: 'created=false\n' })
    assert.deepEqual(run({}), { status: 0, output: 'created=true\n' })
    const failed = run({ FAKE_PUSH_FAILS: '1' })
    assert.equal(failed.status, 1)
    assert.equal(failed.output, '')
})
