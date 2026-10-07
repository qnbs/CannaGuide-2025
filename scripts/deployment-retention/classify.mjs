/**
 * Fail-closed retention classifier for Vercel and Cloudflare Pages.
 *
 * GitHub's Deployments API is a different store. Pruning those records does
 * not delete Vercel deployments or Cloudflare Pages deployments.
 *
 * The two hosts share protection rules (live production, a two-deep rollback
 * window, open PR heads, active aliases, ambiguous metadata) and differ in
 * deletion mechanics. Cloudflare refuses to delete the latest deployment of a
 * branch; that row stays protected. Vercel can delete an unaliased latest
 * preview, but an automatic branch alias is still an active alias.
 *
 * Wrangler 4.110.0 `pages deployment list --json` is not a complete inventory:
 * it calls the unpaged Pages API helper and shortens commit hashes to 7
 * characters, dropping aliases. `pages deployment delete --force` both skips
 * the confirmation prompt and sets the API `force` query, which can delete
 * aliased non-production deployments. This module never emits force=true.
 */

export const ROLLBACK_PREVIOUS = 2
export const MAX_DELETE_PER_RUN = 100

export const PRODUCTION_ALIAS_HOSTS = {
    vercel: [
        'canna-guide-2025-web.vercel.app',
        'canna-guide-2025-web-qnbs-projects.vercel.app',
        'canna-guide-2025-web-git-main-qnbs-projects.vercel.app',
    ],
    cloudflare: ['cannaguide-2025.pages.dev', 'main.cannaguide-2025.pages.dev'],
}

export const LABELS = {
    vercel: {
        production: 'PROTECT_PRODUCTION',
        rollback: 'PROTECT_ROLLBACK',
        openPr: 'PROTECT_OPEN_PR',
        latestBranch: 'PROTECT_CURRENT_BRANCH_HEAD',
        alias: 'PROTECT_ACTIVE_ALIAS',
        merged: 'SAFE_DELETE_MERGED_PR',
        closed: 'SAFE_DELETE_CLOSED_PR',
        superseded: 'SAFE_DELETE_SUPERSEDED_PREVIEW',
        dependabot: 'SAFE_DELETE_STALE_DEPENDABOT',
        oldProduction: 'SAFE_DELETE_OLD_PRODUCTION',
        unknown: 'UNKNOWN',
    },
    cloudflare: {
        production: 'PROTECT_CURRENT_PRODUCTION',
        rollback: 'PROTECT_RECENT_PRODUCTION_ROLLBACK',
        openPr: 'PROTECT_OPEN_PR',
        latestBranch: 'PROTECT_LATEST_ACTIVE_BRANCH',
        alias: 'PROTECT_ACTIVE_ALIAS',
        merged: 'SAFE_DELETE_MERGED_PR_HISTORY',
        closed: 'SAFE_DELETE_CLOSED_PR_HISTORY',
        superseded: 'SAFE_DELETE_SUPERSEDED_PREVIEW',
        dependabot: 'SAFE_DELETE_STALE_DEPENDABOT',
        oldProduction: 'SAFE_DELETE_OLD_PRODUCTION_HISTORY',
        unknown: 'UNKNOWN',
    },
}

const FULL_SHA = /^[0-9a-f]{40}$/i
const SAFE_ID = /^[A-Za-z0-9_-]{6,128}$/

export function requireDeploymentId(id) {
    const match = SAFE_ID.exec(String(id ?? ''))
    if (!match) throw new Error('refusing a deployment id with unexpected characters')
    return match[0]
}

export function requireResourceId(value, label) {
    const match = SAFE_ID.exec(String(value ?? ''))
    if (!match) throw new Error(`refusing ${label} with unexpected characters`)
    return match[0]
}

export function isDeletableClass(className) {
    return typeof className === 'string' && className.startsWith('SAFE_DELETE_')
}

export function aliasHostname(value) {
    return String(value || '')
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/.*$/, '')
        .replace(/\.$/, '')
        .toLowerCase()
}

function uniqueHosts(values) {
    const hosts = []
    const seen = new Set()
    for (const value of values || []) {
        const host = aliasHostname(value)
        if (!host || seen.has(host)) continue
        seen.add(host)
        hosts.push(host)
    }
    return hosts
}

