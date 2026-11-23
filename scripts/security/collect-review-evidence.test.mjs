import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { test } from 'node:test'

import {
    changedFilesFromPullFiles,
    filterEvidenceForPull,
    readEvidenceSupplement,
} from './collect-review-evidence.mjs'

const PULL = 903
const PULL_URL = 'https://api.github.com/repos/qnbs/CannaGuide-2025/pulls/903'
const ISSUE_URL = 'https://api.github.com/repos/qnbs/CannaGuide-2025/issues/903'
const OTHER_PULL = 'https://api.github.com/repos/qnbs/CannaGuide-2025/pulls/902'
const OTHER_ISSUE = 'https://api.github.com/repos/qnbs/CannaGuide-2025/issues/902'

test('filterEvidenceForPull keeps only matching pull/issue URLs and sorts by id', () => {
    const { reviews, issueComments } = filterEvidenceForPull(
        PULL,
        [
            { id: 2, pull_request_url: PULL_URL, user: { login: 'coderabbitai[bot]' } },
            { id: 1, pull_request_url: OTHER_PULL },
        ],
        [
            { id: 3, issue_url: ISSUE_URL, body: 'ok' },
            { id: 2, issue_url: OTHER_ISSUE, body: 'foreign' },
        ],
    )
    assert.equal(reviews.length, 1)
    assert.equal(reviews[0].id, 2)
    assert.equal(issueComments.length, 1)
    assert.equal(issueComments[0].id, 3)
})

test('changedFilesFromPullFiles retains previous_filename on rename', () => {
    const files = changedFilesFromPullFiles([
        {
            filename: 'scripts/security/review-coverage-policy.mjs',
            previous_filename: 'scripts/security/old-collector.mjs',
        },
    ])
    assert.deepEqual(files, [
        'scripts/security/old-collector.mjs',
        'scripts/security/review-coverage-policy.mjs',
    ])
})

test('readEvidenceSupplement accepts headEquivalence and secondReviewRequest only', (t) => {
    const dir = mkdtempSync(join(tmpdir(), 'cg-evidence-'))
    t.after(() => rmSync(dir, { force: true, recursive: true }))
    const path = join(dir, 'extra.json')
    writeFileSync(
        path,
        JSON.stringify({
            headEquivalence: { priorHeadSha: 'a'.repeat(40), changeDigest: 'deadbeef' },
            secondReviewRequest: {
                provider: 'CodeRabbit',
                pullNumber: 907,
                headSha: 'b'.repeat(40),
                requestCount: 1,
                requestedAt: '2026-01-01T00:00:00.000Z',
                observedAt: '2026-01-01T12:00:00.000Z',
                result: 'unavailable',
                reference: 'https://github.com/qnbs/CannaGuide-2025/pull/907#issuecomment-1',
            },
        }),
    )
    const supplement = readEvidenceSupplement(path)
    assert.equal(supplement.headEquivalence.priorHeadSha, 'a'.repeat(40))
    assert.equal(supplement.secondReviewRequest.provider, 'CodeRabbit')
})

const HEAD = 'a'.repeat(40)
const BASE = 'b'.repeat(40)
const CLI = new URL('./collect-review-evidence.mjs', import.meta.url)
const POLICY = new URL('./review-coverage-policy.mjs', import.meta.url)
const PULL_PATH = `repos/qnbs/CannaGuide-2025/pulls/${PULL}`
const COMMENTS_PATH = `repos/qnbs/CannaGuide-2025/issues/${PULL}/comments`
const CLI_TEST = { skip: process.platform === 'win32' && 'Uses a POSIX gh shim and signals' }

function review(login) {
    return {
        pull_request_url: PULL_URL,
        user: { login, type: 'Bot' },
        commit_id: HEAD,
        state: 'COMMENTED',
        submitted_at: '2026-01-01T00:00:00Z',
    }
}

function pullMetadata(head = HEAD, changedFiles = 2) {
    return { head: { sha: head }, base: { sha: BASE }, changed_files: changedFiles }
}

