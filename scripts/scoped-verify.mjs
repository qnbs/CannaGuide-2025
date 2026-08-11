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
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveLocalTool } from './git-hooks/hook-runtime.mjs'

const TAG = '[verify]'

/** Path prefix -> workspace package name. */
const WORKSPACE_BY_PREFIX = [
    ['apps/web/', '@cannaguide/web'],
    ['apps/desktop/', '@cannaguide/desktop'],
    ['packages/ai-core/', '@cannaguide/ai-core'],
    ['packages/ui/', '@cannaguide/ui'],
]

const ALL_WORKSPACES = WORKSPACE_BY_PREFIX.map(([, workspace]) => workspace)

/**
 * Repo-root inputs that feed every workspace. A change to any of them cannot be
 * scoped to a subset -- the dependency graph, the toolchain or the task pipeline
 * moved under all of them at once -- so it widens the scope to everything.
 */
const SHARED_ROOT_INPUTS = new Set([
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'tsconfig.json',
    'tsconfig.base.json',
    'turbo.json',
    '.npmrc',
    'eslint.config.js',
])

const WORKSPACE_NEUTRAL_PREFIXES = ['.github/', '.husky/', 'docs/', 'scripts/']
const WORKSPACE_NEUTRAL_ROOT_FILES = new Set([
    'AGENTS.md',
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'README.md',
])

/**
 * Changing a library means its consumers have to be re-checked against it, so
 * these are filtered with turbo's leading `...` (the package *and everything
 * that depends on it*) -- not the trailing form, which walks the package's own
 * dependencies instead. Leaf apps are filtered on their own.
 */
const LIBRARY_WORKSPACES = new Set(['@cannaguide/ai-core', '@cannaguide/ui'])

const KNOWN_TASKS = new Set(['typecheck', 'test:run', 'lint', 'build'])

function tryGit(args) {
    const result = spawnSync('git', args, { encoding: 'utf8' })
    if (result.status !== 0) {
        console.warn(`${TAG} git ${args.join(' ')} unavailable: ${(result.stderr || '').trim()}`)
        return null
    }
    return result.stdout.trim()
}

export function changedFiles({ git = tryGit } = {}) {
    // Diff against the merge-base, not against origin/main's tip: otherwise every
    // commit that lands on main while a branch is open widens this branch's scope.
    const base = git(['merge-base', 'origin/main', 'HEAD'])
    if (!base) return null
    const outputs = [
        git(['diff', '--name-only', `${base}...HEAD`, '--']),
        git(['diff', '--name-only', '--cached', '--']),
        git(['diff', '--name-only', '--']),
        git(['ls-files', '--others', '--exclude-standard', '--']),
    ]
    if (outputs.some((output) => output === null)) return null
    return [...new Set(outputs.flatMap((output) => output.split('\n').filter(Boolean)))]
}

export function affectedWorkspaces(files) {
    if (files.some((file) => SHARED_ROOT_INPUTS.has(file))) {
        console.log(`${TAG} shared root input changed -- verifying every workspace`)
        return new Set(ALL_WORKSPACES)
    }

    const affected = new Set()
    for (const file of files) {
        let matched = false
        for (const [prefix, workspace] of WORKSPACE_BY_PREFIX) {
            if (file.startsWith(prefix)) {
                affected.add(workspace)
                matched = true
            }
        }
        if (
            !matched &&
            !WORKSPACE_NEUTRAL_ROOT_FILES.has(file) &&
            !WORKSPACE_NEUTRAL_PREFIXES.some((prefix) => file.startsWith(prefix))
        ) {
            console.log(`${TAG} unrecognized shared input '${file}' -- verifying every workspace`)
            return new Set(ALL_WORKSPACES)
        }
    }
    return affected
}

/**
 * Turbo package microsyntax: a *leading* `...pkg` selects the package and
 * everything that depends on it (its consumers); a *trailing* `pkg...` selects
 * the package and everything it depends on. Library workspaces need the
 * former so a change to the library re-verifies the apps that consume it.
 */
export function buildFilters(affected) {
    return [...affected]
        .sort()
        .map((workspace) => (LIBRARY_WORKSPACES.has(workspace) ? `...${workspace}` : workspace))
}

export function main(task = process.argv[2] || 'typecheck') {
    if (!KNOWN_TASKS.has(task)) {
        console.error(`${TAG} unknown task '${task}'. Known: ${[...KNOWN_TASKS].join(', ')}`)
        return 1
    }

    const files = changedFiles()
    if (files === null) {
        console.warn(`${TAG} change scope is unavailable -- verifying every workspace serially`)
    }
    const affected = files === null ? new Set(ALL_WORKSPACES) : affectedWorkspaces(files)

    if (affected.size === 0) {
        console.log(`${TAG} no workspace touched -- skip verify`)
        return 0
    }

    const filters = buildFilters(affected)

    console.log(`${TAG} affected workspaces: ${[...affected].sort().join(', ')}`)

    const args = ['run', task, '--concurrency=1', ...filters.map((f) => `--filter=${f}`)]
    const turbo = resolveLocalTool('turbo')
    console.log(`${TAG} -> ${turbo.displayPath} ${args.join(' ')}`)

    // Direct local execution is intentional. pnpm 11 defaults verify-deps-before-run
    // to "install", which can turn a hook into an implicit workspace install after a
    // lockfile merge. The hook runner verifies dependency synchronization first.
    const run = spawnSync(turbo.command, [...turbo.argsPrefix, ...args], {
        stdio: 'inherit',
        shell: false,
    })
    return run.status ?? 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = main()
}
