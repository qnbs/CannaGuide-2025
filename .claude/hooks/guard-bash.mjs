#!/usr/bin/env node
/**
 * PreToolUse guard for Claude Code's Bash tool (CG-AUD-20261028-A-S4).
 *
 * CLAUDE.md bans hook bypasses, admin merges, force pushes to main, unscoped
 * heavy commands and a bare `pnpm install`. Instructions only shape what an
 * agent tries; this hook enforces it. `.claude/settings.json` also carries
 * deny rules, but Bash deny rules match command text by prefix and miss a flag
 * in another position or a `sh -c` wrapper -- the docs call them "not a
 * security boundary" -- so the checks that matter live here.
 *
 * Heredoc bodies and quoted strings are data (a commit message may name
 * `--no-verify` while explaining the ban) and are dropped first, unless the
 * command evaluates text (`sh -c`, `eval`, a heredoc fed to a shell) or a
 * double-quoted string runs a command substitution.
 *
 * Input: the hook JSON on stdin. Output: a `deny` decision with the reasons,
 * or nothing (normal permission flow). Unparseable input is no decision:
 * a broken guard must not take the Bash tool down with it.
 */
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { heavyCommandRule, shellCommands } from '../../scripts/security/check-agent-policy.mjs'

const EVALUATES_TEXT = /\b(?:ba|z|da)?sh\s+(?:-\w+\s+)*-c\b|\beval\b|\bxargs\b/

/** The command with heredoc bodies and inert quoted strings removed. */
export function stripData(command) {
    const kept = []
    let delimiter = null
    let keepBody = false
    for (const line of command.split('\n')) {
        if (delimiter !== null) {
            if (line.trim() === delimiter) delimiter = null
            else if (keepBody) kept.push(line)
            continue
        }
        kept.push(line)
        const heredoc = /<<-?\s*(['"]?)([A-Za-z_][\w-]*)\1/.exec(line)
        if (heredoc) {
            delimiter = heredoc[2]
            keepBody = /(?:^|[|;&]\s*)(?:ba|z|da)?sh\b|\bsource\b|\beval\b/.test(line)
        }
    }
    const text = kept.join('\n')
    if (EVALUATES_TEXT.test(text)) return text
    return text
        .replace(/'[^']*'/g, "''")
        .replace(/"(?:[^"\\]|\\.)*"/g, (quoted) => (/\$\(|`/.test(quoted) ? quoted : '""'))
}

const RULES = [
    ['hook bypass (--no-verify)', (c) => /^git\s+\S.*\s--no-verify\b/.test(c)],
    [
        'hook bypass (git commit -n)',
        (c) => /^git\s+commit\b/.test(c) && /\s-[A-Za-z]*n[A-Za-z]*(?=\s|$)/.test(c),
    ],
    ['hook bypass (core.hooksPath)', (c) => /^git\b.*\bcore\.hooksPath\b/.test(c)],
    ['admin merge (--admin)', (c) => /^gh\s+pr\s+merge\b.*\s--admin\b/.test(c)],
    [
        'force push (--force / -f / +refspec)',
        (c) => /^git\s+push\b/.test(c) && /\s(?:--force(?=\s|$)|-f\b|\+[\w./-]+)/.test(c),
    ],
    [
        'force push to main',
        (c) =>
            /^git\s+push\b.*--force-(?:with-lease|if-includes)/.test(c) &&
            /[\s:](?:origin\/)?(?:main|master)(?=\s|$)/.test(c),
    ],
    [
        'git clean -x (deletes ignored files: node_modules, caches, local config)',
        (c) =>
            /^git\s+clean\b/.test(c) && /\s-[A-Za-z]*x/.test(c) && /\s-[A-Za-z]*f|--force/.test(c),
    ],
    [
        'git add -A / git add . (stage files explicitly)',
        (c) => /^git\s+add\s+(?:-A|--all|\.)(?=\s|$)/.test(c),
    ],
    [
        'pnpm install without --frozen-lockfile (re-resolves carets; trips minimumReleaseAge)',
        (c) => /^pnpm\s+(?:install|i)(?=\s|$)/.test(c) && !/--frozen-lockfile\b/.test(c),
    ],
]

/** Every rule the command breaks; empty when it may run. */
export function bashViolations(command) {
    const text = stripData(command)
    const violations = new Set()
    if (/(?:^|[\s;&|(])HUSKY=0\b/.test(text)) violations.add('hook bypass (HUSKY=0)')
    // Substitutions, subshells, groups and the quotes of `sh -c '...'` start a
    // new command; lines are judged one by one (shellCommands drops everything
    // after a `#`).
    const subcommands = text
        .replace(/\$\(|[`(){}'"]/g, ' ; ')
        .split('\n')
        .flatMap((line) => shellCommands(line))
    for (const sub of subcommands) {
        for (const [label, test] of RULES) if (test(sub)) violations.add(label)
        const heavy = heavyCommandRule(sub)
        if (heavy && !(heavy === 'bare turbo run' && /--filter\b/.test(sub))) {
            violations.add(
                `${heavy} (use pnpm verify / verify:test / verify:lint, or one spec without --)`,
            )
        }
    }
    return [...violations]
}

function main() {
    let input
    try {
        input = JSON.parse(readFileSync(0, 'utf8'))
    } catch {
        return
    }
    if (input?.tool_name !== 'Bash' || typeof input.tool_input?.command !== 'string') return
    const violations = bashViolations(input.tool_input.command)
    if (!violations.length) return
    process.stdout.write(
        JSON.stringify({
            hookSpecificOutput: {
                hookEventName: 'PreToolUse',
                permissionDecision: 'deny',
                permissionDecisionReason: `Blocked by .claude/hooks/guard-bash.mjs (CLAUDE.md working rules): ${violations.join('; ')}.`,
            },
        }),
    )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
