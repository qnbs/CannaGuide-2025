#!/usr/bin/env node
/**
 * Fail when a deploy, signing, or release secret can be read from a
 * pull_request workflow or from a workflow_dispatch that is not pinned to
 * main.
 *
 * pull_request runs the workflow file from the merge commit, so a same-repo
 * pull request can rewrite any step that sees the secret. workflow_dispatch
 * selects a branch; without a main ref guard that branch is the one that
 * runs with the secret.
 *
 * GitHub Environments and secret rotation are owner settings and are not
 * claimed here. GITHUB_TOKEN is not in the privileged set: its scope is the
 * job permissions block.
 *
 * Run: node scripts/security/check-workflow-credential-scope.mjs
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const PRIVILEGED = new Set([
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'VERCEL_TOKEN',
    'RELEASE_PAT',
    'TAURI_SIGNING_PRIVATE_KEY',
    'TAURI_SIGNING_PRIVATE_KEY_PASSWORD',
    'APPLE_CERTIFICATE',
    'APPLE_CERTIFICATE_PASSWORD',
    'APPLE_SIGNING_IDENTITY',
    'APPLE_ID',
    'APPLE_PASSWORD',
    'APPLE_TEAM_ID',
    'WINDOWS_CERTIFICATE_THUMBPRINT',
    'SNYK_TOKEN',
])

const DISPATCH_GUARD =
    /github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main'/

export function violationsInWorkflow(filename, text) {
    const triggers = triggerKeys(text)
    const problems = []
    for (const job of jobsOf(text)) {
        const secrets = privilegedSecrets(job.lines)
        if (secrets.length === 0) continue
        const ifText = jobIf(job.lines)
        const listed = secrets.join(', ')
        if (reachableFromPullRequest(triggers, ifText)) {
            problems.push(
                `${filename} job ${job.name} reads ${listed} from a pull_request workflow`,
            )
        }
        const normalizedIf = ifText.replace(/\s+/g, ' ')
        if (triggers.has('workflow_dispatch') && !DISPATCH_GUARD.test(normalizedIf)) {
            problems.push(
                `${filename} job ${job.name} reads ${listed} from workflow_dispatch without a main ref guard`,
            )
        }
    }
    return problems
}

export function violationsInTree(root) {
    const dir = join(root, '.github', 'workflows')
    const problems = []
    for (const name of readdirSync(dir).filter(
        (entry) => entry.endsWith('.yml') || entry.endsWith('.yaml'),
    )) {
        const text = readFileSync(join(dir, name), 'utf8')
        problems.push(...violationsInWorkflow(name, text))
    }
    return problems
}

function triggerKeys(text) {
    const onStart = text.search(/^on:\s*$/m)
    if (onStart < 0) return new Set()
    const after = text.slice(onStart)
    const jobsAt = after.search(/^jobs:\s*$/m)
    const onBlock = jobsAt < 0 ? after : after.slice(0, jobsAt)
    const keys = new Set()
    for (const line of onBlock.split('\n')) {
        const match = line.match(/^ {4}([A-Za-z0-9_-]+):\s*$/)
        if (match) keys.add(match[1])
    }
    return keys
}

function jobsOf(text) {
    const jobsAt = text.search(/^jobs:\s*$/m)
    if (jobsAt < 0) return []
    const lines = text.slice(jobsAt).split('\n').slice(1)
    const jobs = []
    let current = null
    for (const line of lines) {
        const match = line.match(/^ {4}([A-Za-z0-9_-]+):\s*$/)
        if (match) {
            if (current) jobs.push(current)
            current = { name: match[1], lines: [] }
            continue
        }
        if (current) current.lines.push(line)
    }
    if (current) jobs.push(current)
    return jobs
}

function jobIf(lines) {
    const out = []
    let collecting = false
    for (const line of lines) {
        if (!collecting) {
            const match = line.match(/^ {8}if:\s*(.*)$/)
            if (!match) continue
            collecting = true
            out.push(match[1])
            continue
        }
        if (line.trim() === '') {
            out.push('')
            continue
        }
        const indent = line.match(/^\s*/)[0].length
        if (indent > 8) {
            out.push(line.trim())
            continue
        }
        break
    }
    return out.join('\n')
}

function privilegedSecrets(lines) {
    const found = new Set()
    const pattern = /secrets\.([A-Z][A-Z0-9_]*)/g
    for (const line of lines) {
        for (const match of line.matchAll(pattern)) {
            if (PRIVILEGED.has(match[1])) found.add(match[1])
        }
    }
    return [...found]
}

function reachableFromPullRequest(triggers, ifText) {
    const hasPullRequest = triggers.has('pull_request') || triggers.has('pull_request_target')
    if (!hasPullRequest) return false
    if (!ifText.trim()) return true
    if (/github\.event_name\s*==\s*'pull_request'/.test(ifText)) return true
    if (/github\.event_name\s*==\s*'pull_request_target'/.test(ifText)) return true
    if (/github\.event_name\s*==\s*'workflow_run'/.test(ifText)) return false
    if (
        /github\.event_name\s*!=\s*'pull_request'/.test(ifText) &&
        /github\.event_name\s*!=\s*'pull_request_target'/.test(ifText)
    ) {
        return false
    }
    return true
}

function main() {
    const problems = violationsInTree(process.cwd())
    if (problems.length > 0) {
        for (const problem of problems) console.error(`[FAIL] ${problem}`)
        process.exit(1)
    }
    console.log(
        '[OK] Deploy, signing, and release secrets stay off pull_request and off non-main dispatch.',
    )
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
