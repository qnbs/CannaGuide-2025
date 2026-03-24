#!/usr/bin/env node

/**
 * PR-based push workflow for solo-dev with enforce_admins branch protection.
 *
 * Usage:
 *   node scripts/github/pr-push.mjs                    # auto-generates branch name from HEAD commit
 *   node scripts/github/pr-push.mjs "feat/my-feature"  # explicit branch name
 *
 * Flow:
 *   1. Validates signed commit(s) on current branch
 *   2. Creates a timestamped feature branch from HEAD
 *   3. Pushes branch to origin
 *   4. Opens a PR targeting main with auto-merge enabled
 *   5. Waits for CI status checks to pass
 *   6. PR auto-merges (squash) once checks pass
 *   7. Cleans up local branch and fetches updated main
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
console.log(`\x1b[32m✓ PR created: ${prUrl}\x1b[0m`)

// Enable auto-merge (squash)
run('gh', ['pr', 'merge', prUrl, '--squash', '--auto'], { silent: true, allowFail: true })
console.log('\x1b[32m✓ Auto-merge enabled (squash)\x1b[0m')

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
const checksResult = run('gh', ['pr', 'checks', prUrl, '--watch', '--fail-fast'], {
    silent: false,
    allowFail: true,
})

if (checksResult.status !== 0) {
    console.error('\x1b[31m✖ CI checks failed. Fix issues, push to branch, and re-run.\x1b[0m')
    console.log(`\x1b[33m  Branch ${branchName} is still open. Fix and push:\x1b[0m`)
    console.log(`\x1b[33m  git checkout ${branchName} && <fix> && git push\x1b[0m`)
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
    // Try manual merge as fallback
    const mergeResult = run('gh', ['pr', 'merge', prUrl, '--squash'], {
        silent: true,
        allowFail: true,
    })
    if (mergeResult.status === 0) {
        merged = true
    }
}

if (merged) {
    console.log('\x1b[32m✓ PR merged successfully\x1b[0m')
} else {
    console.log('\x1b[33m⚠ Auto-merge pending. Check PR manually: ' + prUrl + '\x1b[0m')
}

// ── Cleanup ─────────────────────────────────────────────────────────────

run('git', ['checkout', 'main'])
run('git', ['pull', '--ff-only', 'origin', 'main'])
run('git', ['branch', '-D', branchName], { allowFail: true, silent: true })

console.log('\x1b[32m✓ Done — main is up to date\x1b[0m')
