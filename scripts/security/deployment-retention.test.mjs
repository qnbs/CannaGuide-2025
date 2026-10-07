import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import {
    LABELS,
    assertSafeDeleteBatch,
    attachAliasRecords,
    classifyRetention,
    cloudflareDeleteUrl,
    isDeletableClass,
    normalizeDeployment,
    projectAliasRecord,
    projectRetentionRecord,
    reconcilePlans,
    vercelDeleteUrl,
} from '../deployment-retention/classify.mjs'
import {
    deleteCloudflareDeployment,
    deleteProvenDeployments,
    listCloudflareDeployments,
    listVercelDeployments,
} from '../deployment-retention/hosts.mjs'
import {
    assertDeploySha,
    assertPostDeleteAnchors,
    assertTrustedApply,
    verifyPublicVersion,
} from '../deployment-retention/cli.mjs'

const MAIN = 'cb6d4054d2229b4a5e1b8fba0ffbfc1de6f33f52'
const SHA_A = '585937cf2a2ac1755a897185e50a7a3d924b41ae'
const SHA_B = '140375c8396668a616d666d3ef95252360b9792b'
const SHA_C = '54c9b773aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const OPEN_SHA = '5f4a02d9c59cf3714c674940e82cf269d8a1128e'
const OLD_OPEN = '1111111111111111111111111111111111111111'
const MERGED_SHA = '21586eb666151686ca57df5f21709350c422a716'
const MERGED_OLD = '2222222222222222222222222222222222222222'
const DEP_SHA = '3333333333333333333333333333333333333333'

function deploy(overrides) {
    return {
        id: 'dpl_x',
        url: 'https://example.example',
        createdAt: 1,
        sha: SHA_C,
        shaComplete: true,
        branch: 'main',
        target: 'preview',
        state: 'READY',
        aliases: [],
        ...overrides,
    }
}

function pulls() {
    return [
        { number: 540, state: 'OPEN', headRefName: 'cursor/ai-ml-bump-af4f', headRefOid: OPEN_SHA },
        {
            number: 538,
            state: 'MERGED',
            mergedAt: '2026-10-07T07:55:28Z',
            closedAt: '2026-10-07T07:55:28Z',
            headRefName: 'cursor/testing-library-patch-af4f',
            headRefOid: MERGED_SHA,
        },
        {
            number: 100,
            state: 'CLOSED',
            mergedAt: null,
            closedAt: '2026-10-01T00:00:00Z',
            headRefName: 'cursor/abandoned-af4f',
            headRefOid: '4444444444444444444444444444444444444444',
        },
        {
            number: 513,
            state: 'MERGED',
            mergedAt: '2026-09-01T00:00:00Z',
            closedAt: '2026-09-01T00:00:00Z',
            headRefName: 'dependabot/npm_and_yarn/ai-and-ml-bc1aa2e3d7',
            headRefOid: DEP_SHA,
        },
    ]
}

function productionSet(backend) {
    const ready = backend === 'cloudflare' ? 'success' : 'READY'
    const alias =
        backend === 'cloudflare'
            ? ['cannaguide-2025.pages.dev']
            : ['canna-guide-2025-web.vercel.app']
    return [
        deploy({
            id: 'prod',
            createdAt: 400,
            sha: MAIN,
            branch: 'main',
            target: 'production',
            state: ready,
            aliases: alias,
        }),
        deploy({
            id: 'roll1',
            createdAt: 300,
            sha: SHA_A,
            branch: 'main',
            target: 'production',
            state: ready,
        }),
        deploy({
            id: 'roll2',
            createdAt: 200,
            sha: SHA_B,
            branch: 'main',
            target: 'production',
            state: ready,
        }),
        deploy({
            id: 'oldprod',
            createdAt: 100,
            sha: SHA_C,
            branch: 'main',
            target: 'production',
            state: ready,
        }),
    ]
}

test('vercel keeps production, two rollback deployments, and deletes older unaliased production', () => {
    const plan = classifyRetention({
        backend: 'vercel',
        mainSha: MAIN,
        pulls: [],
        deployments: productionSet('vercel'),
    })
    const byId = Object.fromEntries(plan.deployments.map((row) => [row.id, row.class]))
    assert.equal(byId.prod, 'PROTECT_PRODUCTION')
    assert.equal(byId.roll1, 'PROTECT_ROLLBACK')
    assert.equal(byId.roll2, 'PROTECT_ROLLBACK')
    assert.equal(byId.oldprod, 'SAFE_DELETE_OLD_PRODUCTION')
    assert.deepEqual(plan.queuedDeleteIds, ['oldprod'])
})

test('cloudflare without a canonical alias keeps the newest main production and the rollback window', () => {
    const rows = productionSet('cloudflare').map((row) => ({ ...row, aliases: [] }))
    const plan = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: [],
        deployments: rows,
    })
    const byId = Object.fromEntries(plan.deployments.map((row) => [row.id, row.class]))
    assert.equal(plan.productionAmbiguous, false)
    assert.deepEqual(plan.anchors.productionIds, ['prod'])
    assert.equal(byId.prod, 'PROTECT_CURRENT_PRODUCTION')
    assert.equal(byId.roll1, 'PROTECT_RECENT_PRODUCTION_ROLLBACK')
    assert.equal(byId.roll2, 'PROTECT_RECENT_PRODUCTION_ROLLBACK')
    assert.equal(byId.oldprod, 'SAFE_DELETE_OLD_PRODUCTION_HISTORY')
    assert.equal(byId.prod && plan.deployments.find((row) => row.id === 'prod').deletable, false)
    assert.equal(plan.deployments.find((row) => row.id === 'oldprod').deletable, true)
})

