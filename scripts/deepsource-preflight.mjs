#!/usr/bin/env node
/**
 * DeepSource JavaScript preflight (GH #804). PARTIAL coverage, never a gate.
 *
 * DeepSource fails a PR on occurrences the PR *introduces*, and lists them only
 * on its dashboard. This script approximates that before a push, for the active
 * rules it can mirror with ESLint core rules or AST selectors (MIRRORED below).
 * By default it lints every changed file twice, at the merge base and as it is
 * now, and reports a rule only where its count in a file went up -- the closest
 * local match for "introduced". `--all` lists every finding in those files.
 *
 * Not mirrored: rules that need type information or plugins (for example
 * JS-0357 use-before-define for TypeScript, JS-0437 index keys), DeepSource's
 * metrics, and the owner-retired rules JS-0067 and JS-T1001 (GH #808), which
 * must not come back through this script. A clean run is a good sign, not a
 * certificate: the exact-head `DeepSource: JavaScript` status stays the gate.
 *
 * Usage:
 *   node ./scripts/deepsource-preflight.mjs            # changed vs origin/main, plus new files
 *   node ./scripts/deepsource-preflight.mjs a.ts b.ts  # these files
 *   --all          every finding, not only the ones whose count rose
 *   --report-only  list findings, exit 0
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import tsParser from '@typescript-eslint/parser'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const SOURCE_FILE = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/u
/** The `exclude_patterns` of `.deepsource.toml`: DeepSource does not analyze these paths. */
const SKIPPED_PATH =
    /(?:^|\/)(?:node_modules|dist|build|coverage|out|\.venv|__pycache__|[^/]+\.egg-info|target|\.gradle|\.mvn|vendor)\//u

export const isSkippedPath = (path) => SKIPPED_PATH.test(path)

const SELECTORS = [
    {
        selector: ':not(TaggedTemplateExpression) > TemplateLiteral[expressions.length=0]',
        message: 'JS-R1004 Template literal without interpolation: use a plain string literal.',
    },
    {
        selector: 'CallExpression > Identifier[name="undefined"]:last-child',
        message: 'JS-W1042 Redundant `undefined` as the last argument: leave it out.',
    },
    {
        selector: 'TSNonNullExpression',
        message: 'JS-0339 Non-null assertion: narrow the value instead.',
    },
]

/** Which DeepSource rule each mirrored check stands for. */
export const MIRRORED = {
    complexity: 'JS-R1005',
    'class-methods-use-this': 'JS-0105',
    'require-await': 'JS-0116',
    'consistent-return': 'JS-0045',
    'default-case': 'JS-0047',
    'guard-for-in': 'JS-0051',
    'no-restricted-syntax': 'JS-R1004, JS-W1042, JS-0339',
}

export const PREFLIGHT_RULES = {
    // `.deepsource.toml` sets the JavaScript threshold to "low": 6 or more is reported.
    complexity: ['error', 5],
    'class-methods-use-this': 'error',
    'require-await': 'error',
    'consistent-return': 'error',
    'default-case': 'error',
    'guard-for-in': 'error',
    'no-restricted-syntax': ['error', ...SELECTORS],
}

export const createPreflightLinter = () =>
    new ESLint({
        cwd: repoRoot,
        overrideConfigFile: true,
        overrideConfig: [
            {
                files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
                languageOptions: {
                    parser: tsParser,
                    ecmaVersion: 'latest',
                    sourceType: 'module',
                    parserOptions: { ecmaFeatures: { jsx: true } },
                },
                linterOptions: { reportUnusedDisableDirectives: 'off' },
                rules: PREFLIGHT_RULES,
            },
        ],
    })

const git = (args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })

