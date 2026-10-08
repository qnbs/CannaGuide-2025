#!/usr/bin/env node
/**
 * release-publish.yml keeps RELEASE_PAT on the tag-create step only.
 *
 * Checkout used to prefer that secret over github.token, so a stale or
 * read-only PAT failed the job before any tag work. Dry-run must refuse a
 * missing tag and must not create or push one. Publishing the GitHub
 * Release uses the job token (contents: write), not RELEASE_PAT.
 *
 * Run: node scripts/security/check-release-publish-token.mjs
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const ENSURE = 'Ensure tag exists'
const REFUSE = 'Refuse dry-run when the tag is missing'
const PUBLISH = 'Create GitHub Release'

export function problemsInReleasePublish(text) {
    const steps = splitSteps(text).map((step) => ({ ...step, code: codeOf(step.body) }))
    const problems = []
    const checkouts = steps.filter((step) => /uses:\s*actions\/checkout@/.test(step.code))
    if (checkouts.length === 0) {
        problems.push('release-publish has no actions/checkout step')
    }
    for (const step of checkouts) {
        if (/RELEASE_PAT/.test(step.code)) {
            problems.push(`checkout step "${step.name}" reads RELEASE_PAT`)
        }
        if (!/token:\s*\$\{\{\s*github\.token\s*\}\}/.test(step.code)) {
            problems.push(`checkout step "${step.name}" does not set token to github.token`)
        }
    }

    const ensure = steps.find((step) => step.name === ENSURE)
    if (!ensure) {
        problems.push(`missing step "${ENSURE}"`)
    } else {
        if (!/dry-run\s*!=\s*'true'/.test(ensure.code)) {
            problems.push(`"${ENSURE}" is not skipped on dry-run`)
        }
        if (!/secrets\.RELEASE_PAT/.test(ensure.code)) {
            problems.push(`"${ENSURE}" does not read secrets.RELEASE_PAT`)
        }
        if (!/permissions\.push/.test(ensure.code)) {
            problems.push(`"${ENSURE}" does not preflight Contents write`)
        }
        if (!/GH013/.test(ensure.code)) {
            problems.push(`"${ENSURE}" does not classify a GH013 ruleset refusal`)
        }
        if (/github\.token|secrets\.GITHUB_TOKEN/.test(ensure.code)) {
            problems.push(`"${ENSURE}" falls back to the job token for the tag push`)
        }
    }

    const refuse = steps.find((step) => step.name === REFUSE)
    if (!refuse) {
        problems.push(`missing step "${REFUSE}"`)
    } else {
        if (!/dry-run\s*==\s*'true'/.test(refuse.code)) {
            problems.push(`"${REFUSE}" is not limited to dry-run`)
        }
        if (/\bgit\s+tag\b|\bgit\s+push\b/.test(refuse.code)) {
            problems.push(`"${REFUSE}" creates or pushes a tag`)
        }
        if (!/ls-remote/.test(refuse.code) || !/exit\s+1/.test(refuse.code)) {
            problems.push(`"${REFUSE}" does not fail when the tag is missing`)
        }
    }

    for (const step of steps) {
        if (step.name === ENSURE) continue
        if (/RELEASE_PAT/.test(step.code)) {
            problems.push(`step "${step.name}" reads RELEASE_PAT outside the tag step`)
        }
    }

    const publish = steps.find((step) => step.name === PUBLISH)
    if (!publish) {
        problems.push(`missing step "${PUBLISH}"`)
    } else if (!/GH_TOKEN:\s*\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}/.test(publish.code)) {
        problems.push(`"${PUBLISH}" does not use the job token`)
    }

    if (!/!\(github\.event\.inputs\.dry-run\s*==\s*'true'\)/.test(text)) {
        problems.push('the publish job is not skipped on dry-run')
    }

    return problems
}

function codeOf(body) {
    return body
        .split('\n')
        .filter((line) => !line.trim().startsWith('#'))
        .join('\n')
}

function splitSteps(text) {
    const steps = []
    let current = null
    for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
        const match = line.match(/^\s*- name:\s*(.+?)\s*$/)
        if (match) {
            if (current) steps.push(current)
            current = { name: match[1].replace(/^['"]|['"]$/g, ''), lines: [line] }
            continue
        }
        if (current) current.lines.push(line)
    }
    if (current) steps.push(current)
    return steps.map((step) => ({ name: step.name, body: step.lines.join('\n') }))
}

function main() {
    const file = join(process.cwd(), '.github', 'workflows', 'release-publish.yml')
    const problems = problemsInReleasePublish(readFileSync(file, 'utf8'))
    if (problems.length > 0) {
        for (const problem of problems) console.error(`[FAIL] ${problem}`)
        process.exit(1)
    }
    console.log('[OK] release-publish keeps RELEASE_PAT on the tag step')
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main()