test('cloudflare production stays ambiguous with no candidate, a tie, or a conflicting branch', () => {
    const ready = 'success'
    const stale = productionSet('cloudflare').map((row) => ({ ...row, aliases: [], sha: SHA_A }))
    const none = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: [],
        deployments: stale,
    })
    assert.equal(none.productionAmbiguous, true)
    assert.equal(none.queuedDeleteIds.length, 0)
    assert.ok(none.deployments.every((row) => row.class === 'PROTECT_CURRENT_PRODUCTION'))

    const tie = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: [],
        deployments: [
            deploy({
                id: 'tie-a',
                createdAt: 400,
                sha: MAIN,
                branch: 'main',
                target: 'production',
                state: ready,
            }),
            deploy({
                id: 'tie-b',
                createdAt: 400,
                sha: MAIN,
                branch: 'main',
                target: 'production',
                state: ready,
            }),
        ],
    })
    assert.equal(tie.productionAmbiguous, true)
    assert.equal(tie.queuedDeleteIds.length, 0)

    const conflict = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: [],
        deployments: [
            deploy({
                id: 'live',
                createdAt: 500,
                sha: MAIN,
                branch: 'main',
                target: 'production',
                state: ready,
            }),
            deploy({
                id: 'other-branch',
                createdAt: 450,
                sha: MAIN,
                branch: 'cursor/other-af4f',
                target: 'production',
                state: ready,
            }),
        ],
    })
    assert.equal(conflict.productionAmbiguous, true)
    assert.equal(conflict.queuedDeleteIds.length, 0)
})

test('an older duplicate of the current cloudflare main sha stays inside the rollback window', () => {
    const ready = 'success'
    const plan = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: [],
        deployments: [
            deploy({
                id: 'newest',
                createdAt: 500,
                sha: MAIN,
                branch: 'main',
                target: 'production',
                state: ready,
            }),
            deploy({
                id: 'older-same',
                createdAt: 400,
                sha: MAIN,
                branch: 'main',
                target: 'production',
                state: ready,
            }),
            deploy({
                id: 'prev',
                createdAt: 300,
                sha: SHA_A,
                branch: 'main',
                target: 'production',
                state: ready,
            }),
            deploy({
                id: 'older',
                createdAt: 100,
                sha: SHA_C,
                branch: 'main',
                target: 'production',
                state: ready,
            }),
        ],
    })
    const byId = Object.fromEntries(plan.deployments.map((row) => [row.id, row.class]))
    assert.equal(plan.productionAmbiguous, false)
    assert.deepEqual(plan.anchors.productionIds, ['newest'])
    assert.equal(byId.newest, 'PROTECT_CURRENT_PRODUCTION')
    assert.equal(byId['older-same'], 'PROTECT_RECENT_PRODUCTION_ROLLBACK')
    assert.equal(byId.prev, 'PROTECT_RECENT_PRODUCTION_ROLLBACK')
    assert.equal(byId.older, 'SAFE_DELETE_OLD_PRODUCTION_HISTORY')
    assert.deepEqual(plan.queuedDeleteIds, ['older'])
})

test('sanitized cloudflare branch names follow the pull request head sha', () => {
    const closedSha = '4444444444444444444444444444444444444444'
    const plan = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: [
            ...pulls(),
            {
                number: 9,
                state: 'MERGED',
                mergedAt: '2026-10-02T00:00:00Z',
                closedAt: '2026-10-02T00:00:00Z',
                headRefName: 'cursor/one-af4f',
                headRefOid: MERGED_OLD,
            },
            {
                number: 10,
                state: 'CLOSED',
                mergedAt: null,
                closedAt: '2026-10-03T00:00:00Z',
                headRefName: 'cursor/two-af4f',
                headRefOid: MERGED_OLD,
            },
        ],
        deployments: [
            ...productionSet('cloudflare'),
            deploy({
                id: 'sanitized-latest',
                createdAt: 50,
                sha: MERGED_SHA,
                branch: 'cursor-testing-library-patch-af4f',
                state: 'success',
            }),
            deploy({
                id: 'sanitized-old',
                createdAt: 40,
                sha: MERGED_SHA,
                branch: 'cursor-testing-library-patch-af4f',
                state: 'success',
            }),
            deploy({
                id: 'sanitized-alias',
                createdAt: 39,
                sha: MERGED_SHA,
                branch: 'cursor-testing-library-patch-af4f',
                state: 'success',
                aliases: ['cursor-testing-library-patch-af4f.cannaguide-2025.pages.dev'],
            }),
            deploy({
                id: 'open-sanitized',
                createdAt: 30,
                sha: OPEN_SHA,
                branch: 'cursor-ai-ml-bump-af4f',
                state: 'success',
            }),
            deploy({
                id: 'closed-latest',
                createdAt: 28,
                sha: closedSha,
                branch: 'cursor-abandoned-af4f',
                state: 'success',
            }),
            deploy({
                id: 'closed-old',
                createdAt: 27,
                sha: closedSha,
                branch: 'cursor-abandoned-af4f',
                state: 'success',
            }),
            deploy({
                id: 'conflict-old',
                createdAt: 12,
                sha: MERGED_OLD,
                branch: 'cursor-unrelated-af4f',
                state: 'success',
            }),
            deploy({
                id: 'conflict-latest',
                createdAt: 13,
                sha: SHA_C,
                branch: 'cursor-unrelated-af4f',
                state: 'success',
            }),
        ],
    })
    const byId = Object.fromEntries(plan.deployments.map((row) => [row.id, row.class]))
    assert.equal(byId['sanitized-latest'], 'PROTECT_LATEST_ACTIVE_BRANCH')
    assert.equal(byId['sanitized-old'], 'SAFE_DELETE_MERGED_PR_HISTORY')
    assert.equal(byId['sanitized-alias'], 'PROTECT_ACTIVE_ALIAS')
    assert.equal(byId['open-sanitized'], 'PROTECT_OPEN_PR')
    assert.equal(byId['closed-latest'], 'PROTECT_LATEST_ACTIVE_BRANCH')
    assert.equal(byId['closed-old'], 'SAFE_DELETE_CLOSED_PR_HISTORY')
    assert.equal(byId['conflict-latest'], 'PROTECT_LATEST_ACTIVE_BRANCH')
    assert.equal(byId['conflict-old'], 'UNKNOWN')
    assert.equal(plan.deployments.find((row) => row.id === 'conflict-old').deletable, false)
    assert.equal(plan.deployments.find((row) => row.id === 'sanitized-old').deletable, true)
})