/** The merge base with origin/main, or a clear error when that ref is missing. */
const mergeBase = () => {
    try {
        return execFileSync('git', ['merge-base', 'origin/main', 'HEAD'], {
            cwd: repoRoot,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim()
    } catch {
        throw new Error(
            'origin/main is not available here: run `git fetch origin main`, or name the files with --all.',
        )
    }
}

const nulFields = (text) => text.split('\0').filter((field) => field.length > 0)

/** How many fields a `--name-status -z` record has: renames and copies name two paths. */
const recordLength = (status) => (/^[RC]/u.test(status) ? 3 : 2)

/**
 * `git diff -z --name-status` output as `{ file, basePath }`: the path now and
 * the path at the base. For a rename (`R100 old new`) the base path is the old
 * one, so its findings are not taken for new ones. NUL-separated output keeps
 * paths with spaces or non-ASCII characters exactly as they are.
 */
export const parseNameStatus = (text) => {
    const fields = nulFields(text)
    const entries = []
    for (let index = 0; index < fields.length; index += recordLength(fields[index])) {
        const length = recordLength(fields[index])
        entries.push({ file: fields[index + length - 1], basePath: fields[index + 1] })
    }
    return entries
}

/**
 * Every source file that differs from the merge base -- committed, staged or
 * not -- with renames resolved, plus untracked files (new, so no base path).
 */
const changedFiles = (base) => [
    ...parseNameStatus(git(['diff', '-z', '--name-status', '-M', '--diff-filter=AMRC', base])),
    ...nulFields(git(['ls-files', '-z', '--others', '--exclude-standard'])).map((file) => ({
        file,
        basePath: file,
    })),
]

export const lintableFiles = (paths) =>
    paths.filter(
        (path) =>
            SOURCE_FILE.test(path) && !isSkippedPath(path) && existsSync(resolve(repoRoot, path)),
    )

/**
 * Only findings of the configured rules, and parse errors. A disable comment
 * that names a rule this config does not load would otherwise be reported as
 * "Definition for rule ... was not found", which is not a DeepSource finding.
 */
export const isPreflightFinding = (message) =>
    message.ruleId === null || Object.hasOwn(PREFLIGHT_RULES, message.ruleId)

/** One count per rule, and per selector message for `no-restricted-syntax`. */
export const findingKey = (message) =>
    message.ruleId === 'no-restricted-syntax'
        ? `${message.ruleId}: ${message.message}`
        : String(message.ruleId)

const countByKey = (messages) => {
    const counts = new Map()
    for (const message of messages) {
        const key = findingKey(message)
        counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
}

/** The findings of every rule whose count is higher now than at the base. */
const raisedCounts = (now, before) => {
    const nowCounts = countByKey(now)
    const beforeCounts = countByKey(before)
    return now.filter(
        (message) =>
            (nowCounts.get(findingKey(message)) ?? 0) >
            (beforeCounts.get(findingKey(message)) ?? 0),
    )
}

const complexityOf = (message) => Number(/complexity of (\d+)/u.exec(message.message)?.[1] ?? 0)

/** Findings no finding of the same group at the base reaches in value. */
const raisedByValue = (now, before) => {
    const available = before.map(complexityOf).sort((left, right) => left - right)
    const byValue = [...now].sort((left, right) => complexityOf(right) - complexityOf(left))
    return byValue.filter((message) => {
        const index = available.findIndex((value) => value >= complexityOf(message))
        if (index < 0) return true
        available.splice(index, 1)
        return false
    })
}

/**
 * Which function a complexity finding is about: ESLint names it when it has a
 * name ("Arrow function 'build'", "Method 'render'"), and only gives the kind
 * for an anonymous one ("Arrow function").
 */
export const functionOf = (message) =>
    /^(?<name>.*) has a complexity of/u.exec(message.message)?.groups?.['name'] ?? ''

const byFunction = (messages) => {
    const groups = new Map()
    for (const message of messages) {
        const name = functionOf(message)
        groups.set(name, [...(groups.get(name) ?? []), message])
    }
    return groups
}

/**
 * Complexity findings that make a function worse than at the base: a new
 * function over the threshold, or one that got more complex. DeepSource reports
 * the latter as introduced too, although the number of findings stays the same.
 * Named functions are compared with the same name at the base, so one getting
 * simpler cannot hide another getting more complex; anonymous functions (an
 * inline callback) can only be compared by value among themselves.
 */
const byLine = (left, right) => left.line - right.line

/** The same functions in the same order: compare each with its counterpart. */
const raisedByOrder = (now, before) => {
    const ordered = [...before].sort(byLine)
    return [...now]
        .sort(byLine)
        .filter((message, index) => complexityOf(message) > complexityOf(ordered[index]))
}

/**
 * Per group of functions with the same name (or the same anonymous kind): with
 * as many findings as at the base, they are the same functions in the same
 * order, so each is compared with its counterpart -- two `render` methods, or
 * two inline callbacks, cannot cancel each other out. When the number changed,
 * a function was added or removed, and only the values can be compared.
 */
const raisedInGroup = (now, before) =>
    now.length === before.length ? raisedByOrder(now, before) : raisedByValue(now, before)

const raisedComplexity = (now, before) => {
    const beforeGroups = byFunction(before)
    return [...byFunction(now)].flatMap(([name, messages]) =>
        raisedInGroup(messages, beforeGroups.get(name) ?? []),
    )
}

const isComplexity = (message) => message.ruleId === 'complexity'

/** The findings that make the file worse than at the base. */
export const raisedFindings = (now, before) => [
    ...raisedComplexity(now.filter(isComplexity), before.filter(isComplexity)),
    ...raisedCounts(
        now.filter((message) => !isComplexity(message)),
        before.filter((message) => !isComplexity(message)),
    ),
]

const lintText = async (linter, text, file) => {
    const [result] = await linter.lintText(text, { filePath: resolve(repoRoot, file) })
    return (result?.messages ?? []).filter(isPreflightFinding)
}

/**
 * Where the file was at the base, for the comparison. A file renamed out of a
 * path DeepSource excludes (vendor, dist, ...) was never analyzed there, so it
 * is compared with nothing: all its findings are new to DeepSource.
 */
export const baselinePath = (entry) =>
    isSkippedPath(entry.basePath) && !isSkippedPath(entry.file) ? null : entry.basePath

/** The file at the merge base, or an empty text when it is new there. */
const baseText = (base, file) => {
    if (file === null) return ''
    try {
        return execFileSync('git', ['show', `${base}:${file}`], {
            cwd: repoRoot,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        })
    } catch {
        return ''
    }
}

const formatFinding = (file, message) =>
    `${file}:${String(message.line)}:${String(message.column)}  ${message.ruleId ?? 'parse'}  ${message.message}`

const findingsOf = async (linter, entry, options) => {
    const now = await lintText(
        linter,
        readFileSync(resolve(repoRoot, entry.file), 'utf8'),
        entry.file,
    )
    if (options.all) return now
    const before = await lintText(linter, baseText(options.base, baselinePath(entry)), entry.file)
    return raisedFindings(now, before)
}

const runPreflight = async (entries, options) => {
    const linter = createPreflightLinter()
    const lines = []
    for (const entry of entries) {
        const findings = await findingsOf(linter, entry, options)
        lines.push(...findings.map((message) => formatFinding(entry.file, message)))
    }
    return lines
}

const report = (findings, entries, options) => {
    for (const finding of findings) console.log(finding)
    const scope = options.all
        ? 'all findings'
        : 'findings that rose against the merge base; complexity per function'
    console.log(
        `[deepsource-preflight] ${String(findings.length)} finding(s) in ${String(entries.length)} file(s) (${scope}; partial coverage)`,
    )
}

/** Named files are compared with themselves at the base; otherwise the changed files. */
const selectEntries = (named, base) => {
    const entries =
        named.length > 0 ? named.map((file) => ({ file, basePath: file })) : changedFiles(base)
    const lintable = new Set(lintableFiles(entries.map(({ file }) => file)))
    return entries.filter(({ file }) => lintable.has(file))
}

/** `--all` on named files reads no base, so it works without origin/main. */
const baseFor = (named, all) => (all && named.length > 0 ? null : mergeBase())

const failsRun = (findings, args) => findings.length > 0 && !args.includes('--report-only')

const run = async (args) => {
    const named = args.filter((arg) => !arg.startsWith('--'))
    const all = args.includes('--all')
    const base = baseFor(named, all)
    const options = { all, base }
    const entries = selectEntries(named, base)
    if (entries.length === 0) {
        console.log('[deepsource-preflight] no changed source files')
        return
    }
    const findings = await runPreflight(entries, options)
    report(findings, entries, options)
    if (failsRun(findings, args)) process.exitCode = 1
}

const main = async () => {
    try {
        await run(process.argv.slice(2))
    } catch (error) {
        console.error(
            `[deepsource-preflight] ${error instanceof Error ? error.message : String(error)}`,
        )
        process.exitCode = 2
    }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main()
}
