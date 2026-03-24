#!/usr/bin/env node

/**
 * Automates GitHub repository hardening settings.
 * Uses GitHub REST API with a PAT from GITHUB_PAT, GITHUB_TOKEN, GH_TOKEN, or GH_AUTH_TOKEN.
 */

import { spawnSync } from 'node:child_process'

function readGhAuthToken() {
    const result = spawnSync('gh', ['auth', 'token'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        shell: false,
    })

    if (result.status !== 0) return ''
    return result.stdout.trim()
}

const token =
    process.env.GH_TOKEN ||
    process.env.GH_AUTH_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GITHUB_TOKEN ||
    readGhAuthToken()
const owner = process.env.GITHUB_OWNER || 'qnbs'
const repo = process.env.GITHUB_REPO || 'CannaGuide-2025'
const mainBranch = process.env.GITHUB_MAIN_BRANCH || 'main'
const dryRun = ['1', 'true', 'yes'].includes((process.env.DRY_RUN || '').toLowerCase())

// Only the CI umbrella check is required -- CodeQL/Fuzzing run as informational checks
const defaultChecks = ['\u2705 CI Status']

const checks = (process.env.REQUIRED_STATUS_CHECKS || defaultChecks.join(','))
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

const reviewerLogins = (process.env.ENV_REVIEWERS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

if (!token) {
    console.error(
        'ERROR: Missing PAT. Set GITHUB_PAT, GITHUB_TOKEN, GH_TOKEN, or GH_AUTH_TOKEN first.',
    )
    console.error('Example: export GH_TOKEN="ghp_xxx"')
    process.exit(1)
}

const apiBase = 'https://api.github.com'
const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'cannaguide-hardening-script',
}

const summary = []
const failures = []

function logStep(message) {
    console.log(`\n== ${message}`)
}

async function request(method, path, body, options = {}) {
    const url = `${apiBase}${path}`
    if (dryRun) {
        console.log(`[DRY_RUN] ${method} ${url}`)
        if (body) {
            console.log(`[DRY_RUN] body: ${JSON.stringify(body)}`)
        }
        return { ok: true, status: 200, data: null }
    }

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })

    let data = null
    const text = await res.text()
    if (text) {
        try {
            data = JSON.parse(text)
        } catch {
            data = { raw: text }
        }
    }

    if (!res.ok && !options.allowStatuses?.includes(res.status)) {
        const msg = data?.message || data?.raw || `HTTP ${res.status}`
        throw new Error(`${method} ${path} failed (${res.status}): ${msg}`)
    }

    return { ok: res.ok, status: res.status, data }
}

async function getUserId(login) {
    const { data } = await request('GET', `/users/${encodeURIComponent(login)}`)
    return data?.id
}

async function setActionsPermissions() {
    logStep('Configure GitHub Actions permissions')

    await request('PUT', `/repos/${owner}/${repo}/actions/permissions`, {
        enabled: true,
        allowed_actions: 'all',
    })

    await request('PUT', `/repos/${owner}/${repo}/actions/permissions/workflow`, {
        default_workflow_permissions: 'write',
        can_approve_pull_request_reviews: true,
    })

    summary.push('Actions permissions configured (enabled + workflow write + approve PR reviews).')
}

async function ensureEnvironment(name, config) {
    const reviewerIds = []
    for (const login of reviewerLogins) {
        const id = await getUserId(login)
        if (id) reviewerIds.push({ type: 'User', id })
    }

    const payload = {
        wait_timer: config.waitTimer,
        prevent_self_review: config.preventSelfReview,
        reviewers: reviewerIds,
        deployment_branch_policy: {
            protected_branches: !config.customPolicies,
            custom_branch_policies: config.customPolicies,
        },
    }

    await request(
        'PUT',
        `/repos/${owner}/${repo}/environments/${encodeURIComponent(name)}`,
        payload,
    )

    if (!config.customPolicies || !config.policies?.length) {
        return
    }

    const existingResp = await request(
        'GET',
        `/repos/${owner}/${repo}/environments/${encodeURIComponent(name)}/deployment-branch-policies`,
        null,
        { allowStatuses: [404] },
    )

    const existing = new Set(
        (existingResp.data?.branch_policies || []).map((p) => `${p.type}:${p.name}`),
    )

    for (const policy of config.policies) {
        const key = `${policy.type}:${policy.name}`
        if (existing.has(key)) continue

        await request(
            'POST',
            `/repos/${owner}/${repo}/environments/${encodeURIComponent(name)}/deployment-branch-policies`,
            policy,
        )
    }
}