test('cloudflare uses its own labels and still keeps the rollback window', () => {
    const plan = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: [],
        deployments: productionSet('cloudflare'),
    })
    const byId = Object.fromEntries(plan.deployments.map((row) => [row.id, row.class]))
    assert.equal(byId.prod, 'PROTECT_CURRENT_PRODUCTION')
    assert.equal(byId.roll1, 'PROTECT_RECENT_PRODUCTION_ROLLBACK')
    assert.equal(byId.roll2, 'PROTECT_RECENT_PRODUCTION_ROLLBACK')
    assert.equal(byId.oldprod, 'SAFE_DELETE_OLD_PRODUCTION_HISTORY')
    assert.equal(plan.deployments.find((row) => row.id === 'prod').deletable, false)
})

test('open PR head and superseded preview are classified differently from a stale dependabot branch', () => {
    const ready = 'READY'
    const plan = classifyRetention({
        backend: 'vercel',
        mainSha: MAIN,
        pulls: pulls(),
        deployments: [
            ...productionSet('vercel'),
            deploy({
                id: 'open-head',
                createdAt: 50,
                sha: OPEN_SHA,
                branch: 'cursor/ai-ml-bump-af4f',
                state: ready,
                aliases: [
                    'canna-guide-2025-web-git-cursor-ai-ml-bump-af4f-qnbs-projects.vercel.app',
                ],
            }),
            deploy({
                id: 'open-old',
                createdAt: 40,
                sha: OLD_OPEN,
                branch: 'cursor/ai-ml-bump-af4f',
                state: ready,
            }),
            deploy({
                id: 'merged-latest',
                createdAt: 30,
                sha: MERGED_SHA,
                branch: 'cursor/testing-library-patch-af4f',
                state: ready,
                aliases: [
                    'canna-guide-2025-web-git-cursor-testing-library-patch-af4f-qnbs-projects.vercel.app',
                ],
            }),
            deploy({
                id: 'merged-old',
                createdAt: 20,
                sha: MERGED_OLD,
                branch: 'cursor/testing-library-patch-af4f',
                state: ready,
            }),
            deploy({
                id: 'dep-old',
                createdAt: 10,
                sha: DEP_SHA,
                branch: 'dependabot/npm_and_yarn/ai-and-ml-bc1aa2e3d7',
                state: ready,
            }),
            deploy({
                id: 'closed-old',
                createdAt: 9,
                sha: '4444444444444444444444444444444444444444',
                branch: 'cursor/abandoned-af4f',
                state: ready,
            }),
            deploy({
                id: 'mystery',
                createdAt: 8,
                sha: '5555555555555555555555555555555555555555',
                branch: 'cursor/unknown-af4f',
                state: ready,
            }),
            deploy({
                id: 'building',
                createdAt: 7,
                sha: OLD_OPEN,
                branch: 'cursor/ai-ml-bump-af4f',
                state: 'BUILDING',
            }),
        ],
    })
    const byId = Object.fromEntries(plan.deployments.map((row) => [row.id, row]))
    assert.equal(byId['open-head'].class, 'PROTECT_OPEN_PR')
    assert.equal(byId['open-old'].class, 'SAFE_DELETE_SUPERSEDED_PREVIEW')
    assert.equal(byId['merged-latest'].class, 'PROTECT_ACTIVE_ALIAS')
    assert.equal(byId['merged-old'].class, 'SAFE_DELETE_MERGED_PR')
    assert.equal(byId['dep-old'].class, 'SAFE_DELETE_STALE_DEPENDABOT')
    assert.equal(byId['closed-old'].class, 'SAFE_DELETE_CLOSED_PR')
    assert.equal(byId.mystery.class, 'UNKNOWN')
    assert.equal(byId.building.class, 'UNKNOWN')
    for (const id of ['open-head', 'merged-latest', 'mystery', 'building', 'prod']) {
        assert.equal(byId[id].deletable, false)
        assert.equal(isDeletableClass(byId[id].class), false)
    }
})

test('cloudflare keeps the latest deployment of a merged branch and deletes only older history', () => {
    const plan = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: pulls(),
        deployments: [
            ...productionSet('cloudflare'),
            deploy({
                id: 'merged-latest',
                createdAt: 30,
                sha: MERGED_SHA,
                branch: 'cursor/testing-library-patch-af4f',
                state: 'success',
                aliases: ['cursor-testing-library-patch-af4f.cannaguide-2025.pages.dev'],
            }),
            deploy({
                id: 'merged-old',
                createdAt: 20,
                sha: MERGED_OLD,
                branch: 'cursor/testing-library-patch-af4f',
                state: 'success',
            }),
        ],
    })
    const latest = plan.deployments.find((row) => row.id === 'merged-latest')
    const older = plan.deployments.find((row) => row.id === 'merged-old')
    assert.equal(latest.class, 'PROTECT_LATEST_ACTIVE_BRANCH')
    assert.equal(latest.deletable, false)
    assert.match(latest.limitation, /cannot_be_deleted/)
    assert.equal(older.class, 'SAFE_DELETE_MERGED_PR_HISTORY')
    assert.equal(older.deletable, true)
})

test('a short commit sha and an alias-only record fail closed', () => {
    const wrangler = normalizeDeployment(
        {
            Id: 'pages-1',
            Environment: 'Preview',
            Branch: 'cursor/ai-ml-bump-af4f',
            Source: '5f4a02d',
            Deployment: 'https://preview.pages.dev',
            Status: '2026-10-07',
        },
        'cloudflare',
    )
    assert.equal(wrangler.shaComplete, false)
    const aliasOnly = attachAliasRecords(
        [],
        [{ alias: 'mystery.example', deploymentId: 'missing-deploy' }],
    )
    const plan = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: pulls(),
        deployments: [
            ...productionSet('cloudflare'),
            { ...wrangler, createdAt: 10, state: 'success' },
            deploy({
                id: 'short-old',
                createdAt: 9,
                sha: 'abc1234',
                shaComplete: false,
                branch: 'cursor/ai-ml-bump-af4f',
                state: 'success',
            }),
            aliasOnly[0],
        ],
    })
    const byId = Object.fromEntries(plan.deployments.map((row) => [row.id, row.class]))
    assert.equal(byId['pages-1'], 'PROTECT_OPEN_PR')
    assert.equal(byId['short-old'], 'UNKNOWN')
    assert.equal(byId['missing-deploy'], 'PROTECT_ACTIVE_ALIAS')
    assert.equal(plan.deployments.find((row) => row.id === 'short-old').deletable, false)
})

