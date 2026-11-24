import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { parse } from 'yaml'

test('labeler does not use pull_request_target', () => {
    const yaml = readFileSync('.github/workflows/labeler.yml', 'utf8')
    assert.equal(yaml.includes('pull_request_target'), false)
    assert.match(yaml, /pull_request:\s*\n\s+types:\s*\[opened, synchronize, reopened\]/)
    assert.match(
        yaml,
        /if:\s*github\.event\.pull_request\.head\.repo\.full_name == github\.repository/,
    )
    assert.match(yaml, /contents:\s*read/)
    assert.match(yaml, /pull-requests:\s*write/)
    assert.match(yaml, /actions\/labeler@bf12e9b00b37c5c0ca2b87b79b2daf7891dbda13/)
    assert.equal(yaml.includes('actions/checkout'), false)
})

test('snyk scan cannot continue on error', () => {
    const yaml = readFileSync('.github/workflows/snyk.yml', 'utf8')
    const scanAt = yaml.indexOf('Snyk Open Source scan')
    assert.ok(scanAt > 0)
    const beforeScan = yaml.slice(0, scanAt)
    assert.equal(beforeScan.includes('continue-on-error'), false)
    const monitorAt = yaml.indexOf('Snyk Monitor')
    const scanBlock = yaml.slice(scanAt, monitorAt)
    assert.equal(scanBlock.includes('continue-on-error'), false)
})

test('ci runs the security policy node tests', () => {
    const yaml = readFileSync('.github/workflows/ci.yml', 'utf8')
    assert.match(yaml, /node --test --test-concurrency=1 \.\/scripts\/security\/\*\.test\.mjs/)
})

test('dependency health fails closed and still runs later checks', () => {
    const yaml = readFileSync('.github/workflows/dependency-health.yml', 'utf8')
    assert.equal(yaml.includes('continue-on-error'), false)
    assert.match(yaml, /id:\s*setup/)
    assert.match(yaml, /run: pnpm audit --audit-level=high --prod\s*$/m)
    assert.match(yaml, /run: pnpm audit --audit-level=high\s*$/m)
    const guarded = yaml.match(/if: always\(\) && steps\.setup\.outcome == 'success'/g) ?? []
    assert.equal(guarded.length, 5)
})

test('Scorecard workflow fails if publication retries do not succeed', () => {
    const yaml = readFileSync('.github/workflows/scorecard.yml', 'utf8')
    assert.match(yaml, /fail_on_publish_error:\s*true/)
    assert.match(yaml, /id:\s*scorecard/)
    const analysisJobStart = yaml.indexOf('    analysis:\n')
    const verificationJobStart = yaml.indexOf('    verify-publication:\n')
    assert.ok(analysisJobStart >= 0 && verificationJobStart > analysisJobStart)
    const analysisJob = yaml.slice(analysisJobStart, verificationJobStart)
    assert.match(
        analysisJob,
        /^        outputs:\s*\n            results_published:\s*\$\{\{\s*steps\.scorecard\.outputs\.results_published\s*\}\}/m,
    )

    const verificationJob = yaml.slice(yaml.indexOf('    verify-publication:'))
    assert.match(verificationJob, /needs:\s*analysis/)
    assert.match(verificationJob, /if:\s*\$\{\{\s*!cancelled\(\)\s*\}\}/)
    assert.doesNotMatch(verificationJob, /if:\s*always\(\)/)
    assert.match(verificationJob, /^        permissions:\s*\{\}\s*$/m)
    assert.match(verificationJob, /^        timeout-minutes:\s*\d+\s*$/m)
    assert.match(
        verificationJob,
        /RESULTS_PUBLISHED:\s*\$\{\{\s*needs\.analysis\.outputs\.results_published\s*\}\}/,
    )
    assert.match(verificationJob, /exit 1/)
})

