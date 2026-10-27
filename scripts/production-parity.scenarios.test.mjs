import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, URL } from 'node:url'
import {
    aggregateStatus,
    exitCodeFor,
    PASS_STATUSES,
    platformCacheExpectation,
    readPolicies,
} from './production-parity-policy.mjs'
import { HOSTS, runProbe } from './production-parity.mjs'

// End-to-end scenarios for runProbe against an in-memory model of the three hosts.
// No network: fetch, the clock and sleep are all injected.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const POLICIES = readPolicies(REPO_ROOT)
const MAIN_SHA = '04e8d5a0b10bf8ae90cc4f3ea8b96cf2b39b138b'
const OLD_SHA = '6e4c4b82c8254b2ea781071810a3f5ce7296f2ba'
const ENTRY = 'assets/index-a1b2c3.js'

const SPA_FALLBACKS = new Set([
    'sitemap.xml',
    'manifest.webmanifest',
    'plants/deep-route-audit',
    '__audit-nonexistent-canna-probe.js',
])

const CACHE_KIND = {
    '': 'root',
    'version.json': 'version',
    'manifest.json': 'manifest',
    'sw.js': 'serviceWorker',
    [ENTRY]: 'asset',
}

function rootHtml(host) {
    const csp =
        host.platform === 'github-pages'
            ? `<meta http-equiv="Content-Security-Policy" content="${POLICIES.csp}">`
            : ''
    return [
        '<!doctype html><html><head>',
        csp,
        `<script type="module" crossorigin src="./${ENTRY}"></script>`,
        '<link rel="modulepreload" href="./assets/vendor-d4e5f6.js">',
        '<link rel="manifest" href="./manifest.json">',
        '</head><body><div id="root"></div></body></html>',
    ].join('')
}

// A healthy deployment of `sha` on `host`, as the probe expects to see it.
function healthyResponse(host, path, sha) {
    const security =
        host.platform === 'vercel'
            ? POLICIES.vercelSecurity
            : host.platform === 'cloudflare'
              ? POLICIES.cloudflareSecurity
              : { 'strict-transport-security': 'max-age=31556952' }
    const headers = { ...security }
    const kind = CACHE_KIND[path]
    if (kind) headers['cache-control'] = platformCacheExpectation(host, kind, POLICIES)

    if (path === '')
        return {
            status: 200,
            headers: { ...headers, 'content-type': 'text/html' },
            body: rootHtml(host),
        }
    if (path === 'version.json') {
        return {
            status: 200,
            headers: { ...headers, 'content-type': 'application/json' },
            body: JSON.stringify({
                version: '1.10.0',
                commit: sha,
                builtAt: '2026-10-27T05:28:09.771Z',
            }),
        }
    }
    if (path === 'manifest.json') {
        const manifest = {
            start_url: './',
            scope: './',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
        }
        return {
            status: 200,
            headers: { ...headers, 'content-type': 'application/json' },
            body: JSON.stringify(manifest),
        }
    }
    if (path === ENTRY) {
        return {
            status: 200,
            headers: { ...headers, 'content-type': 'text/javascript' },
            body: 'navigator.serviceWorker.register("./sw.js")',
        }
    }
    if (path === 'index.html' && host.platform === 'cloudflare') {
        return { status: 308, headers: { location: '/' }, body: null }
    }
    if (SPA_FALLBACKS.has(path)) {
        return host.platform === 'github-pages'
            ? { status: 404, headers: { 'content-type': 'text/html' }, body: 'Not Found' }
            : { status: 200, headers: { 'content-type': 'text/html' }, body: rootHtml(host) }
    }
    if (path === 'index.html')
        return { status: 200, headers: { 'content-type': 'text/html' }, body: rootHtml(host) }
    return { status: 200, headers, body: 'ok' }
}

/**
 * fakeHosts({ shaFor, override }) -> fetch implementation.
 * shaFor(hostName, versionReadCount) picks the commit each version.json read reports.
 * override(hostName, path, response) may replace a response or throw a network error.
 */
