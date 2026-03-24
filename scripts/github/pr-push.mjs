#!/usr/bin/env node

/**
 * PR-based push workflow for solo-dev with enforce_admins branch protection.
 *
 * Usage:
 *   node scripts/github/pr-push.mjs                    # auto-generates branch name from HEAD commit
 *   node scripts/github/pr-push.mjs "feat/my-feature"  # explicit branch name
 *
 * Flow:
 *   1. Validates clean working tree, current branch is main, and GitHub CLI auth
 *   2. Ensures local main matches origin/main
 *   3. Verifies HEAD commit is cryptographically signed
 *   4. Creates a timestamped feature branch from HEAD
 *   5. Pushes branch to origin
 *   6. Opens a PR targeting main with auto-merge enabled
 *   7. Waits for CI status checks to pass
 *   8. PR auto-merges (squash) once checks pass
 *   9. Cleans up local branch and resets main to origin/main
 *
 * Requirements:
 *   - gh CLI authenticated with repo scope
 *   - Git SSH signing configured
 *   - No uncommitted changes
 */

import { spawnSync } from 'node:child_process'

const run = (cmd, args, opts = {}) => {
    const result = spawnSync(cmd, args, {
        encoding: 'utf8',
        stdio: opts.silent ? ['ignore', 'pipe', 'pipe'] : 'inherit',
        shell: false,
        ...opts,
    })
    if (!opts.allowFail && result.status !== 0) {
        const stderr = result.stderr?.trim() || ''
        console.error(
            `\x1b[31m✖ ${cmd} ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}\x1b[0m`,
        )
        process.exit(1)
    }
    return result
}

const capture = (cmd, args) => {
    const r = run(cmd, args, { silent: true, allowFail: true })
    return r.status === 0 ? r.stdout.trim() : ''
}

// ── Pre-flight checks ───────────────────────────────────────────────────

const status = capture('git', ['status', '--porcelain'])
if (status) {
    console.error('\x1b[31m✖ Working tree is dirty. Commit or stash changes first.\x1b[0m')
    process.exit(1)
}

const currentBranch = capture('git', ['branch', '--show-current'])
if (currentBranch !== 'main') {
    console.error(`\x1b[31m✖ Must be on main branch (currently on ${currentBranch}).\x1b[0m`)
    process.exit(1)
}

const ghAuth = run('gh', ['auth', 'status'], { silent: true, allowFail: true })
if (ghAuth.status !== 0) {
    console.error('\x1b[31m✖ gh CLI not authenticated. Run: gh auth login\x1b[0m')
    process.exit(1)
}

// Ensure local main is not behind origin
run('git', ['fetch', 'origin', 'main'], { silent: true })
const behindCount = capture('git', ['rev-list', '--count', 'HEAD..origin/main'])
if (behindCount !== '0') {
    console.error('\x1b[31m✖ Local main is behind origin/main. Run: git pull --ff-only\x1b[0m')
    process.exit(1)
}

const aheadCount = capture('git', ['rev-list', '--count', 'origin/main..HEAD'])
if (aheadCount === '0') {
    console.error('\x1b[31m✖ No local commits to push (main is up-to-date with origin).\x1b[0m')
    process.exit(1)
}

// Verify HEAD commit is cryptographically signed
// G=Good, U=Unknown signer (valid sig), E=Can't check (Codespaces GPG, key not in local keyring)
// All indicate the commit IS signed. Reject N=No signature, B=Bad signature.
const sigStatus = capture('git', ['log', '-1', '--format=%G?'])
if (!['G', 'U', 'E'].includes(sigStatus)) {
    console.error(
        `\x1b[31m✖ HEAD commit is not cryptographically signed (status: ${sigStatus}). Aborting.\x1b[0m`,
    )
    process.exit(1)
}

// ── Determine branch name ───────────────────────────────────────────────

const commitMsg = capture('git', ['log', '-1', '--format=%s'])
const commitType = commitMsg.match(/^(\w+)(\(.*?\))?:/)?.[1] || 'chore'
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
const explicitName = process.argv[2]
const branchName = explicitName || `${commitType}/pr-${ts}`

