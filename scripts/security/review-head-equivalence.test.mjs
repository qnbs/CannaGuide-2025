import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { devNull, tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import {
    changeDigest,
    gitEnvironment,
    proveHeadEquivalence,
    UsageError,
} from './review-head-equivalence.mjs'

const SCRIPT = path.join(import.meta.dirname, 'review-head-equivalence.mjs')

/**
 * A throwaway repository with an isolated Git configuration: `main` with a base commit,
 * a `pr` branch with one reviewed change (`prior`), and one more commit on `main`.
 */
function makeRepo(t) {
    const root = mkdtempSync(path.join(tmpdir(), 'cannaguide-equivalence-'))
    t.after(() => rmSync(root, { recursive: true, force: true }))
    const globalConfig = path.join(root, 'isolated-global.gitconfig')
    writeFileSync(globalConfig, '')
    const env = {
        ...Object.fromEntries(
            Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')),
        ),
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_GLOBAL: globalConfig,
        GIT_AUTHOR_NAME: 'Equivalence Test',
        GIT_AUTHOR_EMAIL: 'equivalence@example.invalid',
        GIT_COMMITTER_NAME: 'Equivalence Test',
        GIT_COMMITTER_EMAIL: 'equivalence@example.invalid',
    }
    const repo = path.join(root, 'repo')
    mkdirSync(repo)
    // Throwaway test repository only: these commits are never pushed or merged.
    const git = (...args) =>
        execFileSync('git', ['-c', 'commit.gpgsign=false', ...args], {
            cwd: repo,
            env,
            encoding: 'utf8',
        }).trim()
    const write = (file, text) => writeFileSync(path.join(repo, file), text)
    const commit = (message) => {
        git('add', '--all')
        git('commit', '--quiet', '-m', message)
        return git('rev-parse', 'HEAD')
    }

    git('init', '--quiet', '--initial-branch=main')
    write('a.txt', 'one\ntwo\nthree\n')
    write('CHANGELOG.md', '## Unreleased\n\n### Fixed\n\n- old entry\n')
    const base = commit('base')

    git('switch', '--quiet', '-c', 'pr')
    write('a.txt', 'one\ntwo changed\nthree\n')
    write('CHANGELOG.md', '## Unreleased\n\n### Fixed\n\n- pr entry\n\n- old entry\n')
    const prior = commit('pr change')

    git('switch', '--quiet', 'main')
    write('m.txt', 'main\n')
    write(
        'CHANGELOG.md',
        '## Unreleased\n\n### Fixed\n\n- old entry\n\n### Added\n\n- main entry\n',
    )
    commit('main change')
    git('switch', '--quiet', 'pr')

    return { repo, env, git, write, commit, base, prior }
}

const prove = (repo, prior, head, base = 'main') =>
    proveHeadEquivalence({ cwd: repo, prior, head, base })

function runCli(repo, env, args) {
    return spawnSync(process.execPath, [SCRIPT, ...args], { cwd: repo, env, encoding: 'utf8' })
}

test('a pure merge of the base branch keeps the reviewed changes equivalent', (t) => {
    const { repo, env, git, prior } = makeRepo(t)
    git('merge', '--quiet', '--no-ff', '--no-edit', 'main')
    const head = git('rev-parse', 'HEAD')

    const proof = prove(repo, prior, head)
    assert.equal(proof.equivalent, true, proof.reason)
    assert.equal(proof.reason, null)
    assert.equal(proof.priorChangeDigest, proof.headChangeDigest)
    assert.match(proof.priorChangeDigest, /^[0-9a-f]{64}$/)
    assert.notEqual(proof.priorBaseSha, proof.headBaseSha)
    assert.deepEqual(proof.changedLines, { prior: 4, head: 4 })
    assert.equal(proof.mergeCommits.length, 1)
    assert.equal(proof.mergeCommits[0].sha, head)
    assert.equal(proof.mergeCommits[0].parents[0], prior)
    assert.equal(proof.mergeCommits[0].mergedParentOnBase, true)
    assert.equal(proof.mergeCommits[0].cleanAutomaticMerge, true)
    assert.equal(proof.mergeCommits[0].tree, proof.mergeCommits[0].automaticMergeTree)
    assert.equal(proof.version, 2)

    const cli = runCli(repo, env, ['--prior', prior, '--head', head, '--base', 'main'])
    assert.equal(cli.status, 0, cli.stderr)
    assert.deepEqual(JSON.parse(cli.stdout), proof)
})

test('two successive base merges stay equivalent', (t) => {
    const { repo, git, write, commit, prior } = makeRepo(t)
    git('merge', '--quiet', '--no-ff', '--no-edit', 'main')
    git('switch', '--quiet', 'main')
    write('n.txt', 'second main change\n')
    commit('second main change')
    git('switch', '--quiet', 'pr')
    git('merge', '--quiet', '--no-ff', '--no-edit', 'main')
    const head = git('rev-parse', 'HEAD')

    const proof = prove(repo, prior, head)
    assert.equal(proof.equivalent, true, proof.reason)
    assert.equal(proof.mergeCommits.length, 2)
})

test('a merge that also changes the pull lines (evil merge) is not equivalent', (t) => {
    const { repo, env, git, write, prior } = makeRepo(t)
    git('merge', '--quiet', '--no-ff', '--no-commit', 'main')
    write('a.txt', 'one\ntwo changed\nthree\nsmuggled\n')
    git('add', 'a.txt')
    git('commit', '--quiet', '--no-edit')
    const head = git('rev-parse', 'HEAD')

    const proof = prove(repo, prior, head)
    assert.equal(proof.equivalent, false)
    assert.match(proof.reason, /not git's clean automatic merge/)

    const cli = runCli(repo, env, ['--prior', prior, '--head', head, '--base', 'main'])
    assert.equal(cli.status, 1)
    assert.equal(JSON.parse(cli.stdout).equivalent, false)
})

test('a merge that silently reverts a base change is not equivalent', (t) => {
    const { repo, git, prior } = makeRepo(t)
    git('merge', '--quiet', '--no-ff', '--no-commit', 'main')
    git('rm', '--quiet', '-f', 'm.txt')
    git('commit', '--quiet', '--no-edit')
    const head = git('rev-parse', 'HEAD')

    const proof = prove(repo, prior, head)
    assert.equal(proof.equivalent, false)
    assert.match(proof.reason, /not git's clean automatic merge/)
})

test('a merge that moves a reviewed edit to an identical line elsewhere is rejected', (t) => {
    // Codex P1 on #870: with repeated lines, the flattened changed lines alone match.
    const { repo, git, write, commit } = makeRepo(t)
    git('switch', '--quiet', 'main')
    write('flags.txt', 'allow=false\nmiddle\nallow=false\n')
    commit('flags on main')
    git('switch', '--quiet', 'pr')
    git('merge', '--quiet', '--no-ff', '--no-edit', 'main')
    write('flags.txt', 'allow=true\nmiddle\nallow=false\n')
    const reviewed = commit('enable the first flag')
    git('switch', '--quiet', 'main')
    write('other.txt', 'base update\n')
    commit('base update')
    git('switch', '--quiet', 'pr')
    git('merge', '--quiet', '--no-ff', '--no-commit', 'main')
    write('flags.txt', 'allow=false\nmiddle\nallow=true\n')
    git('add', 'flags.txt')
    git('commit', '--quiet', '--no-edit')
    const head = git('rev-parse', 'HEAD')

    const proof = prove(repo, reviewed, head)
    assert.equal(proof.equivalent, false)
    assert.match(proof.reason, /not git's clean automatic merge/)
    assert.equal(proof.mergeCommits[0].cleanAutomaticMerge, false)
})

test('a merge that replaces a reviewed binary file is rejected', (t) => {
    // Codex P1 / CodeAnt on #870: git prints only "Binary files differ" without --binary.
    const { repo, git, commit } = makeRepo(t)
    writeFileSync(path.join(repo, 'blob.bin'), Buffer.from([0, 3, 4]))
    const reviewed = commit('binary change')
    git('merge', '--quiet', '--no-ff', '--no-commit', 'main')
    writeFileSync(path.join(repo, 'blob.bin'), Buffer.from([0, 99, 100]))
    git('add', 'blob.bin')
    git('commit', '--quiet', '--no-edit')
    const head = git('rev-parse', 'HEAD')

    const proof = prove(repo, reviewed, head)
    assert.equal(proof.equivalent, false)
    assert.match(proof.reason, /not git's clean automatic merge/)
})

test('the changed-line digest includes binary contents', (t) => {
    const { repo, commit, base } = makeRepo(t)
    writeFileSync(path.join(repo, 'blob.bin'), Buffer.from([0, 3, 4]))
    const first = commit('binary one')
    writeFileSync(path.join(repo, 'blob.bin'), Buffer.from([0, 99, 100]))
    const second = commit('binary two')
    assert.notEqual(changeDigest(repo, base, first).digest, changeDigest(repo, base, second).digest)
})

test('a merge whose conflict was resolved by hand is rejected', (t) => {
    const { repo, env, git, write, commit, prior } = makeRepo(t)
    git('switch', '--quiet', 'main')
    write('a.txt', 'one\ntwo on main\nthree\n')
    commit('conflicting main change')
    git('switch', '--quiet', 'pr')
    const merge = spawnSync(
        'git',
        ['-c', 'commit.gpgsign=false', 'merge', '--no-ff', '--no-edit', 'main'],
        { cwd: repo, env, encoding: 'utf8' },
    )
    assert.notEqual(merge.status, 0, 'the fixture must conflict')
    write('a.txt', 'one\ntwo changed\nthree\n')
    git('add', 'a.txt')
    git('commit', '--quiet', '--no-edit')
    const head = git('rev-parse', 'HEAD')

    const proof = prove(repo, prior, head)
    assert.equal(proof.equivalent, false)
    assert.match(proof.reason, /not git's clean automatic merge/)
    assert.equal(proof.mergeCommits[0].automaticMergeTree, null)
})

test('any non-merge commit after the reviewed head breaks the proof, even an empty one', (t) => {
    const { repo, git, prior } = makeRepo(t)
    git('merge', '--quiet', '--no-ff', '--no-edit', 'main')
    git('commit', '--quiet', '--allow-empty', '-m', 'empty')
    const head = git('rev-parse', 'HEAD')

    const proof = prove(repo, prior, head)
    assert.equal(proof.equivalent, false)
    assert.match(proof.reason, /not a two-parent merge/)
})

test('merging a branch that is not on the base ref breaks the proof', (t) => {
    const { repo, git, write, commit, base, prior } = makeRepo(t)
    git('switch', '--quiet', '-c', 'side', base)
    write('s.txt', 'side\n')
    commit('side change')
    git('switch', '--quiet', 'pr')
    git('merge', '--quiet', '--no-ff', '--no-edit', 'side')
    const head = git('rev-parse', 'HEAD')

    const proof = prove(repo, prior, head)
    assert.equal(proof.equivalent, false)
    assert.match(proof.reason, /not on main/)
    assert.equal(proof.mergeCommits[0].mergedParentOnBase, false)
})

test('a reviewed head that is not an ancestor of the head is rejected', (t) => {
    const { repo, git, write, commit, base } = makeRepo(t)
    git('switch', '--quiet', '-c', 'unrelated', base)
    write('u.txt', 'unrelated\n')
    const unrelated = commit('unrelated')
    git('switch', '--quiet', 'pr')
    git('merge', '--quiet', '--no-ff', '--no-edit', 'main')
    const head = git('rev-parse', 'HEAD')

    const proof = prove(repo, unrelated, head)
    assert.equal(proof.equivalent, false)
    assert.match(proof.reason, /not an ancestor/)
})

test('git runs without inherited GIT_* variables or personal configuration', () => {
    const env = gitEnvironment({
        HOME: '/home/someone',
        PATH: '/usr/bin',
        GIT_DIR: '/elsewhere/.git',
        GIT_WORK_TREE: '/elsewhere',
        Git_Index_File: '/elsewhere/index',
        GIT_CONFIG_PARAMETERS: "'diff.noprefix'='true'",
        GIT_EXTERNAL_DIFF: '/bin/true',
    })
    assert.deepEqual(env, {
        HOME: '/home/someone',
        PATH: '/usr/bin',
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_GLOBAL: devNull,
    })
})

test('a hostile caller environment cannot redirect or reformat the proof (CodeRabbit on #870)', (t) => {
    const { repo, env, git, prior } = makeRepo(t)
    git('merge', '--quiet', '--no-ff', '--no-edit', 'main')
    const head = git('rev-parse', 'HEAD')
    const clean = runCli(repo, env, ['--prior', prior, '--head', head, '--base', 'main'])
    assert.equal(clean.status, 0, clean.stderr)

    const hostileConfig = path.join(path.dirname(repo), 'hostile.gitconfig')
    writeFileSync(hostileConfig, '[diff]\n\tnoprefix = true\n\talgorithm = histogram\n')
    const hostile = {
        ...env,
        GIT_DIR: path.join(path.dirname(repo), 'missing.git'),
        GIT_WORK_TREE: path.dirname(repo),
        GIT_CONFIG_GLOBAL: hostileConfig,
        GIT_CONFIG_COUNT: '1',
        GIT_CONFIG_KEY_0: 'diff.mnemonicPrefix',
        GIT_CONFIG_VALUE_0: 'true',
    }
    const run = runCli(repo, hostile, ['--prior', prior, '--head', head, '--base', 'main'])
    assert.equal(run.status, 0, run.stderr)
    assert.deepEqual(JSON.parse(run.stdout), JSON.parse(clean.stdout))
})

test('invalid arguments and unknown commits exit 2 without a proof', (t) => {
    const { repo, env, git, prior } = makeRepo(t)
    git('merge', '--quiet', '--no-ff', '--no-edit', 'main')
    const head = git('rev-parse', 'HEAD')

    const invalid = [
        ['--prior', prior],
        ['--prior', prior.slice(0, 12), '--head', head],
        ['--prior', prior, '--head', prior],
        ['--prior', prior, '--head', head, '--base', '-main'],
        ['--prior', prior, '--head', head, '--extra', 'x'],
        ['--prior', prior, '--head', 'f'.repeat(40)],
        ['--prior', prior, '--head', head, '--base', 'no-such-branch'],
    ]
    for (const args of invalid) {
        const cli = runCli(repo, env, args)
        assert.equal(cli.status, 2, `${args.join(' ')} -> ${cli.status}: ${cli.stdout}`)
        assert.equal(cli.stdout, '')
        assert.match(cli.stderr, /\[review-head-equivalence\]/)
    }
    assert.throws(() => prove(repo, prior.toUpperCase(), head), UsageError)
})
