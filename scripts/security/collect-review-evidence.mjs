#!/usr/bin/env node
/**
 * Collect GitHub review API evidence for the current PR head and run the
 * operator coverage evaluator. Output is JSON from review-coverage-policy.mjs.
 * This does not create receipts and is not a required CI check.
 */
import { execFileSync } from 'node:child_process'
import { spawnSync } from 'node:child_process'

const OWNER = 'qnbs'
const REPO = 'CannaGuide-2025'
const SHA = /^[0-9a-f]{40}$/

function ghJson(args) {
    const out = execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    return JSON.parse(out)
}

function ghLines(args) {
    return execFileSync('gh', args, { encoding: 'utf8' })
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
}

function parsePullNumber(argv) {
    const arg = argv[2]
    if (!arg || !/^\d+$/.test(arg)) {
        console.error('Usage: node scripts/security/collect-review-evidence.mjs <PR_NUMBER>')
        process.exit(2)
    }
    return Number(arg)
}

const pullNumber = parsePullNumber(process.argv)
const headSha = ghJson([
    'pr',
    'view',
    String(pullNumber),
    '--repo',
    `${OWNER}/${REPO}`,
    '--json',
    'headRefOid',
]).headRefOid

if (!SHA.test(headSha ?? '')) {
    console.error('Could not read a full head SHA for PR', pullNumber)
    process.exit(1)
}

const recheckedHeadSha = ghJson([
    'pr',
    'view',
    String(pullNumber),
    '--repo',
    `${OWNER}/${REPO}`,
    '--json',
    'headRefOid',
]).headRefOid

if (recheckedHeadSha !== headSha) {
    console.error('PR head changed while collecting evidence; retry when stable.')
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

const reviews = JSON.parse(
    execFileSync(
        'gh',
        ['api', `repos/${OWNER}/${REPO}/pulls/${pullNumber}/reviews`, '--paginate'],
        { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
    ),
)

const issueComments = JSON.parse(
    execFileSync(
        'gh',
        ['api', `repos/${OWNER}/${REPO}/issues/${pullNumber}/comments`, '--paginate'],
        { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    ),
)

const evidence = {
    pullNumber,
    headSha,
    recheckedHeadSha,
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
    process.exit(policy.status ?? 1)
}