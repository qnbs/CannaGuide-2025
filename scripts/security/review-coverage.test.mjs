import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const ROOT = path.resolve(import.meta.dirname, '../..')
const HEAD = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const OTHER = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

const program = readFileSync(path.join(ROOT, 'docs/PR-REVIEW-LOOP.md'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.includes('group_by(.user.login)'))

function coverageFilter() {
    assert.ok(program, 'coverage jq missing from docs/PR-REVIEW-LOOP.md')
    assert.match(program, /coderabbitai\[bot\]/)
    assert.match(program, /codeant-ai\[bot\]/)
    assert.match(program, /chatgpt-codex-connector\[bot\]/)
    assert.doesNotMatch(program, /unique_by/)
    const filter = program.replace(/^.*\| jq -s '/, '').replace(/'$/, '')
    return filter.replaceAll('<HEAD>', HEAD)
}

function review(login, state, commit = HEAD, submitted = '2026-11-02T10:00:00Z') {
    return { user: { login, type: 'Bot' }, state, commit_id: commit, submitted_at: submitted }
}

/** Run the documented `jq -s` program over REST review pages. */
function covered(pages) {
    const out = execFileSync('jq', ['-s', '-c', `[${coverageFilter()}]`], {
        input: pages.map((page) => JSON.stringify(page)).join('\n'),
        encoding: 'utf8',
    })
    return JSON.parse(out)
}

test('the documented query keeps the newest review per bot login on the head', () => {
    const pages = [
        [
            review('coderabbitai[bot]', 'COMMENTED', HEAD, '2026-11-02T10:00:00Z'),
            review('coderabbitai[bot]', 'CHANGES_REQUESTED', HEAD, '2026-11-02T11:00:00Z'),
            review('codeant-ai[bot]', 'COMMENTED', HEAD, '2026-11-02T09:00:00Z'),
            review('codeant-ai[bot]', 'DISMISSED', HEAD, '2026-11-02T12:00:00Z'),
            review('chatgpt-codex-connector[bot]', 'COMMENTED', OTHER),
            review('greptile-apps[bot]', 'COMMENTED'),
            review('coderabbitai', 'COMMENTED'),
        ],
        [review('cubic-dev-ai[bot]', 'COMMENTED')],
    ]
    assert.deepEqual(covered(pages), [
        { user: 'codeant-ai[bot]', state: 'COMMENTED' },
        { user: 'coderabbitai[bot]', state: 'CHANGES_REQUESTED' },
    ])
})

test('names without the [bot] suffix match nothing, so a stripped filter fails closed', () => {
    const pages = [
        [
            review('coderabbitai', 'COMMENTED'),
            review('codeant-ai', 'APPROVED'),
            review('chatgpt-codex-connector', 'CHANGES_REQUESTED'),
        ],
    ]
    assert.deepEqual(covered(pages), [])
})

test('a dismissed-only login, a silent reviewer, and a trial notice add no row', () => {
    const pages = [
        [
            review('chatgpt-codex-connector[bot]', 'DISMISSED'),
            review('greptile-apps[bot]', 'COMMENTED'),
            review('coderabbitai[bot]', 'COMMENTED'),
        ],
    ]
    assert.deepEqual(
        covered(pages).map((row) => row.user),
        ['coderabbitai[bot]'],
    )
})
