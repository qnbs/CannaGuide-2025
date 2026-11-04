#!/usr/bin/env node
/**
 * DeepSource JavaScript preflight.
 *
 * DeepSource reports some findings only on its dashboard, which needs a login,
 * and a red DeepSource status on a merged PR shows up again on `main`. This
 * script finds locally, before a push, the findings that turned PRs red in
 * practice, so they can be fixed before review instead of after a merge:
 *
 * - cyclomatic complexity of 6 or more (`.deepsource.toml` sets "low");
 * - a template literal without interpolation (use a plain string);
 * - `undefined` passed explicitly as the last argument;
 * - a class method that does not use `this`;
 * - a `function` declaration at module scope (use a `const` arrow).
 *
 * It does not reproduce every DeepSource rule, and it cannot see DeepSource's
 * metrics (the status text "failing metrics"). A clean run is therefore a good
 * sign, not a guarantee.
 *
 * Usage:
 *   node ./scripts/deepsource-preflight.mjs            # files changed vs origin/main, plus new files
 *   node ./scripts/deepsource-preflight.mjs a.ts b.ts  # these files
 *   --report-only                                       # list findings, exit 0
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import tsParser from '@typescript-eslint/parser'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const SOURCE_FILE = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/u
const SKIPPED_PATH = /(?:^|\/)(?:node_modules|dist|build|coverage|target)\//u

export const PREFLIGHT_RULES = {
    complexity: ['error', 5],
    'class-methods-use-this': 'error',
    'no-restricted-syntax': [
        'error',
        {
            selector: ':not(TaggedTemplateExpression) > TemplateLiteral[expressions.length=0]',
            message: 'Template literal without interpolation: use a plain string literal.',
        },
        {
            selector: 'CallExpression > Identifier[name="undefined"]:last-child',
            message: 'Redundant `undefined` as the last argument: leave it out.',
        },
        {
            selector:
                'Program > FunctionDeclaration, Program > ExportNamedDeclaration > FunctionDeclaration',
            message: 'Function declaration at module scope: use a `const` arrow function.',
        },
    ],
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

/** Files changed against the merge base with origin/main, plus untracked files. */
const changedFiles = () => {
    const base = git(['merge-base', 'origin/main', 'HEAD']).trim()
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

const formatFinding = (filePath, message) =>
    `${filePath}:${message.line}:${message.column}  ${message.ruleId ?? 'parse'}  ${message.message}`

const runPreflight = async (files) => {
    const results = await createPreflightLinter().lintFiles(
        files.map((file) => resolve(repoRoot, file)),
    )
    return results.flatMap((result) =>
        result.messages.map((message) =>
            formatFinding(result.filePath.slice(repoRoot.length + 1), message),
        ),
    )
}

const report = (findings, files) => {
    for (const finding of findings) console.log(finding)
    console.log(
        `[deepsource-preflight] ${String(findings.length)} finding(s) in ${String(files.length)} file(s)`,
    )
}

const main = async () => {
    const args = process.argv.slice(2)
    const named = args.filter((arg) => !arg.startsWith('--'))
    const files = lintableFiles(named.length > 0 ? named : changedFiles())
    if (files.length === 0) {
        console.log('[deepsource-preflight] no changed source files')
        return
    }
    const findings = await runPreflight(files)
    report(findings, files)
    if (findings.length > 0 && !args.includes('--report-only')) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main()
}