function fakeHosts({
    shaFor = () => MAIN_SHA,
    override = (_host, _path, response) => response,
} = {}) {
    const versionReads = new Map()
    const requests = []
    const fetchImpl = async (input, init = {}) => {
        const url = new URL(String(input))
        const method = init.method ?? 'GET'
        requests.push({ method, url: url.href, credentials: init.credentials })
        assert.ok(['GET', 'HEAD'].includes(method), `probe sent ${method} ${url.href}`)

        const host = HOSTS.find((candidate) => new URL(candidate.base).host === url.host)
        assert.ok(host, `probe left the three canonical hosts: ${url.href}`)
        const basePath = new URL(host.base).pathname
        // `path` is relative to the host base; the two redirect probes get marker names.
        let path
        let response
        if (url.protocol === 'http:') {
            path = '<http>'
            response = {
                status: 301,
                headers: { location: `https://${url.host}${url.pathname}` },
                body: null,
            }
        } else if (`${url.pathname}/` === basePath) {
            path = '<base-without-slash>'
            response = { status: 301, headers: { location: host.base }, body: null }
        } else {
            path = url.pathname.slice(basePath.length)
            let sha = MAIN_SHA
            if (path === 'version.json') {
                const count = (versionReads.get(host.name) ?? 0) + 1
                versionReads.set(host.name, count)
                sha = shaFor(host.name, count)
            }
            response = healthyResponse(host, path, sha)
        }
        response = override(host.name, path, response)
        return new Response(method === 'HEAD' ? null : response.body, {
            status: response.status,
            headers: response.headers,
        })
    }
    return { fetchImpl, requests, versionReads }
}

function fakeClock() {
    let current = Date.parse('2026-10-27T06:00:00Z')
    return { now: () => current, sleep: async (milliseconds) => void (current += milliseconds) }
}

async function probe(hosts, options = {}) {
    return runProbe({
        expectedSha: MAIN_SHA,
        fetchImpl: hosts.fetchImpl,
        waitSeconds: 300,
        intervalSeconds: 60,
        repoRoot: REPO_ROOT,
        ...fakeClock(),
        ...options,
    })
}

const hostReport = (report, name) => report.hosts.find((host) => host.host === name)
const failing = (host) => host.checks.filter((item) => !PASS_STATUSES.has(item.status))

test('a healthy three-host deployment of the expected SHA is MATCH with read-only requests', async () => {
    const hosts = fakeHosts()
    const report = await probe(hosts)
    for (const host of report.hosts) assert.deepEqual(failing(host), [], host.host)
    assert.equal(report.status, 'MATCH')
    assert.deepEqual(report.deployWait, {
        attempts: 1,
        timedOut: false,
        waitSeconds: 300,
        intervalSeconds: 60,
    })
    assert.ok(hosts.requests.every((request) => request.credentials === 'omit'))
    assert.equal(exitCodeFor(report.status), 0)
})

test('partial propagation waits for the lagging host instead of passing early', async () => {
    const hosts = fakeHosts({
        shaFor: (name, count) => (name === 'cloudflare' && count < 3 ? OLD_SHA : MAIN_SHA),
    })
    const report = await probe(hosts)
    assert.equal(report.deployWait.attempts, 3)
    assert.equal(report.deployWait.timedOut, false)
    assert.equal(report.status, 'MATCH')
})

test('a host still serving the previous SHA after the wait window is DRIFT', async () => {
    const hosts = fakeHosts({ shaFor: (name) => (name === 'github-pages' ? OLD_SHA : MAIN_SHA) })
    const report = await probe(hosts, { waitSeconds: 120 })
    assert.equal(report.deployWait.timedOut, true)
    const stale = hostReport(report, 'github-pages')
    assert.deepEqual(
        failing(stale).map((item) => [item.id, item.status, item.actual]),
        [['version.sha', 'DRIFT', OLD_SHA]],
    )
    assert.equal(hostReport(report, 'vercel').status, 'MATCH')
    assert.equal(report.status, 'DRIFT')
    assert.equal(exitCodeFor(report.status), 1)
})

