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
 * What it cannot do: run the command. A value computed at run time (a
 * substitution's output, a variable) is unknown, so the guard fails closed
 * where that value could be a bypass (an argument of `git commit`, a force
 * push with no named branch) and otherwise judges what the text says.
 *
 * Input: the hook JSON on stdin. Output: a `deny` decision with the reasons,
 * or nothing (normal permission flow). Unparseable input is no decision:
 * a broken guard must not take the Bash tool down with it.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import {
    heavyCommandRule,
    INSTALL_TEST,
    pnpmInvocation,
} from '../../scripts/security/check-agent-policy.mjs'

const MAX_DEPTH = 8
const SHELLS = /^(?:ba|z|da|k)?sh$/
/** A command that runs its standard input (heredoc, here-string) as shell. */
/** `source` / `.` run a file; given stdin (`source /dev/stdin <<EOF`) it is shell. */
const SOURCE_READER = /^(?:source|\.)$/
/** Whether the command runs its stdin (heredoc, here-string, pipe) as shell. */
const runsStdin = (words) => readsStdinScript(words) || SOURCE_READER.test(readerOf(words))
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

const ANSI_C_SIMPLE = {
    a: '\x07',
    b: '\b',
    e: '\x1b',
    E: '\x1b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
    v: '\v',
}

/**
 * The text of a `$'...'` string the way bash decodes it: `\xHH`, `\NNN`,
 * `\uHHHH`, `\UHHHHHHHH`, `\cX` and the letter escapes -- `$'\x2d\x2dno-verify'`
 * is `--no-verify` (#650 review).
 */
function decodeAnsiC(text) {
    return text.replace(
        /\\(?:x([0-9A-Fa-f]{1,2})|([0-7]{1,3})|u([0-9A-Fa-f]{1,4})|U([0-9A-Fa-f]{1,8})|c(.)|(.))/g,
        (all, hex, oct, u4, u8, ctrl, other) => {
            if (hex) return String.fromCharCode(Number.parseInt(hex, 16))
            if (oct) return String.fromCharCode(Number.parseInt(oct, 8) & 0xff)
            if (u4 || u8) return String.fromCodePoint(Number.parseInt(u4 ?? u8, 16) % 0x110000)
            if (ctrl) return String.fromCharCode(ctrl.charCodeAt(0) & 0x1f)
            return ANSI_C_SIMPLE[other] ?? other
        },
    )
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
        // A here-string that expands at run time (`bash <<< "$SCRIPT"`) is not
        // the text written here: the shell input is opaque.
        if (hereStrings.length && runsStdin(words)) {
            if (hereStrings.some(runtimeValue)) words.opaqueStdin = true
            nested.push(...hereStrings)
        }
        hereStrings = []
        if (words.length) {
            // Marks a command that reads the previous one's output through `|`.
            if (pipedNext) words.piped = true
            // The subshell it runs in: `(cd x); y` keeps y in the old directory.
            words.scope = scopes.join('.')
            // `a && cd x` / `a || cd x` may not run: the directory is uncertain.
            words.conditional = conditionalNext
            commands.push(words)
        }
        // Text found while reading this command runs where it runs.
        own(commands.length - 1)
        pipedNext = false
        conditionalNext = false
        words = []
    }
    // owners[k]: the index of the command that runs nested[k] (#650 review).
    const owners = []
    const own = (index) => {
        while (owners.length < nested.length) owners.push(Math.max(index, 0))
    }
    let pipedNext = false
    let conditionalNext = false
    const scopes = []
    let lastScope = 0
    let unterminated = false
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
            const read = readHeredocs(s, i + 1, pending, nested)
            // A heredoc whose delimiter never comes swallows the rest of the
            // input (`(( 1 << n ))` is no heredoc at all): fail closed.
            if (read.unterminated) unterminated = true
            own(commands.length - 1)
            i = read.end
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
            append(decodeAnsiC(s.slice(i + 2, j)))
            i = j + 1
        } else if (c === '$' && next === '"') {
            // `$"..."` (locale translation) is a double-quoted string.
            i += 1
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
            // Pipeline parts and background jobs run in a subshell of their own.
            if ((c === '|' && next !== '|') || (c === '&' && next !== '&')) words.subshell = true
            endCommand()
            if (c === '(') scopes.push((lastScope += 1))
            else if (c === ')') scopes.pop()
            pipedNext = c === '|' && next !== '|'
            conditionalNext = (c === '&' && next === '&') || (c === '|' && next === '|')
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
    // A shell that reads a pipe runs whatever arrives on stdin (#650 review):
    // a heredoc or literal echo/printf text upstream is judged as a script;
    // any other upstream (`curl ... | sh`) cannot be inspected.
    let opaque = commands.some((words) => words.opaqueStdin)
    for (let k = 1; k < commands.length; k += 1) {
        if (!commands[k].piped || !(readsStdinScript(commands[k]) || sourcesStdin(commands[k])))
            continue
        const upstream = commands[k - 1]
        const program = readerOf(upstream)
        if (upstream.heredocBody !== undefined) {
            if (upstream.heredocExpands) opaque = true
            nested.push(upstream.heredocBody)
        } else if (program === 'echo' || program === 'printf') {
            const text = echoedText(upstream)
            if (text === null) opaque = true
            else nested.push(text)
        } else opaque = true
        own(k)
    }
    return { commands, nested, owners, opaque: opaque || unterminated }
}