async function setEnvironments() {
    logStep('Create/update deployment environments')

    const envs = [
        {
            name: 'github-pages',
            waitTimer: 0,
            preventSelfReview: false,
            customPolicies: true,
            policies: [{ name: mainBranch, type: 'branch' }],
        },
        {
            name: 'desktop-release',
            waitTimer: 0,
            preventSelfReview: true,
            customPolicies: true,
            policies: [{ name: 'v*', type: 'tag' }],
        },
        {
            name: 'mobile-release',
            waitTimer: 0,
            preventSelfReview: true,
            customPolicies: true,
            policies: [{ name: 'v*', type: 'tag' }],
        },
        {
            name: 'container-release',
            waitTimer: 0,
            preventSelfReview: false,
            customPolicies: true,
            policies: [{ name: 'v*', type: 'tag' }],
        },
        {
            name: 'container-pr-validation',
            waitTimer: 0,
            preventSelfReview: false,
            customPolicies: false,
            policies: [],
        },
    ]

    for (const env of envs) {
        await ensureEnvironment(env.name, env)
    }

    summary.push(
        'Environments configured: github-pages, desktop/mobile/container release, container-pr-validation.',
    )
}

async function setBranchProtection() {
    logStep(`Configure branch protection for ${mainBranch}`)

    const protectionResp = await request(
        'GET',
        `/repos/${owner}/${repo}/branches/${encodeURIComponent(mainBranch)}/protection`,
        null,
        { allowStatuses: [404] },
    )

    // Replace checks entirely instead of accumulating stale ones
    const requiredChecks = [...new Set(checks)]

    const body = {
        required_status_checks: {
            strict: true,
            contexts: requiredChecks,
        },
        enforce_admins: true,
        required_pull_request_reviews: {
            dismiss_stale_reviews: true,
            require_code_owner_reviews: false,
            required_approving_review_count: 0,
        },
        restrictions: null,
        allow_force_pushes: false,
        allow_deletions: false,
        required_linear_history: true,
        required_conversation_resolution: false,
        lock_branch: false,
    }

    await request(
        'PUT',
        `/repos/${owner}/${repo}/branches/${encodeURIComponent(mainBranch)}/protection`,
        body,
    )
    summary.push(
        `Branch protection configured for ${mainBranch} with checks: ${requiredChecks.join(', ')}.`,
    )
}

async function setPagesWorkflowMode() {
    logStep('Configure GitHub Pages build mode (best effort)')

    try {
        await request(
            'POST',
            `/repos/${owner}/${repo}/pages`,
            {
                build_type: 'workflow',
            },
            { allowStatuses: [409, 422] },
        )

        await request(
            'PUT',
            `/repos/${owner}/${repo}/pages`,
            {
                build_type: 'workflow',
            },
            { allowStatuses: [404, 422] },
        )

        summary.push('GitHub Pages build mode configured (workflow), if supported by API/plan.')
    } catch (error) {
        summary.push(`Pages API skipped: ${error.message}`)
    }
}

async function main() {
    console.log(`Repository: ${owner}/${repo}`)
    if (dryRun) {
        console.log('DRY_RUN mode enabled (no changes will be sent).')
    }

    // Verify token and repo access early
    await request('GET', `/repos/${owner}/${repo}`)

    const steps = [
        ['Actions permissions', setActionsPermissions],
        ['Environments', setEnvironments],
        ['Branch protection', setBranchProtection],
        ['Pages mode', setPagesWorkflowMode],
    ]

    for (const [name, fn] of steps) {
        try {
            await fn()
        } catch (error) {
            failures.push(`${name}: ${error.message}`)
            summary.push(`${name} skipped/failed: ${error.message}`)
            console.error(`WARNING: ${name} failed, continuing...`)
            console.error(`Reason: ${error.message}`)
        }
    }

    console.log('\n==== SUMMARY ====')
    for (const line of summary) {
        console.log(`- ${line}`)
    }

    if (failures.length > 0) {
        console.log('\n==== MANUAL FOLLOW-UP ====')
        for (const line of failures) {
            console.log(`- ${line}`)
        }
        process.exitCode = 2
    }
}

main().catch((error) => {
    console.error(`\nFAILED: ${error.message}`)
    process.exit(1)
})
