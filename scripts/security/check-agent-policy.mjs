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

/** Every file ci.yml routes to the policy job (POLICY_PATHS, minus generated graphify-out). */
export const AGENT_FILES = [
    'AGENTS.md',
    'CLAUDE.md',
    '.github/copilot-instructions.md',
    'docs/PR-REVIEW-LOOP.md',
    'CONTRIBUTING.md',
    'SECURITY.md',
    'docs/release-process.md',
    '.github/CI-AUDIT.md',
    '.github/workflows/README.md',
    'docs/DEVOPS-GATES.md',
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
    ['git add -A / git add .', /\bgit add (?:-A|--all|\.)(?=[\s`;&|)]|$)/g],
    ['admin merge', /--admin\b/g],
    ['force push', /\bpush\b[^\n]*?(?:--force\b|\s-f\b)/g],
    // The short form of --no-verify, and Husky's switch that disables every hook.
    ['git commit -n', /\bgit commit\b[^\n`]*?\s-n\b/g],
    ['HUSKY=0', /\bHUSKY=0\b/g],
]

/** pnpm options that take a separate value (`--dir x`, `-C x`). */
const PNPM_VALUE_OPTIONS = new Set([
    '-C',
    '--dir',
    '--loglevel',
    '--reporter',
    '--workspace-concurrency',
    '--store-dir',
    '--test-pattern',
    '--changed-files-ignore-pattern',
    '--registry',
    '--virtual-store-dir',
    '--modules-dir',
    '--lockfile-dir',
    '--global-dir',
    '--cache-dir',
    '--fetch-timeout',
    '--fetch-retries',
    '--network-concurrency',
    '--child-concurrency',
    '--resolution-mode',
    '--node-linker',
    '--use-node-version',
])
const isFilter = (token) => /^(?:--filter(?:-prod)?|-F)(?:=|$)/.test(token)
/**
 * Words that start what pnpm runs. An option this module does not know is
 * read as value-taking when a value and then one of these follow it -- the
 * list of value options can never be complete, so fail closed (#650 review).
 */
const PNPM_COMMAND_WORDS = new Set([
    'install',
    'i',
    'install-test',
    'it',
    'add',
    'run',
    'run-script',
    'exec',
    'dlx',
    'test',
    'typecheck',
    'lint',
    'test:run',
    'test:coverage',
    'lint:full',
])

/**
 * A pnpm command split into its parts: pnpm's own options may come before the
 * script (`pnpm --silent test`, `pnpm --dir apps/web install`), and a
 * `--filter` / `-F` among them, also in `=` form, scopes the run (#650 review).
 * Tokenised rather than a regex: an earlier pattern with a nested quantifier
 * was a ReDoS (CodeQL).
 */
export function pnpmInvocation(command) {
    const tokens = command.split('#')[0].trim().split(/\s+/)
    if (tokens[0] !== 'pnpm') return null
    const filters = []
    let i = 1
    // Options come before the command, and again between `run` and the script
    // (`pnpm run --if-present typecheck`; #650 review).
    const skipOptions = () => {
        while (i < tokens.length && tokens[i].startsWith('-') && tokens[i] !== '--') {
            const token = tokens[i]
            if (isFilter(token)) {
                const value = token.includes('=')
                    ? token.slice(token.indexOf('=') + 1)
                    : tokens[i + 1]
                filters.push((value ?? '').replace(/['"]/g, ''))
            }
            const takesValue =
                /^(?:--filter(?:-prod)?|-F)$/.test(token) ||
                PNPM_VALUE_OPTIONS.has(token) ||
                (!token.includes('=') &&
                    !PNPM_COMMAND_WORDS.has(tokens[i + 1]) &&
                    PNPM_COMMAND_WORDS.has(tokens[i + 2]))
            i += takesValue ? 2 : 1
        }
    }
    skipOptions()
    // `run-script` is pnpm's alias of `run` (#650 review).
    if (tokens[i] === 'run' || tokens[i] === 'run-script') {
        i += 1
        skipOptions()
    }
    // Only a concrete package or path scopes the run: a glob, an exclusion
    // (`!x`), a dependency selector (`...`) or a brace set can select every
    // workspace (`--filter '@cannaguide/*'`), and the root (`.`, `./`,
    // `./apps/..`) runs the root script, i.e. `turbo run` (#650 review).
    const filtered =
        filters.length > 0 &&
        filters.every(
            (v) =>
                v && !/[*!{}[\]]|\.\.\./.test(v) && !['.', './'].includes(path.posix.normalize(v)),
        )
    return { filtered, script: tokens[i], rest: tokens.slice(i + 1) }
}

/** pnpm's builtin that runs `pnpm install` and then `pnpm test`, and its alias. */
export const INSTALL_TEST = ['install-test', 'it']

const UNFILTERED = [
    'unfiltered pnpm suite',
    {
        test(command) {
            const run = pnpmInvocation(command)
            // `pnpm install-test` / `pnpm it` is `pnpm install` + `pnpm test` (#650 review).
            const suites = [
                ...['test', 'typecheck', 'lint', 'test:run', 'test:coverage', 'lint:full'],
                ...INSTALL_TEST,
            ]
            if (!run || run.filtered || !suites.includes(run.script)) return false
            // A filter after the script still reaches turbo, but only before a
            // standalone `--`: after it, it is the script's argument
            // (`pnpm test -- --filter=!x`).
            const end = run.rest.indexOf('--')
            return !(end === -1 ? run.rest : run.rest.slice(0, end)).some(isFilter)
        },
    },
]
/** Vitest options that take a separate value (`-t <pattern>`, `--reporter dot`). */
const VITEST_VALUE_OPTIONS = new Set([
    '-t',
    '--testNamePattern',
    '-c',
    '--config',
    '-r',
    '--root',
    '--dir',
    '--project',
    '--reporter',
    '--environment',
    '--pool',
    '--shard',
    '--exclude',
    '--maxWorkers',
    '--minWorkers',
    '--outputFile',
    '--output-file',
    '--test-name-pattern',
    '--testTimeout',
    '--test-timeout',
    '--hookTimeout',
    '--hook-timeout',
    '--teardownTimeout',
    '--teardown-timeout',
    '--max-workers',
    '--min-workers',
    '--maxConcurrency',
    '--max-concurrency',
    '--retry',
    '--bail',
    '--mode',
    '--browser',
    '--inspect-brk',
    '--slowTestThreshold',
    '--slow-test-threshold',
])

/**
 * The positional spec filters of a Vitest argument list. Option values are not
 * filters (`-t .` names tests, not files), and `.` / `./` match every file
 * (#650 review).
 */
function specFilters(args) {
    const filters = []
    for (let i = 0; i < args.length; i += 1) {
        // Dotted options (`--coverage.reporter text`) take a value as well; a bare
        // number is an option value, never a file filter (fail closed).
        if (VITEST_VALUE_OPTIONS.has(args[i]) || /^--\w+\.[\w.]+$/.test(args[i])) i += 1
        // An empty filter ('' / "") matches every file as well.
        else if (!args[i].startsWith('-') && !/^(?:\.\/?|\d+|''|"")$/.test(args[i])) {
            filters.push(args[i])
        }
    }
    return filters
}

/**
 * `pnpm --filter <pkg> test|test:run|test:coverage` still runs that package's
 * whole suite when it names no spec (options only) or when a `--` swallows the
 * spec filter (CLAUDE.md trap #1).
 */
const WHOLE_SUITE = [
    'whole-suite test run',
    {
        test(command) {
            const run = pnpmInvocation(command)
            const tests = ['test', 'test:run', 'test:coverage', ...INSTALL_TEST]
            if (!run || !tests.includes(run.script)) return false
            // A filter after the script goes to the root script (`turbo run
            // test:run --filter <pkg>`), which runs that package's whole suite;
            // the scoped form is `pnpm --filter <pkg> test:run <spec>` (#650 review).
            const end = run.rest.indexOf('--')
            if ((end === -1 ? run.rest : run.rest.slice(0, end)).some(isFilter)) return true
            if (!run.filtered) return false
            if (end !== -1) return true
            return specFilters(run.rest).length === 0
        },
    },
]
/**
 * Vitest started directly (`vitest`, `vitest run`, `pnpm exec vitest run`,
 * also `cd apps/web && ...`) without a spec filter runs the whole suite, like
 * the package script does (#650 review). `vitest list` / `init` run no tests.
 */
const DIRECT_VITEST = [
    'whole-suite test run',
    {
        test(command) {
            const tokens = command.split('#')[0].trim().split(/\s+/)
            if (tokens[0] !== 'vitest' || ['list', 'init'].includes(tokens[1])) return false
            const args = /^(?:run|watch|dev|related|bench|typecheck)$/.test(tokens[1] ?? '')
                ? tokens.slice(2)
                : tokens.slice(1)
            const end = args.indexOf('--')
            return specFilters(end === -1 ? args : args.slice(0, end)).length === 0
        },
    },
]
/** `turbo run <task>` without a `--filter` before `--` (after it, the flag goes to the task). */
/** turbo subcommands that run no tasks; any other first word is a task (`turbo typecheck`). */
const TURBO_NON_RUN = new Set([
    'login',
    'logout',
    'link',
    'unlink',
    'prune',
    'gen',
    'generate',
    'daemon',
    'ls',
    'info',
    'query',
    'telemetry',
    'bin',
    'completion',
    'scan',
    'boundaries',
    'docs',
    'devtools',
    'help',
])
/** turbo run options whose value is the next word. */
const TURBO_VALUE_OPTIONS = new Set([
    '--concurrency',
    '--filter',
    '-F',
    '--cache',
    '--cache-dir',
    '--env-mode',
    '--graph',
    '--log-order',
    '--log-prefix',
    '--output-logs',
    '--profile',
    '--ui',
])
const BARE_TURBO = [
    'bare turbo run',
    {
        // `turbo run <task>`, its alias `turbo <task>` and `turbo watch <task>`
        // run tasks; without a --filter before `--` they run every workspace
        // (#650 review).
        test(command) {
            const tokens = command.trim().split(/\s+/)
            if (tokens[0] !== 'turbo') return false
            const explicit = tokens[1] === 'run' || tokens[1] === 'watch'
            // Options may come before the task: `turbo run --concurrency=1
            // typecheck` (#650 review); a value option takes the next word.
            let k = explicit ? 2 : 1
            while (tokens[k]?.startsWith('-')) {
                k += !tokens[k].includes('=') && TURBO_VALUE_OPTIONS.has(tokens[k]) ? 2 : 1
            }
            const task = tokens[k]
            if (!task || task.startsWith('-') || (!explicit && TURBO_NON_RUN.has(task)))
                return false
            // Scoped only by concrete filters (`--filter` or its alias `-F`,
            // before `--`): a glob, dependency selector or the root can select
            // every workspace (`--filter='./apps/*'`; #650 review). An explicit
            // exclusion is a deliberate narrowing -- the prescribed production
            // build is `turbo run build --filter=!@cannaguide/desktop`.
            const options = command.split(/\s--(?=\s|$)/)[0].split(/\s+/)
            const values = []
            options.forEach((token, k) => {
                const match = /^(?:--filter|-F)(?:=(.*))?$/.exec(token)
                if (match) values.push((match[1] ?? options[k + 1] ?? '').replace(/['"]/g, ''))
            })
            const scoped =
                values.length > 0 &&
                values.every(
                    (v) => v && !/[*{}[\]]|\.\.\./.test(v) && !['.', './', '//'].includes(v),
                )
            return !scoped
        },
    },
]

/**
 * The heavy-command rule one shell command breaks, or null. Shared with the
 * Claude Code Bash guard (.claude/hooks/guard-bash.mjs), which judges the
 * commands an agent actually runs.
 */
export function heavyCommandRule(command) {
    for (const [label, pattern] of [BARE_TURBO, UNFILTERED, WHOLE_SUITE, DIRECT_VITEST]) {
        if (pattern.test(command)) return label
    }
    return null
}

/**
 * The individual shell commands of a line: split at `;`, `&&`, `||` and `|`,
 * with leading env assignments and a `pnpm exec` / `npx` launcher removed, so
 * `pnpm test;`, `CI=1 pnpm test` and `pnpm exec turbo run lint` are judged as
 * the command they run.
 */
export function shellCommands(text) {
    return text
        .split('#')[0]
        .split(/&&|\|\||[;|]/)
        .map((part) =>
            part
                .trim()
                .replace(/^(?:[A-Za-z_][A-Za-z0-9_]*=\S*\s+)+/, '')
                .replace(/^(?:pnpm (?:exec|dlx)|npx)\s+/, ''),
        )
        .filter(Boolean)
}

const FENCE = /^\s*(```|~~~)/

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

/**
 * Backticked names that a clause gives as what CI Status "requires": only after
 * the verb (not the adjective "Required") and only up to the end of that clause.
 */
function requiredJobNames(line) {
    const plain = line.replace(/[*_]/g, '')
    const verb = /\brequires?\b/i.exec(plain)
    if (!verb) return []
    const rest = plain.slice(verb.index + verb[0].length)
    const clauseEnd = rest.search(/[.!?](?=\s|$)|\s--\s|\b(?:but|however|except)\b/i)
    return [
        ...(clauseEnd === -1 ? rest : rest.slice(0, clauseEnd)).matchAll(/`([a-z][a-z0-9-]*)`/g),
    ]
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
        for (const command of shellCommands(line)) {
            for (const [label, pattern] of [BARE_TURBO, UNFILTERED, WHOLE_SUITE, DIRECT_VITEST]) {
                if (pattern.test(command))
                    problems.push(`${where}: ${label} in a command block: ${line.trim()}`)
            }
        }
        return problems
    }
    // Inline code: only the pnpm rules -- `turbo run ...` appears inline in the
    // warnings that explain why it is banned.
    for (const m of line.matchAll(/`([^`]+)`/g)) {
        if (isForbiddenAt(line, m.index)) continue
        for (const command of shellCommands(m[1])) {
            for (const [label, pattern] of [UNFILTERED, WHOLE_SUITE]) {
                if (pattern.test(command))
                    problems.push(`${where}: ${label} instructed inline: ${m[0]}`)
            }
        }
    }
    if (needs && /CI Status/.test(line)) {
        for (const m of requiredJobNames(line)) {
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
            if (FENCE.test(line)) {
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
