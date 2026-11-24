#!/usr/bin/env node
/**
 * Posts the structured result of the on-demand Claude review as one formal pull-request
 * review, bound to the commit Claude read (`.github/workflows/claude-review.yml`, GH #906).
 *
 * Claude itself has no write access: it returns JSON matching REVIEW_SCHEMA, and this script,
 * run from the default branch, validates it again, escapes anything that could forge a
 * receipt or mention someone, and submits the review with `commit_id` pinned. When the pull
 * request has moved to another head, it posts nothing. After posting it prints a receipt, one
 * JSON line on stdout naming the review it created (logs go to stderr); the workflow saves it
 * and uploads it as an artifact of this run, so the coverage policy can tell this review from
 * one that only names the run.
 *
 * Environment: REVIEW_JSON, HEAD_SHA, PR_NUMBER, GITHUB_REPOSITORY, GH_TOKEN (the job's
 * GITHUB_TOKEN: the action revokes the Claude App token inside its own step), RUN_ID and
 * RUN_ATTEMPT.
 */
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const MAX_FINDINGS = 25
const MAX_TEXT = 3000
const MAX_SUMMARY = 4000
const MAX_BODY = 60_000
const SHA = /^[0-9a-f]{40}$/
const POSITIVE_INTEGER = /^[1-9]\d*$/
const SEVERITIES = ['critical', 'major', 'minor']

/** Passed to Claude Code as --json-schema; the workflow test checks the copy there. */
export const REVIEW_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['summary', 'findings'],
    properties: {
        summary: { type: 'string', maxLength: MAX_SUMMARY },
        findings: {
            type: 'array',
            maxItems: MAX_FINDINGS,
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['path', 'line', 'severity', 'title', 'body'],
                properties: {
                    path: { type: 'string', maxLength: 300 },
                    line: { type: 'integer', minimum: 1 },
                    severity: { enum: SEVERITIES },
                    title: { type: 'string', maxLength: 200 },
                    body: { type: 'string', maxLength: MAX_TEXT },
                },
            },
        },
    },
}

/**
 * Model text is untrusted. Escaping every `<` leaves no HTML element and no HTML comment, so
 * no text can forge a receipt; no mention can reach a person or a bot (`@claude review`,
 * `@coderabbitai`); and the length is bounded.
 */
export function sanitize(text, max = MAX_TEXT) {
    return String(text)
        .replace(/</g, '&lt;')
        .replace(/@(?=[A-Za-z0-9])/g, '(at)')
        .slice(0, max)
        .trim()
}

const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
const isString = (value) => typeof value === 'string'
const isPositiveId = (value) => Number.isSafeInteger(value) && value >= 1

/** A repository-relative path: no absolute path, no backslash, no `..` segment. */
const PATH_RULES = [
    (path) => isString(path) && path.length > 0,
    (path) => !path.startsWith('/') && !path.includes('\\'),
    (path) => !path.split('/').includes('..'),
]
const isSafePath = (path) => PATH_RULES.every((rule) => rule(path))

/** Each rule a finding must pass before anything about it is posted. */
const FINDING_RULES = [
    (finding) => isPlainObject(finding) && isSafePath(finding.path),
    (finding) => Number.isInteger(finding.line) && finding.line >= 1,
    (finding) => SEVERITIES.includes(finding.severity),
    (finding) => isString(finding.title) && isString(finding.body),
]

function parseFinding(finding, index) {
    if (!FINDING_RULES.every((rule) => rule(finding))) {
        throw new Error(`finding ${index} does not match the schema`)
    }
    return {
        path: finding.path,
        line: finding.line,
        severity: finding.severity,
        title: sanitize(finding.title, 200),
        body: sanitize(finding.body),
    }
}

/** The shape rules of the whole review, each with the error it raises. */
const REVIEW_RULES = [
    [
        (review) => isPlainObject(review) && isString(review.summary),
        'the review needs an object with a summary',
    ],
    [
        (review) => Array.isArray(review.findings) && review.findings.length <= MAX_FINDINGS,
        `the review needs at most ${MAX_FINDINGS} findings`,
    ],
]