test('an immediate observation (--wait-seconds 0) never treats skew as expected', async () => {
    const hosts = fakeHosts({ shaFor: (name) => (name === 'vercel' ? OLD_SHA : MAIN_SHA) })
    const report = await probe(hosts, { waitSeconds: 0 })
    assert.equal(report.deployWait.attempts, 1)
    assert.equal(hostReport(report, 'vercel').checks[0].status, 'DRIFT')
    assert.equal(report.status, 'DRIFT')
})

test('a production alias redirecting to another deployment is DRIFT', async () => {
    const wrongAlias = 'https://canna-guide-2025-web-git-stale-branch.vercel.app/'
    const hosts = fakeHosts({
        override: (name, path, response) =>
            name === 'vercel' && path === ''
                ? { status: 307, headers: { location: wrongAlias }, body: null }
                : response,
    })
    const report = await probe(hosts)
    const vercel = hostReport(report, 'vercel')
    const rootCheck = vercel.checks.find((item) => item.id === 'http.root')
    assert.equal(rootCheck.status, 'DRIFT')
    assert.equal(rootCheck.location, wrongAlias)
    assert.equal(vercel.checks.find((item) => item.id === 'entry.module-script').status, 'DRIFT')
    assert.ok(
        !hosts.requests.some((request) => request.url.startsWith(wrongAlias)),
        'redirect was followed',
    )
    assert.equal(report.status, 'DRIFT')
})

test('diverging security headers on one host are DRIFT, with the observed value', async () => {
    const hosts = fakeHosts({
        override: (name, path, response) => {
            if (name !== 'cloudflare' || path !== '') return response
            const headers = { ...response.headers, 'content-security-policy': 'default-src *' }
            delete headers['x-frame-options']
            return { ...response, headers }
        },
    })
    const report = await probe(hosts)
    const drift = failing(hostReport(report, 'cloudflare')).map((item) => [item.id, item.actual])
    assert.deepEqual(drift, [
        ['security.content-security-policy', 'default-src *'],
        ['security.x-frame-options', null],
    ])
    assert.equal(report.status, 'DRIFT')
})

test('network failures are UNKNOWN, never MATCH', async () => {
    const hosts = fakeHosts({
        override: (name, _path, response) => {
            if (name === 'github-pages') throw new TypeError('fetch failed')
            return response
        },
    })
    const report = await probe(hosts, { waitSeconds: 60 })
    assert.equal(report.deployWait.timedOut, true)
    const unreachable = hostReport(report, 'github-pages')
    assert.equal(unreachable.status, 'UNKNOWN')
    // No response is no evidence: neither drift nor a platform difference that passes.
    assert.deepEqual(
        unreachable.checks.filter((item) => item.status !== 'UNKNOWN').map((item) => item.id),
        [],
    )
    assert.equal(report.status, 'UNKNOWN')
    assert.equal(exitCodeFor(report.status), 2)
})

test('an abbreviated build identity in version.json is not accepted', async () => {
    const hosts = fakeHosts({
        shaFor: (name) => (name === 'cloudflare' ? MAIN_SHA.slice(0, 8) : MAIN_SHA),
    })
    const report = await probe(hosts, { waitSeconds: 0 })
    assert.equal(hostReport(report, 'cloudflare').checks[0].status, 'INVALID')
    assert.equal(hostReport(report, 'cloudflare').status, 'UNKNOWN')
    assert.equal(report.status, 'UNKNOWN')
})

test('only explicit pass states aggregate to MATCH', () => {
    assert.equal(
        aggregateStatus(['MATCH', 'EXACT_MAIN', 'INTENTIONAL_PLATFORM_DIFFERENCE']),
        'MATCH',
    )
    assert.equal(aggregateStatus(['MATCH', 'EXPECTED_SKEW']), 'UNKNOWN')
    assert.equal(aggregateStatus(['MATCH', 'INVALID']), 'UNKNOWN')
    assert.equal(aggregateStatus(['MATCH', 'SOMETHING_NEW']), 'UNKNOWN')
    assert.equal(aggregateStatus(['UNKNOWN', 'DRIFT']), 'DRIFT')
    assert.equal(exitCodeFor('EXPECTED_SKEW'), 2)
})
