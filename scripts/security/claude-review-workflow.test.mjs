import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { parse } from 'yaml'

import { REVIEW_SCHEMA } from './post-claude-review.mjs'

// The on-demand Claude review workflow is a trust boundary: an LLM reads pull-request content
// with a subscription token, and a second job writes to the pull request. Its safety lives in
// a few YAML keys, so the parsed workflow is pinned here (GH #906).

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const TEXT = readFileSync(resolve(ROOT, '.github/workflows/claude-review.yml'), 'utf8')
const WORKFLOW = parse(TEXT)
const ACTION_PIN = 'anthropics/claude-code-action@5a856893345e332afa621934082d8c660c26d689'
const { review, post } = WORKFLOW.jobs

const step = (job, name) => {
    const found = job.steps.find((entry) => entry.name === name)
    assert.ok(found, `missing step "${name}"`)
    return found
}
const claude = step(review, 'Review')
const args = String(claude.with.claude_args).split(/\s+(?=--)/)
const arg = (flag) => args.find((entry) => entry.startsWith(`${flag} `))?.slice(flag.length + 1)

test('it runs only on a pull-request comment, with no default token rights', () => {
    assert.deepEqual(Object.keys(WORKFLOW.on), ['issue_comment'])
    assert.deepEqual(WORKFLOW.on.issue_comment, { types: ['created'] })
    assert.deepEqual(WORKFLOW.permissions, {})
    assert.deepEqual(WORKFLOW.concurrency, {
        group: 'claude-review-${{ github.event.issue.number }}',
        'cancel-in-progress': false,
    })
    assert.deepEqual(Object.keys(WORKFLOW.jobs), ['review', 'post'])
})

test('only a write-access user can start it, with the exact command, on a pull request', () => {
    const condition = review.if
    assert.match(condition, /^github\.event\.issue\.pull_request && /)
    assert.match(condition, /startsWith\(github\.event\.comment\.body, '@claude review'\)/)
    assert.match(
        condition,
        /contains\(fromJSON\('\["OWNER","MEMBER","COLLABORATOR"\]'\), github\.event\.comment\.author_association\)$/,
    )
})

test('the review job is read-only and the post job is the only writer', () => {
    assert.deepEqual(review.permissions, { contents: 'read', 'pull-requests': 'read' })
    assert.deepEqual(post.permissions, { contents: 'read', 'pull-requests': 'write' })
    // No OIDC: the action gets the read-only job token and mints no Claude App token.
    assert.doesNotMatch(TEXT, /id-token/)
    assert.equal(claude.with.github_token, '${{ github.token }}')
    assert.equal(claude.with.allow_fork_prs, 'false')
    assert.equal(claude.with.track_progress, 'false')
    assert.equal(review['timeout-minutes'], 20)
    assert.equal(post['timeout-minutes'], 5)
})

test('Claude can only read: no shell, no writes, no GitHub or CI-log tools', () => {
    assert.equal(arg('--allowedTools'), 'Read,Grep,Glob')
    const denied = arg('--disallowedTools')?.split(',') ?? []
    for (const tool of [
        'Bash',
        'Edit',
        'Write',
        'MultiEdit',
        'NotebookEdit',
        'WebFetch',
        'WebSearch',
        'Task',
        'mcp__github',
        'mcp__github_comment',
        'mcp__github_inline_comment',
        'mcp__github_file_ops',
        'mcp__github_ci',
    ]) {
        assert.ok(denied.includes(tool), `${tool} must be denied`)
    }
    assert.ok(!args.some((entry) => entry.includes('Bash(')), 'no Bash allow rule')
    assert.equal(arg('--max-turns'), '40')
})

test('the pull request head is read from a subdirectory and never run', () => {
    const checkouts = review.steps.filter((entry) => entry.uses?.startsWith('actions/checkout@'))
    assert.equal(checkouts.length, 2)
    // The default branch sits at the root, as the action's security guidance asks.
    assert.deepEqual(checkouts[0].with, { 'persist-credentials': false })
    assert.deepEqual(checkouts[1].with, {
        ref: '${{ steps.head.outputs.sha }}',
        path: 'pr-head',
        'persist-credentials': false,
    })
    assert.equal(arg('--add-dir'), 'pr-head')
    const resolveHead = step(review, 'Resolve the exact head and the diff').run
    assert.match(resolveHead, /head_repo" != "\$GITHUB_REPOSITORY"/)
    // No step of the review job installs or runs repository code.
    for (const entry of review.steps) {
        assert.doesNotMatch(entry.run ?? '', /\b(pnpm|npm|npx|node|yarn|bun|make)\b/, entry.name)
    }
})

test('every action is pinned to a full commit, and the Claude action to the reviewed release', () => {
    const uses = [...review.steps, ...post.steps].map((entry) => entry.uses).filter(Boolean)
    assert.ok(uses.length >= 5)
    for (const ref of uses) assert.match(ref, /@[0-9a-f]{40}$/, ref)
    assert.ok(uses.includes(ACTION_PIN))
})

test('Claude returns the schema the posting script validates', () => {
    const schema = arg('--json-schema')
    assert.ok(schema, 'missing --json-schema')
    assert.deepEqual(JSON.parse(schema.replace(/^'|'$/g, '')), REVIEW_SCHEMA)
})

test('only the default branch posting script writes, with the run named for provenance', () => {
    assert.equal(post.needs, 'review')
    const checkout = post.steps.find((entry) => entry.uses?.startsWith('actions/checkout@'))
    assert.deepEqual(checkout.with, { 'persist-credentials': false })
    const posting = step(post, 'Post the review')
    assert.equal(posting.run, 'node scripts/security/post-claude-review.mjs')
    assert.deepEqual(Object.keys(posting.env).sort(), [
        'GH_TOKEN',
        'HEAD_SHA',
        'PR_NUMBER',
        'REVIEW_JSON',
        'RUN_ATTEMPT',
        'RUN_ID',
    ])
    assert.equal(posting.env.RUN_ID, '${{ github.run_id }}')
    assert.doesNotMatch(JSON.stringify(post), /CLAUDE_CODE_OAUTH_TOKEN/)
})