/** Checks the structured output again; the schema reaching Claude is not a guarantee. */
export function parseStructuredReview(raw) {
    const parsed = isString(raw) ? JSON.parse(raw) : raw
    const broken = REVIEW_RULES.find(([rule]) => !rule(parsed))
    if (broken) throw new Error(broken[1])
    return {
        summary: sanitize(parsed.summary, MAX_SUMMARY),
        findings: parsed.findings.map(parseFinding),
    }
}

const isRightSideLine = (line) => line.startsWith('+') || line.startsWith(' ')

/** The right-side lines a review comment may point at: added and context lines of a patch. */
export function commentableLines(patch) {
    const lines = new Set()
    if (!isString(patch)) return lines
    let next = 0
    for (const line of patch.split('\n')) {
        const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line)
        if (hunk) next = Number(hunk[1])
        else if (next > 0 && isRightSideLine(line)) lines.add(next++)
    }
    return lines
}

export const receiptLine = (headSha, findings, run) =>
    `<!-- claude-review-receipt:v1 ${JSON.stringify({
        commit_sha: headSha,
        status: 'completed',
        findings,
        run_id: run.id,
        run_attempt: run.attempt,
    })} -->`

/** Findings on diff lines go inline; every other finding goes into the body. */
function placeFindings(findings, files, inline) {
    const lines = new Map(files.map((file) => [file.filename, commentableLines(file.patch)]))
    const comments = []
    const outside = []
    for (const finding of findings) {
        const onDiff = inline && lines.get(finding.path)?.has(finding.line)
        if (!onDiff) {
            outside.push(finding)
            continue
        }
        const body = `**${finding.severity}** -- ${finding.title}\n\n${finding.body}`
        comments.push({ path: finding.path, line: finding.line, side: 'RIGHT', body })
    }
    return { comments, outside }
}

const findingHead = (finding) =>
    `- **${finding.severity}** \`${finding.path}:${finding.line}\` -- ${finding.title}: `

function shortened(finding, share) {
    const head = findingHead(finding)
    const room = Math.max(0, share - head.length - 3)
    return finding.body.length <= room
        ? head + finding.body
        : `${head}${finding.body.slice(0, room)}...`
}

/**
 * Lists every finding within the budget: when they do not fit, each body is shortened, never
 * a whole finding dropped, so the review inventory stays complete.
 */
export function listFindings(findings, budget) {
    const full = findings.map((finding) => findingHead(finding) + finding.body).join('\n')
    if (full.length <= budget) return full
    const share = Math.max(0, Math.floor(budget / Math.max(findings.length, 1)) - 1)
    return findings.map((finding) => shortened(finding, share)).join('\n')
}

function assertReviewInputs(headSha, run) {
    if (!SHA.test(headSha ?? '')) throw new Error('the head SHA is not a full commit SHA')
    if (![run?.id, run?.attempt].every(isPositiveId)) {
        throw new Error('the workflow run id and attempt are required')
    }
}

function reviewIntro(review, headSha) {
    const parts = [
        '## Claude review (on demand)',
        `Reviewed commit \`${headSha}\`, read-only. Findings are inline unless their line is outside the diff.`,
        review.summary || 'No summary.',
    ]
    if (review.findings.length === 0) parts.push('No findings.')
    return parts.join('\n\n')
}

/**
 * One formal COMMENT review: findings on diff lines become inline comments, the rest go into
 * the body. It never approves or requests changes, so it cannot satisfy or block a gate alone.
 */
export function buildReview({ review, headSha, files, run, inline = true }) {
    assertReviewInputs(headSha, run)
    const { comments, outside } = placeFindings(review.findings, files, inline)
    const receipt = receiptLine(headSha, review.findings.length, run)
    const intro = reviewIntro(review, headSha)
    const heading = '\n\n### Findings outside the diff\n\n'
    const room = MAX_BODY - intro.length - heading.length - receipt.length - 4
    const listed = outside.length > 0 ? heading + listFindings(outside, room) : ''
    return {
        commit_id: headSha,
        event: 'COMMENT',
        body: `${intro}${listed}\n\n${receipt}`,
        comments,
    }
}

