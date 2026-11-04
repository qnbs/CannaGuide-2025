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
const SKIPPED_PATH = /(?:^|\/)(?:node_modules|dist|build|coverage|target)\//u

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

const mergeBase = () => git(['merge-base', 'origin/main', 'HEAD']).trim()

/** Files changed against the merge base with origin/main, plus untracked files. */
const changedFiles = (base) => {
    const changed = git(['diff', '--name-only', '--diff-filter=AMR', `${base}...HEAD`])
    const local = git(['status', '--porcelain=v1', '--untracked-files=all'])
        .split('\n')
        .filter((line) => line.length > 3 && !line.startsWith(' D') && !line.startsWith('D '))
        .map((line) => line.slice(3))
    return [...new Set([...changed.split('\n'), ...local])]
}

export const lintableFiles = (paths) =>
    paths.filter(
        (path) =>
            SOURCE_FILE.test(path) &&
            !SKIPPED_PATH.test(path) &&
            existsSync(resolve(repoRoot, path)),
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

/**
 * Complexity findings that no finding at the base reaches: a new function over
 * the threshold, or one that got more complex. DeepSource reports the latter as
 * introduced too, although the number of findings in the file stays the same.
 */
const raisedComplexity = (now, before) => {
    const available = before.map(complexityOf).sort((left, right) => left - right)
    const byValue = [...now].sort((left, right) => complexityOf(right) - complexityOf(left))
    return byValue.filter((message) => {
        const index = available.findIndex((value) => value >= complexityOf(message))
        if (index < 0) return true
        available.splice(index, 1)
        return false
    })
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

/** The file at the merge base, or an empty text when it is new there. */
const baseText = (base, file) => {
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

const findingsOf = async (linter, file, options) => {
    const now = await lintText(linter, readFileSync(resolve(repoRoot, file), 'utf8'), file)
    if (options.all) return now
    return raisedFindings(now, await lintText(linter, baseText(options.base, file), file))
}

const runPreflight = async (files, options) => {
    const linter = createPreflightLinter()
    const lines = []
    for (const file of files) {
        const findings = await findingsOf(linter, file, options)
        lines.push(...findings.map((message) => formatFinding(file, message)))
    }
    return lines
}

const report = (findings, files, options) => {
    for (const finding of findings) console.log(finding)
    const scope = options.all ? 'all findings' : 'rules whose count rose'
    console.log(
        `[deepsource-preflight] ${String(findings.length)} finding(s) in ${String(files.length)} file(s) (${scope}; partial coverage)`,
    )
}

const main = async () => {
    const args = process.argv.slice(2)
    const named = args.filter((arg) => !arg.startsWith('--'))
    const options = { all: args.includes('--all'), base: mergeBase() }
    const files = lintableFiles(named.length > 0 ? named : changedFiles(options.base))
    if (files.length === 0) {
        console.log('[deepsource-preflight] no changed source files')
        return
    }
    const findings = await runPreflight(files, options)
    report(findings, files, options)
    if (findings.length > 0 && !args.includes('--report-only')) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main()
}
