/**
 * CLI for host deployment retention.
 *
 * Dry-run is the default. `--apply` deletes only ids that are SAFE_DELETE_*
 * in both the frozen plan and a fresh reclassification. Refuses pull_request
 * events and any ref other than main when running inside GitHub Actions.
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import {
    attachAliasRecords,
    classifyRetention,
    formatReport,
    normalizeDeployment,
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

function writeJson(path, value) {
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

function assertTrustedApply() {
    if (process.env.RETENTION_ALLOW_LOCAL === '1') return
    if (!process.env.GITHUB_ACTIONS) {
        throw new Error('refusing --apply outside GitHub Actions on main')
    }
    const event = process.env.GITHUB_EVENT_NAME || ''
    const ref = process.env.GITHUB_REF || ''
    if (event === 'pull_request' || event === 'pull_request_target') {
        throw new Error('refusing --apply for a pull_request event')
    }
    if (ref !== 'refs/heads/main') throw new Error('refusing --apply off refs/heads/main')
    if (event !== 'schedule' && event !== 'workflow_dispatch') {
        throw new Error(`refusing --apply for event ${event || '(missing)'}`)
    }
}

function gh(args) {
    return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()
}

function collectGithubState(repo) {
    const mainSha = gh(['api', `repos/${repo}/commits/main`, '--jq', '.sha'])
    const pulls = JSON.parse(
        gh([
            'pr',
            'list',
            '--repo',
            repo,
            '--state',
            'all',
            '--limit',
            '300',
            '--json',
            'number,state,mergedAt,closedAt,headRefName,headRefOid',
        ]),
    )
    return { repo, mainSha, pulls }
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

async function verifyPublicVersion(url, expectedSha) {
    const response = await fetch(url, { headers: { 'User-Agent': 'CannaGuide-retention' } })
    const body = await response.json()
    const commit = String(body.commit || '')
    if (response.status !== 200 || commit.toLowerCase() !== expectedSha.toLowerCase()) {
        throw new Error(`${url} served ${commit || '(missing)'} HTTP ${response.status}`)
    }
    return { url, status: response.status, commit, buildVersion: body.buildVersion || '' }
}

async function inventoryCloudflare(outPath) {
    const token = process.env.CLOUDFLARE_API_TOKEN || ''
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || ''
    if (!token || !accountId) {
        writeJson(outPath, { skipped: true, reason: 'Cloudflare credentials are not set' })
        console.log('SKIP Cloudflare inventory: credentials are not set')
        return
    }
    const deployments = await listCloudflareDeployments({
        token,
        accountId,
        projectName: PAGES_PROJECT,
    })
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
    const [deployments, aliases] = await Promise.all([
        listVercelDeployments({ token, projectId, teamId }),
        listVercelAliases({ token, projectId, teamId }),
    ])
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
            deployments.map((row) => normalizeDeployment(row, 'vercel')).filter((row) => row && row.id),
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
        token: backend === 'cloudflare' ? process.env.CLOUDFLARE_API_TOKEN : process.env.VERCEL_TOKEN,
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        projectName: PAGES_PROJECT,
        teamId: process.env.VERCEL_TEAM_ID || VERCEL_TEAM,
    })
    const failed = results.filter((result) => !result.ok)
    console.log(
        `${backend} delete attempted ${results.length} ok ${results.length - failed.length} failed ${failed.length}`,
    )
    for (const result of results) {
        console.log(`${result.ok ? 'deleted' : 'kept'} ${result.id} HTTP ${result.status} ${result.detail}`)
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

main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'retention command failed')
    process.exitCode = 1
})
