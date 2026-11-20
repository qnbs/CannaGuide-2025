#!/usr/bin/env node
/**
 * Read-only operator aid: fetch GitHub pull request review evidence and pipe it
 * through review-coverage-policy.mjs. Uses `gh pr view` and `gh api` only; it
 * does not post comments, edit reviews, or fabricate receipts.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const OWNER = 'qnbs'
const REPO = 'CannaGuide-2025'
const SHA = /^[0-9a-f]{40}$/
const GH_MAX_BUFFER = 32 * 1024 * 1024

function exitFromExecError(error) {
    if (typeof error?.status === 'number' && error.status !== 0) {
        process.exit(error.status)
    }
    if (error?.signal) {
        process.exit(1)
    }
    throw error
}

function ghStdout(args) {
    try {
        return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: GH_MAX_BUFFER })
    } catch (error) {
        exitFromExecError(error)
    }
    return ''
}

function ghJson(args) {
    return JSON.parse(ghStdout(args))
}

/** Combine newline-delimited JSON arrays from `gh api --paginate`. */
export function combinePaginatedJsonArrays(stdout) {
    const arrays = []
    for (const line of stdout.trim().split('\n')) {
        if (line.trim() === '') continue
        const parsed = JSON.parse(line)
        if (Array.isArray(parsed)) arrays.push(...parsed)
        else arrays.push(parsed)
    }
    return arrays
}

function ghApiJson(pathSuffix) {
    const out = ghStdout(['api', pathSuffix, '--paginate'])
    return combinePaginatedJsonArrays(out)
}

const SUPPLEMENT_KEYS = new Set(['headEquivalence', 'secondReviewRequest'])

/** Optional JSON file may supply headEquivalence and secondReviewRequest only. */
export function readEvidenceSupplement(filePath) {
    let parsed
    try {
        parsed = JSON.parse(readFileSync(filePath, 'utf8'))
    } catch {
        console.error('--supplement must be a readable JSON file')
        process.exit(2)
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        console.error('--supplement JSON must be an object')
        process.exit(2)
    }
    const supplement = {}
    for (const key of Object.keys(parsed)) {
        if (!SUPPLEMENT_KEYS.has(key)) {
            console.error(`--supplement ignores unknown key: ${key}`)
            process.exit(2)
        }
        supplement[key] = parsed[key]
    }
    return supplement
}

function parseArgs(argv) {
    let pullNumber = null
    let expectHead = null
    let supplementPath = null
    for (let i = 2; i < argv.length; i += 1) {
        const arg = argv[i]
        if (arg === '--expect-head' && argv[i + 1]) {
            expectHead = argv[i + 1].toLowerCase()
            i += 1
            continue
        }
        if (arg === '--supplement' && argv[i + 1]) {
            supplementPath = argv[i + 1]
            i += 1
            continue
        }
        if (/^\d+$/.test(arg)) {
            pullNumber = Number(arg)
        }
    }
    if (!pullNumber) {
        console.error(
            'Usage: node scripts/security/collect-review-evidence.mjs <PR_NUMBER> [--expect-head <40-char-sha>] [--supplement <path.json>]',
        )
        process.exit(2)
    }
    if (expectHead !== null && !SHA.test(expectHead)) {
        console.error('--expect-head must be a full lowercase git SHA')
        process.exit(2)
    }
    const supplement =
        supplementPath === null ? {} : readEvidenceSupplement(resolve(supplementPath))
    return { pullNumber, expectHead, supplement }
}

function readPrHead(pullNumber) {
    const headRefOid = ghJson([
        'pr',
        'view',
        String(pullNumber),
        '--repo',
        `${OWNER}/${REPO}`,
        '--json',
        'headRefOid',
    ]).headRefOid
    if (!SHA.test(headRefOid ?? '')) {
        console.error('PR head missing or invalid for PR', pullNumber)
        process.exit(1)
    }
    return headRefOid
}

function readStableHead(pullNumber) {
    const headBefore = readPrHead(pullNumber)
    const headAfter = readPrHead(pullNumber)
    if (headBefore !== headAfter) {
        console.error('PR head changed between consecutive reads; retry when stable.')
        process.exit(1)
    }
    return headBefore
}

/** Include prior paths on rename so high-risk renames cannot downgrade risk. */
export function changedFilesFromPullFiles(pullFiles) {
    const names = new Set()
    for (const entry of pullFiles) {
        if (typeof entry?.filename === 'string') names.add(entry.filename)
        if (typeof entry?.previous_filename === 'string') names.add(entry.previous_filename)
    }
    return [...names].sort()
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

export function assertHeadUnchanged(pullNumber, headSha) {
    const current = readPrHead(pullNumber)
    if (current !== headSha) {
        console.error('PR head advanced while collecting evidence; discard and retry on stable head.')
        process.exit(1)
    }
    return current
}

function main() {
    const { pullNumber, expectHead, supplement } = parseArgs(process.argv)
    const headSha = readStableHead(pullNumber)

    if (expectHead !== null && headSha !== expectHead) {
        console.error(`Live head ${headSha} does not match --expect-head ${expectHead}`)
        process.exit(1)
    }

    const pullFiles = ghApiJson(`repos/${OWNER}/${REPO}/pulls/${pullNumber}/files`)
    const changedFiles = changedFilesFromPullFiles(pullFiles)

    const rawReviews = ghApiJson(`repos/${OWNER}/${REPO}/pulls/${pullNumber}/reviews`)
    const rawComments = ghApiJson(`repos/${OWNER}/${REPO}/issues/${pullNumber}/comments`)
    const recheckedHeadSha = assertHeadUnchanged(pullNumber, headSha)
    const { reviews, issueComments } = filterEvidenceForPull(pullNumber, rawReviews, rawComments)

    const evidence = {
        pullNumber,
        headSha,
        recheckedHeadSha,
        changedFiles,
        reviews,
        issueComments,
        now: new Date().toISOString(),
        ...supplement,
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