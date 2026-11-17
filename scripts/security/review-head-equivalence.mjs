#!/usr/bin/env node
/**
 * Proves that a pull-request head only merged the base branch into an earlier reviewed
 * head. CodeRabbit reviews incrementally and skips such a merge ("No files to review"),
 * so its coverage marker stays on the earlier head although the pull's own changes did
 * not move. The JSON this prints is the optional `headEquivalence` evidence that
 * scripts/security/review-coverage-policy.mjs accepts for that case
 * (docs/PR-REVIEW-LOOP.md, section 5).
 *
 * The proof holds only when:
 *   - the reviewed head is an ancestor of the current head;
 *   - every first-parent commit after the reviewed head is a two-parent merge whose first
 *     parent is the previous pull tip and whose second parent is already on the base ref;
 *   - every such merge is git's clean automatic merge of its parents: `git merge-tree
 *     --write-tree` reports no conflict and yields exactly the merge commit's tree. This
 *     pins every byte, binary files and the location of each edit included, so a merge
 *     cannot move or replace a reviewed change by hand;
 *   - the pull's changed lines hash the same on both heads. Each side is diffed against its
 *     own merge base with the base ref (`git diff -U0 --binary`), and only the hunk headers
 *     and `index` lines are dropped, because line numbers and blob ids shift when the base
 *     moves.
 *
 * A conflict resolution or an "evil merge" that changes anything, an extra commit (even an
 * empty one), or a merge of anything not on the base ref fails the proof.
 *
 * Usage:
 *   node scripts/security/review-head-equivalence.mjs --prior <sha> --head <sha> [--base <ref>]
 *
 * Exit codes: 0 = proven (JSON on stdout), 1 = not equivalent (JSON with `reason`),
 * 2 = invalid arguments or a git failure. Read-only and offline: it reads local git objects
 * only, so fetch the base ref first. The base ref defaults to `origin/main`.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { devNull } from 'node:os'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const SHA = /^[0-9a-f]{40}$/
const REF = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/
export const PROOF_VERSION = 2

export class UsageError extends Error {}

/**
 * Git runs against the repository at `cwd` only, and personal configuration cannot change
 * its output: every inherited GIT_* variable is dropped (GIT_DIR, GIT_WORK_TREE,
 * GIT_CONFIG_PARAMETERS, GIT_EXTERNAL_DIFF, ...), and global and system configuration
 * are ignored. The repository's own `.git/config` still applies, the same to both heads.
 */
export function gitEnvironment(env = process.env) {
    const clean = Object.fromEntries(
        Object.entries(env).filter(([name]) => !name.toUpperCase().startsWith('GIT_')),
    )
    return { ...clean, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: devNull }
}

function git(cwd, args) {
    return execFileSync('git', args, {
        cwd,
        env: gitEnvironment(),
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
    })
}

function isAncestor(cwd, ancestor, descendant) {
    try {
        execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
            cwd,
            env: gitEnvironment(),
            stdio: 'ignore',
        })
        return true
    } catch (error) {
        if (error?.status === 1) return false
        throw error
    }
}

/**
 * The tree of git's automatic merge of `first` and `second`, or null when that merge has
 * conflicts. `git merge-tree --write-tree` exits 0 for a clean merge and 1 for conflicts.
 */
function automaticMergeTree(cwd, first, second) {
    const run = spawnSync('git', ['merge-tree', '--write-tree', '--no-messages', first, second], {
        cwd,
        env: gitEnvironment(),
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    })
    if (run.status === 0) return run.stdout.trim().split('\n')[0]
    if (run.status === 1) return null
    throw new Error(`git merge-tree failed: ${(run.stderr || run.error?.message || '').trim()}`)
}

/** Changed lines of `from..to`, without hunk headers and blob ids, and their SHA-256. */
export function changeDigest(cwd, from, to) {
    // Every option that could change the output is spelled out, so the repository's own
    // config (diff.algorithm, diff.noprefix, diff.interHunkContext, diff.ignoreSubmodules,
    // diff.submodule, diff.orderFile, ...) cannot change it.
    const diff = git(cwd, [
        '-c',
        'core.quotePath=true',
        'diff',
        '-U0',
        '--inter-hunk-context=0',
        '--diff-algorithm=myers',
        '--indent-heuristic',
        '--src-prefix=a/',
        '--dst-prefix=b/',
        '--no-relative',
        '--binary',
        '--no-color',
        '--no-ext-diff',
        '--no-textconv',
        '--no-renames',
        '--ignore-submodules=none',
        '--submodule=short',
        `-O${devNull}`,
        from,
        to,
    ])
    const kept = diff
        .split('\n')
        .filter((line) => !line.startsWith('@@') && !line.startsWith('index '))
    const changedLines = kept.filter(
        (line) =>
            (line.startsWith('+') && !line.startsWith('+++ ')) ||
            (line.startsWith('-') && !line.startsWith('--- ')),
    ).length
    return { digest: createHash('sha256').update(kept.join('\n')).digest('hex'), changedLines }
}