function hasCanonicalProductionAlias(deployment, backend) {
    const wanted = new Set(PRODUCTION_ALIAS_HOSTS[backend] || [])
    return deployment.aliases.some((host) => wanted.has(host))
}

function isReady(deployment, backend) {
    const state = String(deployment.state || '').toLowerCase()
    if (backend === 'vercel') return state === 'ready'
    return state === 'success'
}

function isInProgress(deployment, backend) {
    const state = String(deployment.state || '').toLowerCase()
    if (backend === 'vercel') return ['building', 'queued', 'initializing'].includes(state)
    return ['active', 'idle', 'queued', 'initializing'].includes(state)
}

function pullState(pull) {
    const state = String(pull?.state || '').toUpperCase()
    if (state === 'OPEN') return 'open'
    if (state === 'MERGED' || pull?.mergedAt) return 'merged'
    if (state === 'CLOSED') return 'closed'
    return 'unknown'
}

function pullsForBranch(pulls, branch) {
    return (pulls || []).filter((pull) => pull && pull.headRefName === branch)
}

function resolveBranchPull(pulls, branch) {
    const rows = pullsForBranch(pulls, branch)
    const open = rows.filter((pull) => pullState(pull) === 'open')
    if (open.length > 1) return { ambiguous: true, pull: null }
    if (open.length === 1) return { ambiguous: false, pull: open[0] }
    if (rows.length === 0) return { ambiguous: false, pull: null }
    const ranked = [...rows].sort(
        (a, b) => Date.parse(b.closedAt || b.mergedAt || 0) - Date.parse(a.closedAt || a.mergedAt || 0),
    )
    return { ambiguous: false, pull: ranked[0] }
}

function latestIdsByBranch(deployments) {
    const newest = new Map()
    for (const deployment of deployments) {
        if (!deployment.branch) continue
        const current = newest.get(deployment.branch)
        if (!current || deployment.createdAt > current) newest.set(deployment.branch, deployment.createdAt)
    }
    const ids = new Set()
    for (const deployment of deployments) {
        if (!deployment.branch) continue
        if (deployment.createdAt === newest.get(deployment.branch)) ids.add(deployment.id)
    }
    return ids
}

export function normalizeDeployment(raw, backend) {
    if (!raw || typeof raw !== 'object') return null
    if (raw.Id && raw.Environment && !raw.deployment_trigger && !raw.meta) {
        const sha = String(raw.Source || '')
        return {
            id: String(raw.Id),
            url: String(raw.Deployment || ''),
            createdAt: Date.parse(raw.Status) || 0,
            sha,
            shaComplete: FULL_SHA.test(sha),
            branch: String(raw.Branch || ''),
            target: String(raw.Environment).toLowerCase() === 'production' ? 'production' : 'preview',
            state: 'unknown',
            aliases: [],
            source: 'wrangler-list',
        }
    }
    if (backend === 'cloudflare' || raw.deployment_trigger || raw.created_on) {
        const meta = raw.deployment_trigger?.metadata || {}
        const sha = String(meta.commit_hash || meta.commit_sha || '')
        return {
            id: String(raw.id || ''),
            url: String(raw.url || ''),
            createdAt: Date.parse(raw.created_on || '') || 0,
            sha,
            shaComplete: FULL_SHA.test(sha),
            branch: String(meta.branch || ''),
            target: raw.environment === 'production' ? 'production' : 'preview',
            state: String(raw.latest_stage?.status || 'unknown'),
            aliases: uniqueHosts(raw.aliases),
            source: 'cloudflare-api',
        }
    }
    const sha = String(raw.meta?.githubCommitSha || raw.meta?.gitCommitSha || raw.sha || '')
    const aliasValues = []
    if (Array.isArray(raw.alias)) aliasValues.push(...raw.alias)
    if (Array.isArray(raw.aliases)) aliasValues.push(...raw.aliases)
    return {
        id: String(raw.id || raw.uid || ''),
        url: String(raw.url || ''),
        createdAt: Number(raw.created || raw.createdAt || 0) || 0,
        sha,
        shaComplete: FULL_SHA.test(sha),
        branch: String(raw.meta?.githubCommitRef || raw.branch || ''),
        target: raw.target === 'production' ? 'production' : 'preview',
        state: String(raw.readyState || raw.state || 'unknown'),
        aliases: uniqueHosts(aliasValues),
        source: 'vercel-api',
    }
}

