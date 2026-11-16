import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const ALLOWED_REVIEWERS = new Set([
    'coderabbitai[bot]',
    'codeant-ai[bot]',
    'chatgpt-codex-connector[bot]',
])
const COMPLETED_STATES = new Set(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED'])
const DEPENDABOT_LOGIN = 'dependabot[bot]'
const DEPENDABOT_ID = 49699333
const SHA_PATTERN = /^[0-9a-f]{40}$/

function fail(reason) {
    return { ok: false, reason, reviewers: [], dependabotException: false }
}

function sameAuthor(eventAuthor, liveAuthor) {
    return Boolean(
        eventAuthor &&
        liveAuthor &&
        typeof eventAuthor.login === 'string' &&
        eventAuthor.login.length > 0 &&
        Number.isSafeInteger(eventAuthor.id) &&
        typeof eventAuthor.type === 'string' &&
        eventAuthor.login === liveAuthor.login &&
        eventAuthor.id === liveAuthor.id &&
        eventAuthor.type === liveAuthor.type,
    )
}

export function evaluateReviewCoverage(input) {
    if (!input || typeof input !== 'object') return fail('Malformed gate input.')

    if (input.eventName === 'workflow_dispatch') {
        return input.eventRef === 'refs/heads/main'
            ? { ok: true, reviewers: [], reason: 'Manual dispatch is limited to main.' }
            : fail('Manual dispatch on a non-main ref cannot satisfy the PR review gate.')
    }

    if (input.eventName !== 'pull_request') return fail('Unsupported event for PR review coverage.')

    const eventPR = input.eventPullRequest
    const before = input.livePullRequestBefore
    const after = input.livePullRequestAfter
    const expectedHead = eventPR?.head?.sha
    const number = eventPR?.number

    if (!Number.isSafeInteger(number) || number < 1 || !SHA_PATTERN.test(expectedHead || '')) {
        return fail('Malformed event PR number or head SHA.')
    }
    if (
        before?.number !== number ||
        after?.number !== number ||
        before?.state !== 'open' ||
        after?.state !== 'open' ||
        before?.head_sha !== expectedHead ||
        after?.head_sha !== expectedHead
    ) {
        return fail('Live PR state or head does not match the event head.')
    }
    if (!sameAuthor(eventPR.user, before.user) || !sameAuthor(eventPR.user, after.user)) {
        return fail('Event author does not match both live PR API reads.')
    }

    const author = eventPR.user
    if (author.login === DEPENDABOT_LOGIN && author.id === DEPENDABOT_ID && author.type === 'Bot') {
        return { ok: true, reviewers: [], dependabotException: true }
    }

    if (!Array.isArray(input.reviews)) return fail('Review coverage is not an array.')
    const reviewers = new Set()
    for (const review of input.reviews) {
        if (!review || typeof review.user !== 'string' || typeof review.state !== 'string') {
            return fail('Malformed review coverage row.')
        }
        if (ALLOWED_REVIEWERS.has(review.user) && COMPLETED_STATES.has(review.state)) {
            reviewers.add(review.user)
        }
    }

    const eligibleReviewers = [...reviewers].sort()
    if (eligibleReviewers.length < 2) {
        return {
            ok: false,
            reason: 'Two distinct completed permitted reviews are required on the exact head.',
            reviewers: eligibleReviewers,
        }
    }
    return { ok: true, reviewers: eligibleReviewers }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try {
        const input = JSON.parse(readFileSync(0, 'utf8'))
        const result = evaluateReviewCoverage(input)
        process.stdout.write(JSON.stringify(result) + '\n')
        if (!result.ok) process.exitCode = 1
    } catch (error) {
        process.stderr.write('Review coverage gate failed closed: ' + error.message + '\n')
        process.exitCode = 1
    }
}
