import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

function section(markdown, heading) {
    let start
    let length
    if (heading instanceof RegExp) {
        const match = heading.exec(markdown)
        assert.ok(match, `missing heading ${heading}`)
        start = match.index
        length = match[0].length
    } else {
        start = markdown.indexOf(heading)
        assert.ok(start >= 0, `missing heading ${heading}`)
        length = heading.length
    }
    const rest = markdown.slice(start + length)
    const next = rest.search(/\n## /)
    return next === -1 ? rest : rest.slice(0, next)
}

function jobBody(workflow, jobId) {
    const marker = `\n    ${jobId}:\n`
    const start = workflow.indexOf(marker)
    assert.ok(start >= 0, `missing job ${jobId}`)
    const rest = workflow.slice(start + marker.length)
    const next = rest.search(/\n    [a-z0-9-]+:\n/)
    return next === -1 ? rest : rest.slice(0, next)
}

test('current CI audit policy matches the blocking Chromium gate', () => {
    const audit = readFileSync('.github/CI-AUDIT.md', 'utf8')
    const current = section(audit, /## Current policy \(\d{4}-\d{2}-\d{2}\)/)
    assert.match(current, /`\u2705 CI Status`/)
    assert.match(current, /Chromium E2E\s+\|\s+Blocking/)
    assert.match(current, /needs\.e2e\.result` is `success`/)
    assert.match(current, /Signatures\s+\|\s+Required/)
    assert.doesNotMatch(current, /E2E is advisory/i)
    assert.doesNotMatch(current, /Signatures:\*\* disabled/)

    const workflowCount = readdirSync('.github/workflows').filter(
        (name) => name.endsWith('.yml') || name.endsWith('.yaml'),
    ).length
    const marked = current.match(/workflow-inventory: (\d+)/)
    assert.ok(marked, 'workflow-inventory count missing from the current policy section')
    assert.equal(Number(marked[1]), workflowCount)

    const ci = readFileSync('.github/workflows/ci.yml', 'utf8')
    const versionInCi = ci.match(/^# workflow-version:\s*(\S+)/m)
    const versionInAudit = current.match(/`workflow-version:\s*([^`]+)`/)
    assert.ok(versionInCi, 'ci.yml workflow-version missing')
    assert.ok(versionInAudit, 'audit workflow-version missing')
    assert.equal(versionInAudit[1], versionInCi[1])

    const ciStatus = jobBody(ci, 'ci-status')
    assert.match(ciStatus, /needs: \[changes, build, test, verify, security, rust, e2e\]/)
    assert.match(
        ciStatus,
        /if \[\[ "\$\{\{ needs\.e2e\.result \}\}" != "success" \]\]; then/,
    )

    const security = readFileSync('SECURITY.md', 'utf8')
    const operations = section(security, '## CI operations')
    assert.match(operations, /\u2705 CI Status/)
    assert.match(operations, /blocking Chromium E2E/)
    assert.doesNotMatch(operations, /quality \+ security/)
})
