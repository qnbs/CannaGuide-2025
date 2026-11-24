#!/usr/bin/env node
/**
 * Posts the structured result of the on-demand Claude review as one formal pull-request
 * review, bound to the commit Claude read (`.github/workflows/claude-review.yml`, GH #906).
 *
 * Claude itself has no write access: it returns JSON matching REVIEW_SCHEMA, and this script,
 * run from the default branch, validates it again, removes anything that could forge a
 * receipt or mention someone, and submits the review with `commit_id` pinned. When the pull
 * request has moved to another head, it posts nothing. The receipt at the end of the body is
 * what `review-coverage-policy.mjs` reads.
 *
 * Environment: REVIEW_JSON, HEAD_SHA, PR_NUMBER, GITHUB_REPOSITORY, GH_TOKEN (the job's
 * GITHUB_TOKEN: the action revokes the Claude App token inside its own step), RUN_ID and
 * RUN_ATTEMPT. The receipt names the run, so the policy can check it came from this workflow.
 */
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const MAX_FINDINGS = 25
const MAX_TEXT = 3000
const MAX_SUMMARY = 4000
const MAX_BODY = 60_000
const SHA = /^[0-9a-f]{40}$/
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
 * Model text is untrusted: no HTML comment can survive (a forged receipt), no mention can
 * reach a person or a bot (`@claude review`, `@coderabbitai`), and the length is bounded.
 */
export function sanitize(text, max = MAX_TEXT) {
    return String(text)
        .replace(/<!--|-->/g, '')
        .replace(/@(?=[A-Za-z0-9])/g, '(at)')
        .slice(0, max)
        .trim()
}

/** Checks the structured output again; the schema reaching Claude is not a guarantee. */
export function parseStructuredReview(raw) {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('the review is not an object')
    }
    if (typeof parsed.summary !== 'string') throw new Error('the review has no summary')
    if (!Array.isArray(parsed.findings) || parsed.findings.length > MAX_FINDINGS) {
        throw new Error(`the review needs at most ${MAX_FINDINGS} findings`)
    }
    const findings = parsed.findings.map((finding, index) => {
        const valid =
            finding &&
            typeof finding.path === 'string' &&
            finding.path.length > 0 &&
            !finding.path.includes('..') &&
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
    })
    return { summary: sanitize(parsed.summary, MAX_SUMMARY), findings }
}

/** The right-side lines a review comment may point at: added and context lines of a patch. */
export function commentableLines(patch) {
    const lines = new Set()
    if (typeof patch !== 'string') return lines
    let next = 0
    for (const line of patch.split('\n')) {
        const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line)
        if (hunk) {
            next = Number(hunk[1])
        } else if (next > 0 && (line.startsWith('+') || line.startsWith(' '))) {
            lines.add(next)
            next += 1
        }
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

/**
 * One formal COMMENT review: findings on diff lines become inline comments, the rest go into
 * the body. It never approves or requests changes, so it cannot satisfy or block a gate alone.
 */
export function buildReview({ review, headSha, files, run, inline = true }) {
    if (!SHA.test(headSha ?? '')) throw new Error('the head SHA is not a full commit SHA')
    if (
        !Number.isSafeInteger(run?.id) ||
        run.id < 1 ||
        !Number.isSafeInteger(run.attempt) ||
        run.attempt < 1
    ) {
        throw new Error('the workflow run id and attempt are required')
    }
    const lines = new Map(files.map((file) => [file.filename, commentableLines(file.patch)]))
    const comments = []
    const outside = []
    for (const finding of review.findings) {
        const text = `**${finding.severity}** -- ${finding.title}\n\n${finding.body}`
        if (inline && lines.get(finding.path)?.has(finding.line)) {
            comments.push({ path: finding.path, line: finding.line, side: 'RIGHT', body: text })
        } else {
            outside.push(
                `- **${finding.severity}** \`${finding.path}:${finding.line}\` -- ${finding.title}: ${finding.body}`,
            )
        }
    }
    const sections = [
        '## Claude review (on demand)',
        `Reviewed commit \`${headSha}\`, read-only. Findings are inline unless their line is outside the diff.`,
        review.summary || 'No summary.',
    ]
    if (outside.length > 0) sections.push(`### Findings outside the diff\n\n${outside.join('\n')}`)
    if (review.findings.length === 0) sections.push('No findings.')
    const receipt = receiptLine(headSha, review.findings.length, run)
    const text = sections.join('\n\n').slice(0, MAX_BODY - receipt.length - 2)
    return { commit_id: headSha, event: 'COMMENT', body: `${text}\n\n${receipt}`, comments }
}

async function github(path, { token, method = 'GET', body } = {}) {
    const response = await fetch(`https://api.github.com${path}`, {
        method,
        headers: {
            accept: 'application/vnd.github+json',
            authorization: `Bearer ${token}`,
            'x-github-api-version': '2022-11-28',
            ...(body ? { 'content-type': 'application/json' } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return response
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

export async function main(env = process.env, log = console) {
    const { REVIEW_JSON, HEAD_SHA, PR_NUMBER, GITHUB_REPOSITORY, GH_TOKEN, RUN_ID, RUN_ATTEMPT } =
        env
    if (
        !REVIEW_JSON ||
        !SHA.test(HEAD_SHA ?? '') ||
        !/^[1-9]\d*$/.test(PR_NUMBER ?? '') ||
        !GITHUB_REPOSITORY ||
        !GH_TOKEN ||
        !/^[1-9]\d*$/.test(RUN_ID ?? '') ||
        !/^[1-9]\d*$/.test(RUN_ATTEMPT ?? '')
    ) {
        throw new Error(
            'REVIEW_JSON, HEAD_SHA, PR_NUMBER, GITHUB_REPOSITORY, GH_TOKEN, RUN_ID and RUN_ATTEMPT are required',
        )
    }
    const run = { id: Number(RUN_ID), attempt: Number(RUN_ATTEMPT) }
    const review = parseStructuredReview(REVIEW_JSON)
    const pullResponse = await github(`/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}`, {
        token: GH_TOKEN,
    })
    if (!pullResponse.ok)
        throw new Error(`reading the pull request failed: HTTP ${pullResponse.status}`)
    const pull = await pullResponse.json()
    if (pull.head?.sha !== HEAD_SHA || pull.state !== 'open') {
        log.log(`[WARN] the pull request is no longer open at ${HEAD_SHA}; no review was posted`)
        return 'skipped'
    }
    const files = await changedFiles(GITHUB_REPOSITORY, PR_NUMBER, GH_TOKEN)
    const path = `/repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}/reviews`
    let response = await github(path, {
        token: GH_TOKEN,
        method: 'POST',
        body: buildReview({ review, headSha: HEAD_SHA, files, run }),
    })
    if (response.status === 422) {
        // A line GitHub does not accept fails the whole review: post every finding in the body.
        log.log('[WARN] inline comments were refused; posting all findings in the review body')
        response = await github(path, {
            token: GH_TOKEN,
            method: 'POST',
            body: buildReview({ review, headSha: HEAD_SHA, files, run, inline: false }),
        })
    }
    if (!response.ok) throw new Error(`posting the review failed: HTTP ${response.status}`)
    log.log(
        `[OK] posted the Claude review for ${HEAD_SHA} with ${review.findings.length} finding(s)`,
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
