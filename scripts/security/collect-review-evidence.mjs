#!/usr/bin/env node
/**
 * Read-only operator aid: fetch GitHub pull request review evidence and pipe it
 * through review-coverage-policy.mjs. Uses `gh api` only; it
 * does not post comments, edit reviews, or fabricate receipts.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'

import { claudeRunToVerify } from './review-coverage-policy.mjs'

const OWNER = 'qnbs'
const REPO = 'CannaGuide-2025'
const SHA = /^[0-9a-f]{40}$/
const CHILD_TIMEOUT_MS = 120_000
const GH_MAX_BUFFER = 32 * 1024 * 1024
const GH_COMPARE_FILE_LIMIT = 300

function fail(message) {
    console.error(message)
    process.exit(1)
}

function requireEvidence(condition, message) {
    if (!condition) fail(message)
}

function isSha(value) {
    return typeof value === 'string' && SHA.test(value)
}

export function runChild(command, args, options = {}) {
    const result = spawnSync(command, args, {
        encoding: 'utf8',
        timeout: CHILD_TIMEOUT_MS,
        ...options,
    })
    // A timed-out child also reports a signal; keep that distinct from a child
    // which terminated itself so the caller can report the timeout safely.
    if (result.error?.code === 'ETIMEDOUT' || result.error?.code === 'ENOBUFS') return result
    if (result.signal) {
        process.kill(process.pid, result.signal)
        return null
    }
    requireEvidence(!result.error, 'Could not start the evidence collection child process.')
    return result
}

function ghJson(pathSuffix, flags = []) {
    const result = runChild('gh', ['api', pathSuffix, ...flags], { maxBuffer: GH_MAX_BUFFER })
    if (!result) return null
    if (result.error?.code === 'ETIMEDOUT') {
        fail(`GitHub evidence request timed out after ${CHILD_TIMEOUT_MS / 1000} seconds.`)
    }
    if (result.error?.code === 'ENOBUFS') {
        fail(
            'GitHub evidence exceeded the 32 MiB collection limit; use the documented manual evidence fallback.',
        )
    }
    if (result.status !== 0) {
        console.error(`gh failed with exit ${result.status}.`)
        process.exit(result.status ?? 1)
    }
    try {
        return JSON.parse(result.stdout)
    } catch {
        fail('GitHub did not return valid JSON.')
    }
}

function ghApiPages(pathSuffix) {
    const pages = ghJson(pathSuffix, ['--paginate', '--slurp'])
    const message = 'GitHub did not return an array of evidence pages.'
    requireEvidence(Array.isArray(pages), message)
    requireEvidence(pages.length > 0, message)
    requireEvidence(pages.every(Array.isArray), message)
    return pages.flat()
}

const SUPPLEMENT_KEYS = new Set(['headEquivalence', 'secondReviewRequest'])
/**
 * The workflow run the latest Claude review on the head names, reduced to the fields the
 * policy checks, plus that run's own receipt artifact naming the review it posted. Only the
 * run itself can upload that artifact, so a review that merely names the run fails. A run or
 * artifact that cannot be read is left out: it proves nothing, but a planted receipt cannot
 * stop the whole collection.
 */
export function readClaudeRuns(
    repo,
    reviews,
    headSha,
    pullNumber,
    fetchRun = ghRunOrNull,
    fetchReceipt = downloadClaudeReceipt,
) {
    const target = claudeRunToVerify(reviews, headSha, pullNumber)
    if (!target) return {}
    const run = fetchRun(`${repo}/actions/runs/${target.runId}`)
    if (!isPlainObject(run) || run.id !== target.runId) return {}
    return {
        [run.id]: {
            id: run.id,
            path: run.path,
            event: run.event,
            head_branch: run.head_branch,
            repository: run.repository?.full_name,
            head_repository: run.head_repository?.full_name,
            run_attempt: run.run_attempt,
            created_at: run.created_at,
            receipt: fetchReceipt(run.id, target.runAttempt),
        },
    }
}

function ghRunOrNull(pathSuffix) {
    const result = runChild('gh', ['api', pathSuffix], { maxBuffer: GH_MAX_BUFFER })
    if (!result || result.error || result.status !== 0) return null
    try {
        return JSON.parse(result.stdout)
    } catch {
        return null
    }
}

/** The run's `claude-review-receipt-<attempt>` artifact, or null when it cannot be read. */
function downloadClaudeReceipt(runId, runAttempt) {
    const dir = mkdtempSync(join(tmpdir(), 'cg-claude-receipt-'))
    try {
        const name = `claude-review-receipt-${runAttempt}`
        const result = runChild('gh', [
            'run',
            'download',
            String(runId),
            '--repo',
            `${OWNER}/${REPO}`,
            '--name',
            name,
            '--dir',
            dir,
        ])
        if (!result || result.error || result.status !== 0) return null
        const parsed = JSON.parse(readFileSync(join(dir, 'claude-review-receipt.json'), 'utf8'))
        return isPlainObject(parsed) ? parsed : null
    } catch {
        return null
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
}

function isPlainObject(value) {
    if (value === null) return false
    if (typeof value !== 'object') return false
    return !Array.isArray(value)
}

function usageAndExit() {
    console.error(
        'Usage: node scripts/security/collect-review-evidence.mjs <PR_NUMBER> [--expect-head <40-char-sha>] [--supplement <path.json>]',
    )
    process.exit(2)
}

function tryReadFlag(argv, index, flag) {
    if (argv[index] !== flag) return null
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) usageAndExit()
    return { value, skip: 1 }
}

