import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

// Every step that uses github/codeql-action must run one version. A bump of only one
// sub-action fails every CodeQL job with "Loaded a configuration file for version
// '4.39.3', but running version '4.39.4'" (GH #925), so the pins and the Dependabot
// group that keeps them together are checked here.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const WORKFLOWS = join(REPO_ROOT, '.github/workflows')
const USE = /uses:\s*github\/codeql-action(?:\/([\w-]+))?@([^\s#]+)(?:[ \t]*#[ \t]*(\S+))?/gu

function codeqlUses(file, text) {
    return [...text.matchAll(USE)].map((match) => ({
        file,
        action: match[1] ?? '(root)',
        ref: match[2],
        version: match[3],
    }))
}

/** Problems with a set of codeql-action steps; empty when they all run one pinned version. */
function pinProblems(uses) {
    const problems = []
    for (const use of uses) {
        if (!/^[0-9a-f]{40}$/u.test(use.ref)) {
            problems.push(`${use.file}: ${use.action} is not pinned to a commit (${use.ref})`)
        }
        if (!/^v\d+\.\d+\.\d+$/u.test(use.version ?? '')) {
            problems.push(`${use.file}: ${use.action} has no version comment`)
        }
    }
    const pins = new Set(uses.map((use) => `${use.ref} ${use.version}`))
    if (pins.size > 1) problems.push(`more than one pin: ${[...pins].sort().join(', ')}`)
    return problems
}

function workflowUses() {
    return readdirSync(WORKFLOWS)
        .filter((name) => /\.ya?ml$/u.test(name))
        .sort()
        .flatMap((name) => codeqlUses(name, readFileSync(join(WORKFLOWS, name), 'utf8')))
}

test('every github/codeql-action step pins the same commit and version', () => {
    const uses = workflowUses()
    assert.ok(uses.length > 0, 'no github/codeql-action step found')
    assert.deepEqual(pinProblems(uses), [])
})

test('a bump of one sub-action alone is reported, as in GH #925', () => {
    const old = '33d7b85da1a04171e211befe2c739303b9a4c066 # v4.39.3'
    const bumped = '1bd86f2fdb4b86187fa4059f16f31a3202acc9ea # v4.39.4'
    const uses = codeqlUses(
        'codeql.yml',
        [
            `              uses: github/codeql-action/init@${old}`,
            `              uses: github/codeql-action/analyze@${bumped}`,
            '              uses: github/codeql-action/upload-sarif@v4',
        ].join('\n'),
    )
    assert.deepEqual(pinProblems(uses), [
        'codeql.yml: upload-sarif is not pinned to a commit (v4)',
        'codeql.yml: upload-sarif has no version comment',
        `more than one pin: 1bd86f2fdb4b86187fa4059f16f31a3202acc9ea v4.39.4, 33d7b85da1a04171e211befe2c739303b9a4c066 v4.39.3, v4 undefined`,
    ])
})

test('Dependabot updates the github/codeql-action family in one group', () => {
    const config = readFileSync(join(REPO_ROOT, '.github/dependabot.yml'), 'utf8')
    const start = config.indexOf('- package-ecosystem: github-actions')
    assert.notEqual(start, -1, 'no github-actions ecosystem in dependabot.yml')
    const next = config.indexOf('- package-ecosystem:', start + 1)
    const block = config.slice(start, next === -1 ? undefined : next)
    assert.match(
        block,
        /\n {10}codeql-action:\n {14}patterns:\n {18}- 'github\/codeql-action'\n {18}- 'github\/codeql-action\/\*'\n/u,
    )
})
