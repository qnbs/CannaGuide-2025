#!/usr/bin/env node
/**
 * Run a turbo task against only the workspaces this branch actually touched.
 *
 * On the dual-core / ~4 GB machine this repo is developed on, the difference is
 * not cosmetic: a bare `turbo run typecheck` builds and checks all five tasks
 * (ai-core build + typecheck, ui build + typecheck, web typecheck) and takes
 * 6-9 minutes cold, while the same check scoped to the one workspace a PR
 * touches takes well under a minute. Leaving that choice to whoever types the
 * command means it gets typed wrong, so the scoping is derived from the diff.
 *
 *   pnpm verify         -> typecheck   (default)
 *   pnpm verify:test    -> test:run
 *   pnpm verify:lint    -> lint
 *
 * Nothing here shells out to an unfiltered `turbo run`.
 */
import { spawnSync } from 'node:child_process'

const TAG = '[verify]'

/** Path prefix -> workspace package name. */
const WORKSPACE_BY_PREFIX = [
    ['apps/web/', '@cannaguide/web'],
    ['apps/desktop/', '@cannaguide/desktop'],
    ['packages/ai-core/', '@cannaguide/ai-core'],
    ['packages/ui/', '@cannaguide/ui'],
]

/**
 * Changing a library means its consumers have to be re-checked against it, so
 * these are filtered with turbo's trailing `...` (the package *and everything
 * that depends on it*). Leaf apps are filtered on their own.
 */
const LIBRARY_WORKSPACES = new Set(['@cannaguide/ai-core', '@cannaguide/ui'])

const KNOWN_TASKS = new Set(['typecheck', 'test:run', 'lint', 'build'])

function git(args) {
    const result = spawnSync('git', args, { encoding: 'utf8' })
    if (result.status !== 0) {
        console.error(`${TAG} git ${args.join(' ')} failed: ${(result.stderr || '').trim()}`)
        process.exit(1)
    }
    return result.stdout.trim()
}

function changedFiles() {
    // Diff against the merge-base, not against origin/main's tip: otherwise every
    // commit that lands on main while a branch is open widens this branch's scope.
    const base = git(['merge-base', 'origin/main', 'HEAD'])
    const out = git(['diff', '--name-only', `${base}...HEAD`])
    return out ? out.split('\n').filter(Boolean) : []
}

function affectedWorkspaces(files) {
    const affected = new Set()
    for (const file of files) {
        for (const [prefix, workspace] of WORKSPACE_BY_PREFIX) {
            if (file.startsWith(prefix)) affected.add(workspace)
        }
    }
    return affected
}

const task = process.argv[2] || 'typecheck'
if (!KNOWN_TASKS.has(task)) {
    console.error(`${TAG} unknown task '${task}'. Known: ${[...KNOWN_TASKS].join(', ')}`)
    process.exit(1)
}

const affected = affectedWorkspaces(changedFiles())

if (affected.size === 0) {
    console.log(`${TAG} no workspace touched — skip verify`)
    process.exit(0)
}

const filters = [...affected]
    .sort()
    .map((workspace) => (LIBRARY_WORKSPACES.has(workspace) ? `${workspace}...` : workspace))

console.log(`${TAG} affected workspaces: ${[...affected].sort().join(', ')}`)

const args = [
    'exec',
    'turbo',
    'run',
    task,
    '--concurrency=1',
    ...filters.map((f) => `--filter=${f}`),
]
console.log(`${TAG} → pnpm ${args.join(' ')}`)

const run = spawnSync('pnpm', args, { stdio: 'inherit' })
process.exit(run.status ?? 1)
