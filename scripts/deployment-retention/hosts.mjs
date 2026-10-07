/**
 * Authenticated inventory and delete calls for Vercel and Cloudflare Pages.
 *
 * Callers must pass the token only into these functions. Classification does
 * not live here and must run without the token in its environment.
 *
 * Cloudflare deletes always use force=false. Wrangler `--force` is not used:
 * in wrangler 4.110.0 that flag also permits deleting aliased deployments.
 */

import {
    assertSafeDeleteBatch,
    cloudflareDeleteUrl,
    vercelDeleteUrl,
} from './classify.mjs'

const PAGE_CEILING = 40

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

export async function listCloudflareDeployments({
    token,
    accountId,
    projectName = 'cannaguide-2025',
    fetchImpl = fetch,
}) {
    if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is required')
    const deployments = []
    for (let page = 1; page <= PAGE_CEILING; page += 1) {
        const url =
            `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}` +
            `/pages/projects/${encodeURIComponent(projectName)}/deployments?page=${page}&per_page=25`
        const response = await fetchImpl(url, { headers: authHeaders(token) })
        const body = await readJson(response)
        if (!response.ok || body.success === false) {
            throw new Error(`Cloudflare Pages list failed with HTTP ${response.status}`)
        }
        const batch = Array.isArray(body.result) ? body.result : []
        deployments.push(...batch)
        const info = body.result_info || {}
        const totalPages = Number(info.total_pages || 0)
        if (batch.length === 0 || (totalPages && page >= totalPages)) break
        if (!totalPages && batch.length < 25) break
    }
    return deployments
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
}) {
    if (!projectId || !teamId) throw new Error('Vercel project id and team id are required')
    const deployments = []
    let until = ''
    for (let page = 1; page <= PAGE_CEILING; page += 1) {
        const params = new URLSearchParams({ projectId, teamId, limit: '100' })
        if (until) params.set('until', until)
        const response = await fetchImpl(`https://api.vercel.com/v6/deployments?${params}`, {
            headers: authHeaders(token),
        })
        const body = await readJson(response)
        if (!response.ok) throw new Error(`Vercel deployment list failed with HTTP ${response.status}`)
        const batch = Array.isArray(body.deployments) ? body.deployments : []
        deployments.push(...batch)
        const next = body.pagination?.next
        if (!next || batch.length === 0) break
        until = String(next)
    }
    return deployments
}

export async function listVercelAliases({
    token,
    projectId,
    teamId,
    fetchImpl = fetch,
}) {
    const aliases = []
    let until = ''
    for (let page = 1; page <= PAGE_CEILING; page += 1) {
        const params = new URLSearchParams({ projectId, teamId, limit: '100' })
        if (until) params.set('until', until)
        const response = await fetchImpl(`https://api.vercel.com/v4/aliases?${params}`, {
            headers: authHeaders(token),
        })
        const body = await readJson(response)
        if (!response.ok) throw new Error(`Vercel alias list failed with HTTP ${response.status}`)
        const batch = Array.isArray(body.aliases) ? body.aliases : []
        aliases.push(...batch)
        const next = body.pagination?.next
        if (!next || batch.length === 0) break
        until = String(next)
    }
    return aliases
}

export async function deleteVercelDeployment({
    token,
    teamId,
    deploymentId,
    fetchImpl = fetch,
}) {
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
    const results = []
    for (const id of ids) {
        const result =
            backend === 'cloudflare'
                ? await deleteCloudflareDeployment({
                      token,
                      accountId,
                      projectName,
                      deploymentId: id,
                      fetchImpl,
                  })
                : await deleteVercelDeployment({
                      token,
                      teamId,
                      deploymentId: id,
                      fetchImpl,
                  })
        results.push(result)
        if (!result.ok) break
    }
    return results
}
