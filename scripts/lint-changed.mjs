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

function getChangedFiles(baseRef) {
    const files = new Set()

    if (baseRef) {
        let diffTarget = ''
        if (baseRef === 'HEAD~1') {
            diffTarget = 'HEAD~1..HEAD'
        } else {
            const mergeBase = tryRunGit(['merge-base', baseRef, 'HEAD'])
            if (mergeBase) {
                diffTarget = `${mergeBase}...HEAD`
            }
        }

        if (diffTarget) {
            const committedDiff = tryRunGit([
                'diff',
                '--name-only',
                '-z',
                '--diff-filter=ACMRTUXB',
                diffTarget,
            ])

            committedDiff
                .split('\0')
                .map((file) => file.trim())
                .filter(Boolean)
                .forEach((file) => files.add(file))
        }
    }

    const stagedDiff = tryRunGit([
        'diff',
        '--name-only',
        '-z',
        '--cached',
        '--diff-filter=ACMRTUXB',
    ])

    stagedDiff
        .split('\0')
        .map((file) => file.trim())
        .filter(Boolean)
        .forEach((file) => files.add(file))

    const workingTreeDiff = tryRunGit(['diff', '--name-only', '-z', '--diff-filter=ACMRTUXB'])

    workingTreeDiff
        .split('\0')
        .map((file) => file.trim())
        .filter(Boolean)
        .forEach((file) => files.add(file))

    // New files are in no diff yet, but the pre-commit hook lints them once staged.
    // All lists use -z: without it git quotes paths with spaces or non-ASCII
    // bytes ("caf\303\251.ts"), and the quoted name matches no extension.
    const untracked = tryRunGit(['ls-files', '-z', '--others', '--exclude-standard'])

    untracked
        .split('\0')
        .map((file) => file.trim())
        .filter(Boolean)
        .forEach((file) => files.add(file))

    return [...files]
        .filter((file) => {
            const extension = file.slice(file.lastIndexOf('.'))
            return LINT_EXTENSIONS.has(extension)
        })
        .filter((file) => existsSync(file))
}

function main() {
    const inGitRepo = tryRunGit(['rev-parse', '--is-inside-work-tree']) === 'true'
    if (!inGitRepo) {
        console.log('[lint:changed] Not inside a git repository. Skipping.')
        process.exit(0)
    }

    const baseRef = resolveBaseRef()
    const changedFiles = getChangedFiles(baseRef)

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