export function attachAliasRecords(deployments, aliasRecords) {
    const byId = new Map()
    for (const deployment of deployments) {
        if (!deployment?.id) continue
        byId.set(deployment.id, deployment)
    }
    for (const record of aliasRecords || []) {
        if (!record || record.deletedAt) continue
        const id = String(record.deploymentId || record.deployment?.id || '')
        const host = aliasHostname(record.alias || record.host || '')
        if (!id || !host) continue
        const existing = byId.get(id)
        if (existing) {
            existing.aliases = uniqueHosts([...existing.aliases, host])
            continue
        }
        byId.set(id, {
            id,
            url: '',
            createdAt: 0,
            sha: '',
            shaComplete: false,
            branch: '',
            target: 'preview',
            state: 'unknown',
            aliases: [host],
            source: 'alias-only',
        })
    }
    return [...byId.values()]
}

function historyClass(labels, pull, branch) {
    if (String(branch || '').startsWith('dependabot/')) return labels.dependabot
    if (pullState(pull) === 'merged') return labels.merged
    if (pullState(pull) === 'closed') return labels.closed
    return null
}

function classifyOne(deployment, context) {
    const { backend, labels, productionIds, rollbackIds, latestIds, openBySha, branchPulls } = context
    if (!deployment.id) return { className: labels.unknown, limitation: 'missing id' }
    if (productionIds.has(deployment.id)) return { className: labels.production, limitation: '' }
    if (rollbackIds.has(deployment.id)) return { className: labels.rollback, limitation: '' }
    if (isInProgress(deployment, backend)) {
        return { className: labels.unknown, limitation: 'deployment still in progress' }
    }

    const shaKey = deployment.shaComplete ? deployment.sha.toLowerCase() : ''
    if (shaKey && openBySha.has(shaKey)) return { className: labels.openPr, limitation: '' }

    const branchPull = branchPulls.get(deployment.branch)
    const openBranch = branchPull && !branchPull.ambiguous && pullState(branchPull.pull) === 'open'
    if (openBranch && latestIds.has(deployment.id)) {
        const head = String(branchPull.pull.headRefOid || '').toLowerCase()
        if (backend === 'vercel' && shaKey && head && shaKey !== head) {
            return { className: labels.latestBranch, limitation: '' }
        }
        return { className: labels.openPr, limitation: '' }
    }

    if (backend === 'cloudflare' && latestIds.has(deployment.id)) {
        return {
            className: labels.latestBranch,
            limitation: 'cloudflare_latest_branch_deployment_cannot_be_deleted',
        }
    }

    if (deployment.aliases.length > 0) {
        return { className: labels.alias, limitation: 'active alias requires investigation before removal' }
    }
    if (!deployment.shaComplete) {
        return { className: labels.unknown, limitation: 'commit sha is not a full 40-character id' }
    }
    if (branchPull?.ambiguous) {
        return { className: labels.unknown, limitation: 'more than one open pull request for the branch' }
    }

    if (deployment.target === 'production') {
        if (context.productionAmbiguous) {
            return { className: labels.unknown, limitation: 'production deployment could not be identified' }
        }
        if (!isReady(deployment, backend)) {
            return { className: labels.unknown, limitation: 'production deployment is not a known-good success' }
        }
        if (deployment.branch && deployment.branch !== 'main') {
            return { className: labels.unknown, limitation: 'production deployment is not on main' }
        }
        return { className: labels.oldProduction, limitation: '' }
    }

    if (openBranch) {
        if (!isReady(deployment, backend)) {
            return { className: labels.unknown, limitation: 'preview is not in a terminal success state' }
        }
        return { className: labels.superseded, limitation: '' }
    }

    if (deployment.branch === 'main') {
        if (latestIds.has(deployment.id)) return { className: labels.latestBranch, limitation: '' }
        return { className: labels.unknown, limitation: 'non-production main deployment is not proven disposable' }
    }

    if (!branchPull || !branchPull.pull) {
        return { className: labels.unknown, limitation: 'no GitHub pull request proves this branch is closed' }
    }
    if (!isReady(deployment, backend)) {
        return { className: labels.unknown, limitation: 'preview is not in a terminal success state' }
    }
    const closedClass = historyClass(labels, branchPull.pull, deployment.branch)
    if (!closedClass) return { className: labels.unknown, limitation: 'pull request state is not merged or closed' }
    return { className: closedClass, limitation: '' }
}

