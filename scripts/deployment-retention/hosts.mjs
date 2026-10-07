/**
 * Authenticated inventory and delete calls for Vercel and Cloudflare Pages.
 *
 * Callers must pass the token only into these functions. Classification does
 * not live here and must run without the token in its environment.
 *
 * Cloudflare deletes always use force=false. Wrangler `--force` is not used:
 * in wrangler 4.110.0 that flag also permits deleting aliased deployments.
 * A proven old production row may be deleted only when the live record is
 * still production, the alias list is an explicit empty array, and the class
 * is SAFE_DELETE_OLD_PRODUCTION_HISTORY (Cloudflare) or
 * SAFE_DELETE_OLD_PRODUCTION (Vercel). A null alias list is not empty.
 * Preview deletes stay
 * preview-only. Current production and the rollback window never reach this
 * function: assertSafeDeleteBatch rejects those ids first.
 */

import {
    PRODUCTION_ALIAS_HOSTS,
    aliasHostname,
    assertSafeDeleteBatch,
    cloudflareDeleteUrl,
    requireDeploymentId,
    requireResourceId,
    vercelDeleteUrl,
} from './classify.mjs'

const PAGE_CEILING = 40
const CLOUDFLARE_PAGE_SIZE = 25

function authHeaders(token) {
    if (!token) throw new Error('missing API token')
    return {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'CannaGuide-retention',
    }
}

async function readJson(response) {
    const text = await response.text()
    try {
        return text ? JSON.parse(text) : {}
    } catch {
        return { raw: text.slice(0, 500) }
    }
}

function pageLimit(maxPages) {
    const limit = Number(maxPages || PAGE_CEILING)
    if (!Number.isInteger(limit) || limit < 1 || limit > PAGE_CEILING) {
        throw new Error('invalid inventory page ceiling')
    }
    return limit
}

export async function listCloudflareDeployments({
    token,
    accountId,
    projectName = 'cannaguide-2025',
    fetchImpl = fetch,
    maxPages = PAGE_CEILING,
}) {
    const account = requireResourceId(accountId, 'account id')
    const project = requireResourceId(projectName, 'project name')
    const ceiling = pageLimit(maxPages)
    const deployments = []
    for (let page = 1; page <= ceiling; page += 1) {
        const url =
            `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}` +
            `/pages/projects/${encodeURIComponent(project)}/deployments?page=${page}&per_page=${CLOUDFLARE_PAGE_SIZE}`
        const response = await fetchImpl(url, { headers: authHeaders(token) })
        const body = await readJson(response)
        if (!response.ok || body.success === false) {
            throw new Error(`Cloudflare Pages list failed with HTTP ${response.status}`)
        }
        const batch = Array.isArray(body.result) ? body.result : []
        deployments.push(...batch)
        const totalPages = Number(body.result_info?.total_pages || 0)
        const done =
            batch.length === 0 ||
            (totalPages > 0 && page >= totalPages) ||
            (totalPages === 0 && batch.length < CLOUDFLARE_PAGE_SIZE)
        if (done) return deployments
    }
    throw new Error(
        `Cloudflare Pages inventory exceeded ${ceiling} pages; refusing a partial inventory`,
    )
}

export async function deleteCloudflareDeployment({
    token,
    accountId,
    projectName = 'cannaguide-2025',
    deploymentId,
    fetchImpl = fetch,
}) {
    const url = cloudflareDeleteUrl(accountId, projectName, deploymentId)
    if (!url.includes('force=false') || url.includes('force=true')) {
        throw new Error('refusing a Cloudflare delete that is not force=false')
    }
    const response = await fetchImpl(url, { method: 'DELETE', headers: authHeaders(token) })
    const body = await readJson(response)
    return {
        ok: response.ok && body.success !== false,
        status: response.status,
        id: deploymentId,
        detail: body.errors?.[0]?.message || body.messages?.[0]?.message || '',
    }
}

export async function listVercelDeployments({
    token,
    projectId,
    teamId,
    fetchImpl = fetch,
    maxPages = PAGE_CEILING,
}) {
    const project = requireResourceId(projectId, 'project id')
    const team = requireResourceId(teamId, 'team id')
    const ceiling = pageLimit(maxPages)
    const deployments = []
    let until = ''
    for (let page = 1; page <= ceiling; page += 1) {
        const params = new URLSearchParams({ projectId: project, teamId: team, limit: '100' })
        if (until) params.set('until', until)
        const response = await fetchImpl(`https://api.vercel.com/v6/deployments?${params}`, {
            headers: authHeaders(token),
        })
        const body = await readJson(response)
        if (!response.ok)
            throw new Error(`Vercel deployment list failed with HTTP ${response.status}`)
        const batch = Array.isArray(body.deployments) ? body.deployments : []
        deployments.push(...batch)
        const next = body.pagination?.next
        if (!next || batch.length === 0) return deployments
        until = String(next)
    }
    throw new Error(
        `Vercel deployment inventory exceeded ${ceiling} pages; refusing a partial inventory`,
    )
}

