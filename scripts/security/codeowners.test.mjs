// CG-AUD-20261028-A01: CODEOWNERS lost its default owner on 2026-03-24 when a
// markdown formatter turned `* @qnbs` into the bullet `- @qnbs` (a pattern for
// a file literally named "-"). GitHub reports no syntax error for that, so this
// test is what notices: a default rule, no bullet lines, well-formed rules, and
// explicit owners for every file that steers agents or CI.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const ROOT = path.resolve(import.meta.dirname, '../..')

/**
 * The owner of every rule. CODEOWNERS is last-match-wins, so pinning only the
 * control-plane entries would let a later broad rule (say `/*.md @other`) take
 * them over; pinning every rule closes that. Handing paths to another account
 * is an owner decision and has to change this file too.
 */
export const EXPECTED_OWNERS = ['@qnbs']

/** `@user` or `@org/team`; a lone `@` or a typo-shaped handle is not an owner. */
const OWNER = /^@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\/[A-Za-z0-9._-]+)?$/

/** Paths that instruct agents or run CI; each needs its own CODEOWNERS entry. */
export const CONTROL_PLANE_PATHS = [
    '/CODEOWNERS',
    '/AGENTS.md',
    '/CLAUDE.md',
    '/.github/',
    '/.github/copilot-instructions.md',
    '/.github/workflows/',
    '/.github/actions/',
    '/.devcontainer/',
    '/.vscode/',
    '/.mcp.json',
    '/.claude/',
    '/graphify-out/',
]

/** Non-comment, non-blank lines as [pattern, ...owners]. */
export function parseCodeowners(text) {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => line.split(/\s+/))
}

/** Problems in a CODEOWNERS text; empty when it is sound. */
export function codeownersProblems(text) {
    const problems = []
    const rules = parseCodeowners(text)
    for (const [pattern, ...owners] of rules) {
        if (pattern.startsWith('-'))
            problems.push(`markdown bullet instead of a pattern: "${pattern} ${owners.join(' ')}"`)
        if (owners.length === 0 || !owners.every((owner) => OWNER.test(owner))) {
            problems.push(`rule without a valid @owner: "${pattern} ${owners.join(' ')}"`)
        }
    }
    if (!rules.some(([pattern]) => pattern === '*')) problems.push('no default "*" rule')
    const patterns = new Set(rules.map(([pattern]) => pattern))
    for (const required of CONTROL_PLANE_PATHS) {
        if (!patterns.has(required)) problems.push(`no explicit entry for ${required}`)
    }
    for (const [pattern, ...owners] of rules) {
        if (owners.join(' ') !== EXPECTED_OWNERS.join(' ')) {
            problems.push(
                `${pattern} must be owned by ${EXPECTED_OWNERS.join(' ')}, not "${owners.join(' ')}"`,
            )
        }
    }
    return problems
}

test('CODEOWNERS has a default owner and owns every control-plane path', () => {
    assert.deepEqual(codeownersProblems(readFileSync(path.join(ROOT, 'CODEOWNERS'), 'utf8')), [])
})

test('the 2026-03-24 markdown-bullet regression is caught', () => {
    const broken = ['# Solo-dev', '', '- @qnbs', '', '/.github/ @qnbs'].join('\n')
    const problems = codeownersProblems(broken)
    assert.ok(
        problems.some((p) => p.startsWith('markdown bullet')),
        problems.join('; '),
    )
    assert.ok(problems.includes('no default "*" rule'))
    assert.ok(problems.some((p) => p === 'no explicit entry for /AGENTS.md'))
})

test('handing the default or a control-plane path to another owner is caught', () => {
    const rules = ['* @qnbs', ...CONTROL_PLANE_PATHS.map((p) => `${p} @qnbs`)]
    const reassigned = rules.map((r) =>
        r.startsWith('/CLAUDE.md ') ? '/CLAUDE.md @someone-else' : r,
    )
    reassigned[0] = '* @qnbs @someone-else'
    assert.deepEqual(codeownersProblems(reassigned.join('\n')), [
        '* must be owned by @qnbs, not "@qnbs @someone-else"',
        '/CLAUDE.md must be owned by @qnbs, not "@someone-else"',
    ])
})

test('a later broad rule cannot take over a control-plane path', () => {
    const rules = ['* @qnbs', ...CONTROL_PLANE_PATHS.map((p) => `${p} @qnbs`), '/*.md @other']
    assert.deepEqual(codeownersProblems(rules.join('\n')), [
        '/*.md must be owned by @qnbs, not "@other"',
    ])
})

test('a lone @ is not an owner', () => {
    const rules = ['* @qnbs', ...CONTROL_PLANE_PATHS.map((p) => `${p} @qnbs`), '/docs/ @']
    const problems = codeownersProblems(rules.join('\n'))
    assert.ok(problems.includes('rule without a valid @owner: "/docs/ @"'), problems.join('; '))
})

test('no other CODEOWNERS file shadows the root one', () => {
    // GitHub reads .github/CODEOWNERS first, then the root, then docs/.
    for (const shadow of ['.github/CODEOWNERS', 'docs/CODEOWNERS']) {
        assert.equal(
            existsSync(path.join(ROOT, shadow)),
            false,
            `${shadow} would replace the root rules`,
        )
    }
})

test('a rule without an owner is caught', () => {
    const text = ['* @qnbs', ...CONTROL_PLANE_PATHS.map((p) => `${p} @qnbs`), '/docs/'].join('\n')
    assert.deepEqual(codeownersProblems(text), [
        'rule without a valid @owner: "/docs/ "',
        '/docs/ must be owned by @qnbs, not ""',
    ])
})