export function classifyRetention({
    backend,
    deployments,
    pulls = [],
    mainSha,
    rollbackPrevious = ROLLBACK_PREVIOUS,
}) {
    if (backend !== 'vercel' && backend !== 'cloudflare') {
        throw new Error(`unsupported retention backend: ${backend}`)
    }
    const labels = LABELS[backend]
    const main = String(mainSha || '').toLowerCase()
    if (!FULL_SHA.test(main)) {
        throw new Error('main SHA must be a full 40-character commit id')
    }

    const normalized = deployments.map((deployment) => ({ ...deployment }))
    const latestIds = latestIdsByBranch(normalized)
    const openPulls = (pulls || []).filter((pull) => pullState(pull) === 'open')
    const openBySha = new Map()
    for (const pull of openPulls) {
        const sha = String(pull.headRefOid || '').toLowerCase()
        if (FULL_SHA.test(sha)) openBySha.set(sha, pull)
    }

    const branchNames = new Set(normalized.map((deployment) => deployment.branch).filter(Boolean))
    const branchPulls = new Map()
    for (const branch of branchNames) branchPulls.set(branch, resolveBranchPull(pulls, branch))

    const canonical = normalized.filter((deployment) => hasCanonicalProductionAlias(deployment, backend))
    const productionAmbiguous = canonical.length === 0
    const productionIds = new Set()
    if (productionAmbiguous) {
        for (const deployment of normalized) {
            if (deployment.target === 'production') productionIds.add(deployment.id)
        }
    } else {
        for (const deployment of canonical) productionIds.add(deployment.id)
        for (const deployment of normalized) {
            if (deployment.target !== 'production') continue
            if (deployment.shaComplete && deployment.sha.toLowerCase() === main) {
                productionIds.add(deployment.id)
            }
        }
    }

    const rollbackIds = new Set()
    if (!productionAmbiguous) {
        const previous = normalized
            .filter(
                (deployment) =>
                    deployment.target === 'production' &&
                    !productionIds.has(deployment.id) &&
                    isReady(deployment, backend) &&
                    deployment.shaComplete,
            )
            .sort((a, b) => b.createdAt - a.createdAt)
        const selected = previous.slice(0, rollbackPrevious)
        const cutoff = selected.length === rollbackPrevious ? selected[selected.length - 1].createdAt : null
        for (const deployment of selected) rollbackIds.add(deployment.id)
        if (cutoff !== null) {
            for (const deployment of previous) {
                if (deployment.createdAt === cutoff) rollbackIds.add(deployment.id)
            }
        }
    }

    const decisions = normalized.map((deployment) => {
        const result = classifyOne(deployment, {
            backend,
            labels,
            productionIds,
            rollbackIds,
            latestIds,
            openBySha,
            branchPulls,
            productionAmbiguous,
        })
        let className = result.className
        let limitation = result.limitation
        if (isDeletableClass(className) && deployment.aliases.length > 0) {
            className = labels.unknown
            limitation = 'aliased deployment is not deletable'
        }
        return {
            id: deployment.id,
            url: deployment.url,
            sha: deployment.sha,
            branch: deployment.branch,
            target: deployment.target,
            state: deployment.state,
            createdAt: deployment.createdAt,
            aliases: deployment.aliases,
            class: className,
            deletable: isDeletableClass(className),
            limitation,
        }
    })

    const counts = {}
    for (const decision of decisions) counts[decision.class] = (counts[decision.class] || 0) + 1

    const deleteIds = decisions.filter((decision) => decision.deletable).map((decision) => decision.id)
    const deferred = deleteIds.slice(MAX_DELETE_PER_RUN)
    const queued = deleteIds.slice(0, MAX_DELETE_PER_RUN)

    return {
        backend,
        mainSha: main,
        productionAmbiguous,
        counts,
        total: decisions.length,
        queuedDeleteIds: queued,
        deferredDeleteIds: deferred,
        limitations: decisions
            .filter((decision) => decision.limitation)
            .map((decision) => ({ id: decision.id, class: decision.class, limitation: decision.limitation })),
        anchors: {
            mainSha: main,
            productionIds: [...productionIds].sort(),
            rollbackIds: [...rollbackIds].sort(),
            openPulls: openPulls.map((pull) => ({
                number: pull.number,
                branch: pull.headRefName,
                sha: String(pull.headRefOid || '').toLowerCase(),
            })),
        },
        deployments: decisions,
    }
}

