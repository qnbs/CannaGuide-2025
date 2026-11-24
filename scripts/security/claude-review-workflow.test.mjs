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

test('it runs only when dispatched with a pull request number, with no default token rights', () => {
    // No comment trigger: zizmor ranks issue_comment a dangerous trigger, and the ratchet
    // only goes down. Dispatching needs write access to the repository.
    assert.deepEqual(Object.keys(WORKFLOW.on), ['workflow_dispatch'])
    assert.deepEqual(WORKFLOW.on.workflow_dispatch.inputs.pr, {
        description: 'Number of the pull request to review (from this repository)',
        required: true,
        type: 'number',
    })
    assert.deepEqual(WORKFLOW.permissions, {})
    assert.equal(WORKFLOW.concurrency, undefined)
    assert.deepEqual(review.concurrency, {
        group: 'claude-review-${{ inputs.pr }}',
        'cancel-in-progress': false,
    })
    assert.deepEqual(post.concurrency, {
        group: 'claude-review-post-${{ inputs.pr }}',
        'cancel-in-progress': false,
    })
    assert.deepEqual(Object.keys(WORKFLOW.jobs), ['review', 'post'])
    assert.doesNotMatch(TEXT, /github\.event\.(issue|comment)/)
})

test("only main's copy reviews: a dispatch on another branch does nothing", () => {
    assert.equal(review.if, "github.ref == 'refs/heads/main'")
    assert.equal(post.needs, 'review')
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

test('no pull-request code is checked out: its changed files arrive through the API as data', () => {
    const checkouts = review.steps.filter((entry) => entry.uses?.startsWith('actions/checkout@'))
    assert.equal(checkouts.length, 1)
    assert.deepEqual(checkouts[0].with, { 'persist-credentials': false })
    assert.equal(arg('--add-dir'), undefined)
    const resolveHead = step(review, 'Resolve the exact head and the diff').run
    assert.match(resolveHead, /head_repo" != "\$GITHUB_REPOSITORY"/)
    // Diff and inventory are pinned to the same base and head as the contents, never the live PR.
    assert.match(resolveHead, /compare="repos\/\$GITHUB_REPOSITORY\/compare\/\$base\.\.\.\$sha"/)
    assert.match(resolveHead, /gh api "\$compare" -H 'Accept: application\/vnd\.github\.diff'/)
    assert.match(resolveHead, /gh api "\$compare\?per_page=1"/)
    assert.doesNotMatch(resolveHead, /pulls\/\$PR\/files|pulls\/\$PR" -H/)
    assert.match(resolveHead, /\[ "\$changed" -gt 300 \]/)
    // Each file is fetched at the exact head SHA, by a decoded path kept inside head/.
    assert.match(resolveHead, /contents\/\$encoded_path\?ref=\$sha/)
    assert.match(resolveHead, /@base64/)
    assert.match(resolveHead, /\*\/\.\.\/\*/)
    assert.match(resolveHead, /head -c 1000000/)
    assert.match(String(claude.with.prompt), /\.claude-review\/head\//)
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
    assert.match(
        posting.run,
        /^node scripts\/security\/post-claude-review\.mjs < "\$REVIEW_FILE" > receipt\.tmp\n/,
    )
    assert.match(posting.run, /if \[ -s receipt\.tmp \]; then mv receipt\.tmp "\$RECEIPT_FILE"; fi/)
    assert.deepEqual(Object.keys(posting.env).sort(), [
        'GH_TOKEN',
        'HEAD_SHA',
        'PR_NUMBER',
        'RECEIPT_FILE',
        'REVIEW_FILE',
        'RUN_ATTEMPT',
        'RUN_ID',
    ])
    // Only this run can upload into itself: the artifact binds the posted review to the run.
    const upload = step(post, 'Upload the review receipt')
    assert.match(upload.uses, /^actions\/upload-artifact@[0-9a-f]{40}$/)
    assert.equal(upload.with.name, 'claude-review-receipt-${{ github.run_attempt }}')
    assert.equal(upload.with.path, posting.env.RECEIPT_FILE)
    assert.equal(posting.env.RUN_ID, '${{ github.run_id }}')
    assert.doesNotMatch(JSON.stringify(post), /CLAUDE_CODE_OAUTH_TOKEN/)
})

test('the review travels as an artifact of this run, never as one large environment entry', () => {
    // One environment entry is capped at about 128 KiB on Linux; a long multibyte review is not.
    assert.doesNotMatch(TEXT, /structured_output \}\}/)
    assert.deepEqual(review.outputs, {
        ready: '${{ steps.result.outputs.ready }}',
        artifact: '${{ steps.result.outputs.artifact }}',
        sha: '${{ steps.head.outputs.sha }}',
    })
    assert.equal(post.if, "needs.review.outputs.ready == 'true'")
    const extract = step(review, 'Extract the structured review')
    assert.deepEqual(extract.env, { EXECUTION_FILE: '${{ steps.claude.outputs.execution_file }}' })
    assert.match(extract.run, /jq -ce '\[\.\[\] \| select\(\.type == "result"\)\] \| last/)
    assert.match(extract.run, /select\(\.subtype == "success" and \(\.is_error \| not\)\)/)
    const upload = step(review, 'Upload the structured review')
    assert.match(upload.uses, /^actions\/upload-artifact@[0-9a-f]{40}$/)
    // The review attempt names its artifact, and post downloads exactly that name: re-running
    // only a failed post job raises github.run_attempt but keeps the review job's outputs.
    assert.match(extract.run, /echo "artifact=claude-review-result-\$GITHUB_RUN_ATTEMPT"/)
    assert.equal(upload.with.name, '${{ steps.result.outputs.artifact }}')
    assert.equal(upload.with['if-no-files-found'], 'error')
    const download = step(post, 'Download the structured review')
    assert.match(download.uses, /^actions\/download-artifact@[0-9a-f]{40}$/)
    assert.equal(download.with.name, '${{ needs.review.outputs.artifact }}')
    assert.doesNotMatch(
        JSON.stringify(post.steps),
        /claude-review-result-\$\{\{ github\.run_attempt/,
    )
    assert.equal(step(post, 'Post the review').env.REVIEW_FILE, `${download.with.path}/review.json`)
})
