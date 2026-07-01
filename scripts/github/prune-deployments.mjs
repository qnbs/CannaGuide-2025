#!/usr/bin/env node
/**
 * Prune GitHub deployment records (keep N newest per environment).
 * Deactivates active deployments before delete — required by GitHub API.
 *
 * Usage:
 *   node scripts/github/prune-deployments.mjs [--dry-run] [--keep=3]
 *
 * Requires: gh CLI authenticated with repo + deployments scope.
 */

import { execFileSync } from 'node:child_process'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const keepArg = args.find((a) => a.startsWith('--keep='))
const keep = Math.max(1, Number(keepArg?.split('=')[1] ?? 3))

const repo = process.env.GITHUB_REPOSITORY || 'qnbs/CannaGuide-2025'

function ghApi(path, method = 'GET', fields = {}) {
    const cmd = ['api', path, '-X', method]
    for (const [key, value] of Object.entries(fields)) {
        cmd.push('-f', `${key}=${value}`)
    }
    const out = execFileSync('gh', cmd, { encoding: 'utf8' })
    return out ? JSON.parse(out) : null
}

function ghPaginate(path) {
    const out = execFileSync('gh', ['api', path, '--paginate'], { encoding: 'utf8' })
    const items = []
    for (const chunk of out.split('\n')) {
        const line = chunk.trim()
        if (!line) continue
        const parsed = JSON.parse(line)
        if (Array.isArray(parsed)) items.push(...parsed)
        else items.push(parsed)
    }
    return items
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function deactivateAndDelete(id, env) {
    try {
        ghApi(`repos/${repo}/deployments/${id}/statuses`, 'POST', {
            state: 'inactive',
            description: 'Pruned by scripts/github/prune-deployments.mjs',
        })
    } catch {
        // may already be inactive
    }
    await sleep(200)
    try {
        ghApi(`repos/${repo}/deployments/${id}`, 'DELETE')
        return
    } catch (err) {
        if (!String(err.message).includes('422')) throw err
    }
    ghApi(`repos/${repo}/deployments/${id}/statuses`, 'POST', {
        state: 'inactive',
        description: 'Pruned (retry)',
    })
    await sleep(400)
    ghApi(`repos/${repo}/deployments/${id}`, 'DELETE')
}

async function main() {
    const deployments = ghPaginate(`repos/${repo}/deployments?per_page=100`)
    const byEnv = new Map()

    for (const d of deployments) {
        const env = d.environment || 'unknown'
        if (!byEnv.has(env)) byEnv.set(env, [])
        byEnv.get(env).push(d)
    }

    let deleted = 0
    let failed = 0
    let skipped = 0

    for (const [env, deps] of byEnv) {
        deps.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        const toDelete = deps.slice(keep)

        if (toDelete.length === 0) {
            console.log(`[${env}] ${deps.length} total — nothing to prune`)
            continue
        }

        console.log(
            `[${env}] ${deps.length} total, keeping ${keep}, ${dryRun ? 'would delete' : 'deleting'} ${toDelete.length}`
        )

        const ordered = [...toDelete].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
        )

        for (const d of ordered) {
            if (dryRun) {
                console.log(`  candidate id=${d.id} ref=${d.ref} created=${d.created_at}`)
                deleted++
                continue
            }
            try {
                await deactivateAndDelete(d.id, env)
                deleted++
                if (deleted % 25 === 0) process.stdout.write('.')
            } catch (err) {
                if (String(err.message).includes('404')) {
                    skipped++
                    continue
                }
                failed++
                console.warn(`Failed ${d.id} (${env}): ${String(err.message).split('\n')[0]}`)
            }
        }
    }

    console.log(
        `\n[OK] ${deleted} ${dryRun ? 'candidates' : 'deleted'}, ${skipped} already gone, ${failed} failures`
    )
    if (failed > 0 && deleted === 0) process.exit(1)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
