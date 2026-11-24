#!/usr/bin/env node
/**
 * Posts the structured result of the on-demand Claude review as one formal pull-request
 * review, bound to the commit Claude read (`.github/workflows/claude-review.yml`, GH #906).
 *
 * Claude itself has no write access: it returns JSON matching REVIEW_SCHEMA, and this script,
 * run from the default branch, validates it again, escapes anything that could forge a
 * receipt or mention someone, and submits the review with `commit_id` pinned. When the pull
 * request has moved to another head, it posts nothing. After posting it writes a receipt file
 * naming the review it created; the workflow uploads that file as an artifact of this run, so
 * the coverage policy can tell this review from one that only names the run.
 *
 * Environment: REVIEW_JSON, HEAD_SHA, PR_NUMBER, GITHUB_REPOSITORY, GH_TOKEN (the job's
 * GITHUB_TOKEN: the action revokes the Claude App token inside its own step), RUN_ID,
 * RUN_ATTEMPT, and RECEIPT_FILE for the artifact.
 */
import { writeFileSync } from 'node:fs'
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

/** A repository-relative path: no absolute path, no backslash, no `..` segment. */
const isSafePath = (path) =>
    typeof path === 'string' &&
    path.length > 0 &&
    !path.startsWith('/') &&
    !path.includes('\\') &&
    !path.split('/').includes('..')

function parseFinding(finding, index) {
    const valid =
        isSafePath(finding?.path) &&
        Number.isInteger(finding.line) &&
        finding.line >= 1 &&
        SEVERITIES.includes(finding.severity) &&
        typeof finding.title === 'string' &&
        typeof finding.body === 'string'
    if (!valid) throw new Error(`finding ${index} does not match the schema`)
    return {
        path: finding.path,
        line: finding.line,
        severity: finding.severity,
        title: sanitize(finding.title, 200),
        body: sanitize(finding.body),
    }
}

/** Checks the structured output again; the schema reaching Claude is not a guarantee. */
export function parseStructuredReview(raw) {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const isObject = parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
    if (!isObject || typeof parsed.summary !== 'string') {
        throw new Error('the review needs an object with a summary')
    }
    if (!Array.isArray(parsed.findings) || parsed.findings.length > MAX_FINDINGS) {
        throw new Error(`the review needs at most ${MAX_FINDINGS} findings`)
    }
    return {
        summary: sanitize(parsed.summary, MAX_SUMMARY),
        findings: parsed.findings.map(parseFinding),
    }
}

const isRightSideLine = (line) => line.startsWith('+') || line.startsWith(' ')

/** The right-side lines a review comment may point at: added and context lines of a patch. */
export function commentableLines(patch) {
    const lines = new Set()
    if (typeof patch !== 'string') return lines
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
        if (inline && lines.get(finding.path)?.has(finding.line)) {
            const body = `**${finding.severity}** -- ${finding.title}\n\n${finding.body}`
            comments.push({ path: finding.path, line: finding.line, side: 'RIGHT', body })
        } else {
            outside.push(finding)
        }
    }
    return { comments, outside }
}

const findingHead = (finding) =>
    `- **${finding.severity}** \`${finding.path}:${finding.line}\` -- ${finding.title}: `

/**
 * Lists every finding within the budget: when they do not fit, each body is shortened, never
 * a whole finding dropped, so the review inventory stays complete.
 */
export function listFindings(findings, budget) {
    const full = findings.map((finding) => findingHead(finding) + finding.body).join('\n')
    if (full.length <= budget) return full
    const share = Math.max(0, Math.floor(budget / Math.max(findings.length, 1)) - 1)
    return findings
        .map((finding) => {
            const head = findingHead(finding)
            const room = Math.max(0, share - head.length - 3)
            return finding.body.length <= room
                ? head + finding.body
                : `${head}${finding.body.slice(0, room)}...`
        })
        .join('\n')
}

function assertReviewInputs(headSha, run) {
    if (!SHA.test(headSha ?? '')) throw new Error('the head SHA is not a full commit SHA')
    const validRun =
        Number.isSafeInteger(run?.id) &&
        run.id >= 1 &&
        Number.isSafeInteger(run.attempt) &&
        run.attempt >= 1
    if (!validRun) throw new Error('the workflow run id and attempt are required')
}

/**
 * One formal COMMENT review: findings on diff lines become inline comments, the rest go into
 * the body. It never approves or requests changes, so it cannot satisfy or block a gate alone.
 */
export function buildReview({ review, headSha, files, run, inline = true }) {
    assertReviewInputs(headSha, run)
    const { comments, outside } = placeFindings(review.findings, files, inline)
    const receipt = receiptLine(headSha, review.findings.length, run)
    const intro = [
        '## Claude review (on demand)',
        `Reviewed commit \`${headSha}\`, read-only. Findings are inline unless their line is outside the diff.`,
        review.summary || 'No summary.',
        review.findings.length === 0 ? 'No findings.' : '',
    ]
        .filter(Boolean)
        .join('\n\n')
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
    return fetch(`https://api.github.com${path}`, {
        method,
        headers: {
            accept: 'application/vnd.github+json',
            authorization: `Bearer ${token}`,
            'x-github-api-version': '2022-11-28',
            ...(body ? { 'content-type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
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

/** The validated inputs, or an error naming every one the workflow must pass. */
export function readInputs(env) {
    const { REVIEW_JSON, HEAD_SHA, PR_NUMBER, GITHUB_REPOSITORY, GH_TOKEN, RUN_ID, RUN_ATTEMPT } =
        env
    const complete =
        Boolean(REVIEW_JSON && GITHUB_REPOSITORY && GH_TOKEN) &&
        SHA.test(HEAD_SHA ?? '') &&
        [PR_NUMBER, RUN_ID, RUN_ATTEMPT].every((value) => POSITIVE_INTEGER.test(value ?? ''))
    if (!complete) {
        throw new Error(
            'REVIEW_JSON, HEAD_SHA, PR_NUMBER, GITHUB_REPOSITORY, GH_TOKEN, RUN_ID and RUN_ATTEMPT are required',
        )
    }
    return {
        review: parseStructuredReview(REVIEW_JSON),
        headSha: HEAD_SHA,
        pull: Number(PR_NUMBER),
        repo: GITHUB_REPOSITORY,
        token: GH_TOKEN,
        run: { id: Number(RUN_ID), attempt: Number(RUN_ATTEMPT) },
        receiptFile: env.RECEIPT_FILE || 'claude-review-receipt.json',
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
    if (!Number.isSafeInteger(created?.id)) throw new Error('GitHub returned no review id')
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

export async function main(env = process.env, log = console) {
    const inputs = readInputs(env)
    if (!(await stillOpenAt(inputs))) {
        log.log(
            `[WARN] the pull request is no longer open at ${inputs.headSha}; no review was posted`,
        )
        return 'skipped'
    }
    const files = await changedFiles(inputs.repo, inputs.pull, inputs.token)
    const reviewId = await submitReview(inputs, files, log)
    const receipt = {
        pull: inputs.pull,
        head_sha: inputs.headSha,
        review_id: reviewId,
        run_id: inputs.run.id,
        run_attempt: inputs.run.attempt,
    }
    writeFileSync(inputs.receiptFile, `${JSON.stringify(receipt)}\n`)
    log.log(
        `[OK] posted Claude review ${reviewId} for ${inputs.headSha} with ${inputs.review.findings.length} finding(s)`,
    )
    return 'posted'
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
    main().catch((error) => {
        console.error(`[FAIL] ${error.message}`)
        process.exit(1)
    })
}
