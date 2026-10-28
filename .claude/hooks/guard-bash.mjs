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
 * The command is tokenised the way bash reads it (#650 review: five rounds of
 * regex heuristics each left another form open): quotes, `$(...)` / backtick /
 * process substitutions with their own nesting, comments that start a word,
 * redirections, heredocs and line continuations. A quoted argument stays one
 * word, so a commit message that names `--no-verify` is one argument, never the
 * flag, while `"--no-verify"` on its own still is. Everything that runs is
 * judged: substitution bodies, `sh -c` / `eval` arguments, a heredoc fed to a
 * shell, and the substitutions bash expands in an unquoted heredoc.
 *
 * Input: the hook JSON on stdin. Output: a `deny` decision with the reasons,
 * or nothing (normal permission flow). Unparseable input is no decision:
 * a broken guard must not take the Bash tool down with it.
 */
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { heavyCommandRule, pnpmInvocation } from '../../scripts/security/check-agent-policy.mjs'

const MAX_DEPTH = 8
const SHELLS = /^(?:ba|z|da|k)?sh$/
/** A command that runs its standard input (heredoc, here-string) as shell. */
const SHELL_READER = /^(?:(?:ba|z|da|k)?sh|source|\.|eval)$/
/** The command a word list runs, after wrappers and control keywords. */
const readerOf = (words) => unwrap(words.map(flat).join(' ')).split(' ')[0]
/** Stand-in for a substitution's output in the enclosing word. */
const SUBST = 'SUBST'

/** Position of the `'` closing a single-quoted string whose text starts at `i`. */
const closingSingle = (s, i) => {
    const at = s.indexOf("'", i)
    return at === -1 ? s.length : at
}

/** Position of the `` ` `` closing a backtick substitution whose body starts at `i`. */
function closingBacktick(s, i) {
    while (i < s.length) {
        if (s[i] === '\\') i += 2
        else if (s[i] === '`') return i
        else i += 1
    }
    return s.length
}

/** Position of the `"` closing a double-quoted string whose text starts at `i`. */
function closingDouble(s, i) {
    while (i < s.length) {
        if (s[i] === '\\') i += 2
        else if (s[i] === '"') return i
        else if (s.startsWith('$(', i)) i = closingParen(s, i + 2) + 1
        else if (s[i] === '`') i = closingBacktick(s, i + 1) + 1
        else i += 1
    }
    return s.length
}

/** Position of the `)` closing a `$(` / `<(` / `(` whose body starts at `i`. */
function closingParen(s, i) {
    let depth = 1
    while (i < s.length) {
        const c = s[i]
        if (c === '\\') i += 2
        else if (c === "'") i = closingSingle(s, i + 1) + 1
        else if (c === '"') i = closingDouble(s, i + 1) + 1
        else if (c === '`') i = closingBacktick(s, i + 1) + 1
        else if (c === '(') {
            depth += 1
            i += 1
        } else if (c === ')') {
            depth -= 1
            if (depth === 0) return i
            i += 1
        } else i += 1
    }
    return s.length
}

/** Double-quoted text without its escapes; substitution bodies go to `nested`. */
function unquoteDouble(text, nested) {
    let out = ''
    for (let i = 0; i < text.length;) {
        if (text[i] === '\\' && i + 1 < text.length && '$`"\\'.includes(text[i + 1])) {
            out += text[i + 1]
            i += 2
        } else if (text.startsWith('$(', i)) {
            const end = closingParen(text, i + 2)
            nested.push(text.slice(i + 2, end))
            out += SUBST
            i = end + 1
        } else if (text[i] === '`') {
            const end = closingBacktick(text, i + 1)
            nested.push(text.slice(i + 1, end))
            out += SUBST
            i = end + 1
        } else {
            out += text[i]
            i += 1
        }
    }
    return out
}