test('missing production alias protects every production deployment', () => {
    const rows = productionSet('vercel').map((row) => ({ ...row, aliases: [] }))
    const plan = classifyRetention({
        backend: 'vercel',
        mainSha: MAIN,
        pulls: [],
        deployments: rows,
    })
    assert.equal(plan.productionAmbiguous, true)
    assert.equal(plan.queuedDeleteIds.length, 0)
    assert.ok(plan.deployments.every((row) => row.class === 'PROTECT_PRODUCTION'))
})

test('reconcile aborts when main or a safe row changes and never deletes UNKNOWN', () => {
    const frozen = classifyRetention({
        backend: 'vercel',
        mainSha: MAIN,
        pulls: [],
        deployments: productionSet('vercel'),
    })
    const moved = classifyRetention({
        backend: 'vercel',
        mainSha: SHA_A,
        pulls: [],
        deployments: productionSet('vercel').map((row) =>
            row.id === 'prod'
                ? { ...row, sha: SHA_A, aliases: ['canna-guide-2025-web.vercel.app'] }
                : row,
        ),
    })
    const aborted = reconcilePlans(frozen, moved)
    assert.equal(aborted.abort, true)
    assert.equal(aborted.ids.length, 0)

    const fresh = classifyRetention({
        backend: 'vercel',
        mainSha: MAIN,
        pulls: [],
        deployments: productionSet('vercel'),
    })
    const ok = reconcilePlans(frozen, fresh)
    assert.equal(ok.abort, false)
    assert.deepEqual(ok.ids, ['oldprod'])
    assert.throws(() => assertSafeDeleteBatch(frozen, ['prod']), /refusing to delete/)
    assert.throws(() => assertSafeDeleteBatch(frozen, ['mystery']), /refusing to delete/)
})

test('cloudflare and vercel delete URLs cannot enable force or a project delete', () => {
    const cloudflare = cloudflareDeleteUrl('account', 'cannaguide-2025', 'deploy-1')
    assert.match(cloudflare, /\/deployments\/deploy-1\?force=false$/)
    assert.doesNotMatch(cloudflare, /force=true/)
    assert.doesNotMatch(cloudflare, /\/projects\/cannaguide-2025\?/)
    const vercel = vercelDeleteUrl('dpl_123', 'team_123')
    assert.match(vercel, /\/v13\/deployments\/dpl_123\?teamId=team_123$/)
    assert.throws(
        () => cloudflareDeleteUrl('account', 'cannaguide-2025', 'a/b'),
        /unexpected characters/,
    )
})

test('delete helper stops on the first API rejection and never sends force=true', async () => {
    const calls = []
    const plan = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: pulls(),
        deployments: [
            ...productionSet('cloudflare'),
            deploy({
                id: 'merged-latest',
                createdAt: 30,
                sha: MERGED_SHA,
                branch: 'cursor/testing-library-patch-af4f',
                state: 'success',
            }),
            deploy({
                id: 'merged-old',
                createdAt: 20,
                sha: MERGED_OLD,
                branch: 'cursor/testing-library-patch-af4f',
                state: 'success',
            }),
            deploy({
                id: 'merged-older',
                createdAt: 19,
                sha: '6666666666666666666666666666666666666666',
                branch: 'cursor/testing-library-patch-af4f',
                state: 'success',
            }),
        ],
    })
    const fetchImpl = async (url, init) => {
        calls.push({ url, method: init?.method || 'GET' })
        const method = init?.method || 'GET'
        if (method === 'GET') {
            return {
                ok: true,
                status: 200,
                text: async () =>
                    JSON.stringify({
                        success: true,
                        result: { environment: 'preview', aliases: [] },
                        target: null,
                    }),
            }
        }
        if (String(url).includes('merged-older')) {
            return {
                ok: false,
                status: 400,
                text: async () =>
                    JSON.stringify({ success: false, errors: [{ message: 'latest' }] }),
            }
        }
        return { ok: true, status: 200, text: async () => JSON.stringify({ success: true }) }
    }
    const ids = plan.queuedDeleteIds.filter((id) => id !== 'oldprod')
    const results = await deleteProvenDeployments({
        backend: 'cloudflare',
        plan,
        ids: ['merged-old', 'merged-older'],
        token: 'test-token',
        accountId: 'account',
        projectName: 'cannaguide-2025',
        fetchImpl,
    })
    assert.equal(results.length, 2)
    assert.equal(results[0].ok, true)
    assert.equal(results[1].ok, false)
    assert.ok(
        calls
            .filter((call) => call.method === 'DELETE')
            .every((call) => call.url.includes('force=false')),
    )
    assert.ok(calls.every((call) => !call.url.includes('force=true')))
    assert.equal(ids.includes('merged-latest'), false)
    await assert.rejects(
        () =>
            deleteCloudflareDeployment({
                token: 'test-token',
                accountId: 'account',
                projectName: 'cannaguide-2025',
                deploymentId: 'deploy-1',
                fetchImpl: async () => {
                    throw new Error('should build the URL before fetch')
                },
            }),
        /should build the URL before fetch/,
    )
})

test('a partial inventory past the page ceiling is refused', async () => {
    const page = (totalPages) => ({
        ok: true,
        status: 200,
        text: async () =>
            JSON.stringify({
                success: true,
                result: Array.from({ length: 25 }, (_, index) => ({ id: `page-row-${index}` })),
                result_info: { total_pages: totalPages },
            }),
    })
    await assert.rejects(
        () =>
            listCloudflareDeployments({
                token: 'test-token',
                accountId: 'account1',
                projectName: 'cannaguide-2025',
                maxPages: 2,
                fetchImpl: async () => page(5),
            }),
        /refusing a partial inventory/,
    )
    const listed = await listVercelDeployments({
        token: 'test-token',
        projectId: 'prj_test',
        teamId: 'team_test',
        maxPages: 2,
        fetchImpl: async () => ({
            ok: true,
            status: 200,
            text: async () =>
                JSON.stringify({ deployments: [{ id: 'dpl_done1' }], pagination: {} }),
        }),
    })
    assert.equal(listed.length, 1)
})