async function github(path, { token, method = 'GET', body } = {}) {
    const headers = {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2022-11-28',
    }
    if (body) headers['content-type'] = 'application/json'
    return fetch(`https://api.github.com${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })
}

async function changedFiles(repo, pull, token) {
    const files = []
    for (let page = 1; page <= 10; page += 1) {
        const response = await github(
            `/repos/${repo}/pulls/${pull}/files?per_page=100&page=${page}`,
            { token },
        )
        if (!response.ok) throw new Error(`listing files failed: HTTP ${response.status}`)
        const batch = await response.json()
        files.push(...batch)
        if (batch.length < 100) break
    }
    return files
}

const REQUIRED_INPUTS =
    'REVIEW_JSON, HEAD_SHA, PR_NUMBER, GITHUB_REPOSITORY, GH_TOKEN, RUN_ID and RUN_ATTEMPT are required'

/** The validated inputs, or an error naming every one the workflow must pass. */
export function readInputs(env) {
    const present = [env.REVIEW_JSON, env.GITHUB_REPOSITORY, env.GH_TOKEN].every(Boolean)
    const numbers = [env.PR_NUMBER, env.RUN_ID, env.RUN_ATTEMPT].every((value) =>
        POSITIVE_INTEGER.test(value ?? ''),
    )
    if (!present || !numbers || !SHA.test(env.HEAD_SHA ?? '')) throw new Error(REQUIRED_INPUTS)
    return {
        review: parseStructuredReview(env.REVIEW_JSON),
        headSha: env.HEAD_SHA,
        pull: Number(env.PR_NUMBER),
        repo: env.GITHUB_REPOSITORY,
        token: env.GH_TOKEN,
        run: { id: Number(env.RUN_ID), attempt: Number(env.RUN_ATTEMPT) },
    }
}

/** Posts the review, falling back to every finding in the body when a line is refused. */
async function submitReview({ review, headSha, pull, repo, token, run }, files, log) {
    const path = `/repos/${repo}/pulls/${pull}/reviews`
    const post = (inline) =>
        github(path, {
            token,
            method: 'POST',
            body: buildReview({ review, headSha, files, run, inline }),
        })
    let response = await post(true)
    if (response.status === 422) {
        log.log('[WARN] inline comments were refused; posting all findings in the review body')
        response = await post(false)
    }
    if (!response.ok) throw new Error(`posting the review failed: HTTP ${response.status}`)
    const created = await response.json()
    if (!isPositiveId(created?.id)) throw new Error('GitHub returned no review id')
    return created.id
}

async function stillOpenAt(inputs) {
    const response = await github(`/repos/${inputs.repo}/pulls/${inputs.pull}`, {
        token: inputs.token,
    })
    if (!response.ok) throw new Error(`reading the pull request failed: HTTP ${response.status}`)
    const pull = await response.json()
    return pull.head?.sha === inputs.headSha && pull.state === 'open'
}

const toStderr = { log: (line) => console.error(line) }

/**
 * Posts the review. Returns the receipt naming the review GitHub created, or null when the
 * pull request has moved on and nothing was posted.
 */
export async function main(env = process.env, log = toStderr) {
    const inputs = readInputs(env)
    if (!(await stillOpenAt(inputs))) {
        log.log(
            `[WARN] the pull request is no longer open at ${inputs.headSha}; no review was posted`,
        )
        return null
    }
    const files = await changedFiles(inputs.repo, inputs.pull, inputs.token)
    const reviewId = await submitReview(inputs, files, log)
    log.log(
        `[OK] posted Claude review ${reviewId} for ${inputs.headSha} with ${inputs.review.findings.length} finding(s)`,
    )
    return {
        pull: inputs.pull,
        head_sha: inputs.headSha,
        review_id: reviewId,
        run_id: inputs.run.id,
        run_attempt: inputs.run.attempt,
    }
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
    main()
        .then((receipt) => {
            // The receipt is the only stdout; the workflow saves it for the artifact.
            if (receipt) process.stdout.write(`${JSON.stringify(receipt)}\n`)
        })
        .catch((error) => {
            console.error(`[FAIL] ${error.message}`)
            process.exit(1)
        })
}