/** The `$(...)` and backtick bodies bash expands in an unquoted heredoc body. */
/** Position of the `}` closing a `${` whose text starts at `i` (nesting-aware). */
function closingBrace(s, i) {
    let depth = 1
    while (i < s.length) {
        const c = s[i]
        if (c === '\\') i += 2
        else if (c === "'") i = closingSingle(s, i + 1) + 1
        else if (c === '"') i = closingDouble(s, i + 1) + 1
        else if (s.startsWith('$(', i)) i = closingParen(s, i + 2) + 1
        else if (c === '`') i = closingBacktick(s, i + 1) + 1
        else if (s.startsWith('${', i)) {
            depth += 1
            i += 2
        } else if (c === '}') {
            depth -= 1
            if (depth === 0) return i
            i += 1
        } else i += 1
    }
    return s.length
}

function substitutionsIn(text) {
    const bodies = []
    for (let i = 0; i < text.length; i += 1) {
        if (text[i] === '\\') {
            i += 1
        } else if (text.startsWith('$(', i)) {
            const end = closingParen(text, i + 2)
            bodies.push(text.slice(i + 2, end))
            i = end
        } else if (text[i] === '`') {
            const end = closingBacktick(text, i + 1)
            bodies.push(text.slice(i + 1, end))
            i = end
        }
    }
    return bodies
}