test('a preview that becomes production between classify and delete is not removed', async () => {
    const plan = classifyRetention({
        backend: 'vercel',
        mainSha: MAIN,
        pulls: pulls(),
        deployments: [
            ...productionSet('vercel'),
            deploy({
                id: 'open-latest',
                createdAt: 50,
                sha: OPEN_SHA,
                branch: 'cursor/ai-ml-bump-af4f',
                state: 'READY',
            }),
            deploy({
                id: 'promoted-preview',
                createdAt: 40,
                sha: OLD_OPEN,
                branch: 'cursor/ai-ml-bump-af4f',
                state: 'READY',
            }),
        ],
    })
    const row = plan.deployments.find((item) => item.id === 'promoted-preview')
    assert.equal(row.class, 'SAFE_DELETE_SUPERSEDED_PREVIEW')
    assert.equal(row.deletable, true)
    const calls = []
    await assert.rejects(
        () =>
            deleteProvenDeployments({
                backend: 'vercel',
                plan,
                ids: ['promoted-preview'],
                token: 'test-token',
                teamId: 'team_test',
                fetchImpl: async (_url, init) => {
                    calls.push(init?.method || 'GET')
                    return {
                        ok: true,
                        status: 200,
                        text: async () => JSON.stringify({ target: 'production', alias: [] }),
                    }
                },
            }),
        /target is production/,
    )
    assert.deepEqual(calls, ['GET'])
})

test('unaliased old Vercel production is deleted and any live alias blocks it', async () => {
    const plan = classifyRetention({
        backend: 'vercel',
        mainSha: MAIN,
        pulls: [],
        deployments: productionSet('vercel'),
    })
    assert.equal(
        plan.deployments.find((row) => row.id === 'oldprod').class,
        'SAFE_DELETE_OLD_PRODUCTION',
    )
    const calls = []
    const results = await deleteProvenDeployments({
        backend: 'vercel',
        plan,
        ids: ['oldprod'],
        token: 'test-token',
        teamId: 'team_test',
        fetchImpl: async (url, init) => {
            calls.push({ url: String(url), method: init?.method || 'GET' })
            return {
                ok: true,
                status: 200,
                text: async () => JSON.stringify({ target: 'production', alias: [], aliases: [] }),
            }
        },
    })
    assert.equal(results.length, 1)
    assert.equal(results[0].ok, true)
    assert.equal(calls[0].method, 'GET')
    assert.equal(calls[1].method, 'DELETE')
    assert.match(calls[1].url, /\/v13\/deployments\/oldprod\?teamId=team_test$/)
    assert.ok(calls.every((call) => !call.url.includes('force=true')))

    for (const alias of [['archive.example.com'], null, undefined]) {
        const blocked = []
        await assert.rejects(
            () =>
                deleteProvenDeployments({
                    backend: 'vercel',
                    plan,
                    ids: ['oldprod'],
                    token: 'test-token',
                    teamId: 'team_test',
                    fetchImpl: async (_url, init) => {
                        blocked.push(init?.method || 'GET')
                        return {
                            ok: true,
                            status: 200,
                            text: async () => JSON.stringify({ target: 'production', alias }),
                        }
                    },
                }),
            /alias state is not an empty list/,
        )
        assert.deepEqual(blocked, ['GET'])
    }
})

test('current production and both rollback ids never reach a delete request', async () => {
    const protectClass = {
        vercel: {
            prod: 'PROTECT_PRODUCTION',
            roll1: 'PROTECT_ROLLBACK',
            roll2: 'PROTECT_ROLLBACK',
        },
        cloudflare: {
            prod: 'PROTECT_CURRENT_PRODUCTION',
            roll1: 'PROTECT_RECENT_PRODUCTION_ROLLBACK',
            roll2: 'PROTECT_RECENT_PRODUCTION_ROLLBACK',
        },
    }
    for (const backend of ['vercel', 'cloudflare']) {
        const plan = classifyRetention({
            backend,
            mainSha: MAIN,
            pulls: [],
            deployments: productionSet(backend),
        })
        assert.deepEqual(plan.anchors.productionIds, ['prod'])
        assert.deepEqual(plan.anchors.rollbackIds, ['roll1', 'roll2'])
        const oldClass =
            backend === 'vercel'
                ? 'SAFE_DELETE_OLD_PRODUCTION'
                : 'SAFE_DELETE_OLD_PRODUCTION_HISTORY'
        for (const id of ['prod', 'roll1', 'roll2']) {
            const row = plan.deployments.find((item) => item.id === id)
            assert.equal(row.class, protectClass[backend][id])
            assert.equal(row.deletable, false)
            const calls = []
            await assert.rejects(
                () =>
                    deleteProvenDeployments({
                        backend,
                        plan,
                        ids: [id],
                        token: 'test-token',
                        accountId: 'account',
                        projectName: 'cannaguide-2025',
                        teamId: 'team_test',
                        fetchImpl: async () => {
                            calls.push('network')
                            throw new Error('network must not run')
                        },
                    }),
                /not a proven safe-delete row/,
            )
            assert.deepEqual(calls, [])
            assert.throws(() => assertSafeDeleteBatch(plan, [id]), /not a proven safe-delete row/)
            const forced = {
                ...plan,
                deployments: plan.deployments.map((item) =>
                    item.id === id
                        ? { ...item, class: oldClass, deletable: true, aliases: [] }
                        : item,
                ),
            }
            assert.throws(
                () => assertSafeDeleteBatch(forced, [id]),
                /refusing to delete protected deployment/,
            )
        }
    }
})

