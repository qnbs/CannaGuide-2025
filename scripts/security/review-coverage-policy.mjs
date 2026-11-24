import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const REVIEWERS = new Map([
    ['coderabbitai[bot]', 'CodeRabbit'],
    ['codeant-ai[bot]', 'CodeAnt'],
    ['chatgpt-codex-connector[bot]', 'Codex'],
    ['sourcery-ai[bot]', 'Sourcery'],
])
const COMPLETED_REVIEW_STATES = new Set(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED'])
const UNAVAILABLE_RESULTS = new Set(['rate_limited', 'timed_out', 'skipped', 'silent'])
const SHA = /^[0-9a-f]{40}$/
const DIGEST = /^[0-9a-f]{64}$/
const HEAD_EQUIVALENCE_VERSION = 2
/** Pulls in this repository target `main`; a proof against any other base does not count. */
const HEAD_EQUIVALENCE_BASE_REF = 'origin/main'
const API_ROOT = 'https://api.github.com/repos/qnbs/CannaGuide-2025'
const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
/** Until merged, PR #857 stays on formal-review-only coverage (no receipt or low-risk fallback). */
const TRANSITION_PULL_NUMBER = 857

const TRUST_BOUNDARY_DOC_PATHS = new Set([
    'docs/GITHUB-SETTINGS-GUIDE.md',
    'docs/DEVOPS-GATES.md',
    'docs/release-process.md',
    'docs/HOUSEKEEPING.md',
])

function timestamp(value) {
    const parsed = Date.parse(value ?? '')
    return Number.isFinite(parsed) ? parsed : null
}

function compareLatest(a, b, dateField) {
    const timeA = timestamp(a[dateField]) ?? timestamp(a.created_at) ?? 0
    const timeB = timestamp(b[dateField]) ?? timestamp(b.created_at) ?? 0
    if (timeA !== timeB) return timeA - timeB
    return Number(a.id ?? 0) - Number(b.id ?? 0)
}

function isReviewBot(user, login) {
    return user?.login === login && user?.type === 'Bot'
}

function parseCodexReceipt(comment, headSha, pullNumber) {
    if (
        !isReviewBot(comment?.user, 'chatgpt-codex-connector[bot]') ||
        comment.issue_url !== `${API_ROOT}/issues/${pullNumber}`
    )
        return null
    const body = comment?.body
    if (typeof body !== 'string') return null

    const summaryMarker = '<!-- codex-pull-request-review-summary -->'
    const statePrefix = '<!-- codex-review-state:v1 '
    if (body.split(summaryMarker).length !== 2 || body.split(statePrefix).length !== 2) return null
    const match = body.match(/<!-- codex-review-state:v1 (\{[^\r\n]*\}) -->/)
    if (!match || body.indexOf(summaryMarker) > body.indexOf(match[0])) return null

    let payload
    try {
        payload = JSON.parse(match[1])
    } catch {
        return null
    }
    const review = payload?.code_review
    if (
        review?.commit_sha !== headSha ||
        !SHA.test(review.commit_sha) ||
        review.status !== 'completed' ||
        typeof review.has_any_findings !== 'boolean' ||
        typeof review.has_unresolved_findings !== 'boolean'
    ) {
        return null
    }
    if (!timestamp(comment.created_at)) return null
    return {
        provider: 'Codex',
        login: 'chatgpt-codex-connector[bot]',
        commitSha: review.commit_sha,
        hasAnyFindings: review.has_any_findings,
        hasUnresolvedFindings: review.has_unresolved_findings,
        createdAt: comment.created_at,
        source: 'structured_issue_comment_receipt',
    }
}

const CODERABBIT_LOGIN = 'coderabbitai[bot]'
const CODERABBIT_SUMMARY_MARKER =
    '<!-- This is an auto-generated comment: summarize by coderabbit.ai -->'
const CODERABBIT_COVERAGE_PREFIX = '<!-- final_review_risk_coverage:'

/**
 * Proof from scripts/security/review-head-equivalence.mjs that the head only merged the
 * base branch (`origin/main`) into an earlier reviewed head: every first-parent commit
 * after that head is a two-parent merge continuing the pull branch with a base-branch
 * commit, each merge is git's clean automatic merge of its parents (same tree id), and the
 * pull's changed lines hash the same on both heads. Anything else fails closed (null).
 */
function parseHeadEquivalence(proof, headSha) {
    if (!proof || typeof proof !== 'object') return null
    const { priorHeadSha, priorChangeDigest, headChangeDigest, mergeCommits } = proof
    if (
        proof.version !== HEAD_EQUIVALENCE_VERSION ||
        proof.equivalent !== true ||
        proof.baseRef !== HEAD_EQUIVALENCE_BASE_REF ||
        !SHA.test(proof.baseSha ?? '') ||
        proof.headSha !== headSha ||
        !SHA.test(priorHeadSha ?? '') ||
        priorHeadSha === headSha ||
        !DIGEST.test(priorChangeDigest ?? '') ||
        priorChangeDigest !== headChangeDigest ||
        !Array.isArray(mergeCommits) ||
        mergeCommits.length === 0
    ) {
        return null
    }
    let previous = priorHeadSha
    for (const commit of mergeCommits) {
        if (
            !SHA.test(commit?.sha ?? '') ||
            !Array.isArray(commit.parents) ||
            commit.parents.length !== 2 ||
            commit.parents[0] !== previous ||
            !SHA.test(commit.parents[1] ?? '') ||
            commit.mergedParentOnBase !== true ||
            commit.cleanAutomaticMerge !== true ||
            !SHA.test(commit.tree ?? '') ||
            commit.automaticMergeTree !== commit.tree
        ) {
            return null
        }
        previous = commit.sha
    }
    return previous === headSha ? { priorHeadSha, changeDigest: priorChangeDigest } : null
}

/**
 * CodeRabbit records the last commit it reviewed in its summary comment. A review that
 * finds nothing creates no GitHub review object, so without this marker a clean
 * exact-head CodeRabbit review could never count. The marker must appear exactly once
 * (a second copy, e.g. quoted from a PR description, fails closed), name the exact head
 * as both source and covered commit, and say `reviewed`. The one exception: CodeRabbit
 * skips a head that only merged the base branch, so its marker may name the earlier
 * reviewed head when a valid head-equivalence proof names that same head.
 */
function parseCodeRabbitReceipt(comment, headSha, pullNumber, equivalence = null) {
    if (
        !isReviewBot(comment?.user, CODERABBIT_LOGIN) ||
        comment.issue_url !== `${API_ROOT}/issues/${pullNumber}`
    )
        return null
    const body = comment?.body
    if (typeof body !== 'string') return null
    if (
        body.split(CODERABBIT_SUMMARY_MARKER).length !== 2 ||
        body.split(CODERABBIT_COVERAGE_PREFIX).length !== 2
    )
        return null
    const match = body.match(/<!-- final_review_risk_coverage:(\{[^\r\n]*\}) -->/)
    if (!match) return null

    let payload
    try {
        payload = JSON.parse(match[1])
    } catch {
        return null
    }
    const exactHead = payload?.coveredCommitId === headSha && payload?.sourceCommitId === headSha
    const equivalentHead =
        !exactHead &&
        equivalence !== null &&
        payload?.coveredCommitId === equivalence.priorHeadSha &&
        payload?.sourceCommitId === equivalence.priorHeadSha
    if (
        payload?.kind !== 'reviewed' ||
        !SHA.test(payload.coveredCommitId ?? '') ||
        !(exactHead || equivalentHead)
    ) {
        return null
    }
    const observedAt = comment.updated_at ?? comment.created_at
    if (!timestamp(observedAt)) return null
    return {
        provider: 'CodeRabbit',
        login: CODERABBIT_LOGIN,
        commitSha: payload.coveredCommitId,
        createdAt: observedAt,
        source: exactHead ? 'coverage_marker_issue_comment' : 'coverage_marker_equivalent_head',
    }
}

/** The latest CodeRabbit review object on a given commit of this pull, if any. */
function latestCodeRabbitReviewOn(reviews, commitSha, pullNumber) {
    return (Array.isArray(reviews) ? reviews : [])
        .filter(
            (review) =>
                isReviewBot(review?.user, CODERABBIT_LOGIN) &&
                review.commit_id === commitSha &&
                review.pull_request_url === `${API_ROOT}/pulls/${pullNumber}`,
        )
        .sort((a, b) => compareLatest(a, b, 'submitted_at'))
        .at(-1)
}

function lowRiskFile(file) {
    const normalized = file.replaceAll('\\', '/')
    if (TRUST_BOUNDARY_DOC_PATHS.has(normalized)) {
        return false
    }
    if (
        /^docs\/PR-REVIEW-LOOP\.md$/i.test(normalized) ||
        /(^|\/)(\.github|\.husky|scripts\/security)(\/|$)/i.test(normalized) ||
        /(^|\/)(AGENTS|CLAUDE)\.md$/i.test(normalized) ||
        /(^|\/)(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|Cargo\.toml|Cargo\.lock)$/i.test(
            normalized,
        ) ||
        /(^|\/)(security|privacy|auth|secrets?|storage|persist(?:ence)?|multitab|recovery|erase|release|sign(?:ing)?|review-policy)(\/|[._-]|$)/i.test(
            normalized,
        )
    ) {
        return false
    }

    if (/^(README|CHANGELOG|ROADMAP)(\.[a-z0-9-]+)?\.md$/i.test(normalized)) return true
    if (/^docs\/.+\.md$/i.test(normalized)) return true
    const isTestFile = /(^|\/)(tests?|__tests__)\/[^/]+\.test\.[cm]?[jt]sx?$/i.test(normalized)
    if (!isTestFile) return false
    if (
        /(^|\/)(credentials?|secrets?|auth|signing|persist(?:ence)?|storage|multitab|recovery|privacy|security)(\/|[._-]|\.)/i.test(
            normalized,
        )
    ) {
        return false
    }
    return true
}

function unavailableFallback(request, pullNumber, headSha, qualifiedLogins, now) {
    if (
        !request ||
        request.pullNumber !== pullNumber ||
        request.headSha !== headSha ||
        !REVIEWERS.has(request.provider) ||
        qualifiedLogins.has(request.provider) ||
        request.requestCount !== 1 ||
        !request.reference ||
        !UNAVAILABLE_RESULTS.has(request.result)
    ) {
        return false
    }
    const requestedAt = timestamp(request.requestedAt)
    const observedAt = timestamp(request.observedAt)
    if (
        requestedAt === null ||
        observedAt === null ||
        observedAt < requestedAt ||
        now < observedAt
    ) {
        return false
    }
    const elapsed = now - requestedAt
    return request.result === 'silent' ? elapsed >= DAY : elapsed >= HOUR / 2
}

/**
 * A bot that answers in an existing thread creates a COMMENTED review object on the
 * current head, even while its own review of that head is rate limited. Such an object
 * has no body and no new inline comment, so it is not a review of the head. Without
 * inline-comment evidence a blank COMMENTED object does not count either.
 */
function isThreadReplyOnly(review, reviewComments) {
    if (review.state !== 'COMMENTED') return false
    if (typeof review.body === 'string' && review.body.trim() !== '') return false
    return !reviewComments.some(
        (comment) =>
            comment?.pull_request_review_id === review.id && comment.in_reply_to_id == null,
    )
}

/** Evaluate operator-collected GitHub API evidence. This is not a required CI check. */
export function evaluateReviewCoverage(evidence) {
    const headSha = evidence?.headSha
    const recheckedHeadSha = evidence?.recheckedHeadSha
    const pullNumber = evidence?.pullNumber
    const files = Array.isArray(evidence?.changedFiles) ? evidence.changedFiles : []
    const now = timestamp(evidence?.now) ?? Date.now()
    const highRiskFiles = files.filter((file) => typeof file !== 'string' || !lowRiskFile(file))
    const risk = files.length > 0 && highRiskFiles.length === 0 ? 'low' : 'high'
    if (
        !Number.isInteger(pullNumber) ||
        pullNumber < 1 ||
        !SHA.test(headSha ?? '') ||
        recheckedHeadSha !== headSha
    ) {
        return {
            status: 'invalid_or_changed_head',
            headSha: headSha ?? null,
            risk,
            qualifiedReviewers: [],
            requiredReviews: risk === 'high' ? 2 : 2,
            satisfied: false,
        }
    }

    const reviewComments = Array.isArray(evidence.reviewComments) ? evidence.reviewComments : []
    const reviewsByLogin = new Map()
    for (const review of Array.isArray(evidence.reviews) ? evidence.reviews : []) {
        const login = review?.user?.login
        if (
            !REVIEWERS.has(login) ||
            review.commit_id !== headSha ||
            review.pull_request_url !== `${API_ROOT}/pulls/${pullNumber}`
        )
            continue
        if (!isReviewBot(review.user, login)) continue
        if (isThreadReplyOnly(review, reviewComments)) continue
        const current = reviewsByLogin.get(login)
        if (!current || compareLatest(review, current, 'submitted_at') > 0) {
            reviewsByLogin.set(login, review)
        }
    }

    const formal = new Map()
    const blockedByDismissal = new Set()
    for (const [login, review] of reviewsByLogin) {
        if (review.state === 'DISMISSED') {
            blockedByDismissal.add(login)
            continue
        }
        if (COMPLETED_REVIEW_STATES.has(review.state) && timestamp(review.submitted_at)) {
            formal.set(login, {
                provider: REVIEWERS.get(login),
                login,
                state: review.state,
                commitSha: review.commit_id,
                createdAt: review.submitted_at,
                source: 'github_pull_request_review',
            })
        }
    }

    const latestCodexMarker = (Array.isArray(evidence.issueComments) ? evidence.issueComments : [])
        .filter(
            (comment) =>
                isReviewBot(comment?.user, 'chatgpt-codex-connector[bot]') &&
                comment.issue_url === `${API_ROOT}/issues/${pullNumber}` &&
                typeof comment.body === 'string' &&
                comment.body.includes('<!-- codex-review-state:v1 '),
        )
        .sort((a, b) => compareLatest(a, b, 'created_at'))
        .at(-1)
    const receipt = latestCodexMarker
        ? parseCodexReceipt(latestCodexMarker, headSha, pullNumber)
        : null

    // CodeRabbit edits its summary in place, so the latest edit is the current state.
    // Pick the latest summary first and only then check its marker: a newer summary
    // without a valid marker (rate limited, skipped, failed) voids an older marker.
    const latestCodeRabbitSummary = (
        Array.isArray(evidence.issueComments) ? evidence.issueComments : []
    )
        .filter(
            (comment) =>
                isReviewBot(comment?.user, CODERABBIT_LOGIN) &&
                comment.issue_url === `${API_ROOT}/issues/${pullNumber}` &&
                typeof comment.body === 'string' &&
                comment.body.includes(CODERABBIT_SUMMARY_MARKER),
        )
        .sort((a, b) => compareLatest(a, b, 'updated_at'))
        .at(-1)
    // A head-equivalence proof lets the marker of the earlier reviewed head count, unless
    // CodeRabbit's review on that earlier head was dismissed.
    let equivalence = parseHeadEquivalence(evidence.headEquivalence, headSha)
    if (
        equivalence &&
        latestCodeRabbitReviewOn(evidence.reviews, equivalence.priorHeadSha, pullNumber)?.state ===
            'DISMISSED'
    ) {
        equivalence = null
    }
    const codeRabbitReceipt = latestCodeRabbitSummary
        ? parseCodeRabbitReceipt(latestCodeRabbitSummary, headSha, pullNumber, equivalence)
        : null

    const qualified = new Map(formal)
    for (const issued of [receipt, codeRabbitReceipt]) {
        if (issued && !formal.has(issued.login) && !blockedByDismissal.has(issued.login)) {
            qualified.set(issued.login, issued)
        }
    }

    const qualifiedLogins = new Set(qualified.keys())
    const highRisk = risk === 'high'
    const transitionPull = pullNumber === TRANSITION_PULL_NUMBER
    const formalCount = formal.size
    const qualifiedCount = qualified.size
    let eligibleCount
    let requiredReviews = 2
    let fallback = false
    if (transitionPull) {
        eligibleCount = formalCount
    } else if (highRisk) {
        eligibleCount = qualifiedCount
    } else {
        eligibleCount = qualifiedCount
        fallback =
            eligibleCount === 1 &&
            unavailableFallback(
                evidence.secondReviewRequest,
                pullNumber,
                headSha,
                qualifiedLogins,
                now,
            )
        requiredReviews = fallback ? 1 : 2
    }
    const satisfied = eligibleCount >= requiredReviews

    return {
        status: satisfied ? 'covered' : 'insufficient_coverage',
        headSha,
        risk,
        highRiskFiles,
        transitionPull,
        qualifiedReviewers: [...qualified.values()].map(({ provider, login, source }) => ({
            provider,
            login,
            source,
        })),
        formalReviewers: [...formal.values()].map(({ provider, login, state }) => ({
            provider,
            login,
            state,
        })),
        receiptFindings: receipt
            ? {
                  hasAnyFindings: receipt.hasAnyFindings,
                  hasUnresolvedFindings: receipt.hasUnresolvedFindings,
              }
            : null,
        equivalentHead:
            qualified.get(CODERABBIT_LOGIN)?.source === 'coverage_marker_equivalent_head'
                ? {
                      reviewedHeadSha: equivalence.priorHeadSha,
                      changeDigest: equivalence.changeDigest,
                  }
                : null,
        fallback,
        requiredReviews,
        satisfied,
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    const input = JSON.parse(readFileSync(0, 'utf8'))
    const result = evaluateReviewCoverage(input)
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    if (!result.satisfied) process.exitCode = 1
}
