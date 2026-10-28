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
 * Message text is data (a commit message may name `--no-verify` while
 * explaining the ban): the value of -m / --message / --body / --title and a
 * quoted-delimiter heredoc body are dropped. Every other quoted argument keeps
 * its words -- `"--no-verify"` is still the flag, `"Spec"` still a spec --
 * and only loses its shell separators. Text a shell will run is kept whole:
 * `sh -c` / `eval` arguments, a heredoc fed to a shell, and the `$(...)`
 * substitutions bash expands in an unquoted heredoc body.
 *
 * Input: the hook JSON on stdin. Output: a `deny` decision with the reasons,
 * or nothing (normal permission flow). Unparseable input is no decision:
 * a broken guard must not take the Bash tool down with it.
 */
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { heavyCommandRule, shellCommands } from '../../scripts/security/check-agent-policy.mjs'

// `-c` may be combined with other flags: `bash -lc '...'`.
const EVALUATES_TEXT = /\b(?:ba|z|da)?sh\s+(?:-\w+\s+)*-[A-Za-z]*c\b|\beval\b|\bxargs\b/

const SHELL_HEREDOC = /(?:^|[|;&]\s*)(?:ba|z|da)?sh\b|\bsource\b|\beval\b/
/** Options whose quoted value is message text (also `-am`, `gh -b` / `-t`). */
const MESSAGE_OPTION =
    /(\s(?:-[A-Za-z]*m|--message|--body|--title|--notes|-[bt])(?:=|\s+))('[^']*'|"(?:[^"\\]|\\.)*")/g
const SUBSTITUTION = /\$\(|`/
/** Quoted words stay; separators inside quotes are not separators. */
const inert = (inner) => inner.replace(/[;&|(){}<>#]/g, ' ')

/** The command with message text removed and other quoting resolved. */
export function stripData(command) {
    const kept = []
    let delimiter = null
    let body = 'drop'
    for (const line of command.split('\n')) {
        if (delimiter !== null) {
            if (line.trim() === delimiter) delimiter = null
            else if (body === 'keep') kept.push(line)
            else if (body === 'substitutions') {
                for (const m of line.matchAll(/\$\(([^()]*)\)|`([^`]*)`/g)) kept.push(m[1] ?? m[2])
            }
            continue
        }
        kept.push(line)
        const heredoc = /<<-?\s*(['"]?)([A-Za-z_][\w-]*)\1/.exec(line)
        if (heredoc) {
            delimiter = heredoc[2]
            // A quoted delimiter makes the body literal; an unquoted one
            // still expands $(...) even when the reader is not a shell.
            body = SHELL_HEREDOC.test(line) ? 'keep' : heredoc[1] ? 'drop' : 'substitutions'
        }
    }
    const text = kept.join('\n')
    if (EVALUATES_TEXT.test(text)) return text
    return text
        .replace(MESSAGE_OPTION, (all, option, quoted) =>
            SUBSTITUTION.test(quoted) ? all : `${option}MESSAGE`,
        )
        .replace(/'([^']*)'/g, (_, inner) => inert(inner))
        .replace(/"((?:[^"\\]|\\.)*)"/g, (all, inner) =>
            SUBSTITUTION.test(inner) ? all : inert(inner),
        )
}

/**
 * The command a wrapper runs: `command git ...`, `env -i X=1 pnpm ...`,
 * `timeout 60 git ...`, `nice -n 5 ...`, `sudo ...` are judged as what they run.
 */
const WRAPPER =
    /^(?:command|builtin|exec|nohup|time|stdbuf(?:\s+-\S+)*|nice(?:\s+-\S+(?:\s+\d+)?)*|sudo(?:\s+-\S+)*|env(?:\s+-\S+)*|timeout(?:\s+-\S+)*\s+\d\S*|[A-Za-z_]\w*=\S*)\s+/
export function unwrap(command) {
    let current = command.trim()
    for (
        let next = current.replace(WRAPPER, '');
        next !== current;
        next = current.replace(WRAPPER, '')
    ) {
        current = next
    }
    return current
}

/** Git global options come before the subcommand: `git -C . commit` is a commit. */
const GIT_OPTION_WITH_VALUE =
    /^(?:-C|-c|--git-dir|--work-tree|--namespace|--config-env|--exec-path)$/
export function normalizeGit(command) {
    const tokens = command.split(/\s+/)
    if (tokens[0] !== 'git') return command
    let index = 1
    while (index < tokens.length && tokens[index].startsWith('-')) {
        index += GIT_OPTION_WITH_VALUE.test(tokens[index]) ? 2 : 1
    }
    return ['git', ...tokens.slice(index)].join(' ')
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
            // main as a branch, a lease (`=main`, `=refs/heads/main:sha`) or a
            // refspec target (`HEAD:main`, `HEAD:refs/heads/main`).
            /(?:[\s:=]|refs\/heads\/)(?:origin\/)?(?:main|master)(?=[\s:]|$)/.test(c),
    ],
    [
        'git clean -x (deletes ignored files: node_modules, caches, local config)',
        (c) =>
            /^git\s+clean\b/.test(c) && /\s-[A-Za-z]*x/.test(c) && /\s-[A-Za-z]*f|--force/.test(c),
    ],
    [
        'git add -A / git add . (stage files explicitly)',
        // Any argument that means the whole tree, also after `--`.
        (c) =>
            /^git\s+add\b/.test(c) &&
            /\s(?:-[A-Za-z]*A[A-Za-z]*|--all|\.\/?|:\/|:\(top\)|\*)(?=\s|$)/.test(c),
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
    for (const raw of subcommands) {
        const sub = unwrap(raw)
        const git = normalizeGit(sub)
        for (const [label, test] of RULES) if (test(sub) || test(git)) violations.add(label)
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
