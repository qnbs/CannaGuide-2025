import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { parse } from 'yaml'

const read = (path) => parse(readFileSync(path, 'utf8'))
const ci = read('.github/workflows/ci.yml')
const health = read('.github/workflows/dependency-health.yml')
const AUDIT_JOBS = [
    ['ci.yml rust-audit', ci.jobs['rust-audit']],
    ['dependency-health.yml rust-advisories', health.jobs['rust-advisories']],
]
const installStep = (job) => job.steps.find((step) => step.env?.CARGO_AUDIT_VERSION)

test('each cargo audit runs a pinned release only after its checksum matches', () => {
    for (const [where, job] of AUDIT_JOBS) {
        assert.ok(job, `no job: ${where}`)
        const install = installStep(job)
        assert.ok(install, `no install step: ${where}`)
        assert.match(install.env.CARGO_AUDIT_VERSION, /^\d+\.\d+\.\d+$/, where)
        assert.match(install.env.CARGO_AUDIT_SHA256, /^[0-9a-f]{64}$/, where)
        // The checksum is checked before the archive is unpacked or anything in it runs.
        const script = install.run
        assert.ok(script.includes('set -euo pipefail'), where)
        const checked = script.indexOf('sha256sum -c')
        assert.ok(checked !== -1 && checked < script.indexOf('tar -xzf'), where)
        const audit = job.steps.find((step) => step.run?.includes(' audit --file '))
        assert.ok(audit, `no audit step: ${where}`)
        assert.match(audit.run, /--file apps\/desktop\/src-tauri\/Cargo\.lock/, where)
        assert.doesNotMatch(audit.run, /\$\{\{/, where)
        const checkout = job.steps.find((step) => step.uses?.startsWith('actions/checkout@'))
        assert.equal(checkout.with['persist-credentials'], false, where)
    }
})

test('both cargo audits use the same release and checksum', () => {
    const [first, second] = AUDIT_JOBS.map(([, job]) => installStep(job).env)
    assert.deepEqual(first, second)
})

test('CI audits on desktop changes without making it a required check', () => {
    const job = ci.jobs['rust-audit']
    assert.equal(job.if, "needs.changes.outputs.desktop == 'true'")
    assert.deepEqual(job.permissions, { contents: 'read' })
    // Owner decision (2026-11-25): visible, but an advisory against an untouched crate must
    // not block unrelated merges, so the job stays out of the aggregated CI Status.
    assert.ok(!ci.jobs['ci-status'].needs.includes('rust-audit'))
})

test('Dependency Health runs the audit on its daily schedule', () => {
    assert.ok(health.on.schedule?.length > 0, 'no schedule')
    assert.equal(health.jobs['rust-advisories'].if, undefined)
})