/** The words a command runs, after wrappers (original text, not flattened). */
const unwrappedWords = (words) =>
    words.slice(words.length - unwrap(words.map(flat).join(' ')).split(' ').length)

/** File names of the process's own stdin. */
const STDIN_PATH = /^(?:\/dev\/stdin|\/dev\/fd\/0|\/proc\/self\/fd\/0)$/

/** Whether `words` is a shell that takes its script from stdin. */
function readsStdinScript(words) {
    const [program, ...args] = unwrappedWords(words)
    if (!SHELLS.test(programName(program ?? ''))) return false
    // `-c` names the script itself (judged elsewhere); a non-option operand
    // is a script file unless it names stdin (`bash /dev/stdin`); `-s`
    // forces stdin.
    if (args.some((arg) => /^-[A-Za-z]*c[A-Za-z]*$/.test(arg))) return false
    const operand = shellOperand(args)
    return (
        operand === undefined ||
        STDIN_PATH.test(operand) ||
        args.some((arg) => /^-[A-Za-z]*s/.test(arg))
    )
}

/**
 * A shell's first operand (its script file). Option values are not operands:
 * `bash -o pipefail`, `-O extglob`, `+o x`, `--rcfile x` (#650 review).
 */
function shellOperand(args) {
    for (let k = 0; k < args.length; k += 1) {
        const arg = args[k]
        if (/^[-+][A-Za-z]*[oO]$/.test(arg) || /^--(?:rcfile|init-file)$/.test(arg)) k += 1
        else if (!/^[-+]/.test(arg)) return arg
    }
    return undefined
}

/**
 * Whether `words` is `source` / `.` reading stdin: `source /dev/stdin`, or a
 * file known only at run time, which may be stdin (#650 review).
 */
function sourcesStdin(words) {
    const [program, file] = unwrappedWords(words)
    if (!SOURCE_READER.test(program ?? '')) return false
    return file === undefined || STDIN_PATH.test(file) || runtimeValue(file)
}

/**
 * The text echo/printf write, escapes decoded (fail closed: read as a script),
 * or null when it cannot be known: a printf format other than %s / %%, or an
 * operand that only exists at run time (`printf '%s' "$SCRIPT"`; #650 review).
 */
function echoedText(words) {
    const [program, ...args] = unwrappedWords(words)
    if (program === 'printf' && args[0] === '-v') return '' // assigns a variable, writes nothing
    if (args.some(runtimeValue)) return null
    if (program === 'printf') {
        const [format = '', ...values] = args[0] === '--' ? args.slice(1) : args
        if (/%(?![%s])/.test(format)) return null
        let out = ''
        let k = 0
        // The format repeats only while it consumes arguments: `%%s` is a
        // literal `%s` and takes none (it looped forever; #650 review).
        for (let before = -1; k > before && (before === -1 || k < values.length);) {
            before = k
            out += format.replace(/%([%s])/g, (_, spec) =>
                spec === '%' ? '%' : (values[k++] ?? ''),
            )
        }
        return decodeAnsiC(out)
    }
    return decodeAnsiC(args.filter((arg) => !/^-[neE]+$/.test(arg)).join(' '))
}

/**
 * Reads the bodies of the heredocs opened on the line before `start`; returns
 * where reading stopped and whether a delimiter never came.
 */
