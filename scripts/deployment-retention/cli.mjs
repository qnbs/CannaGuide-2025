/**
 * CLI for host deployment retention.
 *
 * Dry-run is the default. `--apply` deletes only ids that are SAFE_DELETE_*
 * in both the frozen plan and a fresh reclassification. Refuses pull_request
 * events and any ref other than main when running inside GitHub Actions.
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

import {
    attachAliasRecords,
    classifyRetention,
    formatReport,
    normalizeDeployment,
    projectAliasRecord,
    projectRetentionRecord,
    reconcilePlans,
} from './classify.mjs'
import {
    deleteProvenDeployments,
    listCloudflareDeployments,
    listVercelAliases,
    listVercelDeployments,
} from './hosts.mjs'

const PAGES_PROJECT = 'cannaguide-2025'
const VERCEL_PROJECT = 'prj_aCxh4Qd9pZMB7b2atH9pfqGVY8Q0'
const VERCEL_TEAM = 'team_Dx4T2J41LNqP8mDgrRraonWp'
const PAGES_VERSION_URL = 'https://cannaguide-2025.pages.dev/version.json'
const VERCEL_VERSION_URL = 'https://canna-guide-2025-web.vercel.app/version.json'

function arg(name, fallback = '') {
    const index = process.argv.indexOf(name)
    if (index === -1) return fallback
    return process.argv[index + 1] || fallback
}

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'))
}

function writeJson(filePath, value) {
    const root = resolve('retention-reports')
    const target = resolve(filePath)
    if (target !== root && !target.startsWith(`${root}${sep}`)) {
        throw new Error('refusing to write outside retention-reports')
    }
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`)
}

/**
 * `--apply` runs only for schedule, workflow_dispatch, or a workflow_run
 * that the trusted workflow proved is a successful push to main in this
 * repository. A pull_request completion also emits workflow_run, and a fork
 * can name its own branch main; both sources are refused.
 */
export function assertTrustedApply(env = process.env) {
    if (env.RETENTION_ALLOW_LOCAL === '1') return
    if (!env.GITHUB_ACTIONS) {
        throw new Error('refusing --apply outside GitHub Actions on main')
    }
    const event = env.GITHUB_EVENT_NAME || ''
    const ref = env.GITHUB_REF || ''
    if (event === 'pull_request' || event === 'pull_request_target') {
        throw new Error('refusing --apply for a pull_request event')
    }
    if (ref !== 'refs/heads/main') throw new Error('refusing --apply off refs/heads/main')
    if (event === 'schedule' || event === 'workflow_dispatch') return
    if (event === 'workflow_run') {
        const source = env.RETENTION_SOURCE_EVENT || ''
        const branch = env.RETENTION_SOURCE_BRANCH || ''
        const conclusion = env.RETENTION_SOURCE_CONCLUSION || ''
        const sourceRepository = env.RETENTION_SOURCE_REPOSITORY || ''
        const repository = env.GITHUB_REPOSITORY || ''
        if (
            source === 'push' &&
            branch === 'main' &&
            conclusion === 'success' &&
            sourceRepository !== '' &&
            sourceRepository === repository
        ) {
            return
        }
        throw new Error('refusing --apply for an untrusted workflow_run')
    }
    throw new Error(`refusing --apply for event ${event || '(missing)'}`)
}

function gh(args) {
    return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()
}

function capture(value, pattern) {
    const text = String(value ?? '')
    if (!pattern.test(text)) return ''
    return text
}

function projectPull(pull) {
    const number = Number(pull.number)
    const sha = capture(pull.headRefOid, /^[0-9a-f]{40}$/i).toLowerCase()
    const branch = capture(pull.headRefName, /^[A-Za-z0-9._/-]{1,200}$/)
    const state = capture(String(pull.state || '').toUpperCase(), /^(OPEN|CLOSED|MERGED)$/)
    if (!Number.isInteger(number) || number < 1 || !sha || !branch || !state) return null
    return {
        number,
        state,
        mergedAt:
            capture(pull.mergedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/) || null,
        closedAt:
            capture(pull.closedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/) || null,
        headRefName: branch,
        headRefOid: sha,
    }
}

function collectGithubState(repo) {
    const safeRepo = capture(repo, /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/)
    if (!safeRepo) throw new Error('refusing a repository name with unexpected characters')
    const mainSha = capture(
        gh(['api', `repos/${safeRepo}/commits/main`, '--jq', '.sha']),
        /^[0-9a-f]{40}$/i,
    ).toLowerCase()
    if (!mainSha) throw new Error('GitHub main SHA was not a full commit id')
    const raw = gh([
        'api',
        '--paginate',
        `repos/${safeRepo}/pulls?state=all&per_page=100`,
        '--jq',
        '.[] | {number,state,mergedAt:.merged_at,closedAt:.closed_at,headRefName:.head.ref,headRefOid:.head.sha}',
    ])
    const pulls = raw
        .split('\n')
        .filter(Boolean)
        .map((line) => projectPull(JSON.parse(line)))
        .filter(Boolean)
    return { repo: safeRepo, mainSha, pulls }
}