const REDIRECTION = /^(?:<<<|<<-|<<|<>|<&|<\(|<|>>|>&|>\||>\(|>|&>>|&>)/

/**
 * Simple commands (arrays of words, quoting removed) of `source`, plus the
 * shell text that also runs (`nested`: substitution bodies and heredocs fed
 * to a shell).
 */
export function parseCommands(source) {
    const s = source.replace(/\\\r?\n/g, '')
    const commands = []
    const nested = []
    let words = []
    let word = null
    // The next word is a redirection target ('drop') or a here-string ('here').
    let dropWord = false
    let heredocs = []
    let hereStrings = []
    const append = (text) => {
        word = (word ?? '') + text
    }
    const endWord = () => {
        if (word !== null && dropWord === 'here') hereStrings.push(word)
        else if (word !== null && !dropWord) words.push(word)
        if (word !== null) dropWord = false
        word = null
    }
    const endCommand = () => {
        endWord()
        dropWord = false
        // `bash <<< '...'` runs the here-string as its script; for any other
        // reader it is data (#650 review).
        if (hereStrings.length && SHELL_READER.test(readerOf(words))) nested.push(...hereStrings)
        hereStrings = []
        if (words.length) commands.push(words)
        words = []
    }
    let i = 0
    while (i < s.length) {
        const c = s[i]
        const next = s[i + 1]
        if (c === ' ' || c === '\t') {
            endWord()
            i += 1
        } else if (c === '\n') {
            const pending = heredocs
            heredocs = []
            endCommand()
            i = readHeredocs(s, i + 1, pending, nested)
        } else if (c === '#' && word === null) {
            // A comment starts a word; `a#b` and `$#` are ordinary text.
            while (i < s.length && s[i] !== '\n') i += 1
        } else if (c === '\\') {
            append(next ?? '')
            i += 2
        } else if (c === "'") {
            const end = closingSingle(s, i + 1)
            append(s.slice(i + 1, end))
            i = end + 1
        } else if (c === '"') {
            const end = closingDouble(s, i + 1)
            append(unquoteDouble(s.slice(i + 1, end), nested))
            i = end + 1
        } else if (c === '$' && next === "'") {
            let j = i + 2
            while (j < s.length && s[j] !== "'") j += s[j] === '\\' ? 2 : 1
            append(s.slice(i + 2, j).replace(/\\(.)/g, '$1'))
            i = j + 1
        } else if (c === '$' && next === '(') {
            const end = closingParen(s, i + 2)
            nested.push(s.slice(i + 2, end))
            append(SUBST)
            i = end + 1
        } else if (c === '$' && next === '{') {
            // `${X:-$(cmd)}` runs cmd: the expansion stays one word, its
            // substitutions are judged (#650 review).
            const end = closingBrace(s, i + 2)
            nested.push(...substitutionsIn(s.slice(i + 2, end)))
            append(s.slice(i, end + 1))
            i = end + 1
        } else if (c === '`') {
            const end = closingBacktick(s, i + 1)
            nested.push(s.slice(i + 1, end))
            append(SUBST)
            i = end + 1
        } else if (c === '<' || c === '>' || (c === '&' && next === '>')) {
            // A leading fd number (`2>`) belongs to the redirection.
            if (word !== null && /^\d+$/.test(word)) word = null
            else endWord()
            const op = REDIRECTION.exec(s.slice(i))[0]
            i += op.length
            if (op === '<(' || op === '>(') {
                const end = closingParen(s, i)
                nested.push(s.slice(i, end))
                append(SUBST)
                i = end + 1
            } else if (op === '<<' || op === '<<-') {
                while (s[i] === ' ' || s[i] === '\t') i += 1
                let delimiter = ''
                let quoted = false
                while (i < s.length && !/[\s;&|<>()]/.test(s[i])) {
                    if (s[i] === "'" || s[i] === '"') {
                        quoted = true
                        const end = s[i] === "'" ? closingSingle(s, i + 1) : closingDouble(s, i + 1)
                        delimiter += s.slice(i + 1, end)
                        i = end + 1
                    } else if (s[i] === '\\') {
                        quoted = true
                        delimiter += s[i + 1] ?? ''
                        i += 2
                    } else {
                        delimiter += s[i]
                        i += 1
                    }
                }
                heredocs.push({ delimiter, quoted, stripTabs: op === '<<-', words })
            } else if ((op === '>&' || op === '<&') && /[\d-]/.test(s[i] ?? '')) {
                while (/[\d-]/.test(s[i] ?? '')) i += 1
            } else {
                // The target (a file name, a here-string) is not an argument.
                dropWord = op === '<<<' ? 'here' : 'drop'
            }
        } else if (c === '&' || c === '|' || c === ';' || c === '(' || c === ')') {
            endCommand()
            i +=
                (c === '&' && next === '&') ||
                (c === '|' && /[|&]/.test(next ?? '')) ||
                (c === ';' && next === ';')
                    ? 2
                    : 1
        } else {
            append(c)
            i += 1
        }
    }
    endCommand()
    return { commands, nested }
}

/** Reads the bodies of the heredocs opened on the line before `start`. */
function readHeredocs(s, start, pending, nested) {
    let i = start
    for (const doc of pending) {
        const body = []
        while (i < s.length) {
            const end = s.indexOf('\n', i)
            const stop = end === -1 ? s.length : end
            const line = s.slice(i, stop)
            i = stop + 1
            if ((doc.stripTabs ? line.replace(/^\t+/, '') : line) === doc.delimiter) break
            body.push(line)
        }
        const text = body.join('\n')
        const reader = readerOf(doc.words)
        // A shell runs its heredoc whatever the quoting; for any other reader an
        // unquoted delimiter still lets bash expand the substitutions.
        if (SHELL_READER.test(reader)) {
            nested.push(text)
        } else if (!doc.quoted) {
            nested.push(...substitutionsIn(text))
        }
    }
    return Math.min(i, s.length)
}

/** A word as rule text: whitespace inside one quoted argument is not a separator. */
const flat = (word) => word.replace(/[\s#]/g, '_')

/**
 * The command a wrapper runs: `command git ...`, `env -i X=1 pnpm ...`,
 * `timeout 60 git ...`, `nice -n 5 ...`, `sudo ...` are judged as what they run,
 * and so is the body of a control keyword (`do git push`, `then ...`, `! ...`,
 * `{ ...`). `corepack pnpm[@version] ...` (this repo's bootstrap form) and
 * `xargs [opts] cmd` run the package manager / command they name.
 */
const WRAPPER =
    /^(?:if|then|elif|else|while|until|do|!|\{|corepack|pnpm\s+exec|npx|xargs(?:\s+-\S+)*|command|builtin|exec|nohup|time|stdbuf(?:\s+-\S+)*|nice(?:\s+-\S+(?:\s+\d+)?)*|sudo(?:\s+(?:-[ugCDhprtUT]\s+\S+|-\S+))*|env(?:\s+(?:-[uCS]\s+\S+|-\S+))*|timeout(?:\s+-\S+)*\s+\d\S*|[A-Za-z_]\w*=\S*)\s+/
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
            /\s(?:-[A-Za-z]*A[A-Za-z]*|--all|\.\/?|:\/|:\(top\)|\*+(?:\/\*+)*)(?=\s|$)/.test(c),
    ],
    [
        'pnpm install without --frozen-lockfile (re-resolves carets; trips minimumReleaseAge)',
        // pnpm's own options may precede the command: `pnpm --dir apps/web install`.
        (c) => ['install', 'i'].includes(pnpmInvocation(c)?.script) && !frozenLockfile(c),
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

/**
 * Whether the command sets HUSKY=0 for what it runs: an assignment before the
 * command (also after env/sudo/... and their options) or an `export`. As an
 * argument (`rg 'HUSKY=0' .husky`) or in a comment it is just text.
 */
function disablesHusky(all) {
    // Control keywords open a command: `then HUSKY=0 git commit` (#650 review).
    let start = 0
    while (/^(?:if|then|elif|else|while|until|do|!|\{)$/.test(all[start] ?? '')) start += 1
    const words = all.slice(start)
    if (/^(?:export|declare|typeset|readonly)$/.test(words[0] ?? '')) {
        return words.slice(1).includes('HUSKY=0')
    }
    for (const word of words) {
        if (word === 'HUSKY=0') return true
        if (!/^(?:[A-Za-z_]\w*=.*|env|command|exec|nohup|time|sudo|-\S*)$/.test(word)) return false
    }
    return false
}

/** Adds the rules `words` breaks; returns shell text it hands to another shell. */
function judge(words, violations) {
    if (disablesHusky(words)) violations.add('hook bypass (HUSKY=0)')
    const command = unwrap(words.map(flat).join(' '))
    if (!command) return []
    const git = normalizeGit(command)
    for (const [label, test] of RULES) if (test(command) || test(git)) violations.add(label)
    const heavy = heavyCommandRule(command)
    // A turbo `--filter` scopes the run only before `--`; after it the flag is
    // passed on to the tasks (#650 review).
    const turboFiltered = /--filter\b/.test(command.split(/\s--(?=\s|$)/)[0])
    if (heavy && !(heavy === 'bare turbo run' && turboFiltered)) {
        violations.add(
            `${heavy} (use pnpm verify / verify:test / verify:lint, or one spec without --)`,
        )
    }
    // The unwrapped words, with their original text: `sh -c '<script>'` and
    // `eval <words>` run that text as shell.
    const rest = words.slice(words.length - command.split(' ').length)
    if (SHELLS.test(rest[0] ?? '')) {
        const flag = rest.findIndex((w, k) => k > 0 && /^-[A-Za-z]*c[A-Za-z]*$/.test(w))
        if (flag > 0 && rest[flag + 1] !== undefined) return [rest[flag + 1]]
    }
    if (rest[0] === 'eval') return [rest.slice(1).join(' ')]
    return []
}

/** Every rule the command breaks; empty when it may run. */
export function bashViolations(command, depth = 0) {
    const violations = new Set()
    const { commands, nested } = parseCommands(command)
    for (const words of commands) nested.push(...judge(words, violations))
    // Fail closed: text nested deeper than the guard reads is denied, not
    // waved through (#650 review).
    if (nested.length && depth >= MAX_DEPTH) {
        violations.add(`nesting deeper than ${MAX_DEPTH} levels (not inspected)`)
    } else {
        for (const script of nested) {
            for (const violation of bashViolations(script, depth + 1)) violations.add(violation)
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
