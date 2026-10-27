import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const WORKFLOWS = resolve(dirname(fileURLToPath(import.meta.url)), '../.github/workflows')
const files = readdirSync(WORKFLOWS)
    .filter((name) => name.endsWith('.yml'))
    .map((name) => ({ name, text: readFileSync(join(WORKFLOWS, name), 'utf8') }))

// Top-level jobs with the part before `steps:` (name, if, needs, permissions).
function jobs(text) {
    const lines = text.split('\n')
    const start = lines.indexOf('jobs:')
    if (start === -1) return []
    const result = []
    for (let index = start + 1; index < lines.length; index += 1) {
        const match = /^ {4}([\w-]+):$/.exec(lines[index])
        if (!match) continue
        let end = index + 1
        while (end < lines.length && !/^ {4}[\w-]+:$/.test(lines[end])) end += 1
        const body = lines.slice(index + 1, end).join('\n')
        result.push({ id: match[1], header: body.split(/\n {8}steps:/)[0], body })
        index = end - 1
    }
    return result
}

const FORK_GUARD = 'github.event.workflow_run.head_repository.full_name == github.repository'

test('workflow_run jobs that check out the triggering commit refuse fork runs', () => {
    // deploy.yml filtered only by `branches: [main]`, which matches a fork's own
    // `main` too, then built workflow_run.head_sha with pages/id-token write
    // (code-scanning alert 353, actions/untrusted-checkout).
    const checked = []
    for (const { name, text } of files) {
        if (!/^\s{4}workflow_run:/m.test(text)) continue
        const checksOutHead =
            /workflow_run\.head_sha/.test(text) &&
            /ref: \$\{\{ (env\.DEPLOY_SHA|github\.event\.workflow_run\.head_sha) \}\}/.test(text)
        if (!checksOutHead) continue
        for (const job of jobs(text)) {
            if (/^ {8}needs:/m.test(job.header)) continue
            checked.push(`${name}:${job.id}`)
            assert.ok(job.header.includes(FORK_GUARD), `${name} job ${job.id} lacks the fork guard`)
        }
    }
    assert.ok(checked.includes('deploy.yml:build'), `checked: ${checked.join(', ')}`)
})

const TRUSTED_MAIN_RUN =
    "github.event.workflow_run.head_branch == 'main' && " +
    "(github.event.workflow_run.event == 'push' || github.event.workflow_run.event == 'workflow_dispatch') && " +
    FORK_GUARD

// The whole expression, not its fragments: an added `|| true` must fail the test.
const squash = (value) => value.replace(/\s+/g, ' ').trim()

test('deploy.yml publishes only for a push or dispatch of main', () => {
    const text = files.find((file) => file.name === 'deploy.yml').text
    const build = jobs(text).find((job) => job.id === 'build')
    const condition = /^ {8}if: >-\n((?: {12}.*\n)+)/m.exec(build.header)
    assert.ok(condition, 'build job has no folded if: block')
    assert.equal(
        squash(condition[1]),
        squash(`github.event.workflow_run.conclusion == 'success' && ${TRUSTED_MAIN_RUN}`),
    )

    // Workflow-level concurrency is evaluated before any job condition, so a fork
    // run must not land in the group that cancels trusted builds.
    const group = /^concurrency:\n {4}group: (.*)$/m.exec(text)?.[1] ?? ''
    assert.equal(
        squash(group),
        squash(
            `\${{ (${TRUSTED_MAIN_RUN}) && 'pages-main' || ` +
                "format('pages-ignored-{0}', github.event.workflow_run.id) }}",
        ),
    )
})

test('CodeQL and Scorecard each upload from exactly one workflow', () => {
    // A second uploader for the same tool creates a duplicate code-scanning
    // configuration that later goes stale ("not configured correctly").
    // Running Scorecard locally without uploading (security-scan.yml) is fine.
    const users = (pattern) =>
        files.filter(({ text }) => pattern.test(text)).map(({ name }) => name)
    assert.deepEqual(users(/github\/codeql-action\/(init|analyze)@/), ['codeql.yml'])
    const scorecardUploads = files
        .filter(({ text }) => /ossf\/scorecard-action@/.test(text))
        .filter(({ text }) => /sarif_file: scorecard-results\.sarif/.test(text))
        .map(({ name }) => name)
    assert.deepEqual(scorecardUploads, ['scorecard.yml'])
})
