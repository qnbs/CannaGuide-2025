#!/usr/bin/env node
/**
 * Read-only operator aid: fetch GitHub pull request review evidence and pipe it
 * through review-coverage-policy.mjs. Uses `gh api` only; it
 * does not post comments, edit reviews, or fabricate receipts.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const OWNER = 'qnbs'
const REPO = 'CannaGuide-2025'
const SHA = /^[0-9a-f]{40}$/
const GH_MAX_BUFFER = 32 * 1024 * 1024

function fail(message) {
    console.error(message)
    process.exit(1)
}

function runChild(command, args, options) {
    const result = spawnSync(command, args, { encoding: 'utf8', ...options })
    if (result.signal) {
        process.kill(process.pid, result.signal)
        return null
    }
    if (result.error) fail(`Could not run ${command === 'gh' ? 'gh' : 'the review policy'}.`)
    return result
}

function ghJson(pathSuffix, flags = []) {
    const result = runChild('gh', ['api', pathSuffix, ...flags], { maxBuffer: GH_MAX_BUFFER })
    if (!result) return null
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
    if (!Array.isArray(pages) || pages.length === 0 || !pages.every(Array.isArray)) {
        fail('GitHub did not return an array of evidence pages.')
    }
    return pages.flat()
}

const SUPPLEMENT_KEYS = new Set(['headEquivalence', 'secondReviewRequest'])

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
    if (!SHA.test(expectHead)) {
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

function readPull(path) {
    const pull = ghJson(path)
    const head = pull?.head?.sha
    const base = pull?.base?.sha
    if (!SHA.test(head ?? '') || !SHA.test(base ?? '')) fail('Invalid pull request SHAs.')
    return { head, base, fileCount: pull.changed_files }
}

function readChangedFiles(pullPath, fileCount) {
    if (!Number.isInteger(fileCount) || fileCount < 1 || fileCount > 3000) {
        fail('Invalid changed-file count or GitHub file-list limit exceeded.')
    }
    const files = ghApiPages(`${pullPath}/files`)
    const currentPaths = new Set(files.map((entry) => entry?.filename))
    if (files.length !== fileCount || currentPaths.size !== fileCount) {
        fail('GitHub returned an incomplete or duplicate changed-file list.')
    }
    if (files.some((entry) => !isValidFileEntry(entry))) fail('Invalid changed-file entry.')
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

function assertPullUnchanged(path, before) {
    const after = readPull(path)
    if (
        after.head !== before.head ||
        after.base !== before.base ||
        after.fileCount !== before.fileCount
    ) {
        fail('PR changed while collecting evidence; discard and retry when stable.')
    }
    return after.head
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

    const changedFiles = readChangedFiles(pullPath, before.fileCount)
    const rawReviews = ghApiPages(`${pullPath}/reviews`)
    const rawComments = ghApiPages(`${repo}/issues/${pullNumber}/comments`)
    const recheckedHeadSha = assertPullUnchanged(pullPath, before)
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

    const policy = runChild(process.execPath, ['scripts/security/review-coverage-policy.mjs'], {
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        input: JSON.stringify(evidence),
    })

    if (!policy) return
    process.stdout.write(policy.stdout)
    if (policy.status !== 0 && !policy.stdout) console.error('Review policy produced no result.')
    process.exitCode = policy.status ?? 1
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
    main()
}
