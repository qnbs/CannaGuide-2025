#!/usr/bin/env node
/**
 * Agent-policy gate for the files that instruct coding agents
 * (CG-AUD-20261028-A02/A03/A06).
 *
 * These files are read by Claude Code (CLAUDE.md), Codex and other agents
 * (AGENTS.md), Copilot (.github/copilot-instructions.md) and the review-loop
 * runbook every agent follows. An instruction in them is executed, so a bypass
 * or an unscoped heavy command is a defect, not a style issue. Rules:
 *
 * - banned: a bypass (`--no-verify`, `git add -A`, `--admin`, force push) in a
 *   clause that does not itself forbid it; inside fenced blocks a bare
 *   `turbo run <task>`; in fenced blocks and inline code an unfiltered
 *   `pnpm test|typecheck|lint` or a filtered whole-suite `test:run`;
 * - fact: job names a line gives as `CI Status` requirements must be in the
 *   `needs` list of the ci-status job;
 * - required: the "Authority and trust" section in AGENTS.md and an
 *   affirmative (not negated) scoped verify command.
 *
 * A prohibition only exempts its own clause: the line is split at sentence
 * and contrast boundaries, so "Never use X, but retry with --no-verify" or
 * "Use --no-verify instead of waiting" still fail.
 *
 * Usage: node scripts/security/check-agent-policy.mjs
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '../..')

export const AGENT_FILES = [
    'AGENTS.md',
    'CLAUDE.md',
    '.github/copilot-instructions.md',
    'docs/PR-REVIEW-LOOP.md',
]

/**
 * Clause boundaries: sentence ends, ` -- ` and contrast words. Not `;`: it
 * separates items of one list that share the leading negation.
 */
const CLAUSE_BREAK =
    /[.!?](?=\s|$)|\s--\s|\b(?:but|however|instead|then|unless|otherwise|except)\b/gi