function scanArgv(argv) {
    let pullNumber = null
    let expectHead = null
    let supplementPath = null
    for (let i = 2; i < argv.length; i += 1) {
        const expect = tryReadFlag(argv, i, '--expect-head')
        if (expect) {
            if (expectHead !== null) usageAndExit()
            expectHead = expect.value
            i += expect.skip
            continue
        }
        const supplement = tryReadFlag(argv, i, '--supplement')
        if (supplement) {
            if (supplementPath !== null) usageAndExit()
            supplementPath = supplement.value
            i += supplement.skip
            continue
        }
        if (pullNumber !== null || !/^[1-9]\d*$/.test(argv[i])) usageAndExit()
        pullNumber = Number(argv[i])
    }
    return { pullNumber, expectHead, supplementPath }
}

function validateExpectHead(expectHead) {
    if (expectHead === null) return
    if (!isSha(expectHead)) {
        console.error('--expect-head must be a full lowercase git SHA')
        process.exit(2)
    }
}

/** Optional JSON file may supply headEquivalence and secondReviewRequest only. */
export function readEvidenceSupplement(filePath) {
    let parsed
    try {
        parsed = JSON.parse(readFileSync(filePath, 'utf8'))
    } catch {
        console.error('--supplement must be a readable JSON file')
        process.exit(2)
    }
    if (!isPlainObject(parsed)) {
        console.error('--supplement JSON must be an object')
        process.exit(2)
    }
    const supplement = {}
    for (const key of Object.keys(parsed)) {
        if (!SUPPLEMENT_KEYS.has(key)) {
            console.error('--supplement contains an unsupported key')
            process.exit(2)
        }
        supplement[key] = parsed[key]
    }
    return supplement
}

function parseArgs(argv) {
    const { pullNumber, expectHead, supplementPath } = scanArgv(argv)
    if (!Number.isSafeInteger(pullNumber)) usageAndExit()
    validateExpectHead(expectHead)
    const supplement =
        supplementPath === null ? {} : readEvidenceSupplement(resolve(supplementPath))
    return { pullNumber, expectHead, supplement }
}

function sourceRefApiPath(head) {
    const sourceRepository = head?.repo?.full_name
    const sourceRef = head?.ref
    requireEvidence(
        typeof sourceRepository === 'string' &&
            /^[^/]+\/[^/]+$/.test(sourceRepository) &&
            typeof sourceRef === 'string' &&
            sourceRef.length > 0,
        'GitHub did not report a valid source repository and branch.',
    )
    const encodedRef = sourceRef.split('/').map(encodeURIComponent).join('/')
    return `repos/${sourceRepository}/git/ref/heads/${encodedRef}`
}

function readPull(path) {
    const pull = ghJson(path)
    const head = pull?.head?.sha
    const base = pull?.base?.sha
    requireEvidence(isSha(head) && isSha(base), 'Invalid pull request head or base SHA.')
    return {
        head,
        base,
        fileCount: pull.changed_files,
        updatedAt: pull.updated_at,
        sourceRefPath: sourceRefApiPath(pull.head),
    }
}

function assertSourceBranchMatchesPull(pull) {
    const sourceRef = ghJson(pull.sourceRefPath)
    requireEvidence(
        isSha(sourceRef?.object?.sha) && sourceRef.object.sha === pull.head,
        'Source branch and pull request heads differ; discard this snapshot and retry when GitHub has synchronized them.',
    )
}

function readChangedFiles({ head, base, fileCount }) {
    requireEvidence(Number.isInteger(fileCount), 'GitHub did not report an integer file count.')
    requireEvidence(fileCount > 0, 'GitHub reported an empty changed-file list.')
    requireEvidence(fileCount <= GH_COMPARE_FILE_LIMIT, 'GitHub compare file-list limit exceeded.')
    // GitHub sends the file list on page one, regardless of the commit page size.
    const comparison = ghJson(`repos/${OWNER}/${REPO}/compare/${base}...${head}?per_page=1`)
    const files = comparison?.files
    requireEvidence(Array.isArray(files), 'GitHub comparison did not return a changed-file list.')
    requireEvidence(files.every(isValidFileEntry), 'Invalid changed-file entry.')
    const currentPaths = new Set(files.map((entry) => entry.filename))
    const message = 'GitHub returned an incomplete or duplicate changed-file list.'
    requireEvidence(files.length === fileCount, message)
    requireEvidence(currentPaths.size === fileCount, message)
    return changedFilesFromPullFiles(files)
}