test('proven unaliased Cloudflare production history deletes with force=false', async () => {
    const plan = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: [],
        deployments: productionSet('cloudflare'),
    })
    assert.deepEqual(plan.queuedDeleteIds, ['oldprod'])
    const calls = []
    const results = await deleteProvenDeployments({
        backend: 'cloudflare',
        plan,
        ids: ['oldprod'],
        token: 'test-token',
        accountId: 'account',
        projectName: 'cannaguide-2025',
        fetchImpl: async (url, init) => {
            calls.push({ url: String(url), method: init?.method || 'GET' })
            return {
                ok: true,
                status: 200,
                text: async () =>
                    JSON.stringify({
                        success: true,
                        result: { environment: 'production', aliases: [] },
                    }),
            }
        },
    })
    assert.equal(results.length, 1)
    assert.equal(results[0].ok, true)
    assert.equal(calls[0].method, 'GET')
    assert.equal(calls[1].method, 'DELETE')
    assert.match(calls[1].url, /force=false/)
    assert.ok(calls.every((call) => !call.url.includes('force=true')))

    const blocked = []
    await assert.rejects(
        () =>
            deleteProvenDeployments({
                backend: 'cloudflare',
                plan,
                ids: ['oldprod'],
                token: 'test-token',
                accountId: 'account',
                projectName: 'cannaguide-2025',
                fetchImpl: async (_url, init) => {
                    blocked.push(init?.method || 'GET')
                    return {
                        ok: true,
                        status: 200,
                        text: async () =>
                            JSON.stringify({
                                success: true,
                                result: {
                                    environment: 'production',
                                    aliases: ['cannaguide-2025.pages.dev'],
                                },
                            }),
                    }
                },
            }),
        /production alias appeared/,
    )
    assert.deepEqual(blocked, ['GET'])

    await assert.rejects(
        () =>
            deleteProvenDeployments({
                backend: 'cloudflare',
                plan,
                ids: ['oldprod'],
                token: 'test-token',
                accountId: 'account',
                projectName: 'cannaguide-2025',
                fetchImpl: async () => ({
                    ok: true,
                    status: 200,
                    text: async () =>
                        JSON.stringify({
                            success: true,
                            result: { environment: 'preview', aliases: [] },
                        }),
                }),
            }),
        /environment is not old production/,
    )
    const omitted = []
    await assert.rejects(
        () =>
            deleteProvenDeployments({
                backend: 'cloudflare',
                plan,
                ids: ['oldprod'],
                token: 'test-token',
                accountId: 'account',
                projectName: 'cannaguide-2025',
                fetchImpl: async (_url, init) => {
                    omitted.push(init?.method || 'GET')
                    return {
                        ok: true,
                        status: 200,
                        text: async () =>
                            JSON.stringify({
                                success: true,
                                result: {
                                    environment: 'production',
                                    latest_stage: { status: 'success' },
                                },
                            }),
                    }
                },
            }),
        /alias list was omitted/,
    )
    assert.deepEqual(omitted, ['GET'])
    await assert.rejects(
        () =>
            deleteProvenDeployments({
                backend: 'cloudflare',
                plan,
                ids: ['prod'],
                token: 'test-token',
                accountId: 'account',
                projectName: 'cannaguide-2025',
                fetchImpl: async () => {
                    throw new Error('current production must not be looked up')
                },
            }),
        /refusing to delete/,
    )
})

test('Cloudflare null aliases delete only with fresh canonical main authority', async () => {
    const plan = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: [],
        deployments: productionSet('cloudflare'),
    })
    const candidate = {
        environment: 'production',
        aliases: null,
        latest_stage: { status: 'success' },
    }
    const project = (canonical) => ({
        success: true,
        result: {
            production_branch: 'main',
            canonical_deployment: canonical,
        },
    })
    const canonical = {
        id: 'canonical-prod',
        environment: 'production',
        latest_stage: { status: 'success' },
        deployment_trigger: { metadata: { commit_hash: MAIN, branch: 'main' } },
    }
    const run = async ({ deployment = candidate, body = project(canonical), status = 200 }) => {
        const calls = []
        const result = deleteProvenDeployments({
            backend: 'cloudflare',
            plan,
            ids: ['oldprod'],
            token: 'test-token',
            accountId: 'account',
            projectName: 'cannaguide-2025',
            fetchImpl: async (url, init) => {
                const method = init?.method || 'GET'
                calls.push({ url: String(url), method })
                if (method === 'DELETE') {
                    return {
                        ok: true,
                        status: 200,
                        text: async () => JSON.stringify({ success: true }),
                    }
                }
                if (String(url).includes('/deployments/')) {
                    return {
                        ok: true,
                        status: 200,
                        text: async () => JSON.stringify({ success: true, result: deployment }),
                    }
                }
                return {
                    ok: status === 200,
                    status,
                    text: async () => JSON.stringify(body),
                }
            },
        })
        return { calls, result }
    }
    const allowed = await run({})
    const deleted = await allowed.result
    assert.equal(deleted.length, 1)
    assert.equal(deleted[0].ok, true)
    assert.deepEqual(
        allowed.calls.map((call) => call.method),
        ['GET', 'GET', 'DELETE'],
    )
    assert.ok(allowed.calls[1].url.endsWith('/pages/projects/cannaguide-2025'))
    assert.match(allowed.calls[2].url, /force=false/)
    assert.ok(allowed.calls.every((call) => !call.url.includes('force=true')))

    const cases = [
        { status: 500, body: { success: false }, message: /project lookup failed/ },
        { body: project(null), message: /canonical deployment is missing/ },
        {
            body: project({ ...canonical, id: 'oldprod' }),
            message: /canonical deployment is the candidate/,
        },
        {
            body: project({
                ...canonical,
                deployment_trigger: {
                    metadata: { commit_hash: SHA_A, branch: 'main' },
                },
            }),
            message: /canonical deployment SHA is not current main/,
        },
        {
            body: {
                success: true,
                result: { production_branch: 'preview', canonical_deployment: canonical },
            },
            message: /production branch is not main/,
        },
    ]
    for (const item of cases) {
        const attempt = await run(item)
        await assert.rejects(attempt.result, item.message)
        assert.deepEqual(
            attempt.calls.map((call) => call.method),
            ['GET', 'GET'],
        )
    }
    const unfinished = await run({
        deployment: { ...candidate, latest_stage: { status: 'active' } },
    })
    await assert.rejects(unfinished.result, /not a successful production/)
    assert.deepEqual(
        unfinished.calls.map((call) => call.method),
        ['GET'],
    )
})

