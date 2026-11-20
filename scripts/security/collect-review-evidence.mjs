#!/usr/bin/env node
/**
 * Read-only operator aid: fetch GitHub pull request review evidence and pipe it
 * through review-coverage-policy.mjs. Uses `gh pr view` and `gh api` only; it
 * does not post comments, edit reviews, or fabricate receipts.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const OWNER = 'qnbs'
const REPO = 'CannaGuide-2025'
const SHA = /^[0-9a-f]{40}$/

function ghJson(args) {
    const out = execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    return JSON.parse(out)
}

function ghApiJson(pathSuffix) {
    const out = execFileSync(
        'gh',
        ['api', pathSuffix, '--paginate'],
        { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    )
    return JSON.parse(out)
}

function parseArgs(argv) {
    let pullNumber = null
    let expectHead = null
    for (let i = 2; i < argv.length; i += 1) {
        const arg = argv[i]
        if (arg === '--expect-head' && argv[i + 1]) {
            expectHead = argv[i + 1].toLowerCase()
            i += 1
            continue
        }
        if (/^\d+$/.test(arg)) {
            pullNumber = Number(arg)
        }
    }
    if (!pullNumber) {
        console.error(
            'Usage: node scripts/security/collect-review-evidence.mjs <PR_NUMBER> [--expect-head <40-char-sha>]',
        )
        process.exit(2)
    }
    if (expectHead !== null && !SHA.test(expectHead)) {
        console.error('--expect-head must be a full lowercase git SHA')
        process.exit(2)
    }
    return { pullNumber, expectHead }
}

function readStableHead(pullNumber) {
    const headBefore = ghJson([
        'pr',
        'view',
        String(pullNumber),
        '--repo',
        `${OWNER}/${REPO}`,
        '--json',
        'headRefOid',
    ]).headRefOid
    const headAfter = ghJson([
        'pr',
        'view',
        String(pullNumber),
        '--repo',
        `${OWNER}/${REPO}`,
        '--json',
        'headRefOid',
    ]).headRefOid
    if (!SHA.test(headBefore ?? '') || headBefore !== headAfter) {
        console.error('PR head missing or changed while collecting evidence; retry when stable.')
        process.exit(1)
    }
    return headBefore
}

/**
 * Drop reviews and issue comments that do not belong to this pull. The evaluator
 * rejects them anyway; filtering here avoids accidental cross-PR paste-in.
 */
export function filterEvidenceForPull(pullNumber, reviews, issueComments) {
    const pullUrl = `https://api.github.com/repos/${OWNER}/${REPO}/pulls/${pullNumber}`
    const issueUrl = `https://api.github.com/repos/${OWNER}/${REPO}/issues/${pullNumber}`
    const stableReviews = (Array.isArray(reviews) ? reviews : [])
        .filter((review) => review?.pull_request_url === pullUrl)
        .sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0))
    const stableComments = (Array.isArray(issueComments) ? issueComments : [])
        .filter((comment) => comment?.issue_url === issueUrl)
        .sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0))
    return { reviews: stableReviews, issueComments: stableComments }
}

function main() {
    const { pullNumber, expectHead } = parseArgs(process.argv)
    const headSha = readStableHead(pullNumber)

    if (expectHead !== null && headSha !== expectHead) {
        console.error(`Live head ${headSha} does not match --expect-head ${expectHead}`)
        process.exit(1)
    }

    const { baseRefOid: baseSha } = ghJson([
        'pr',
        'view',
        String(pullNumber),
        '--repo',
        `${OWNER}/${REPO}`,
        '--json',
        'baseRefOid',
    ])

    if (!SHA.test(baseSha ?? '')) {
        console.error('Could not read base SHA for PR', pullNumber)
        process.exit(1)
    }

    const changedFiles = ghJson([
        'api',
        `repos/${OWNER}/${REPO}/compare/${baseSha}...${headSha}`,
        '--jq',
        '.files | map(.filename)',
    ])

    const rawReviews = ghApiJson(`repos/${OWNER}/${REPO}/pulls/${pullNumber}/reviews`)
    const rawComments = ghApiJson(`repos/${OWNER}/${REPO}/issues/${pullNumber}/comments`)
    const { reviews, issueComments } = filterEvidenceForPull(pullNumber, rawReviews, rawComments)

    const evidence = {
        pullNumber,
        headSha,
        recheckedHeadSha: headSha,
        changedFiles,
        reviews,
        issueComments,
        now: new Date().toISOString(),
    }

    const policy = spawnSync(
        process.execPath,
        ['scripts/security/review-coverage-policy.mjs'],
        {
            cwd: new URL('../..', import.meta.url).pathname,
            input: JSON.stringify(evidence),
            encoding: 'utf8',
        },
    )

    process.stdout.write(policy.stdout ?? '')
    if (policy.status !== 0) {
        process.stderr.write(policy.stderr ?? '')
        process.exit(policy.status ?? 1)
    }
}

const isDirectRun =
    process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
    main()
}