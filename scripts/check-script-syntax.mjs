#!/usr/bin/env node
/**
 * Parse every tracked script that ESLint ignores, so a syntax error cannot reach CI or a hook
 * unseen. eslint.config.js ignores `scripts/**`, `docker/**`, every `*.cjs` and the service
 * worker, so nothing checked them: a stray apostrophe in a single-quoted string broke
 * scripts/check-i18n-hardcoded.mjs on 2026-11-24 and only a review caught it.
 *
 * `node --check` parses without running anything. Usage: node scripts/check-script-syntax.mjs
 */
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** The JavaScript outside ESLint's reach, mirroring its ignore list. */
export const UNLINTED = [
    /^scripts\/.*\.(mjs|cjs|js)$/,
    /^docker\/.*\.(mjs|cjs|js)$/,
    /^\.claude\/.*\.(mjs|cjs|js)$/,
    /\.cjs$/,
    /^(apps\/web\/)?public\/sw\.(js|mjs)$/,
]

export function unlintedScripts(root = ROOT) {
    const listed = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    if (listed.status !== 0) throw new Error('git ls-files failed')
    return listed.stdout
        .split('\0')
        .filter((file) => UNLINTED.some((pattern) => pattern.test(file)))
        .sort()
}

/** The files that do not parse, each with the first line of node's error. */
export function syntaxErrors(files, root = ROOT) {
    const errors = []
    for (const file of files) {
        const parsed = spawnSync(process.execPath, ['--check', file], {
            cwd: root,
            encoding: 'utf8',
        })
        if (parsed.status !== 0) {
            const detail = (parsed.stderr || parsed.error?.message || 'node --check failed')
                .split('\n')
                .find((line) => /Error/.test(line))
            errors.push({ file, detail: detail?.trim() ?? 'node --check failed' })
        }
    }
    return errors
}

function main() {
    const files = unlintedScripts()
    const errors = syntaxErrors(files)
    for (const { file, detail } of errors) console.error(`[FAIL] ${file}: ${detail}`)
    if (errors.length > 0) {
        console.error(`[FAIL] ${errors.length} of ${files.length} unlinted scripts do not parse.`)
        return 1
    }
    console.log(`[OK] All ${files.length} unlinted scripts parse.`)
    return 0
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) process.exitCode = main()