function inventoryFromFile(backend, file) {
    const payload = readJson(file)
    if (payload.skipped) return payload
    const rawDeployments = payload.deployments || payload.result || payload
    const list = Array.isArray(rawDeployments) ? rawDeployments : rawDeployments.deployments || []
    const normalized = list
        .map((row) => normalizeDeployment(row, backend))
        .filter((row) => row && row.id)
    const deployments = attachAliasRecords(normalized, payload.aliases || [])
    return { skipped: false, deployments }
}

function classifyFile(backend, inventoryPath, githubPath) {
    const github = readJson(githubPath)
    const inventory = inventoryFromFile(backend, inventoryPath)
    if (inventory.skipped) {
        return {
            backend,
            skipped: true,
            reason: inventory.reason || 'skipped',
            total: 0,
            counts: {},
            queuedDeleteIds: [],
            deferredDeleteIds: [],
            limitations: [],
            deployments: [],
            anchors: { mainSha: github.mainSha, productionIds: [], rollbackIds: [], openPulls: [] },
            productionAmbiguous: true,
            mainSha: github.mainSha,
        }
    }
    return classifyRetention({
        backend,
        deployments: inventory.deployments,
        pulls: github.pulls || [],
        mainSha: github.mainSha,
    })
}

export async function verifyPublicVersion(url, expectedSha, options = {}) {
    const fetchImpl = options.fetchImpl || fetch
    const attempts = options.attempts || 3
    const pauseMs = options.pauseMs ?? 2000
    let lastStatus = 0
    let lastCommit = ''
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        const response = await fetchImpl(url, { headers: { 'User-Agent': 'CannaGuide-retention' } })
        const body = await response.json()
        const commit = String(body.commit || '')
        if (response.status === 200 && commit.toLowerCase() === String(expectedSha).toLowerCase()) {
            return {
                url,
                status: response.status,
                commit,
                buildVersion: body.buildVersion || '',
                attempts: attempt,
            }
        }
        lastStatus = response.status
        lastCommit = commit
        if (attempt < attempts && pauseMs > 0) {
            await new Promise((resolveDelay) => setTimeout(resolveDelay, pauseMs))
        }
    }
    throw new Error(`${url} served ${lastCommit || '(missing)'} HTTP ${lastStatus}`)
}

async function inventoryCloudflare(outPath) {
    const token = process.env.CLOUDFLARE_API_TOKEN || ''
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || ''
    if (!token || !accountId) {
        writeJson(outPath, { skipped: true, reason: 'Cloudflare credentials are not set' })
        console.log('SKIP Cloudflare inventory: credentials are not set')
        return
    }
    const listed = await listCloudflareDeployments({
        token,
        accountId,
        projectName: PAGES_PROJECT,
    })
    const deployments = listed
        .map((row) => projectRetentionRecord(row, 'cloudflare'))
        .filter(Boolean)
    writeJson(outPath, { skipped: false, project: PAGES_PROJECT, deployments })
    console.log(`Cloudflare inventory ${deployments.length}`)
}

async function inventoryVercel(outPath) {
    const token = process.env.VERCEL_TOKEN || ''
    if (!token) {
        writeJson(outPath, { skipped: true, reason: 'VERCEL_TOKEN is not set' })
        console.log('SKIP Vercel inventory: VERCEL_TOKEN is not set')
        return
    }
    const projectId = process.env.VERCEL_PROJECT_ID || VERCEL_PROJECT
    const teamId = process.env.VERCEL_TEAM_ID || VERCEL_TEAM
    const [listed, listedAliases] = await Promise.all([
        listVercelDeployments({ token, projectId, teamId }),
        listVercelAliases({ token, projectId, teamId }),
    ])
    const deployments = listed.map((row) => projectRetentionRecord(row, 'vercel')).filter(Boolean)
    const aliases = listedAliases.map((row) => projectAliasRecord(row)).filter(Boolean)
    writeJson(outPath, { skipped: false, projectId, deployments, aliases })
    console.log(`Vercel inventory ${deployments.length} aliases ${aliases.length}`)
}