test('a failed Cloudflare delete stops the rest of the batch', async () => {
    const calls = []
    const plan = classifyRetention({
        backend: 'cloudflare',
        mainSha: MAIN,
        pulls: [],
        deployments: productionSet('cloudflare').concat(
            deploy({
                id: 'older-prod',
                createdAt: 50,
                sha: '7777777777777777777777777777777777777777',
                branch: 'main',
                target: 'production',
                state: 'success',
            }),
        ),
    })
    assert.ok(plan.queuedDeleteIds.includes('oldprod'))
    assert.ok(plan.queuedDeleteIds.includes('older-prod'))
    const results = await deleteProvenDeployments({
        backend: 'cloudflare',
        plan,
        ids: ['oldprod', 'older-prod'],
        token: 'test-token',
        accountId: 'account',
        projectName: 'cannaguide-2025',
        fetchImpl: async (url, init) => {
            const method = init?.method || 'GET'
            calls.push(method)
            if (method === 'DELETE') {
                return {
                    ok: false,
                    status: 409,
                    text: async () =>
                        JSON.stringify({ success: false, errors: [{ message: 'rejected' }] }),
                }
            }
            return {
                ok: true,
                status: 200,
                text: async () =>
                    JSON.stringify({
                        success: true,
                        result: { environment: 'production', aliases: [] },
                    }),
            }
        },
    })
    assert.equal(results.length, 1)
    assert.equal(results[0].ok, false)
    assert.equal(calls.filter((method) => method === 'DELETE').length, 1)
    assert.ok(calls.every((method, index) => method !== 'DELETE' || calls[index - 1] === 'GET'))
})

test('post-delete checks keep production and both rollback anchors', () => {
    assert.doesNotThrow(() =>
        assertPostDeleteAnchors({
            remainingIds: new Set(['prod', 'roll1', 'roll2']),
            deletedIds: ['oldprod'],
            productionIds: ['prod'],
            rollbackIds: ['roll1', 'roll2'],
        }),
    )
    assert.throws(
        () =>
            assertPostDeleteAnchors({
                remainingIds: new Set(['roll1', 'roll2']),
                deletedIds: ['oldprod'],
                productionIds: ['prod'],
                rollbackIds: ['roll1', 'roll2'],
            }),
        /production deployment prod disappeared/,
    )
    assert.throws(
        () =>
            assertPostDeleteAnchors({
                remainingIds: new Set(['prod', 'roll2']),
                deletedIds: ['oldprod'],
                productionIds: ['prod'],
                rollbackIds: ['roll1', 'roll2'],
            }),
        /rollback deployment roll1 disappeared/,
    )
    assert.throws(
        () =>
            assertPostDeleteAnchors({
                remainingIds: new Set(['prod', 'roll1', 'roll2', 'oldprod']),
                deletedIds: ['oldprod'],
                productionIds: ['prod'],
                rollbackIds: ['roll1', 'roll2'],
            }),
        /oldprod is still present after delete/,
    )
})

test('version identity is retried before the cleanup run is failed', async () => {
    let calls = 0
    const version = await verifyPublicVersion(
        'https://cannaguide-2025.pages.dev/version.json',
        MAIN,
        {
            attempts: 3,
            pauseMs: 0,
            fetchImpl: async () => {
                calls += 1
                const commit = calls < 3 ? 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' : MAIN
                return {
                    status: 200,
                    json: async () => ({ commit, buildVersion: `1.9.0+${commit}` }),
                }
            },
        },
    )
    assert.equal(version.attempts, 3)
    assert.equal(version.commit, MAIN)

    let transportCalls = 0
    const recovered = await verifyPublicVersion(
        'https://cannaguide-2025.pages.dev/version.json',
        MAIN,
        {
            attempts: 3,
            pauseMs: 0,
            fetchImpl: async () => {
                transportCalls += 1
                if (transportCalls === 1) throw new Error('temporary network failure')
                if (transportCalls === 2) {
                    return {
                        status: 200,
                        json: async () => {
                            throw new Error('invalid json')
                        },
                    }
                }
                return {
                    status: 200,
                    json: async () => ({ commit: MAIN, buildVersion: `1.9.0+${MAIN}` }),
                }
            },
        },
    )
    assert.equal(transportCalls, 3)
    assert.equal(recovered.attempts, 3)
    assert.equal(recovered.commit, MAIN)
    await assert.rejects(
        () =>
            verifyPublicVersion('https://cannaguide-2025.pages.dev/version.json', MAIN, {
                attempts: 2,
                pauseMs: 0,
                fetchImpl: async () => {
                    throw new Error('still down')
                },
            }),
        /version check failed after 2 attempts: still down/,
    )
})

test('inventory records keep proven fields and fail closed on unexpected text', () => {
    const cloudflare = projectRetentionRecord(
        {
            id: 'pages-deploy-1',
            url: 'https://preview.cannaguide-2025.pages.dev',
            created_on: '2026-10-07T07:55:28Z',
            environment: 'preview',
            latest_stage: { status: 'success' },
            aliases: ['preview.cannaguide-2025.pages.dev', 'not a host'],
            deployment_trigger: {
                metadata: { commit_hash: MERGED_SHA, branch: 'cursor/testing-library-patch-af4f' },
            },
        },
        'cloudflare',
    )
    assert.equal(cloudflare.id, 'pages-deploy-1')
    assert.equal(cloudflare.sha, MERGED_SHA)
    assert.equal(cloudflare.branch, 'cursor/testing-library-patch-af4f')
    assert.equal(cloudflare.state, 'success')
    assert.ok(cloudflare.aliases.includes('needs-review.invalid'))
    const reread = normalizeDeployment(cloudflare, 'cloudflare')
    assert.equal(reread.sha, MERGED_SHA)
    assert.equal(reread.branch, cloudflare.branch)
    assert.equal(reread.target, 'preview')

    const tainted = projectRetentionRecord(
        {
            id: 'pages-deploy-2',
            created_on: '2026-10-07T07:55:28Z',
            environment: 'preview',
            latest_stage: { status: 'success' },
            deployment_trigger: { metadata: { commit_hash: MERGED_SHA, branch: 'feature\nmain' } },
        },
        'cloudflare',
    )
    assert.equal(tainted.branch, '')
    assert.equal(tainted.state, 'unknown')
    assert.equal(projectRetentionRecord({ id: 'a/b' }, 'vercel'), null)
    assert.equal(
        projectAliasRecord({ deploymentId: 'dpl_123456', alias: 'bad host.example' }).alias,
        'needs-review.invalid',
    )
    assert.equal(projectAliasRecord({ deploymentId: 'dpl_123456', deletedAt: 1 }), null)
})

