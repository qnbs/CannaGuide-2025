/**
 * Authenticated inventory and delete calls for Vercel and Cloudflare Pages.
 *
 * Callers must pass the token only into these functions. Classification does
 * not live here and must run without the token in its environment.
 *
 * Cloudflare deletes always use force=false. Wrangler `--force` is not used:
 * in wrangler 4.110.0 that flag also permits deleting aliased deployments.
 * A proven old production row may be deleted only when the live record is
 * still production and unaliased. An explicit empty Cloudflare alias array
 * may be deleted. `aliases: null` is not rewritten to `[]`; it is allowed
 * only when a fresh Pages project lookup proves a different successful
 * canonical production deployment of exact current main on branch main.
 * Omitted aliases, a non-empty list, and any other non-array value are
 * refused. Vercel still requires an explicit empty alias array. Preview
 * deletes stay preview-only. Current production and the rollback window
 * never reach this function: assertSafeDeleteBatch rejects those ids first.
 */

import {
    PRODUCTION_ALIAS_HOSTS,
    aliasHostname,
    assertSafeDeleteBatch,
    isInertBranchAlias,
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

/**
 * The aliases currently assigned to a Vercel deployment. The `alias` field of
 * GET /v13/deployments/{id} is not this: an old production deployment still lists
 * the aliases it was built with there, while /v4/aliases maps none of them to it.
 * Any unexpected response shape refuses, so a delete never proceeds on a guess.
 */
async function currentVercelAliases({ token, teamId, deploymentId, fetchImpl }) {
    const url =
        `https://api.vercel.com/v2/deployments/${encodeURIComponent(deploymentId)}/aliases` +
        `?teamId=${encodeURIComponent(teamId)}`
    const response = await fetchImpl(url, { headers: authHeaders(token) })
    const body = await readJson(response)
    if (!response.ok) {
        throw new Error(`refusing to delete ${deploymentId}: live Vercel alias lookup failed`)
    }
    if (!Array.isArray(body?.aliases)) {
        throw new Error(`refusing to delete ${deploymentId}: alias state is not a list`)
    }
    return body.aliases.map((record) =>
        typeof record?.alias === 'string' ? aliasHostname(record.alias) : 'needs-review.invalid',
    )
}

function aliasList(value) {
    return Array.isArray(value) ? value : []
}

function cloudflareProjectUrl(accountId, projectName) {
    const account = requireResourceId(accountId, 'account id')
    const project = requireResourceId(projectName, 'project name')
    return (
        `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}` +
        `/pages/projects/${encodeURIComponent(project)}`
    )
}

async function assertNullAliasCanonical({
    token,
    accountId,
    projectName,
    candidateId,
    mainSha,
    fetchImpl,
}) {
    const expected = String(mainSha || '').toLowerCase()
    if (!/^[0-9a-f]{40}$/.test(expected)) {
        throw new Error(`refusing to delete ${candidateId}: main SHA is not exact`)
    }
    const url = cloudflareProjectUrl(accountId, projectName)
    if (url.includes('/deployments') || url.includes('force=')) {
        throw new Error('refusing a project lookup that is not the project resource')
    }
    const response = await fetchImpl(url, { headers: authHeaders(token) })
    const body = await readJson(response)
    if (!response.ok || body.success === false) {
        throw new Error(`refusing to delete ${candidateId}: live Cloudflare project lookup failed`)
    }
    const canonical = body.result?.canonical_deployment
    if (!canonical || !canonical.id) {
        throw new Error(`refusing to delete ${candidateId}: canonical deployment is missing`)
    }
    if (String(canonical.id) === candidateId) {
        throw new Error(`refusing to delete ${candidateId}: canonical deployment is the candidate`)
    }
    if (canonical.environment !== 'production' || canonical.latest_stage?.status !== 'success') {
        throw new Error(
            `refusing to delete ${candidateId}: canonical deployment is not a successful production`,
        )
    }
    const sha = String(
        canonical.deployment_trigger?.metadata?.commit_hash ||
            canonical.deployment_trigger?.metadata?.commit_sha ||
            '',
    ).toLowerCase()
    if (sha !== expected) {
        throw new Error(
            `refusing to delete ${candidateId}: canonical deployment SHA is not current main`,
        )
    }
    if (body.result?.production_branch !== 'main') {
        throw new Error(`refusing to delete ${candidateId}: production branch is not main`)
    }
    const canonicalBranch = canonical.deployment_trigger?.metadata?.branch
    if (canonicalBranch && canonicalBranch !== 'main') {
        throw new Error(`refusing to delete ${candidateId}: production branch is not main`)
    }
}

export async function assertStillDisposable({
    backend,
    id,
    expectedClass,
    mainSha,
    protectedIds,
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
            if (protectedIds?.has(safeId)) {
                throw new Error(`refusing to delete protected deployment ${safeId}`)
            }
            if (record.environment !== 'production') {
                throw new Error(`refusing to delete ${safeId}: environment is not old production`)
            }
            if (record.aliases === undefined) {
                throw new Error(`refusing to delete ${safeId}: alias list was omitted`)
            }
            if (Array.isArray(record.aliases)) {
                if (record.aliases.length > 0) {
                    throw new Error(`refusing to delete ${safeId}: alias appeared`)
                }
                return { skip: false, id: safeId }
            }
            if (record.aliases !== null) {
                throw new Error(`refusing to delete ${safeId}: alias state is not an empty list`)
            }
            if (record.latest_stage?.status !== 'success') {
                throw new Error(
                    `refusing to delete ${safeId}: candidate is not a successful production`,
                )
            }
            await assertNullAliasCanonical({
                token,
                accountId,
                projectName,
                candidateId: safeId,
                mainSha,
                fetchImpl,
            })
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
    const oldProduction = expectedClass === 'SAFE_DELETE_OLD_PRODUCTION'
    // Target first: it is the stronger reason to refuse and needs no further request.
    if (oldProduction && body.target !== 'production') {
        throw new Error(`refusing to delete ${safeId}: target is ${body.target ?? 'unset'}`)
    }
    if (!oldProduction && body.target != null && body.target !== 'preview') {
        throw new Error(`refusing to delete ${safeId}: target is ${body.target}`)
    }
    const aliasValues = await currentVercelAliases({
        token,
        teamId: team,
        deploymentId: safeId,
        fetchImpl,
    })
    if (oldProduction && aliasValues.length > 0) {
        throw new Error(`refusing to delete ${safeId}: alias state is not an empty list`)
    }
    // A finished branch keeps only its automatic branch alias; anything else is live.
    const active = aliasValues.find((host) => !isInertBranchAlias(host, 'vercel'))
    if (active) throw new Error(`refusing to delete ${safeId}: active alias ${active}`)
    if (carriesProductionAlias(aliasValues, 'vercel')) {
        throw new Error(`refusing to delete ${safeId}: production alias appeared`)
    }
    return { skip: false, id: safeId }
}

/**
 * Run the pre-delete gate for every id without deleting anything, so a dry run can
 * show which deletes the live state would allow. Never throws for a single refusal.
 */
export async function checkProvenDeployments({
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
    const protectedIds = new Set([
        ...(plan?.anchors?.productionIds || []),
        ...(plan?.anchors?.rollbackIds || []),
    ])
    const results = []
    for (const id of ids) {
        try {
            const gate = await assertStillDisposable({
                backend,
                id,
                expectedClass: classById.get(id),
                mainSha: plan?.mainSha,
                protectedIds,
                token,
                accountId,
                projectName,
                teamId,
                fetchImpl,
            })
            results.push({ id, ok: true, detail: gate.skip ? 'already absent' : 'would delete' })
        } catch (error) {
            results.push({
                id,
                ok: false,
                detail: error instanceof Error ? error.message : 'refused',
            })
        }
    }
    return results
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
    const protectedIds = new Set([
        ...(plan?.anchors?.productionIds || []),
        ...(plan?.anchors?.rollbackIds || []),
    ])
    const results = []
    for (const id of ids) {
        const gate = await assertStillDisposable({
            backend,
            id,
            expectedClass: classById.get(id),
            mainSha: plan?.mainSha,
            protectedIds,
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
