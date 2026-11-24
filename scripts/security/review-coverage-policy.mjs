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

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

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
/** The coverage payload of a CodeRabbit summary that carries each marker exactly once. */
function codeRabbitCoveragePayload(comment, pullNumber) {
    const body = comment?.body
    const wellFormed =
        isReviewBot(comment?.user, CODERABBIT_LOGIN) &&
        comment.issue_url === `${API_ROOT}/issues/${pullNumber}` &&
        typeof body === 'string' &&
        body.split(CODERABBIT_SUMMARY_MARKER).length === 2 &&
        body.split(CODERABBIT_COVERAGE_PREFIX).length === 2
    const match = wellFormed
        ? body.match(/<!-- final_review_risk_coverage:(\{[^\r\n]*\}) -->/)
        : null
    if (!match) return null
    try {
        return JSON.parse(match[1])
    } catch {
        return null
    }
}

/** Whether a payload names one commit as both its source and its covered commit. */
const coversCommit = (payload, sha) =>
    payload?.coveredCommitId === sha && payload?.sourceCommitId === sha

function parseCodeRabbitReceipt(comment, headSha, pullNumber, equivalence = null) {
    const payload = codeRabbitCoveragePayload(comment, pullNumber)
    const exactHead = coversCommit(payload, headSha)
    const equivalentHead =
        !exactHead && equivalence !== null && coversCommit(payload, equivalence.priorHeadSha)
    const observedAt = comment?.updated_at ?? comment?.created_at
    const valid =
        payload?.kind === 'reviewed' &&
        SHA.test(payload.coveredCommitId ?? '') &&
        (exactHead || equivalentHead) &&
        Boolean(timestamp(observedAt))
    if (!valid) return null
    return {
        provider: 'CodeRabbit',
        login: CODERABBIT_LOGIN,
        commitSha: payload.coveredCommitId,
        createdAt: observedAt,
        source: exactHead ? 'coverage_marker_issue_comment' : 'coverage_marker_equivalent_head',
    }
}