export function reconcilePlans(frozen, fresh) {
    const errors = []
    if (!frozen || !fresh || frozen.backend !== fresh.backend) errors.push('backend mismatch')
    if (frozen?.anchors?.mainSha !== fresh?.anchors?.mainSha) errors.push('main SHA changed')
    const same = (left = [], right = []) => left.join(',') === right.join(',')
    if (!same(frozen?.anchors?.productionIds, fresh?.anchors?.productionIds)) {
        errors.push('production deployment set changed')
    }
    if (!same([...(frozen?.anchors?.rollbackIds || [])].sort(), [...(fresh?.anchors?.rollbackIds || [])].sort())) {
        errors.push('rollback window changed')
    }
    const heads = (plan) =>
        (plan?.anchors?.openPulls || [])
            .map((pull) => `${pull.number}:${pull.sha}`)
            .sort()
            .join('|')
    if (heads(frozen) !== heads(fresh)) errors.push('open pull request heads changed')
    if (errors.length) return { abort: true, errors, ids: [] }

    const freshById = new Map((fresh.deployments || []).map((row) => [row.id, row]))
    const ids = []
    for (const row of frozen.deployments || []) {
        if (!row.deletable) continue
        if (!isDeletableClass(row.class) || row.class === 'UNKNOWN') {
            return { abort: true, errors: [`frozen row ${row.id} is not a safe-delete class`], ids: [] }
        }
        const now = freshById.get(row.id)
        if (!now) continue
        if (now.class !== row.class || !now.deletable || now.aliases.length > 0) {
            return {
                abort: true,
                errors: [`${row.id} is no longer ${row.class}`],
                ids: [],
            }
        }
        ids.push(row.id)
    }
    return { abort: false, errors: [], ids: ids.slice(0, MAX_DELETE_PER_RUN) }
}

export function cloudflareDeleteUrl(accountId, projectName, deploymentId) {
    const account = requireResourceId(accountId, 'account id')
    const project = requireResourceId(projectName, 'project name')
    const id = requireDeploymentId(deploymentId)
    const query = 'force=false'
    if (query !== 'force=false') throw new Error('force query drifted')
    return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/pages/projects/${encodeURIComponent(project)}/deployments/${encodeURIComponent(id)}?${query}`
}

export function vercelDeleteUrl(deploymentId, teamId) {
    const id = requireDeploymentId(deploymentId)
    const team = requireResourceId(teamId, 'team id')
    return `https://api.vercel.com/v13/deployments/${encodeURIComponent(id)}?teamId=${encodeURIComponent(team)}`
}

export function assertSafeDeleteBatch(plan, ids) {
    const byId = new Map((plan?.deployments || []).map((row) => [row.id, row]))
    const production = new Set(plan?.anchors?.productionIds || [])
    const rollback = new Set(plan?.anchors?.rollbackIds || [])
    for (const id of ids) {
        const row = byId.get(id)
        if (!row || !isDeletableClass(row.class) || !row.deletable) {
            throw new Error(`refusing to delete ${id || '(missing)'}: not a proven safe-delete row`)
        }
        if (row.aliases.length > 0) throw new Error(`refusing to delete aliased deployment ${id}`)
        if (production.has(id) || rollback.has(id)) {
            throw new Error(`refusing to delete protected deployment ${id}`)
        }
    }
}

export function formatReport(plan) {
    const lines = [
        `${plan.backend.toUpperCase()} RETENTION PLAN`,
        `main ${plan.mainSha}`,
        `total ${plan.total}`,
        `production ${plan.anchors.productionIds.join(',') || '(none)'}`,
        `rollback ${plan.anchors.rollbackIds.join(',') || '(none)'}`,
        `queued ${plan.queuedDeleteIds.length}`,
        `deferred ${plan.deferredDeleteIds.length}`,
        `ambiguous_production ${plan.productionAmbiguous ? 'yes' : 'no'}`,
    ]
    const classes = Object.keys(plan.counts).sort()
    for (const className of classes) lines.push(`class ${className} ${plan.counts[className]}`)
    for (const row of plan.limitations) {
        if (!row.limitation) continue
        lines.push(`limitation ${row.id} ${row.class} ${row.limitation}`)
    }
    return lines.join('\n')
}
