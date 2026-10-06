import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

function section(markdown, heading) {
    const start = markdown.indexOf(heading)
    assert.ok(start >= 0, `missing heading ${heading}`)
    const rest = markdown.slice(start + heading.length)
    const next = rest.search(/\n## /)
    return next === -1 ? rest : rest.slice(0, next)
}

test('current CI audit policy matches the blocking Chromium gate', () => {
    const audit = readFileSync('.github/CI-AUDIT.md', 'utf8')
    const current = section(audit, '## Current policy (2026-10-06)')
    assert.match(current, /`\u2705 CI Status`/)
    assert.match(current, /Chromium E2E\s+\|\s+Blocking/)
    assert.match(current, /needs\.e2e\.result` is `success`/)
    assert.match(current, /Signatures\s+\|\s+Required/)
    assert.doesNotMatch(current, /E2E is advisory/i)
    assert.doesNotMatch(current, /Signatures:\*\* disabled/)
    assert.match(current, /workflow-inventory: 29/)

    const workflowCount = readdirSync('.github/workflows').filter((name) =>
        name.endsWith('.yml'),
    ).length
    const marked = current.match(/workflow-inventory: (\d+)/)
    assert.equal(Number(marked[1]), workflowCount)

    const ci = readFileSync('.github/workflows/ci.yml', 'utf8')
    assert.match(ci, /workflow-version: 2026-08-04-e2e-blocking/)
    assert.match(ci, /if \[\[ "\$\{\{ needs\.e2e\.result \}\}" != "success" \]\]/)

    const security = readFileSync('SECURITY.md', 'utf8')
    const operations = section(security, '## CI operations')
    assert.match(operations, /\u2705 CI Status/)
    assert.match(operations, /blocking Chromium E2E/)
    assert.doesNotMatch(operations, /quality \+ security/)
})