function runCollector(t, overrides = {}, argv = [String(PULL), '--expect-head', HEAD]) {
    const dir = mkdtempSync(join(tmpdir(), 'cg evidence '))
    t.after(() => rmSync(dir, { force: true, recursive: true }))
    const scriptDir = join(dir, 'scripts', 'security')
    mkdirSync(scriptDir, { recursive: true })
    const cli = join(scriptDir, 'collect-review-evidence.mjs')
    copyFileSync(CLI, cli)
    copyFileSync(POLICY, join(scriptDir, 'review-coverage-policy.mjs'))
    const responses = {
        [PULL_PATH]: { values: [pullMetadata(), pullMetadata()] },
        [`${PULL_PATH}/files`]: {
            values: [[[{ filename: 'docs/readme.md' }], [{ filename: 'scripts/ci.mjs' }]]],
        },
        [`${PULL_PATH}/reviews`]: {
            values: [[[review('coderabbitai[bot]')], [review('sourcery-ai[bot]')]]],
        },
        [COMMENTS_PATH]: { values: [[[]]] },
        ...overrides,
    }

    writeFileSync(
        join(dir, 'gh'),
        `#!/usr/bin/env node
import * as fs from 'node:fs'
const route = process.argv[3]
const responses = JSON.parse(process.env.CANNAGUIDE_REVIEW_FIXTURE)
const response = responses[route]
if (process.argv[2] !== 'api' || !response) process.exit(90)
if (response.signal) process.kill(process.pid, response.signal)
if (response.exit) {
    process.stderr.write('fixture private diagnostic')
    process.exit(response.exit)
}
const paginated = route.endsWith('/files') || route.endsWith('/reviews') || route.endsWith('/comments')
if (paginated && process.argv.slice(4).join(' ') !== '--paginate --slurp') process.exit(91)
const countFile = process.env.CANNAGUIDE_REVIEW_REQUESTS
const counts = fs.existsSync(countFile) ? JSON.parse(fs.readFileSync(countFile)) : {}
const index = counts[route] || 0
if (index >= response.values.length) process.exit(92)
counts[route] = index + 1
fs.writeFileSync(countFile, JSON.stringify(counts))
process.stdout.write(JSON.stringify(response.values[index], null, 2))
`,
        { mode: 0o755 },
    )
    return spawnSync(process.execPath, [cli, ...argv], {
        encoding: 'utf8',
        env: {
            ...process.env,
            PATH: `${dir}${delimiter}${process.env.PATH ?? ''}`,
            CANNAGUIDE_REVIEW_FIXTURE: JSON.stringify(responses),
            CANNAGUIDE_REVIEW_REQUESTS: join(dir, 'requests.json'),
        },
    })
}

test(
    'CLI reads pretty-printed pages and runs the policy from a path with spaces',
    CLI_TEST,
    (t) => {
        const result = runCollector(t)
        assert.equal(result.status, 0, result.stderr || result.stdout)
        assert.deepEqual(JSON.parse(result.stdout).highRiskFiles, ['scripts/ci.mjs'])
    },
)

test('CLI preserves an insufficient-coverage result and its exit status', CLI_TEST, (t) => {
    const result = runCollector(t, { [`${PULL_PATH}/reviews`]: { values: [[[]]] } })
    assert.equal(result.status, 1)
    assert.equal(JSON.parse(result.stdout).status, 'insufficient_coverage')
})

test('CLI preserves a late GitHub failure without emitting partial evidence', CLI_TEST, (t) => {
    const result = runCollector(t, { [COMMENTS_PATH]: { exit: 4 } })
    assert.equal(result.status, 4)
    assert.equal(result.stdout, '')
    assert.doesNotMatch(result.stderr, /private diagnostic/)
})

test('CLI propagates child signal termination', CLI_TEST, (t) => {
    const result = runCollector(t, { [COMMENTS_PATH]: { signal: 'SIGTERM' } })
    assert.equal(result.signal, 'SIGTERM')
    assert.equal(result.stdout, '')
})

test('CLI discards evidence when the PR advances during collection', CLI_TEST, (t) => {
    const result = runCollector(t, {
        [PULL_PATH]: { values: [pullMetadata(), pullMetadata('c'.repeat(40))] },
    })
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /PR changed/)
})

test('CLI rejects truncated, duplicate, or over-limit file lists', CLI_TEST, (t) => {
    const entry = { filename: 'docs/readme.md' }
    for (const files of [[entry], [entry, entry]]) {
        const result = runCollector(t, { [`${PULL_PATH}/files`]: { values: [[files]] } })
        assert.equal(result.status, 1)
        assert.equal(result.stdout, '')
        assert.match(result.stderr, /incomplete or duplicate/)
    }
    const result = runCollector(t, { [PULL_PATH]: { values: [pullMetadata(HEAD, 3001)] } })
    assert.equal(result.status, 1)
    assert.equal(result.stdout, '')
    assert.match(result.stderr, /file-list limit/)
})

test('CLI rejects unknown options and duplicate PR numbers before collecting', CLI_TEST, (t) => {
    for (const args of [
        [String(PULL), `--expect-head=${HEAD}`],
        [String(PULL), '902'],
    ]) {
        const result = runCollector(t, {}, args)
        assert.equal(result.status, 2)
        assert.equal(result.stdout, '')
        assert.match(result.stderr, /Usage:/)
    }
})

test('filterEvidenceForPull does not treat prose as structured receipt input', () => {
    const { issueComments } = filterEvidenceForPull(
        PULL,
        [],
        [
            {
                id: 1,
                issue_url: ISSUE_URL,
                user: { login: 'codeant-ai[bot]' },
                body: 'Low Risk summary without supported structured receipt markers',
            },
        ],
    )
    assert.equal(issueComments.length, 1)
    assert.ok(!issueComments[0].body.includes('final_review_risk_coverage'))
})