console.log(`\x1b[36m→ Branch: ${branchName}\x1b[0m`)

// ── Create branch + push ────────────────────────────────────────────────

run('git', ['checkout', '-b', branchName])
run('git', ['push', '-u', 'origin', branchName])

// ── Create PR with auto-merge ───────────────────────────────────────────

const prTitle = commitMsg
const prBody = [
    `Automated PR via \`scripts/github/pr-push.mjs\`.`,
    '',
    '**Checks required:** `quality` + `ci-status`',
    '**Merge strategy:** squash, auto-merge enabled',
    '',
    `> Branch: \`${branchName}\` → \`main\``,
].join('\n')

console.log('\x1b[36m→ Creating PR...\x1b[0m')
const prResult = run(
    'gh',
    ['pr', 'create', '--base', 'main', '--head', branchName, '--title', prTitle, '--body', prBody],
    { silent: true },
)

const prUrl = prResult.stdout.trim()
const prNumber = prUrl.split('/').pop()
const owner = 'qnbs'
const repoName = 'CannaGuide-2025'
console.log(`\x1b[32m✓ PR created: ${prUrl}\x1b[0m`)

// Enable auto-merge (squash)
const autoMergeResult = run('gh', ['pr', 'merge', prUrl, '--squash', '--auto'], {
    silent: true,
    allowFail: true,
})
if (autoMergeResult.status === 0) {
    console.log('\x1b[32m✓ Auto-merge enabled (squash)\x1b[0m')
} else {
    console.log(
        '\x1b[33m⚠ Auto-merge could not be enabled. The PR will need to be merged manually.\x1b[0m',
    )
}

// ── Wait for CI ─────────────────────────────────────────────────────────

console.log('\x1b[36m→ Waiting for CI checks to start...\x1b[0m')

// Poll until at least one check is registered (GitHub needs a moment)
for (let attempt = 0; attempt < 30; attempt++) {
    const count = capture('gh', [
        'pr',
        'view',
        prUrl,
        '--json',
        'statusCheckRollup',
        '--jq',
        '.statusCheckRollup | length',
    ])
    if (count && Number(count) > 0) {
        break
    }
    if (attempt === 29) {
        console.error(
            '\x1b[31m✖ No CI checks appeared after 90 s. Check repo workflow config.\x1b[0m',
        )
        run('git', ['checkout', 'main'])
        process.exit(1)
    }
    await new Promise((r) => setTimeout(r, 3000))
}

console.log('\x1b[36m→ CI checks detected — watching for completion...\x1b[0m')

// Checks with continue-on-error that should not block the merge
const IGNORABLE_CHECKS = new Set(['PR Fuzzing', 'PR Fuzzing (none)'])

// Poll check status instead of --watch (avoids alternate buffer / TUI issues)
let checksPass = false
for (let attempt = 0; attempt < 120; attempt++) {
    const raw = capture('gh', [
        'pr',
        'view',
        prUrl,
        '--json',
        'statusCheckRollup',
        '--jq',
        '[.statusCheckRollup[] | {n: .name, s: (.status // (if .state == "SUCCESS" or .state == "FAILURE" or .state == "ERROR" then "COMPLETED" else "IN_PROGRESS" end)), c: (.conclusion // .state)}]',
    ])
    if (raw) {
        try {
            const checks = JSON.parse(raw)
            const completed = checks.filter((c) => c.s === 'COMPLETED')
            // Failures in ignorable checks (e.g. ClusterFuzzLite) do not block
            const realFailed = completed.filter(
                (c) =>
                    (c.c === 'FAILURE' ||
                        c.c === 'CANCELLED' ||
                        c.c === 'TIMED_OUT' ||
                        c.c === 'ERROR') &&
                    !IGNORABLE_CHECKS.has(c.n),
            )
            const ignoredFailed = completed.filter(
                (c) => (c.c === 'FAILURE' || c.c === 'ERROR') && IGNORABLE_CHECKS.has(c.n),
            )
            const pending = checks.filter((c) => c.s !== 'COMPLETED')
            const total = checks.length
            const done = completed.length
            process.stdout.write(
                `\r\x1b[36m  ${done}/${total} checks completed` +
                    (realFailed.length ? `, ${realFailed.length} failed` : '') +
                    (ignoredFailed.length ? `, ${ignoredFailed.length} ignored` : '') +
                    (pending.length ? `, ${pending.length} pending` : '') +
                    '\x1b[0m  ',
            )
            if (pending.length === 0 && total > 0) {
                process.stdout.write('\n')
                if (ignoredFailed.length > 0) {
                    console.log(
                        `\x1b[33m  Ignored failures: ${ignoredFailed.map((c) => c.n).join(', ')} (continue-on-error)\x1b[0m`,
                    )
                }
                checksPass = realFailed.length === 0
                break
            }
        } catch {
            /* JSON parse error -- retry */
        }
    }
    await new Promise((r) => setTimeout(r, 10_000))
}

