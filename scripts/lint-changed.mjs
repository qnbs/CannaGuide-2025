import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const LINT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])

function runGit(args) {
    const result = spawnSync('git', args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        shell: false,
    })

    if (result.status !== 0) {
        throw new Error(`git ${args.join(' ')} failed`)
    }

    return result.stdout.trim()
}

function tryRunGit(args) {
    try {
        return runGit(args)
    } catch {
        return ''
    }
}

function hasRef(ref) {
    return tryRunGit(['rev-parse', '--verify', '--quiet', ref]) !== ''
}

function resolveBaseRef() {
    if (process.env.LINT_BASE_REF) {
        return process.env.LINT_BASE_REF
    }

    if (process.env.GITHUB_BASE_REF) {
        return `origin/${process.env.GITHUB_BASE_REF}`
    }

    if (hasRef('origin/main')) {
        return 'origin/main'
    }

    if (hasRef('main')) {
        return 'main'
    }

    if (hasRef('HEAD~1')) {
        return 'HEAD~1'
    }

    return ''
}

/**
 * A NUL-separated path list exactly as git writes it. Nothing is trimmed: with
 * -z git neither quotes nor pads names, and a name may itself start or end
 * with whitespace. A failed listing throws: an empty list would read as
 * "nothing changed" and let the run pass without linting anything.
 */
function listGit(args) {
    const result = spawnSync('git', args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        shell: false,
    })
    if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed`)
    return result.stdout.split('\0').filter(Boolean)
}

/**
 * The committed range this branch adds on top of `baseRef`. Fails closed: with
 * no base, or no merge base, the branch's commits would silently go unlinted
 * and the run would still pass. CI checks out the full history (fetch-depth 0),
 * so there it always resolves.
 */
function committedRange(baseRef) {
    if (!baseRef) {
        throw new Error('no base ref (origin/main, main or HEAD~1) found: set LINT_BASE_REF')
    }
    if (baseRef === 'HEAD~1') return 'HEAD~1..HEAD'
    const mergeBase = tryRunGit(['merge-base', baseRef, 'HEAD'])
    if (!mergeBase) {
        throw new Error(
            `no merge base between ${baseRef} and HEAD: run \`git fetch origin main\` or set LINT_BASE_REF`,
        )
    }
    return `${mergeBase}...HEAD`
}

function getChangedFiles(baseRef) {
    const files = new Set()

    listGit([
        'diff',
        '--name-only',
        '-z',
        '--diff-filter=ACMRTUXB',
        committedRange(baseRef),
    ]).forEach((file) => files.add(file))

    // Staged and unstaged changes, then new files: they are in no diff yet, but
    // the pre-commit hook lints them once staged. All lists use -z: without it
    // git quotes paths with spaces or non-ASCII bytes ("caf\303\251.ts"), and
    // the quoted name matches no extension.
    for (const args of [
        ['diff', '--name-only', '-z', '--cached', '--diff-filter=ACMRTUXB'],
        ['diff', '--name-only', '-z', '--diff-filter=ACMRTUXB'],
        ['ls-files', '-z', '--others', '--exclude-standard'],
    ]) {
        listGit(args).forEach((file) => files.add(file))
    }

    return [...files]
        .filter((file) => {
            const extension = file.slice(file.lastIndexOf('.'))
            return LINT_EXTENSIONS.has(extension)
        })
        .filter((file) => existsSync(file))
}

/** The changed files, or exit 2 with the reason when the base cannot be resolved. */
function changedFilesOrExit(baseRef) {
    try {
        return getChangedFiles(baseRef)
    } catch (error) {
        console.error(`[lint:changed] ${error instanceof Error ? error.message : String(error)}`)
        return process.exit(2)
    }
}

function main() {
    const inGitRepo = tryRunGit(['rev-parse', '--is-inside-work-tree']) === 'true'
    if (!inGitRepo) {
        console.log('[lint:changed] Not inside a git repository. Skipping.')
        process.exit(0)
    }

    const baseRef = resolveBaseRef()
    const changedFiles = changedFilesOrExit(baseRef)

    if (changedFiles.length === 0) {
        console.log(`[lint:changed] No changed JS/TS files found (base: ${baseRef || 'n/a'}).`)
        process.exit(0)
    }

    console.log(`[lint:changed] Linting ${changedFiles.length} changed files (base: ${baseRef}).`)
    const result = spawnSync(
        'pnpm',
        // The same bar as the pre-commit hook (lint-staged): warnings fail too, so a
        // warning in a file outside the strict scopes is found before the commit.
        ['exec', 'eslint', '--max-warnings', '0', '--no-warn-ignored', '--', ...changedFiles],
        {
            stdio: 'inherit',
            shell: process.platform === 'win32',
        },
    )

    process.exit(result.status ?? 1)
}

main()
