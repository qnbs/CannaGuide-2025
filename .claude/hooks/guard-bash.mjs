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

/**
 * A quoted string a shell will run: the argument right after `sh -c` (also
 * combined flags, `bash -lc`) or `eval`. Judged per quoted string on the text
 * just before it, so the word `eval` inside a commit message no longer turns
 * off data handling for the whole call (#650 review).
 */
const EVALUATED_ARGUMENT = /(?:\b(?:ba|z|da)?sh(?:\s+-\w+)*\s+-[A-Za-z]*c|\beval)\s+$/

const SHELL_HEREDOC = /(?:^|[|;&]\s*)(?:ba|z|da)?sh\b|\bsource\b|\beval\b/
/**
 * One left-to-right pass over every quoted string, so a quote character inside
 * the other kind of quotes (`"it's"`) never opens a span (#650 review). The
 * optional prefix marks a value that is data: the text of a message option
 * (-m / -am / --message / --body / --title / --notes / gh -b -t -f -F --field)
 * or of a variable assignment (`MSG="..."`, `R[key]='...'`).
 */
const QUOTED =
    /(\s(?:-[A-Za-z]*m|--message|--body|--title|--notes|-[bt]|-[fF]|--field|--raw-field)(?:=|\s+)|(?:^|[\s;&|(])[A-Za-z_]\w*(?:\[[^\]\s]*\])?=)?('[^']*'|"(?:[^"\\]|\\.)*")/g
