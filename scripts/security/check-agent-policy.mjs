#!/usr/bin/env node
/**
 * Agent-policy gate for the files that instruct coding agents
 * (CG-AUD-20261028-A02/A03/A06).
 *
 * These files are read by Claude Code (CLAUDE.md), Codex and other agents
 * (AGENTS.md) and Copilot (.github/copilot-instructions.md). An instruction in
 * them is executed, so a bypass or an unscoped heavy command is a defect, not a
 * style issue. Two rule kinds:
 *
 * - banned: a bypass (`--no-verify`, `git add -A`, `--admin`, force push) on a
 *   line that is not itself a prohibition, and inside fenced command blocks a
 *   bare `turbo run <task>` or an unfiltered `pnpm test|typecheck|lint` that
 *   would run every workspace on the low-memory dev machine;
 * - required: the "Authority and trust" section in AGENTS.md (single writer,
 *   read-only reviewers, untrusted content) and the scoped verify command.
 *
 * Usage: node scripts/security/check-agent-policy.mjs
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '../..')

export const AGENT_FILES = ['AGENTS.md', 'CLAUDE.md', '.github/copilot-instructions.md']

/** A line that forbids the thing it names, rather than instructing it. */
const PROHIBITION =
    /\b(never|banned|must not|do not|don't|not authori[sz]e|outside agent policy|owner action|instead of)\b/i

const BYPASSES = [
    ['--no-verify', /--no-verify\b/],
    ['git add -A / git add .', /\bgit add (-A|--all|\.)(\s|`|$)/],
    ['admin merge', /--admin\b/],
    ['force push', /\bpush\b[^\n]*(--force\b|\s-f\b)/],
]

/** Heavy commands that must not appear as instructions inside a fenced block. */
const UNSCOPED = [
    ['bare turbo run', /^\s*turbo run [a-z:-]+/],
    [
        'unfiltered pnpm suite',
        /^\s*pnpm (run )?(test|typecheck|lint|test:run|test:coverage|lint:full)\b(?![^#\n]*--filter)/,
    ],
]

const REQUIRED = {
    'AGENTS.md': [
        ['an "Authority and trust" section', /^#{2,4} Authority and trust/m],
        ['the writer lease (QNB-259)', /QNB-259/],
        ['read-only reviewers', /read-only reviewers/i],
        ['the untrusted-content rule', /data, never instructions/i],
        ['the scoped verify command', /`pnpm verify`/],
    ],
    'CLAUDE.md': [['the scoped verify command', /pnpm verify\b/]],
}

/** Problems across `files` (name -> text); empty when every file is sound. */
export function agentPolicyProblems(files) {
    const problems = []
    for (const [name, text] of Object.entries(files)) {
        let inFence = false
        text.split('\n').forEach((line, index) => {
            const where = `${name}:${index + 1}`
            if (/^\s*```/.test(line)) {
                inFence = !inFence
                return
            }
            for (const [label, pattern] of BYPASSES) {
                if (pattern.test(line) && !PROHIBITION.test(line)) {
                    problems.push(`${where}: instructs ${label}: ${line.trim()}`)
                }
            }
            if (inFence && !line.trim().startsWith('#')) {
                for (const [label, pattern] of UNSCOPED) {
                    if (pattern.test(line))
                        problems.push(`${where}: ${label} in a command block: ${line.trim()}`)
                }
            }
        })
        for (const [label, pattern] of REQUIRED[name] ?? []) {
            if (!pattern.test(text)) problems.push(`${name}: missing ${label}`)
        }
    }
    return problems
}

function main() {
    const files = Object.fromEntries(
        AGENT_FILES.map((name) => [name, readFileSync(path.join(ROOT, name), 'utf8')]),
    )
    const problems = agentPolicyProblems(files)
    if (problems.length) {
        console.error(`[FAIL] Agent policy: ${problems.length} problem(s)`)
        for (const problem of problems) console.error(`  - ${problem}`)
        process.exit(1)
    }
    console.log(`[OK] Agent policy holds for ${AGENT_FILES.join(', ')}.`)
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