export async function listVercelAliases({
    token,
    projectId,
    teamId,
    fetchImpl = fetch,
    maxPages = PAGE_CEILING,
}) {
    const project = requireResourceId(projectId, 'project id')
    const team = requireResourceId(teamId, 'team id')
    const ceiling = pageLimit(maxPages)
    const aliases = []
    let until = ''
    for (let page = 1; page <= ceiling; page += 1) {
        const params = new URLSearchParams({ projectId: project, teamId: team, limit: '100' })
        if (until) params.set('until', until)
        const response = await fetchImpl(`https://api.vercel.com/v4/aliases?${params}`, {
            headers: authHeaders(token),
        })
        const body = await readJson(response)
        if (!response.ok) throw new Error(`Vercel alias list failed with HTTP ${response.status}`)
        const batch = Array.isArray(body.aliases) ? body.aliases : []
        aliases.push(...batch)
        const next = body.pagination?.next
        if (!next || batch.length === 0) return aliases
        until = String(next)
    }
    throw new Error(
        `Vercel alias inventory exceeded ${ceiling} pages; refusing a partial inventory`,
    )
}

export async function deleteVercelDeployment({ token, teamId, deploymentId, fetchImpl = fetch }) {
    const url = vercelDeleteUrl(deploymentId, teamId)
    const response = await fetchImpl(url, { method: 'DELETE', headers: authHeaders(token) })
    const body = await readJson(response)
    return {
        ok: response.ok,
        status: response.status,
        id: deploymentId,
        detail: body.error?.message || body.message || '',
    }
}

function carriesProductionAlias(aliases, backend) {
    const canonical = new Set(PRODUCTION_ALIAS_HOSTS[backend] || [])
    return (aliases || []).map(aliasHostname).some((host) => canonical.has(host))
}

function aliasList(value) {
    return Array.isArray(value) ? value : []
}

export async function assertStillDisposable({
    backend,
    id,
    expectedClass,
    token,
    accountId,
    projectName,
    teamId,
    fetchImpl = fetch,
}) {
    const safeId = requireDeploymentId(id)
    if (backend === 'cloudflare') {
        const account = requireResourceId(accountId, 'account id')
        const project = requireResourceId(projectName, 'project name')
        const url =
            `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}` +
            `/pages/projects/${encodeURIComponent(project)}/deployments/${encodeURIComponent(safeId)}`
        const response = await fetchImpl(url, { headers: authHeaders(token) })
        const body = await readJson(response)
        if (response.status === 404) return { skip: true, id: safeId }
        if (!response.ok || body.success === false) {
            throw new Error(`refusing to delete ${safeId}: live Cloudflare lookup failed`)
        }
        const record = body.result || {}
        const aliases = aliasList(record.aliases)
        if (carriesProductionAlias(aliases, 'cloudflare')) {
            throw new Error(`refusing to delete ${safeId}: production alias appeared`)
        }
        if (expectedClass === 'SAFE_DELETE_OLD_PRODUCTION_HISTORY') {
            if (record.environment !== 'production') {
                throw new Error(`refusing to delete ${safeId}: environment is not old production`)
            }
            // null or a missing list is not proof that the deployment is unaliased.
            if (!Array.isArray(record.aliases) || record.aliases.length > 0) {
                throw new Error(`refusing to delete ${safeId}: alias state is not an empty list`)
            }
            return { skip: false, id: safeId }
        }
        if (record.environment !== 'preview') {
            throw new Error(`refusing to delete ${safeId}: environment is not preview`)
        }
        return { skip: false, id: safeId }
    }
    const team = requireResourceId(teamId, 'team id')
    const url = `https://api.vercel.com/v13/deployments/${encodeURIComponent(safeId)}?teamId=${encodeURIComponent(team)}`
    const response = await fetchImpl(url, { headers: authHeaders(token) })
    const body = await readJson(response)
    if (response.status === 404) return { skip: true, id: safeId }
    if (!response.ok) throw new Error(`refusing to delete ${safeId}: live Vercel lookup failed`)
    const aliasValues = []
    let aliasKnown = true
    for (const field of [body.alias, body.aliases]) {
        if (field === undefined) continue
        if (!Array.isArray(field)) aliasKnown = false
        else aliasValues.push(...field)
    }
    if (expectedClass === 'SAFE_DELETE_OLD_PRODUCTION') {
        if (body.target !== 'production') {
            throw new Error(`refusing to delete ${safeId}: target is ${body.target ?? 'unset'}`)
        }
        if (!aliasKnown || aliasValues.length > 0) {
            throw new Error(`refusing to delete ${safeId}: alias state is not an empty list`)
        }
    } else if (body.target != null && body.target !== 'preview') {
        throw new Error(`refusing to delete ${safeId}: target is ${body.target}`)
    }
    if (carriesProductionAlias(aliasValues, 'vercel')) {
        throw new Error(`refusing to delete ${safeId}: production alias appeared`)
    }
    return { skip: false, id: safeId }
}

export async function deleteProvenDeployments({
    backend,
    plan,
    ids,
    token,
    accountId,
    projectName,
    teamId,
    fetchImpl = fetch,
}) {
    assertSafeDeleteBatch(plan, ids)
    const classById = new Map((plan?.deployments || []).map((row) => [row.id, row.class]))
    const results = []
    for (const id of ids) {
        const gate = await assertStillDisposable({
            backend,
            id,
            expectedClass: classById.get(id),
            token,
            accountId,
            projectName,
            teamId,
            fetchImpl,
        })
        if (gate.skip) {
            results.push({ ok: true, status: 404, id: gate.id, detail: 'already absent' })
            continue
        }
        const result =
            backend === 'cloudflare'
                ? await deleteCloudflareDeployment({
                      token,
                      accountId,
                      projectName,
                      deploymentId: gate.id,
                      fetchImpl,
                  })
                : await deleteVercelDeployment({
                      token,
                      teamId,
                      deploymentId: gate.id,
                      fetchImpl,
                  })
        results.push(result)
        if (!result.ok) break
    }
    return results
}