if (!checksPass) {
    console.error('\x1b[31m✖ CI checks failed.\x1b[0m')
    console.log(`\x1b[33m  Branch ${branchName} is still open. Fix and push new commits:\x1b[0m`)
    console.log(`\x1b[33m  git checkout ${branchName} && <fix> && git push\x1b[0m`)
    console.log(
        '\x1b[33m  CI will re-run for the existing PR; re-running this script is not required.\x1b[0m',
    )
    // Switch back to main but don't delete the branch
    run('git', ['checkout', 'main'])
    process.exit(1)
}

console.log('\x1b[32m✓ CI checks passed\x1b[0m')

// ── Wait for merge ──────────────────────────────────────────────────────

console.log('\x1b[36m→ Waiting for auto-merge...\x1b[0m')
let merged = false
for (let i = 0; i < 30; i++) {
    const state = capture('gh', ['pr', 'view', prUrl, '--json', 'state', '--jq', '.state'])
    if (state === 'MERGED') {
        merged = true
        break
    }
    await new Promise((r) => setTimeout(r, 3000))
}

if (!merged) {
    // Resolve any open review threads that may block merge
    console.log('\x1b[36m-> Resolving open review threads...\x1b[0m')
    const threadsRaw = capture('gh', [
        'api',
        'graphql',
        '-f',
        `query=query { repository(owner:"${owner}", name:"${repoName}") { pullRequest(number:${prNumber}) { reviewThreads(first:50) { nodes { id isResolved } } } } }`,
        '--jq',
        '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | .id]',
    ])
    if (threadsRaw) {
        try {
            const threadIds = JSON.parse(threadsRaw)
            for (const tid of threadIds) {
                capture('gh', [
                    'api',
                    'graphql',
                    '-f',
                    `query=mutation { resolveReviewThread(input: {threadId: "${tid}"}) { thread { isResolved } } }`,
                ])
            }
            if (threadIds.length > 0) {
                console.log(`\x1b[32m  Resolved ${threadIds.length} review thread(s)\x1b[0m`)
            }
        } catch {
            /* thread resolution is best-effort */
        }
    }

    // Try merge with admin flag to bypass informational check failures
    console.log('\x1b[36m-> Attempting admin merge...\x1b[0m')
    const mergeResult = run('gh', ['pr', 'merge', prUrl, '--squash', '--admin'], {
        silent: true,
        allowFail: true,
    })
    if (mergeResult.status === 0) {
        merged = true
    } else {
        // Final fallback without admin (in case admin flag is not available)
        const fallback = run('gh', ['pr', 'merge', prUrl, '--squash'], {
            silent: true,
            allowFail: true,
        })
        if (fallback.status === 0) {
            merged = true
        }
    }
}

if (merged) {
    console.log('\x1b[32m✓ PR merged successfully\x1b[0m')
} else {
    console.log('\x1b[33m[WARN] Auto-merge pending. Check PR manually: ' + prUrl + '\x1b[0m')
}

// ── Cleanup ─────────────────────────────────────────────────────────────

run('git', ['checkout', 'main'])
run('git', ['fetch', 'origin', 'main'], { silent: true })
run('git', ['reset', '--hard', 'origin/main'])
run('git', ['branch', '-D', branchName], { allowFail: true, silent: true })

console.log('\x1b[32m✓ Done — main is up to date\x1b[0m')