test('cleanup workflow keeps host retention on trusted main and off pull requests', () => {
    const workflow = readFileSync('.github/workflows/cleanup-deployments.yml', 'utf8')
    assert.match(workflow, /host-retention:/)
    assert.match(workflow, /workflow_run:/)
    assert.match(workflow, /workflow_run.event == 'push'/)
    assert.match(workflow, /workflows: \['CI', 'Deploy to Cloudflare Pages'\]/)
    assert.match(workflow, /head_branch == 'main'/)
    assert.match(workflow, /head_repository\.full_name == github\.repository/)
    assert.match(workflow, /inputs\.dry_run != true && inputs\.dry_run != 'true'/)
    assert.doesNotMatch(workflow, /inputs\.dry_run == false/)
    assert.match(workflow, /RETENTION_SOURCE_EVENT:/)
    assert.match(workflow, /RETENTION_SOURCE_REPOSITORY:/)
    assert.match(workflow, /RETENTION_SOURCE_WORKFLOW:/)
    assert.match(workflow, /RETENTION_DEPLOY_SHA:/)
    assert.equal((workflow.match(/head_repository\.full_name/g) || []).length, 4)
    const host = workflow.slice(workflow.indexOf('host-retention:'))
    const hostIf = host.slice(0, host.indexOf('steps:'))
    assert.match(hostIf, /workflow_run.name == 'Deploy to Cloudflare Pages'/)
    assert.match(hostIf, /workflow_run.event == 'workflow_run'/)
    assert.doesNotMatch(hostIf, /event == 'push'/)
    assert.doesNotMatch(workflow, /pull_request:/)
    assert.doesNotMatch(workflow, /pull_request_target:/)
    assert.match(workflow, /refs\/heads\/main/)
    assert.match(workflow, /delete-cloudflare/)
    assert.match(workflow, /delete-vercel/)
    assert.doesNotMatch(workflow, /--force/)
    const classify = workflow.slice(workflow.indexOf('Classify Cloudflare Pages'))
    const classifyStep = classify.slice(0, classify.indexOf('- name: Delete proven Cloudflare'))
    assert.doesNotMatch(classifyStep, /CLOUDFLARE_API_TOKEN/)
    assert.doesNotMatch(classifyStep, /VERCEL_TOKEN/)
    assert.match(workflow, /CLOUDFLARE_API_TOKEN/)
    assert.equal(LABELS.vercel.unknown, 'UNKNOWN')
    assert.equal(LABELS.cloudflare.unknown, 'UNKNOWN')
})

test('apply accepts a successful main push and refuses a pull-request workflow_run', () => {
    const main = {
        GITHUB_ACTIONS: 'true',
        GITHUB_REF: 'refs/heads/main',
        GITHUB_REPOSITORY: 'qnbs/CannaGuide-2025',
    }
    const trustedRun = {
        ...main,
        GITHUB_EVENT_NAME: 'workflow_run',
        RETENTION_SOURCE_EVENT: 'push',
        RETENTION_SOURCE_BRANCH: 'main',
        RETENTION_SOURCE_CONCLUSION: 'success',
        RETENTION_SOURCE_REPOSITORY: 'qnbs/CannaGuide-2025',
    }
    assert.doesNotThrow(() => assertTrustedApply({ ...main, GITHUB_EVENT_NAME: 'schedule' }))
    assert.doesNotThrow(() =>
        assertTrustedApply({ ...main, GITHUB_EVENT_NAME: 'workflow_dispatch' }),
    )
    assert.doesNotThrow(() => assertTrustedApply(trustedRun))
    assert.doesNotThrow(() =>
        assertTrustedApply({
            ...main,
            GITHUB_EVENT_NAME: 'workflow_run',
            RETENTION_SOURCE_EVENT: 'workflow_run',
            RETENTION_SOURCE_BRANCH: 'main',
            RETENTION_SOURCE_CONCLUSION: 'success',
            RETENTION_SOURCE_REPOSITORY: 'qnbs/CannaGuide-2025',
            RETENTION_SOURCE_WORKFLOW: 'Deploy to Cloudflare Pages',
        }),
    )
    assert.throws(
        () =>
            assertTrustedApply({
                ...main,
                GITHUB_EVENT_NAME: 'workflow_run',
                RETENTION_SOURCE_EVENT: 'workflow_run',
                RETENTION_SOURCE_BRANCH: 'main',
                RETENTION_SOURCE_CONCLUSION: 'success',
                RETENTION_SOURCE_REPOSITORY: 'qnbs/CannaGuide-2025',
                RETENTION_SOURCE_WORKFLOW: 'CI',
            }),
        /untrusted workflow_run/,
    )
    assert.doesNotThrow(() => assertDeploySha({}, MAIN))
    assert.doesNotThrow(() => assertDeploySha({ RETENTION_DEPLOY_SHA: MAIN }, MAIN))
    assert.throws(
        () => assertDeploySha({ RETENTION_DEPLOY_SHA: SHA_A }, MAIN),
        /deploy SHA is not current main/,
    )
    assert.throws(
        () =>
            assertTrustedApply({
                ...trustedRun,
                RETENTION_SOURCE_REPOSITORY: 'fork/CannaGuide-2025',
            }),
        /untrusted workflow_run/,
    )
    assert.throws(
        () =>
            assertTrustedApply({
                ...trustedRun,
                RETENTION_SOURCE_REPOSITORY: '',
            }),
        /untrusted workflow_run/,
    )
    assert.throws(
        () =>
            assertTrustedApply({
                ...main,
                GITHUB_EVENT_NAME: 'workflow_run',
                RETENTION_SOURCE_EVENT: 'pull_request',
                RETENTION_SOURCE_BRANCH: 'cursor/example-af4f',
                RETENTION_SOURCE_CONCLUSION: 'success',
                RETENTION_SOURCE_REPOSITORY: 'qnbs/CannaGuide-2025',
            }),
        /untrusted workflow_run/,
    )
    assert.throws(
        () =>
            assertTrustedApply({
                ...main,
                GITHUB_EVENT_NAME: 'workflow_run',
            }),
        /untrusted workflow_run/,
    )
    assert.throws(
        () =>
            assertTrustedApply({
                GITHUB_ACTIONS: 'true',
                GITHUB_REF: 'refs/pull/1/merge',
                GITHUB_EVENT_NAME: 'pull_request',
            }),
        /pull_request/,
    )
})