function readHeredocs(s, start, pending, nested) {
    let i = start
    let unterminated = false
    for (const doc of pending) {
        const body = []
        let closed = false
        while (i < s.length) {
            const end = s.indexOf('\n', i)
            const stop = end === -1 ? s.length : end
            const line = s.slice(i, stop)
            i = stop + 1
            if ((doc.stripTabs ? line.replace(/^\t+/, '') : line) === doc.delimiter) {
                closed = true
                break
            }
            body.push(line)
        }
        if (!closed) unterminated = true
        const text = body.join('\n')
        // Kept for a shell further down the pipeline (`cat <<EOF | bash`). An
        // unquoted delimiter expands `$X` / `$(...)` first, so the text a
        // shell receives is not the text written here (#650 review).
        doc.words.heredocBody = text
        doc.words.heredocExpands = !doc.quoted && /[$`]/.test(text)
        // A shell that reads stdin runs its heredoc whatever the quoting (not
        // `bash -c 'cat'`: there the script is the -c argument); for any other
        // reader an unquoted delimiter still lets bash expand the substitutions.
        if (runsStdin(doc.words)) {
            if (doc.words.heredocExpands) doc.words.opaqueStdin = true
            nested.push(text)
        } else if (!doc.quoted) {
            nested.push(...substitutionsIn(text))
        }
    }
    return { end: Math.min(i, s.length), unterminated }
}

/** A word as rule text: whitespace inside one quoted argument is not a separator. */
// An empty argument (`''`) stays a token, so word positions survive the join
// (`bash -c 'cmd' ''` keeps its script in place; #650 review).
const flat = (word) => (word === '' ? "''" : word.replace(/[\s#]/g, '_'))

/**
 * The command a wrapper runs: `command git ...`, `env -i X=1 pnpm ...`,
 * `timeout 60 git ...`, `nice -n 5 ...`, `sudo ...` are judged as what they run,
 * and so is the body of a control keyword (`do git push`, `then ...`, `! ...`,
 * `{ ...`). `corepack pnpm[@version] ...` (this repo's bootstrap form) and
 * `xargs [opts] cmd` run the package manager / command they name.
 */
const WRAPPER =
    /^(?:if|then|elif|else|while|until|do|!|\{|corepack|pnpm\s+(?:exec|dlx)|npx|xargs(?:\s+(?:-[nLPsIdEa]\s+\S+|-\S+))*|command|builtin|exec|nohup|time|stdbuf(?:\s+-\S+)*|nice(?:\s+-\S+(?:\s+\d+)?)*|sudo(?:\s+(?:-[ugCDhprtUT]\s+\S+|-\S+))*|env(?:\s+(?:-[uCS]\s+\S+|-\S+))*|timeout(?:\s+-\S+)*\s+\d\S*|[A-Za-z_]\w*=\S*)\s+/
export function unwrap(command) {
    let current = programName(command.trim())
    for (let next = unwrapOnce(current); next !== current; next = unwrapOnce(current)) {
        current = next
    }
    return current.replace(/^pnpm@\S+/, 'pnpm')
}

/**
 * One wrapper layer off. pnpm options may precede `exec` / `dlx`
 * (`pnpm --filter <pkg> exec playwright test`, `pnpm -C apps/web exec ...`),
 * and exec's own options follow it (#650 review).
 */
function unwrapOnce(command) {
    const run = pnpmInvocation(command.replace(/^pnpm@\S+/, 'pnpm'))
    if (run && (run.script === 'exec' || run.script === 'dlx')) {
        const rest = [...run.rest]
        while (rest.length > 1 && rest[0].startsWith('-')) rest.shift()
        if (rest.length) return programName(rest.join(' '))
    }
    return programName(command.replace(WRAPPER, ''))
}

/**
 * The program by name: `/bin/bash`, `/usr/bin/git`, `./node_modules/.bin/turbo`
 * run the same program as their basename (#650 review). An assignment
 * (`X=/a/b cmd`) keeps its value.
 */
function programName(command) {
    return command.replace(/^[^\s=]*\//, '')
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

/** A word whose value only exists at run time: a substitution or a `$VAR`. */
// Also part of a word: `"$(printf -- --no-)verify"` is `--no-verify` (#650 review).
const runtimeValue = (token) => token.includes(SUBST) || token.includes('$')

/**
 * Value-taking options per git subcommand: short letters and long names whose
 * value may be the next word (message, file, author, push option, ...).
 */
const GIT_VALUE_OPTIONS = {
    commit: {
        short: 'mFCct',
        long: /^--(?:message|file|reuse-message|reedit-message|template|author|date|cleanup|fixup|squash|trailer)$/,
    },
    push: { short: 'o', long: /^--(?:push-option|repo|receive-pack|exec)$/ },
}

/**
 * Positions of the words consumed as option values, parsed in order like git
 * does (#650 review): `-m msg`, `-am msg` and `--message msg` take the next
 * word; `-mtest` and `--message=x` carry their value, so the next word is an
 * option again; a consumed word (`-m '-m'`) is never read as an option.
 */
function optionValuePositions(tokens, spec) {
    const values = new Set()
    for (let k = 2; k < tokens.length; k += 1) {
        const token = tokens[k]
        if (token === '--') break
        if (spec.long.test(token)) {
            values.add(k + 1)
            k += 1
        } else if (/^-[A-Za-z]/.test(token)) {
            // A short cluster: the first value letter takes the rest of the
            // token, or the next word when it is the cluster's last letter.
            const at = [...token.slice(1)].findIndex((letter) => spec.short.includes(letter))
            if (at === token.length - 2) {
                values.add(k + 1)
                k += 1
            }
        }
    }
    return values
}

/**
 * `git commit -m '--no-verify'` passes the flag's text as the message: words
 * consumed by a value-taking option become VALUE before the rules run, while a
 * standalone `git commit '--no-verify'` stays a flag (#650 review).
 */
function maskOptionValues(command) {
    const spec = GIT_VALUE_OPTIONS[/^git\s+(\S+)/.exec(command)?.[1]]
    if (!spec) return command
    const tokens = command.split(' ')
    const values = optionValuePositions(tokens, spec)
    return tokens.map((token, k) => (values.has(k) ? 'VALUE' : token)).join(' ')
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
    [
        'admin merge (--admin)',
        // gh takes options before and between its subcommands:
        // `gh --repo o/r pr merge 12 --admin`, `gh pr -R o/r merge` (#650 review).
        (c) => {
            const tokens = c.split(/\s+/)
            const pr = tokens.indexOf('pr')
            return (
                tokens[0] === 'gh' &&
                pr > 0 &&
                tokens.indexOf('merge', pr + 1) > pr &&
                tokens.some((token) => /^--admin(?:=|$)/.test(token))
            )
        },
    ],
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
        'force push without a named branch (the current branch may be main)',
        // `git push --force-with-lease [remote]` pushes the current branch, and
        // `... origin "$BRANCH"` a branch only known at run time; neither is
        // visible to a static check, so the branch must be written out.
        (c) => {
            if (!/^git\s+push\b.*--force-(?:with-lease|if-includes)/.test(c)) return false
            const positional = c
                .split(/\s+/)
                .slice(2)
                // An option's value (`-o ci.skip`, masked to VALUE) is no
                // remote or branch (#650 review).
                .filter((word) => !word.startsWith('-') && word !== 'VALUE')
            // A wildcard refspec (`refs/heads/*:refs/heads/*`), --all and --mirror
            // push every branch, main included (#650 review).
            return (
                positional.length < 2 ||
                positional.slice(1).some((ref) => runtimeValue(ref) || ref.includes('*')) ||
                /\s--(?:all|mirror)(?=\s|$)/.test(c)
            )
        },
    ],
    [
        'git commit argument known only at run time (may expand to a flag)',
        // `git commit $(printf --no-verify)` or `git commit "$FLAGS"`: the value
        // is unknown. As the value of -m/-F/... it is message text, already
        // masked to VALUE (maskOptionValues) before the rules run.
        (c) => {
            if (!/^git\s+commit\b/.test(c)) return false
            const tokens = c.split(/\s+/)
            return tokens.some(
                (token, k) =>
                    runtimeValue(token) &&
                    k >= 2 &&
                    // An attached value (`--message="$MSG"`, `-m"$MSG"`) cannot
                    // become a flag of its own (#650 review).
                    !/^--?[A-Za-z][\w-]*=/.test(token) &&
                    !/^-[A-Za-z]*[mFCct][^-\s]/.test(token),
            )
        },
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
            // Magic pathspecs (`:(top,glob)**`, `:!x` = all but x) are read as
            // the whole tree: fail closed (#650 review).
            /\s(?:-[A-Za-z]*A[A-Za-z]*|--all|\.\/?|:\/|:\(\S*|:[!^]\S*|(?:\.\/)?\*+(?:\/\*+)*)(?=\s|$)/.test(
                c,
            ),
    ],
    [
        'E2E, Playwright, Stryker or Lighthouse run locally (CI only, AGENTS.md)',
        // The tools themselves; package scripts that start them (test:e2e,
        // test:ct, test:mutate, lighthouse:ci) are resolved to these in judge().
        (c) => /^(?:playwright\s+test|stryker\s+run|lhci(?:\s|$))/.test(c),
    ],
    [
        'pnpm install without --frozen-lockfile (re-resolves carets; trips minimumReleaseAge)',
        // pnpm's own options may precede the command: `pnpm --dir apps/web install`.
        // `pnpm install-test` / `it` install first (#650 review).
        (c) =>
            ['install', 'i', ...INSTALL_TEST].includes(pnpmInvocation(c)?.script) &&
            !frozenLockfile(c),
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
 * The environment assignments the command makes for what it runs: before the
 * command (also after env/sudo/... and their options) or in an `export`. As an
 * argument (`rg 'HUSKY=0' .husky`) or in a comment such text is just data.
 */
function envAssignments(all) {
    // Control keywords open a command: `then HUSKY=0 git commit` (#650 review).
    let start = 0
    while (/^(?:if|then|elif|else|while|until|do|!|\{)$/.test(all[start] ?? '')) start += 1
    const words = all.slice(start)
    const assignment = /^[A-Za-z_]\w*=/
    if (/^(?:export|declare|typeset|readonly)$/.test(words[0] ?? '')) {
        return words.slice(1).filter((word) => assignment.test(word))
    }
    const found = []
    for (let k = 0; k < words.length; k += 1) {
        const word = words[k]
        if (assignment.test(word)) found.push(word)
        // A wrapper option's value is not the command: `env -u NAME`, `sudo -u USER`.
        else if (/^-[uCSgDhprtUT]$/.test(word)) k += 1
        else if (!/^(?:(?:\S*\/)?(?:env|command|exec|nohup|time|sudo)|-\S*)$/.test(word)) break
    }
    return found
}

/** A run-time value (`HUSKY="$(printf 0)"`, `HUSKY=$X`) may be 0: fail closed. */
const disablesHusky = (assignments) =>
    assignments.some(
        (word) => /^HUSKY=/.test(word) && (word === 'HUSKY=0' || runtimeValue(word.slice(6))),
    )

/**
 * `GIT_CONFIG_COUNT` + `GIT_CONFIG_KEY_<n>` / `GIT_CONFIG_VALUE_<n>` and
 * `GIT_CONFIG_PARAMETERS` set config like `git -c`, above the repository's own
 * `core.hooksPath` (#650 review). Other git config variables
 * (`GIT_CONFIG_GLOBAL`, `GIT_CONFIG_SYSTEM`) rank below the local hooksPath.
 */
const overridesHooksPath = (assignments) =>
    assignments.some((word) => {
        const value = /^(?:GIT_CONFIG_KEY_\d+|GIT_CONFIG_PARAMETERS)=(.*)$/s.exec(word)?.[1]
        return value !== undefined && (/core\.hookspath/i.test(value) || runtimeValue(value))
    })

/** Adds the rules `words` breaks; returns shell text it hands to another shell. */
const RAW_RULES = new Set(['hook bypass (core.hooksPath)'])

const ROOT = path.resolve(import.meta.dirname, '../..')

/** The workspaces: `{ name, dir, scripts }`, `dir` '' for the root; read once. */
let workspaceTable = null
function workspaces() {
    if (workspaceTable) return workspaceTable
    workspaceTable = []
    const dirs = ['']
    for (const group of ['apps', 'packages']) {
        try {
            for (const name of readdirSync(path.join(ROOT, group)))
                dirs.push(path.posix.join(group, name))
        } catch {
            // no such group in this checkout
        }
    }
    for (const dir of dirs) {
        try {
            const pkg = JSON.parse(readFileSync(path.join(ROOT, dir, 'package.json'), 'utf8'))
            workspaceTable.push({
                name: dir === '' ? '' : pkg.name,
                dir,
                scripts: pkg.scripts ?? {},
            })
        } catch {
            // not a package
        }
    }
    return workspaceTable
}

/** A path selector relative to the root: `./apps/web/` -> `apps/web`, `.` -> ''. */
const workspaceDir = (selector) => {
    const dir = path.posix.normalize(selector.replace(/^\{(.*)\}$/, '$1'))
    return dir === '.' || dir === './' ? '' : dir.replace(/^\.\/|\/$/g, '')
}

/**
 * The working directory relative to the repository root ('' = the root), or
 * null when it is not known (outside the repository, `~`, `$DIR`, `cd -`).
 */
const repoRelative = (absolute) => {
    if (absolute === ROOT) return ''
    return absolute.startsWith(`${ROOT}/`) ? absolute.slice(ROOT.length + 1) : null
}
/** `dir` joined onto the known working directory `cwd`, or null. */
const joinDir = (cwd, dir) => {
    if (dir.startsWith('/')) return repoRelative(path.posix.normalize(dir))
    if (cwd === null || runtimeValue(dir) || /^[~-]/.test(dir)) return null
    const joined = path.posix.normalize(path.posix.join(cwd || '.', dir)).replace(/\/$/, '')
    if (joined === '.') return ''
    return joined.startsWith('..') ? null : joined
}

/**
 * The workspace a directory belongs to: the deepest one containing it, the
 * root otherwise (pnpm reads the nearest package.json). A nested checkout
 * (`.notes/<worktree>/apps/web`) maps by its trailing path.
 */
function workspaceAt(dir) {
    const inside = (w) =>
        w.dir === '' ||
        dir === w.dir ||
        dir.startsWith(`${w.dir}/`) ||
        dir.endsWith(`/${w.dir}`) ||
        dir.includes(`/${w.dir}/`)
    return workspaces()
        .filter(inside)
        .sort((a, b) => b.dir.length - a.dir.length)
        .slice(0, 1)
}

/**
 * The workspaces a pnpm selector names: a package name, or a directory
 * (`./apps/web`, `{apps/web}`, `.` = the current one's root; #650 review). A
 * glob, exclusion, dependency or changed-since selector may reach any of them.
 */
function selectedWorkspaces(selector, cwd) {
    const all = workspaces()
    if (/[*!{}[\]^]|\.\.\./.test(selector.replace(/^\{([^{}*]*)\}$/, '$1'))) return all
    if (/^[.{]/.test(selector)) {
        const dir = joinDir(cwd, workspaceDir(selector) || '.')
        return dir === null ? all : workspaceAt(dir)
    }
    return all.filter((w) => w.name === selector)
}

/**
 * What a pnpm package script runs, with the passed-on arguments, so
 * `pnpm test:mutate` is judged as `pnpm exec stryker run` and
 * `pnpm --filter <pkg> test:ct` as that package's `playwright test` (#650 review).
 * The package comes from `--filter`, else `--dir` / `-C`, else the working
 * directory (`cd apps/web && pnpm run dev` is the web package's `vite`). When
 * that directory is unknown, every package that has the script is judged.
 */
function scriptBodies(command, cwd) {
    const run = pnpmInvocation(command)
    if (!run?.script) return []
    const options = command.split(/\s--(?=\s|$)/)[0]
    const filters = [...options.matchAll(/(?:^|\s)(?:--filter(?:-prod)?|-F)(?:=|\s+)(\S+)/g)]
    const dirOption = /(?:^|\s)(?:--dir|-C)(?:=|\s+)(\S+)/.exec(options)
    const dir = dirOption ? joinDir(cwd, dirOption[1]) : cwd
    const chosen = filters.length
        ? filters.flatMap((match) => selectedWorkspaces(match[1], dir))
        : dir === null
          ? workspaces()
          : workspaceAt(dir)
    const bodies = new Set(chosen.map((w) => w.scripts[run.script]).filter(Boolean))
    return [...bodies].map((body) => [body, ...run.rest].join(' '))
}

/**
 * The working directory after `words` when they change it (`cd`, `pushd`,
 * `popd`), else `undefined`.
 */
function changedDir(words, cwd) {
    const [program, ...args] = unwrappedWords(words)
    if (program === 'popd') return null
    if (program !== 'cd' && program !== 'pushd') return undefined
    const target = args.find((arg) => arg === '-' || !arg.startsWith('-'))
    return target === undefined ? null : joinDir(cwd, target)
}

function judge(words, violations, cwd) {
    const assignments = envAssignments(words)
    if (disablesHusky(assignments)) violations.add('hook bypass (HUSKY=0)')
    if (overridesHooksPath(assignments)) violations.add('hook bypass (core.hooksPath)')
    const command = unwrap(words.map(flat).join(' '))
    if (!command) return []
    // Rules see git without its global options and without values consumed by
    // value-taking options; the core.hooksPath override lives among the
    // global options, so that rule also reads the raw command.
    const subject = maskOptionValues(normalizeGit(command))
    for (const [label, test] of RULES) {
        if (test(subject) || (RAW_RULES.has(label) && test(command))) violations.add(label)
    }
    const heavy = heavyCommandRule(command)
    if (heavy) {
        violations.add(
            `${heavy} (use pnpm verify / verify:test / verify:lint, or one spec without --)`,
        )
    }
    // The unwrapped words, with their original text: `sh -c '<script>'` and
    // `eval <words>` run that text as shell.
    const rest = words.slice(words.length - command.split(' ').length)
    if (SHELLS.test(programName(rest[0] ?? ''))) {
        const flag = rest.findIndex((w, k) => k > 0 && /^-[A-Za-z]*c[A-Za-z]*$/.test(w))
        if (flag > 0 && rest[flag + 1] !== undefined) return [rest[flag + 1]]
    }
    if (rest[0] === 'eval') return [rest.slice(1).join(' ')]
    const bodies = scriptBodies(command, cwd)
    if (bodies.length) return bodies
    // `pnpm exec -c '<script>'` (shell mode) runs that text as shell.
    const shellMode = words.findIndex(
        (w, k) => /^(?:-c|--shell-mode)$/.test(w) && words.slice(0, k).includes('exec'),
    )
    if (shellMode !== -1 && words[0]?.startsWith('pnpm') && words[shellMode + 1] !== undefined) {
        return [words[shellMode + 1]]
    }
    // `env -S '<cmd args>'` splits that string and runs it (#650 review).
    const envAt = words.findIndex((w) => programName(w) === 'env')
    if (envAt !== -1) {
        for (let k = envAt + 1; k < words.length; k += 1) {
            if (/^(?:-S|--split-string)$/.test(words[k]) && words[k + 1] !== undefined) {
                return [words[k + 1]]
            }
            const attached = /^(?:-S|--split-string=)(.+)$/.exec(words[k])
            if (attached) return [attached[1]]
        }
    }
    return []
}

/**
 * Every rule the command breaks; empty when it may run. `cwd` is the working
 * directory relative to the repository root ('' = root, null = unknown); a
 * `cd` in the command moves it for the commands after it.
 */
export function bashViolations(command, depth = 0, cwd = '') {
    const violations = new Set()
    const { commands, nested, owners, opaque } = parseCommands(command)
    if (opaque) violations.add('shell reads input that cannot be inspected')
    // The directory per subshell scope ('1.2' inherits from '1', then '').
    // A cd in `( ... )`, a pipeline part or a background job ends with it; a
    // cd after `&&` / `||` may be skipped, so the directory becomes unknown.
    const dirs = new Map([['', cwd]])
    const dirIn = (scope) => {
        for (let s = scope; ; s = s.slice(0, Math.max(s.lastIndexOf('.'), 0))) {
            if (dirs.has(s)) return dirs.get(s)
        }
    }
    const scripts = []
    const dirAt = []
    for (const words of commands) {
        const dir = dirIn(words.scope)
        dirAt.push(dir)
        const moved = changedDir(words, dir)
        if (moved === undefined) {
            for (const script of judge(words, violations, dir)) scripts.push([script, dir])
        } else if (!words.piped && !words.subshell) {
            dirs.set(words.scope, words.conditional ? null : moved)
        }
    }
    // Substitutions, here-strings and heredocs run where their command runs.
    nested.forEach((script, k) => scripts.push([script, dirAt[owners[k]] ?? cwd]))
    // Fail closed: text nested deeper than the guard reads is denied, not
    // waved through (#650 review).
    if (scripts.length && depth >= MAX_DEPTH) {
        violations.add(`nesting deeper than ${MAX_DEPTH} levels (not inspected)`)
    } else {
        for (const [script, at] of scripts) {
            for (const violation of bashViolations(script, depth + 1, at)) violations.add(violation)
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
    // The session's working directory: `pnpm run dev` in apps/web is vite.
    const cwd = typeof input.cwd === 'string' ? repoRelative(path.resolve(input.cwd)) : ''
    const violations = bashViolations(input.tool_input.command, 0, cwd)
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