async function applyDeletes(backend, planPath) {
    assertTrustedApply()
    const frozen = readJson(planPath)
    if (frozen.skipped) {
        console.log(`SKIP ${backend} delete: ${frozen.reason}`)
        return
    }
    const github = collectGithubState(process.env.GITHUB_REPOSITORY || 'qnbs/CannaGuide-2025')
    let freshInventory
    if (backend === 'cloudflare') {
        const deployments = await listCloudflareDeployments({
            token: process.env.CLOUDFLARE_API_TOKEN,
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
            projectName: PAGES_PROJECT,
        })
        freshInventory = deployments
            .map((row) => normalizeDeployment(row, 'cloudflare'))
            .filter((row) => row && row.id)
    } else {
        const projectId = process.env.VERCEL_PROJECT_ID || VERCEL_PROJECT
        const teamId = process.env.VERCEL_TEAM_ID || VERCEL_TEAM
        const token = process.env.VERCEL_TOKEN
        const deployments = await listVercelDeployments({ token, projectId, teamId })
        const aliases = await listVercelAliases({ token, projectId, teamId })
        freshInventory = attachAliasRecords(
            deployments
                .map((row) => normalizeDeployment(row, 'vercel'))
                .filter((row) => row && row.id),
            aliases,
        )
    }
    const fresh = classifyRetention({
        backend,
        deployments: freshInventory,
        pulls: github.pulls,
        mainSha: github.mainSha,
    })
    const decision = reconcilePlans(frozen, fresh)
    if (decision.abort) {
        throw new Error(`retention batch aborted: ${decision.errors.join('; ')}`)
    }
    const results = await deleteProvenDeployments({
        backend,
        plan: fresh,
        ids: decision.ids,
        token:
            backend === 'cloudflare' ? process.env.CLOUDFLARE_API_TOKEN : process.env.VERCEL_TOKEN,
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        projectName: PAGES_PROJECT,
        teamId: process.env.VERCEL_TEAM_ID || VERCEL_TEAM,
    })
    const failed = results.filter((result) => !result.ok)
    console.log(
        `${backend} delete attempted ${results.length} ok ${results.length - failed.length} failed ${failed.length}`,
    )
    for (const result of results) {
        console.log(
            `${result.ok ? 'deleted' : 'kept'} ${result.id} HTTP ${result.status} ${result.detail}`,
        )
    }
    if (failed.length) throw new Error(`${backend} delete stopped after HTTP ${failed[0].status}`)

    const version = await verifyPublicVersion(
        backend === 'cloudflare' ? PAGES_VERSION_URL : VERCEL_VERSION_URL,
        fresh.anchors.mainSha,
    )
    console.log(`version ${version.buildVersion} commit ${version.commit}`)

    const remainingRaw =
        backend === 'cloudflare'
            ? await listCloudflareDeployments({
                  token: process.env.CLOUDFLARE_API_TOKEN,
                  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
                  projectName: PAGES_PROJECT,
              })
            : await listVercelDeployments({
                  token: process.env.VERCEL_TOKEN,
                  projectId: process.env.VERCEL_PROJECT_ID || VERCEL_PROJECT,
                  teamId: process.env.VERCEL_TEAM_ID || VERCEL_TEAM,
              })
    const remainingIds = new Set(
        remainingRaw
            .map((row) => normalizeDeployment(row, backend))
            .filter((row) => row && row.id)
            .map((row) => row.id),
    )
    for (const id of decision.ids) {
        if (remainingIds.has(id)) throw new Error(`deployment ${id} is still present after delete`)
    }
    for (const id of fresh.anchors.productionIds) {
        if (!remainingIds.has(id)) throw new Error(`production deployment ${id} disappeared`)
    }
    for (const id of fresh.anchors.rollbackIds) {
        if (!remainingIds.has(id)) throw new Error(`rollback deployment ${id} disappeared`)
    }
}

async function main() {
    const command = process.argv[2]
    if (command === 'github-state') {
        const repo = arg('--repo', process.env.GITHUB_REPOSITORY || 'qnbs/CannaGuide-2025')
        const state = collectGithubState(repo)
        writeJson(arg('--out'), state)
        console.log(`GitHub state main ${state.mainSha} pulls ${state.pulls.length}`)
        return
    }
    if (command === 'inventory-cloudflare') {
        await inventoryCloudflare(arg('--out'))
        return
    }
    if (command === 'inventory-vercel') {
        await inventoryVercel(arg('--out'))
        return
    }
    if (command === 'classify') {
        const backend = arg('--backend')
        const plan = classifyFile(backend, arg('--inventory'), arg('--github'))
        writeJson(arg('--out'), plan)
        console.log(formatReport(plan))
        return
    }
    if (command === 'delete-cloudflare' || command === 'delete-vercel') {
        if (!process.argv.includes('--apply')) {
            const plan = readJson(arg('--plan'))
            console.log(formatReport(plan))
            console.log('dry-run: no deletions')
            return
        }
        await applyDeletes(command === 'delete-cloudflare' ? 'cloudflare' : 'vercel', arg('--plan'))
        return
    }
    throw new Error(
        'usage: github-state | inventory-cloudflare | inventory-vercel | classify | delete-cloudflare | delete-vercel',
    )
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) {
    main().catch((error) => {
        console.error(error instanceof Error ? error.message : 'retention command failed')
        process.exitCode = 1
    })
}