/** Single quotes never substitute; in double quotes only an unescaped `$(` or backtick does. */
const SUBSTITUTION = /(?<!\\)(?:\$\(|`)/
const liveSubstitution = (quoted) => quoted.startsWith('"') && SUBSTITUTION.test(quoted)
/**
 * Quoted words stay; separators inside quotes are not separators. Backticks and
 * `$` go too: a string that reaches here does not substitute (single quotes, or
 * escaped in double quotes), so `\`...\`` in it is literal text.
 */
const inert = (inner) => inner.replace(/[;&|(){}<>#`$'"]/g, ' ')

/** The command with message text removed and other quoting resolved. */
export function stripData(command, bodies = []) {
    const kept = []
    let delimiter = null
    let body = 'drop'
    // A backslash-newline continues the command: `git commit \<NL> --no-verify`
    // is one command, and so is `pnpm install \<NL> --frozen-lockfile`.
    for (const line of command.replace(/\\\r?\n/g, ' ').split('\n')) {
        if (delimiter !== null) {
            if (line.trim() === delimiter) delimiter = null
            else if (body === 'keep') kept.push(line)
            else if (body === 'substitutions') {
                for (const m of line.matchAll(/\$\(([^()]*)\)|`([^`]*)`/g)) kept.push(m[1] ?? m[2])
            }
            continue
        }
        kept.push(line)
        // `<<<` is a here-string, not a heredoc.
        const heredoc = /(?<!<)<<(?!<)-?\s*(['"]?)([A-Za-z_][\w-]*)\1/.exec(line)
        if (heredoc) {
            delimiter = heredoc[2]
            // A quoted delimiter makes the body literal; an unquoted one
            // still expands $(...) even when the reader is not a shell.
            body = SHELL_HEREDOC.test(line) ? 'keep' : heredoc[1] ? 'drop' : 'substitutions'
        }
    }
    const text = kept.join('\n')
    const resolved = text.replace(QUOTED, (all, prefix = '', quoted, offset) => {
        // Bounded look-behind: a command's own prefix is short.
        if (!prefix && EVALUATED_ARGUMENT.test(text.slice(Math.max(0, offset - 200), offset))) {
            return all
        }
        if (liveSubstitution(quoted)) {
            const inner = liftSubstitutions(quoted.slice(1, -1), bodies)
            return prefix ? `${prefix}DATA` : inert(inner)
        }
        const inner = quoted.slice(1, -1)
        if (!prefix) return inert(inner)
        // HUSKY's own value stays: `HUSKY="0"` is still the switch.
        if (/^\s*HUSKY=$/.test(prefix)) return prefix + inner
        return `${prefix}DATA`
    })
    return liftSubstitutions(resolved, bodies)
}

/**
 * Moves every `$(...)` (nesting-aware) and backtick body into `bodies` and leaves
 * a placeholder argument, so the enclosing command stays whole --
 * `git commit -m "$(printf fix)" --no-verify` keeps its flag -- while each body
 * is judged as a command of its own (#650 review).
 */
function liftSubstitutions(text, bodies) {
    let out = ''
    for (let i = 0; i < text.length; i += 1) {
        if (text[i] === '\\') {
            out += text.slice(i, i + 2)
            i += 1
        } else if (text.startsWith('$(', i)) {
            let depth = 1
            let j = i + 2
            for (; j < text.length && depth > 0; j += 1) {
                if (text[j] === '(') depth += 1
                else if (text[j] === ')') depth -= 1
            }
            bodies.push(text.slice(i + 2, depth === 0 ? j - 1 : j))
            out += ' SUBST '
            i = j - 1
        } else if (text[i] === '`') {
            const end = text.indexOf('`', i + 1)
            const stop = end === -1 ? text.length : end
            bodies.push(text.slice(i + 1, stop))
            out += ' SUBST '
            i = stop
        } else {
            out += text[i]
        }
    }
    return out
}

/**
 * The command a wrapper runs: `command git ...`, `env -i X=1 pnpm ...`,
 * `timeout 60 git ...`, `nice -n 5 ...`, `sudo ...` are judged as what they run,
 * and so is the body of a control keyword (`do git push`, `then ...`, `! ...`).
 * `corepack pnpm[@version] ...` (this repo's bootstrap form) and `xargs [opts] cmd`
 * run the package manager / command they name.
 */
const WRAPPER =
    /^(?:if|then|elif|else|while|until|do|!|corepack|xargs(?:\s+-\S+)*|command|builtin|exec|nohup|time|stdbuf(?:\s+-\S+)*|nice(?:\s+-\S+(?:\s+\d+)?)*|sudo(?:\s+-\S+)*|env(?:\s+-\S+)*|timeout(?:\s+-\S+)*\s+\d\S*|[A-Za-z_]\w*=\S*)\s+/
export function unwrap(command) {
    let current = command.trim()
    for (
        let next = current.replace(WRAPPER, '');
        next !== current;
        next = current.replace(WRAPPER, '')
    ) {
        current = next
    }
    return current.replace(/^pnpm@\S+/, 'pnpm')
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
    [
        'hook bypass (core.hooksPath)',
        // Overriding, setting or unsetting it bypasses the hooks; reading it
        // (`git config --get core.hooksPath`, `git config get ...`) is diagnosis.
        // Git config keys are case-insensitive: `core.hookspath` is the same key.
        (c) =>
            /^git\b.*\bcore\.hookspath\b/i.test(c) &&
            !/^git\s+config\s+(?:--(?:global|local|system|show-origin|show-scope)\s+)*(?:--get(?:-all|-regexp)?|--list|-l|get|list)\b/.test(
                normalizeGit(c),
            ),
    ],
    ['admin merge (--admin)', (c) => /^gh\s+pr\s+merge\b.*\s--admin\b/.test(c)],
    [
        'force push (--force / -f / +refspec)',
        // `-f` may be combined with other short flags: `git push -fu origin x`.
        (c) =>
            /^git\s+push\b/.test(c) &&
            /\s(?:--force(?=\s|$)|-[A-Za-z]*f[A-Za-z]*(?=\s|$)|\+[\w./-]+)/.test(c),
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
        (c) => /^pnpm\s+(?:install|i)(?=\s|$)/.test(c) && !frozenLockfile(c),
    ],
]

/**
 * The effective --frozen-lockfile setting: the last of `--frozen-lockfile[=true]`,
 * `--frozen-lockfile=false` and `--no-frozen-lockfile` wins (#650 review).
 */
function frozenLockfile(command) {
    let frozen = false
    for (const token of command.split(/\s+/)) {
        if (/^--frozen-lockfile(?:=true)?$/.test(token)) frozen = true
        else if (/^--(?:no-frozen-lockfile|frozen-lockfile=false)$/.test(token)) frozen = false
    }
    return frozen
}

/** Every rule the command breaks; empty when it may run. */
export function bashViolations(command, depth = 0) {
    const bodies = []
    const text = stripData(command, bodies)
    const violations = new Set()
    // Substitution bodies run too; judged like any command (bounded nesting).
    if (depth < 8) {
        for (const body of bodies) {
            for (const violation of bashViolations(body, depth + 1)) violations.add(violation)
        }
    }
    if (/(?:^|[\s;&|(])HUSKY=0\b/.test(text)) violations.add('hook bypass (HUSKY=0)')
    // Substitutions, subshells, groups, background `&` and the quotes of
    // `sh -c '...'` start a new command. Lines are judged one by one, and a `#`
    // inside a word (`a#b`, `$#`) is not a comment, so it must not let
    // shellCommands cut off what follows.
    const subcommands = text
        .replace(/\$\(|[`(){}'"&]/g, ' ; ')
        .split('\n')
        .flatMap((line) => shellCommands(line.replace(/(?<=[^\s;|])#/g, '_')))
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