test('Scorecard runs weekly and on demand, not on every push to main', () => {
    // A periodic supply-chain assessment, not a step of every merge (owner decision, 2026-11-24).
    const workflow = parse(readFileSync('.github/workflows/scorecard.yml', 'utf8'))
    assert.deepEqual(Object.keys(workflow.on).sort(), ['schedule', 'workflow_dispatch'])
    assert.equal(workflow.on.schedule.length, 1)
    assert.match(workflow.on.schedule[0].cron, /^\d+ \d+ \* \* [0-6]$/)
    // The publication gate itself is unchanged.
    const scorecard = workflow.jobs.analysis.steps.find((step) => step.id === 'scorecard')
    assert.equal(scorecard.with.publish_results, true)
    assert.equal(scorecard.with.fail_on_publish_error, true)
})

/** The verify step's script, run under bash with the given outputs of the analysis job. */
function runVerify(env) {
    const workflow = parse(readFileSync('.github/workflows/scorecard.yml', 'utf8'))
    const step = workflow.jobs['verify-publication'].steps.find(
        (entry) => entry.name === 'Require published Scorecard results',
    )
    assert.deepEqual(Object.keys(step.env).sort(), [
        'ANALYSIS_RESULT',
        'PUBLICATION_STATUS',
        'RESULTS_PUBLISHED',
    ])
    const result = spawnSync('bash', ['-e', '-c', step.run], {
        encoding: 'utf8',
        env: { PATH: process.env.PATH, ANALYSIS_RESULT: 'success', PUBLICATION_STATUS: '', ...env },
    })
    return { code: result.status, out: result.stdout }
}

test('Scorecard verification names why nothing was published', () => {
    const workflow = parse(readFileSync('.github/workflows/scorecard.yml', 'utf8'))
    assert.equal(
        workflow.jobs.analysis.outputs.publication_status,
        '${{ steps.scorecard.outputs.publication_status }}',
    )
    const upload = workflow.jobs.analysis.steps.find((s) => s.name === 'Upload Scorecard SARIF')
    assert.equal(upload.if, "always() && hashFiles('scorecard-results.sarif') != ''")

    assert.deepEqual(runVerify({ RESULTS_PUBLISHED: 'true', PUBLICATION_STATUS: '201' }), {
        code: 0,
        out: 'Scorecard results were published (HTTP 201).\n',
    })
    const cases = [
        // The 2026-11-24 outage: the action image did not pull, so no output was ever set.
        [
            { RESULTS_PUBLISHED: '', ANALYSIS_RESULT: 'failure' },
            /never reached publication: the analysis job ended 'failure'/,
        ],
        [
            { RESULTS_PUBLISHED: 'false', PUBLICATION_STATUS: 'skipped' },
            /did not attempt to publish/,
        ],
        [{ RESULTS_PUBLISHED: 'false', PUBLICATION_STATUS: 'error' }, /gave no answer/],
        [{ RESULTS_PUBLISHED: 'false', PUBLICATION_STATUS: '429' }, /retry later \(HTTP 429/],
        [{ RESULTS_PUBLISHED: 'false', PUBLICATION_STATUS: '408' }, /retry later \(HTTP 408/],
        [
            { RESULTS_PUBLISHED: 'false', PUBLICATION_STATUS: '403' },
            /rejected the results \(HTTP 403\)/,
        ],
        [{ RESULTS_PUBLISHED: 'false', PUBLICATION_STATUS: '503' }, /answered HTTP 503/],
        // Output text that is not a status is never echoed into a workflow command.
        [
            { RESULTS_PUBLISHED: 'false', PUBLICATION_STATUS: '::warning::x' },
            /never reached publication/,
        ],
        [
            { RESULTS_PUBLISHED: 'yes', PUBLICATION_STATUS: '201', ANALYSIS_RESULT: 'x;y' },
            /answered HTTP 201/,
        ],
    ]
    for (const [env, message] of cases) {
        const { code, out } = runVerify(env)
        assert.equal(code, 1, JSON.stringify(env))
        assert.match(out, new RegExp(`^::error::.*${message.source}`), JSON.stringify(env))
        assert.doesNotMatch(out, /::warning::x|x;y/)
    }
})