function isValidFileEntry(entry) {
    if (typeof entry?.filename !== 'string' || !entry.filename) return false
    if (entry.status !== 'renamed') return true
    return typeof entry.previous_filename === 'string' && Boolean(entry.previous_filename)
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
export function filterEvidenceForPull(pullNumber, reviews, issueComments, reviewComments = []) {
    const pullUrl = `https://api.github.com/repos/${OWNER}/${REPO}/pulls/${pullNumber}`
    const issueUrl = `https://api.github.com/repos/${OWNER}/${REPO}/issues/${pullNumber}`
    const stableReviews = (Array.isArray(reviews) ? reviews : [])
        .filter((review) => review?.pull_request_url === pullUrl)
        .sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0))
    const stableComments = (Array.isArray(issueComments) ? issueComments : [])
        .filter((comment) => comment?.issue_url === issueUrl)
        .sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0))
    const stableReviewComments = (Array.isArray(reviewComments) ? reviewComments : [])
        .filter((comment) => comment?.pull_request_url === pullUrl)
        .sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0))
    return {
        reviews: stableReviews,
        issueComments: stableComments,
        reviewComments: stableReviewComments,
    }
}

function assertPullUnchanged(path, before) {
    const after = readPull(path)
    const unchanged = Object.entries(before).every(([key, value]) => after[key] === value)
    requireEvidence(
        unchanged,
        'PR changed while collecting evidence; discard and retry when stable.',
    )
    return after.head
}

function canonicalJson(value) {
    if (Array.isArray(value)) return value.map(canonicalJson)
    if (isPlainObject(value)) {
        return Object.fromEntries(
            Object.keys(value)
                .sort()
                .map((key) => [key, canonicalJson(value[key])]),
        )
    }
    return value
}

function assertEvidenceUnchanged(first, second) {
    requireEvidence(
        JSON.stringify(canonicalJson(first)) === JSON.stringify(canonicalJson(second)),
        'Review evidence changed while collecting it; discard this snapshot and retry when stable.',
    )
}

function main() {
    const { pullNumber, expectHead, supplement } = parseArgs(process.argv)
    const repo = `repos/${OWNER}/${REPO}`
    const pullPath = `${repo}/pulls/${pullNumber}`
    const before = readPull(pullPath)
    const headSha = before.head

    if (expectHead !== null && headSha !== expectHead) {
        fail(`Live head ${headSha} does not match --expect-head ${expectHead}`)
    }

    // The PR API head alone can lag the source branch after a push. Verify both
    // independently before and after collecting the evidence snapshot.
    assertSourceBranchMatchesPull(before)
    const changedFiles = readChangedFiles(before)
    const rawReviews = ghApiPages(`${pullPath}/reviews`)
    const rawComments = ghApiPages(`${repo}/issues/${pullNumber}/comments`)
    const rawReviewComments = ghApiPages(`${pullPath}/comments`)
    assertPullUnchanged(pullPath, before)
    assertSourceBranchMatchesPull(before)
    const { reviews, issueComments, reviewComments } = filterEvidenceForPull(
        pullNumber,
        rawReviews,
        rawComments,
        rawReviewComments,
    )
    // Claude's run and receipt artifact are network reads too. They come before the
    // confirmation pass, so a head that moves or a review dismissed meanwhile voids the
    // snapshot instead of reaching the policy.
    const claudeRuns = readClaudeRuns(repo, reviews, headSha, pullNumber)

    // A second read catches reviews being dismissed and receipt comments being
    // edited while the first paginated snapshot was in flight. The final PR
    // metadata read also checks updated_at after this second evidence read.
    const confirmedReviews = ghApiPages(`${pullPath}/reviews`)
    const confirmedComments = ghApiPages(`${repo}/issues/${pullNumber}/comments`)
    const confirmedReviewComments = ghApiPages(`${pullPath}/comments`)
    const recheckedHeadSha = assertPullUnchanged(pullPath, before)
    assertSourceBranchMatchesPull(before)
    const confirmed = filterEvidenceForPull(
        pullNumber,
        confirmedReviews,
        confirmedComments,
        confirmedReviewComments,
    )
    assertEvidenceUnchanged({ reviews, issueComments, reviewComments }, confirmed)

    const evidence = {
        pullNumber,
        headSha,
        recheckedHeadSha,
        changedFiles,
        reviews,
        issueComments,
        reviewComments,
        claudeRuns,
        now: new Date().toISOString(),
        ...supplement,
    }

    const policy = runChild(process.execPath, ['scripts/security/review-coverage-policy.mjs'], {
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        input: JSON.stringify(evidence),
    })

    if (!policy) return
    if (policy.error?.code === 'ETIMEDOUT') {
        fail(`Review coverage policy timed out after ${CHILD_TIMEOUT_MS / 1000} seconds.`)
    }
    requireEvidence(!policy.error, 'Could not run the review coverage policy.')
    process.stdout.write(policy.stdout)
    if (policy.status !== 0 && !policy.stdout) console.error('Review policy produced no result.')
    process.exitCode = policy.status ?? 1
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
    main()
}