/** A negation that, before the match in the same clause, forbids it. */
const NEGATION_BEFORE = /\b(never|no|not|banned|forbidden|don't|do not|must not|avoid|without)\b/i
/** A postfix that forbids what the clause names ("`--no-verify` is banned"). */
const NEGATION_AFTER =
    /\b(is|are)\b[\w\s]{0,24}\b(banned|forbidden|not allowed)\b|\bowner action\b|\boutside agent policy\b/i

/** Markdown emphasis and code markers are not words; backticks become spaces. */
const strip = (text) => text.replace(/[*`_]/g, (c) => (c === '`' ? ' ' : ''))

/** True when the occurrence at `index` in `line` sits in a clause that forbids it. */
export function isForbiddenAt(line, index) {
    const plain = strip(line)
    const at = strip(line.slice(0, index)).length
    let start = 0
    let end = plain.length
    for (const m of plain.matchAll(CLAUSE_BREAK)) {
        if (m.index < at) {
            start = m.index + m[0].length
        } else {
            end = m.index
            break
        }
    }
    return (
        NEGATION_BEFORE.test(plain.slice(start, at)) || NEGATION_AFTER.test(plain.slice(start, end))
    )
}

const BYPASSES = [
    ['--no-verify', /--no-verify\b/g],
    ['git add -A / git add .', /\bgit add (?:-A|--all|\.)(?=\s|`|$)/g],
    ['admin merge', /--admin\b/g],
    ['force push', /\bpush\b[^\n]*?(?:--force\b|\s-f\b)/g],
]

const UNFILTERED = [
    'unfiltered pnpm suite',
    /^\s*pnpm (run )?(test|typecheck|lint|test:run|test:coverage|lint:full)(?=\s|$)(?![^#\n]*--filter)/,
]
/** `--filter <pkg> test:run` with no spec (options only) runs the whole suite. */
const WHOLE_SUITE = [
    'whole-suite test run',
    /^\s*pnpm --filter \S+ (run )?(test|test:run|test:coverage)(\s+--?[\w=:-]+)*\s*(#.*)?$/,
]
const BARE_TURBO = ['bare turbo run', /^\s*turbo run [a-z:-]+/]

const REQUIRED = {
    'AGENTS.md': [
        ['an "Authority and trust" section', /^#{2,4} Authority and trust/m],
        ['the writer lease (QNB-259)', /QNB-259/],
        ['read-only reviewers', /read-only reviewers/i],
        ['the untrusted-content rule', /data, never instructions/i],
    ],
}
/** Must appear at least once in an affirmative (not forbidding) clause. */
const AFFIRMED = {
    'AGENTS.md': [['the scoped verify command', /pnpm verify\b/g]],
    'CLAUDE.md': [['the scoped verify command', /pnpm verify\b/g]],
}

/** Job ids in the `needs:` list of ci.yml's ci-status job. */
export function ciStatusNeeds(ciYaml) {
    const job = ciYaml.slice(ciYaml.indexOf('\n    ci-status:\n'))
    const list = /needs: \[([^\]]+)\]/.exec(job)?.[1] ?? ''
    return new Set(
        list
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
    )
}

function lineProblems(name, line, where, inFence, needs) {
    const problems = []
    for (const [label, pattern] of BYPASSES) {
        for (const m of line.matchAll(pattern)) {
            if (!isForbiddenAt(line, m.index)) {
                problems.push(`${where}: instructs ${label}: ${line.trim()}`)
                break
            }
        }
    }
    if (inFence) {
        if (line.trim().startsWith('#')) return problems
        for (const [label, pattern] of [BARE_TURBO, UNFILTERED, WHOLE_SUITE]) {
            if (pattern.test(line))
                problems.push(`${where}: ${label} in a command block: ${line.trim()}`)
        }
        return problems
    }
    // Inline code: only the pnpm rules -- `turbo run ...` appears inline in the
    // warnings that explain why it is banned.
    for (const m of line.matchAll(/`([^`]+)`/g)) {
        if (isForbiddenAt(line, m.index)) continue
        for (const [label, pattern] of [UNFILTERED, WHOLE_SUITE]) {
            if (pattern.test(m[1])) problems.push(`${where}: ${label} instructed inline: ${m[0]}`)
        }
    }
    if (needs && /CI Status/.test(line) && /\brequire/i.test(line)) {
        for (const m of line.matchAll(/`([a-z][a-z-]*)`/g)) {
            if (!needs.has(m[1])) {
                problems.push(
                    `${where}: names \`${m[1]}\` as a CI Status requirement, but ci-status needs ${[...needs].join(', ')}`,
                )
            }
        }
    }
    return problems
}

/** Problems across `files` (name -> text); empty when every file is sound. */
export function agentPolicyProblems(files, { needs } = {}) {
    const problems = []
    for (const [name, text] of Object.entries(files)) {
        let inFence = false
        text.split('\n').forEach((line, index) => {
            if (/^\s*```/.test(line)) {
                inFence = !inFence
                return
            }
            problems.push(...lineProblems(name, line, `${name}:${index + 1}`, inFence, needs))
        })
        for (const [label, pattern] of REQUIRED[name] ?? []) {
            if (!pattern.test(text)) problems.push(`${name}: missing ${label}`)
        }
        for (const [label, pattern] of AFFIRMED[name] ?? []) {
            const affirmed = text
                .split('\n')
                .some((line) =>
                    [...line.matchAll(pattern)].some((m) => !isForbiddenAt(line, m.index)),
                )
            if (!affirmed) problems.push(`${name}: missing ${label}`)
        }
    }
    return problems
}

function main() {
    const files = Object.fromEntries(
        AGENT_FILES.map((name) => [name, readFileSync(path.join(ROOT, name), 'utf8')]),
    )
    const needs = ciStatusNeeds(readFileSync(path.join(ROOT, '.github/workflows/ci.yml'), 'utf8'))
    const problems = agentPolicyProblems(files, { needs })
    if (problems.length) {
        console.error(`[FAIL] Agent policy: ${problems.length} problem(s)`)
        for (const problem of problems) console.error(`  - ${problem}`)
        process.exit(1)
    }
    console.log(`[OK] Agent policy holds for ${AGENT_FILES.join(', ')}.`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