export function proveHeadEquivalence({ cwd = process.cwd(), prior, head, base = 'origin/main' }) {
    if (!SHA.test(prior ?? '') || !SHA.test(head ?? '')) {
        throw new UsageError('--prior and --head must be full 40-character lowercase SHAs')
    }
    if (prior === head) throw new UsageError('--prior and --head must differ')
    if (!REF.test(base ?? '')) throw new UsageError(`invalid --base ref: ${base}`)
    for (const sha of [prior, head]) git(cwd, ['cat-file', '-e', `${sha}^{commit}`])
    const baseSha = git(cwd, ['rev-parse', '--verify', '--quiet', `${base}^{commit}`]).trim()

    const result = {
        version: PROOF_VERSION,
        baseRef: base,
        baseSha,
        priorHeadSha: prior,
        headSha: head,
        priorBaseSha: null,
        headBaseSha: null,
        priorChangeDigest: null,
        headChangeDigest: null,
        changedLines: null,
        mergeCommits: [],
        equivalent: false,
        reason: null,
    }
    const fail = (reason) => ({ ...result, reason })

    if (!isAncestor(cwd, prior, head))
        return fail('the reviewed head is not an ancestor of the head')

    const chain = git(cwd, [
        'rev-list',
        '--first-parent',
        '--reverse',
        '--parents',
        `${prior}..${head}`,
    ])
        .split('\n')
        .filter(Boolean)
        .map((line) => line.split(' '))
    let previous = prior
    for (const [sha, ...parents] of chain) {
        const mergedParentOnBase =
            parents.length === 2 && parents[0] === previous && isAncestor(cwd, parents[1], baseSha)
        const tree = git(cwd, ['rev-parse', `${sha}^{tree}`]).trim()
        const automatic = mergedParentOnBase
            ? automaticMergeTree(cwd, parents[0], parents[1])
            : null
        const cleanAutomaticMerge = automatic !== null && automatic === tree
        result.mergeCommits.push({
            sha,
            parents,
            mergedParentOnBase,
            tree,
            automaticMergeTree: automatic,
            cleanAutomaticMerge,
        })
        if (parents.length !== 2) return fail(`${sha} is not a two-parent merge`)
        if (parents[0] !== previous) return fail(`${sha} does not continue the pull branch`)
        if (!mergedParentOnBase) return fail(`${sha} merges a commit that is not on ${base}`)
        if (!cleanAutomaticMerge) {
            return fail(`${sha} is not git's clean automatic merge of its parents`)
        }
        previous = sha
    }
    if (previous !== head || result.mergeCommits.length === 0) {
        return fail('the first-parent chain does not end at the head')
    }

    result.priorBaseSha = git(cwd, ['merge-base', baseSha, prior]).trim()
    result.headBaseSha = git(cwd, ['merge-base', baseSha, head]).trim()
    const priorChange = changeDigest(cwd, result.priorBaseSha, prior)
    const headChange = changeDigest(cwd, result.headBaseSha, head)
    result.priorChangeDigest = priorChange.digest
    result.headChangeDigest = headChange.digest
    result.changedLines = { prior: priorChange.changedLines, head: headChange.changedLines }
    if (priorChange.digest !== headChange.digest) {
        return fail('the pull changed lines differ between the two heads')
    }
    return { ...result, equivalent: true }
}

function parseArgs(argv) {
    const options = {}
    for (let index = 0; index < argv.length; index += 1) {
        const flag = argv[index]
        const key = { '--prior': 'prior', '--head': 'head', '--base': 'base' }[flag]
        const value = argv[index + 1]
        if (!key || value === undefined || value.startsWith('--')) {
            throw new UsageError(`unexpected argument: ${flag}`)
        }
        options[key] = value
        index += 1
    }
    if (!options.prior || !options.head) throw new UsageError('--prior and --head are required')
    return options
}

export function main(argv = process.argv.slice(2)) {
    try {
        const proof = proveHeadEquivalence(parseArgs(argv))
        process.stdout.write(`${JSON.stringify(proof, null, 4)}\n`)
        return proof.equivalent ? 0 : 1
    } catch (error) {
        const message = error instanceof UsageError ? error.message : `git failed: ${error.message}`
        process.stderr.write(`[review-head-equivalence] ${message}\n`)
        return 2
    }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    process.exitCode = main()
}