/** The latest CodeRabbit review object on a given commit of this pull, if any. */
function latestCodeRabbitReviewOn(reviews, commitSha, pullNumber, reviewComments) {
    return (Array.isArray(reviews) ? reviews : [])
        .filter(
            (review) =>
                isReviewBot(review?.user, CODERABBIT_LOGIN) &&
                review.commit_id === commitSha &&
                review.pull_request_url === `${API_ROOT}/pulls/${pullNumber}` &&
                !isThreadReplyOnly(review, reviewComments),
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
const CLAUDE_KEY = 'claude-review'
/** The Claude App token is revoked inside the action, so the posting job uses GITHUB_TOKEN. */
const CLAUDE_POSTER = 'github-actions[bot]'
const CLAUDE_WORKFLOW_PATH = '.github/workflows/claude-review.yml'
const CLAUDE_RECEIPT_PREFIX = '<!-- claude-review-receipt:v1 '
const CLAUDE_RECEIPT = /\n<!-- claude-review-receipt:v1 (\{[^\r\n]*\}) -->\s*$/
const CODERABBIT_UNAVAILABLE = /Review limit reached|Review rate limited|Review skipped/
const CODERABBIT_BOT_SKIP = /Review skipped[\s\S]{0,200}Bot user detected/

function claudeReceipt(body) {
    if (typeof body !== 'string' || body.split(CLAUDE_RECEIPT_PREFIX).length !== 2) return null
    const match = body.match(CLAUDE_RECEIPT)
    if (!match) return null
    try {
        return JSON.parse(match[1])
    } catch {
        return null
    }
}

const isClaudeCandidate = (review, pullNumber) =>
    isReviewBot(review?.user, CLAUDE_POSTER) &&
    review.pull_request_url === `${API_ROOT}/pulls/${pullNumber}` &&
    typeof review.body === 'string' &&
    review.body.includes(CLAUDE_RECEIPT_PREFIX)

const latestClaudeCandidate = (reviews, headSha, pullNumber) =>
    (Array.isArray(reviews) ? reviews : [])
        .filter((review) => isClaudeCandidate(review, pullNumber) && review.commit_id === headSha)
        .sort((a, b) => compareLatest(a, b, 'submitted_at'))
        .at(-1)

/**
 * The run the collector must fetch: the one the latest receipt-carrying review on the head
 * names. The policy decides by that review alone, so no other run is evidence.
 */
export function claudeRunToVerify(reviews, headSha, pullNumber) {
    const latest = latestClaudeCandidate(reviews, headSha, pullNumber)
    const receipt = latest ? claudeReceipt(latest.body) : null
    const valid =
        Number.isSafeInteger(receipt?.run_id) &&
        receipt.run_id > 0 &&
        Number.isSafeInteger(receipt.run_attempt) &&
        receipt.run_attempt > 0
    return valid ? { runId: receipt.run_id, runAttempt: receipt.run_attempt } : null
}

/**
 * Only a run of main's claude-review workflow, dispatched on main, can have posted the review:
 * a dispatch on another branch runs that branch's copy, and its run reports that branch, so
 * `head_branch` must be main. (The trigger is workflow_dispatch, not a comment: zizmor ranks
 * issue_comment a dangerous trigger, and the workflow-lint ratchet only goes down.) Naming such a run
 * is not enough, though: any same-repository workflow with pull-requests write access can post
 * as github-actions[bot]. The run's own receipt artifact, which only that run can upload, has
 * to name this review, this head and this pull request.
 */
function trustedClaudeRun(run, receipt, review, headSha, pullNumber) {
    const artifact = run?.receipt
    return (
        run?.id === receipt.run_id &&
        run.path === CLAUDE_WORKFLOW_PATH &&
        run.event === 'workflow_dispatch' &&
        run.head_branch === 'main' &&
        run.repository === 'qnbs/CannaGuide-2025' &&
        run.head_repository === 'qnbs/CannaGuide-2025' &&
        Number.isSafeInteger(receipt.run_attempt) &&
        Number.isSafeInteger(run.run_attempt) &&
        run.run_attempt >= receipt.run_attempt &&
        timestamp(run.created_at) !== null &&
        timestamp(run.created_at) <= timestamp(review.submitted_at) &&
        artifact?.review_id === review.id &&
        artifact.head_sha === headSha &&
        artifact.pull === pullNumber &&
        artifact.run_id === run.id &&
        artifact.run_attempt === receipt.run_attempt
    )
}

/**
 * The on-demand Claude review (`.github/workflows/claude-review.yml`) is one formal COMMENT
 * review bound to the commit Claude read. It counts only with exactly one receipt at the end
 * of the body naming that head, posted by the workflow's own run as its receipt artifact
 * proves, and the latest such review on the head must not be dismissed. A Claude chat reply
 * or inline comment is no review.
 */
function claudeReviewOn(reviews, headSha, pullNumber, runs) {
    const latest = latestClaudeCandidate(reviews, headSha, pullNumber)
    if (!latest || latest.state !== 'COMMENTED' || !timestamp(latest.submitted_at)) return null
    const receipt = claudeReceipt(latest.body)
    if (
        receipt?.commit_sha !== headSha ||
        receipt.status !== 'completed' ||
        !Number.isInteger(receipt.findings) ||
        receipt.findings < 0 ||
        !Number.isSafeInteger(receipt.run_id)
    ) {
        return null
    }
    const run = isPlainObject(runs) ? runs[String(receipt.run_id)] : undefined
    if (!trustedClaudeRun(run, receipt, latest, headSha, pullNumber)) return null
    return {
        provider: 'Claude',
        login: CLAUDE_POSTER,
        state: latest.state,
        commitSha: headSha,
        findings: receipt.findings,
        runId: receipt.run_id,
        createdAt: latest.submitted_at,
        source: 'claude_review_receipt',
    }
}

/**
 * CodeRabbit demonstrably could not review this head: a request that names the full head SHA,
 * answered by CodeRabbit's own limit or skip notice, or its standing skip of a bot-authored
 * pull request. Only then may the Claude review stand in for it.
 */
function codeRabbitUnavailable(issueComments, headSha, pullNumber) {
    const onThisPull = issueComments.filter(
        (comment) =>
            comment?.issue_url === `${API_ROOT}/issues/${pullNumber}` &&
            typeof comment.body === 'string' &&
            timestamp(comment.created_at) !== null,
    )
    const notices = onThisPull.filter(
        (comment) =>
            isReviewBot(comment.user, CODERABBIT_LOGIN) &&
            CODERABBIT_UNAVAILABLE.test(comment.body),
    )
    if (notices.some((notice) => CODERABBIT_BOT_SKIP.test(notice.body))) return true
    const requests = onThisPull.filter(
        (comment) =>
            comment.user?.type === 'User' &&
            comment.body.includes('@coderabbitai') &&
            comment.body.includes(headSha),
    )
    return requests.some((request) =>
        notices.some((notice) => timestamp(notice.created_at) >= timestamp(request.created_at)),
    )
}

function isThreadReplyOnly(review, reviewComments) {
    if (review.state !== 'COMMENTED') return false
    if (typeof review.body === 'string' && review.body.trim() !== '') return false
    return !reviewComments.some(
        (comment) =>
            comment?.pull_request_review_id === review.id && comment.in_reply_to_id == null,
    )
}

const list = (value) => (Array.isArray(value) ? value : [])

/** The latest formal review per qualified bot on this head, and the bots whose latest was dismissed. */
function formalReviews(reviews, headSha, pullNumber, reviewComments) {
    const reviewsByLogin = new Map()
    for (const review of reviews) {
        const login = review?.user?.login
        const onThisHead =
            REVIEWERS.has(login) &&
            review.commit_id === headSha &&
            review.pull_request_url === `${API_ROOT}/pulls/${pullNumber}`
        if (!onThisHead || !isReviewBot(review.user, login)) continue
        if (isThreadReplyOnly(review, reviewComments)) continue
        const current = reviewsByLogin.get(login)
        if (!current || compareLatest(review, current, 'submitted_at') > 0) {
            reviewsByLogin.set(login, review)
        }
    }
    const formal = new Map()
    const blockedByDismissal = new Set()
    for (const [login, review] of reviewsByLogin) {
        if (review.state === 'DISMISSED') blockedByDismissal.add(login)
        else if (COMPLETED_REVIEW_STATES.has(review.state) && timestamp(review.submitted_at)) {
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
    return { formal, blockedByDismissal }
}

/** The latest comment by one bot on this pull request that carries a marker. */
function latestMarkerComment(issueComments, login, pullNumber, marker, dateField) {
    return issueComments
        .filter(
            (comment) =>
                isReviewBot(comment?.user, login) &&
                comment.issue_url === `${API_ROOT}/issues/${pullNumber}` &&
                typeof comment.body === 'string' &&
                comment.body.includes(marker),
        )
        .sort((a, b) => compareLatest(a, b, dateField))
        .at(-1)
}

/**
 * A head-equivalence proof lets the marker of the earlier reviewed head count, unless
 * CodeRabbit's review on that earlier head was dismissed.
 */
function usableEquivalence(evidence, headSha, pullNumber, reviewComments) {
    const equivalence = parseHeadEquivalence(evidence.headEquivalence, headSha)
    if (!equivalence) return null
    const prior = latestCodeRabbitReviewOn(
        evidence.reviews,
        equivalence.priorHeadSha,
        pullNumber,
        reviewComments,
    )
    return prior?.state === 'DISMISSED' ? null : equivalence
}

/**
 * The on-demand Claude review counts as one qualified provider of its own (owner decision,
 * 2026-11-24): never as two, and only as the receipt-bound formal review. It is recorded as
 * standing in for CodeRabbit when CodeRabbit demonstrably could not review this head.
 */
function claudeEntry(evidence, headSha, pullNumber, qualified) {
    if (pullNumber === TRANSITION_PULL_NUMBER) return null
    const claude = claudeReviewOn(list(evidence.reviews), headSha, pullNumber, evidence.claudeRuns)
    if (!claude) return null
    const standsIn =
        !qualified.has(CODERABBIT_LOGIN) &&
        codeRabbitUnavailable(list(evidence.issueComments), headSha, pullNumber)
    return { ...claude, standsInFor: standsIn ? 'CodeRabbit' : null }
}

/** How many reviews count and how many are required, with the low-risk fallback. */
function coverageRequirement(evidence, { pullNumber, headSha, highRisk, formal, qualified, now }) {
    if (pullNumber === TRANSITION_PULL_NUMBER) {
        return { eligibleCount: formal.size, requiredReviews: 2, fallback: false }
    }
    const eligibleCount = qualified.size
    const fallback =
        !highRisk &&
        eligibleCount === 1 &&
        unavailableFallback(
            evidence.secondReviewRequest,
            pullNumber,
            headSha,
            new Set(qualified.keys()),
            now,
        )
    return { eligibleCount, requiredReviews: fallback ? 1 : 2, fallback }
}

function receiptSummary(receipt) {
    return receipt
        ? {
              hasAnyFindings: receipt.hasAnyFindings,
              hasUnresolvedFindings: receipt.hasUnresolvedFindings,
          }
        : null
}

function equivalentHeadSummary(qualified, equivalence) {
    return qualified.get(CODERABBIT_LOGIN)?.source === 'coverage_marker_equivalent_head'
        ? { reviewedHeadSha: equivalence.priorHeadSha, changeDigest: equivalence.changeDigest }
        : null
}

function claudeSummary(qualified) {
    const claude = qualified.get(CLAUDE_KEY)
    return claude
        ? { findings: claude.findings, runId: claude.runId, standsInFor: claude.standsInFor }
        : null
}

/** Evaluate operator-collected GitHub API evidence. This is not a required CI check. */
export function evaluateReviewCoverage(evidence) {
    const headSha = evidence?.headSha
    const pullNumber = evidence?.pullNumber
    const files = list(evidence?.changedFiles)
    const now = timestamp(evidence?.now) ?? Date.now()
    const highRiskFiles = files.filter((file) => typeof file !== 'string' || !lowRiskFile(file))
    const risk = files.length > 0 && highRiskFiles.length === 0 ? 'low' : 'high'
    const validHead =
        Number.isInteger(pullNumber) &&
        pullNumber >= 1 &&
        SHA.test(headSha ?? '') &&
        evidence?.recheckedHeadSha === headSha
    if (!validHead) {
        return {
            status: 'invalid_or_changed_head',
            headSha: headSha ?? null,
            risk,
            qualifiedReviewers: [],
            requiredReviews: 2,
            satisfied: false,
        }
    }

    const reviewComments = list(evidence.reviewComments)
    const issueComments = list(evidence.issueComments)
    const { formal, blockedByDismissal } = formalReviews(
        list(evidence.reviews),
        headSha,
        pullNumber,
        reviewComments,
    )
    const codexMarker = latestMarkerComment(
        issueComments,
        'chatgpt-codex-connector[bot]',
        pullNumber,
        '<!-- codex-review-state:v1 ',
        'created_at',
    )
    const receipt = codexMarker ? parseCodexReceipt(codexMarker, headSha, pullNumber) : null
    // CodeRabbit edits its summary in place, so the latest edit is the current state.
    // Pick the latest summary first and only then check its marker: a newer summary
    // without a valid marker (rate limited, skipped, failed) voids an older marker.
    const codeRabbitSummary = latestMarkerComment(
        issueComments,
        CODERABBIT_LOGIN,
        pullNumber,
        CODERABBIT_SUMMARY_MARKER,
        'updated_at',
    )
    const equivalence = usableEquivalence(evidence, headSha, pullNumber, reviewComments)
    const codeRabbitReceipt = codeRabbitSummary
        ? parseCodeRabbitReceipt(codeRabbitSummary, headSha, pullNumber, equivalence)
        : null

    const qualified = new Map(formal)
    for (const issued of [receipt, codeRabbitReceipt]) {
        if (issued && !formal.has(issued.login) && !blockedByDismissal.has(issued.login)) {
            qualified.set(issued.login, issued)
        }
    }
    const claude = claudeEntry(evidence, headSha, pullNumber, qualified)
    if (claude) qualified.set(CLAUDE_KEY, claude)

    const transitionPull = pullNumber === TRANSITION_PULL_NUMBER
    const { eligibleCount, requiredReviews, fallback } = coverageRequirement(evidence, {
        pullNumber,
        headSha,
        highRisk: risk === 'high',
        formal,
        qualified,
        now,
    })
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
        receiptFindings: receiptSummary(receipt),
        equivalentHead: equivalentHeadSummary(qualified, equivalence),
        claudeReview: claudeSummary(qualified),
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
