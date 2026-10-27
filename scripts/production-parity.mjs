#!/usr/bin/env node

import { Console } from 'node:console'
import { Buffer } from 'node:buffer'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { setTimeout as sleepTimer } from 'node:timers/promises'
import { fileURLToPath, URL } from 'node:url'
import {
    aggregateStatus,
    cacheCheck,
    check,
    classifySha,
    comparableCsp,
    compareHeaders,
    expectedStatuses,
    exitCodeFor,
    getMetaCsp,
    parseRootAssets,
    readPolicies,
    SECURITY_HEADERS,
} from './production-parity-policy.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const logger = new Console({ stdout: process.stdout, stderr: process.stderr })
const USER_AGENT = 'cannaguide-readonly-audit/1.0'
const FULL_SHA = /^[0-9a-f]{40}$/i
const TIMEOUT_MS = 15_000
export const MAX_RESPONSE_BYTES = 4 * 1024 * 1024

export const HOSTS = [
    { name: 'vercel', platform: 'vercel', base: 'https://canna-guide-2025-web.vercel.app/' },
    { name: 'cloudflare', platform: 'cloudflare', base: 'https://cannaguide-2025.pages.dev/' },
    {
        name: 'github-pages',
        platform: 'github-pages',
        base: 'https://qnbs.github.io/CannaGuide-2025/',
    },
]

function urlFor(host, relativePath, query = '') {
    const url = new URL(relativePath.replace(/^\//, ''), host.base)
    if (query) url.search = query
    return url
}

async function request(url, method = 'GET', fetchImpl = globalThis.fetch) {
    try {
        const response = await fetchImpl(url, {
            method,
            redirect: 'manual',
            credentials: 'omit',
            headers: { 'user-agent': USER_AGENT },
            signal: globalThis.AbortSignal.timeout(TIMEOUT_MS),
        })
        const headers = Object.fromEntries(
            [...response.headers.entries()].filter(([name]) =>
                [
                    ...SECURITY_HEADERS,
                    'cache-control',
                    'content-type',
                    'location',
                    'etag',
                    'last-modified',
                    'age',
                    'content-length',
                ].includes(name.toLowerCase()),
            ),
        )
        let body = ''
        if (method !== 'HEAD') {
            try {
                body = await readBoundedText(response)
            } catch (error) {
                return {
                    url: String(url),
                    status: response.status,
                    headers,
                    body,
                    error: String(error),
                }
            }
        }
        return { url: String(url), status: response.status, headers, body }
    } catch (error) {
        return { url: String(url), status: null, headers: {}, body: '', error: String(error) }
    }
}

export async function readBoundedText(response, maxBytes = MAX_RESPONSE_BYTES) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
        throw new RangeError('Response byte limit must be a non-negative safe integer')
    }
    const declaredLength = Number(response.headers.get('content-length'))
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
        await response.body?.cancel()
        throw new RangeError(`Response exceeds the ${maxBytes}-byte inspection limit`)
    }
    if (!response.body) return ''
    if (typeof response.body.getReader !== 'function') {
        throw new TypeError('Response stream does not support bounded reading')
    }

    const reader = response.body.getReader()
    const chunks = []
    let totalBytes = 0
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = Buffer.from(value)
            totalBytes += chunk.byteLength
            if (totalBytes > maxBytes) {
                await reader.cancel()
                throw new RangeError(`Response exceeds the ${maxBytes}-byte inspection limit`)
            }
            chunks.push(chunk)
        }
    } catch (error) {
        try {
            await reader.cancel()
        } catch {
            // Preserve the read or size-limit error.
        }
        throw error
    }
    return Buffer.concat(chunks, totalBytes).toString('utf8')
}

async function readVersion(host, expectedSha, fetchImpl, timedOut = false) {
    const url = urlFor(host, 'version.json', `?probe=${Date.now()}`)
    const response = await request(url, 'GET', fetchImpl)
    let body
    try {
        body = response.status === 200 ? JSON.parse(response.body) : null
    } catch {
        body = null
    }
    const commit = typeof body?.commit === 'string' ? body.commit : ''
    return {
        response,
        body,
        check: check(
            'version.sha',
            response.status === null || response.error
                ? 'UNKNOWN'
                : body
                  ? classifySha(commit, expectedSha, timedOut)
                  : 'INVALID',
            expectedSha,
            commit || `HTTP ${response.status}`,
            { version: body?.version ?? null, builtAt: body?.builtAt ?? null },
        ),
    }
}

async function waitForMain(expectedSha, fetchImpl, waitSeconds, intervalSeconds, now, sleep) {
    const deadline = now() + waitSeconds * 1000
    let samples = []
    let attempt = 0
    while (true) {
        attempt++
        samples = []
        for (const host of HOSTS) samples.push(await readVersion(host, expectedSha, fetchImpl))
        if (samples.every((sample) => sample.check.status === 'EXACT_MAIN')) {
            return { samples, attempts: attempt, timedOut: false }
        }
        if (now() >= deadline) return { samples, attempts: attempt, timedOut: true }
        await sleep(Math.min(intervalSeconds * 1000, Math.max(0, deadline - now())))
    }
}

function responseCheck(id, response, expected, details = {}) {
    if (response.status === null) return check(id, 'UNKNOWN', expected, response.error, details)
    const status = expected.includes(response.status) ? 'MATCH' : 'DRIFT'
    return check(id, status, expected, response.status, {
        url: response.url,
        location: response.headers.location ?? null,
        ...details,
    })
}

function contentTypeCheck(id, response, expectedPrefix) {
    if (response.status === null) return check(id, 'UNKNOWN', expectedPrefix, response.error)
    if (response.status !== 200) {
        return check(
            id,
            'INTENTIONAL_PLATFORM_DIFFERENCE',
            `${expectedPrefix} when HTTP 200`,
            `HTTP ${response.status}`,
        )
    }
    const actual = response.headers['content-type'] ?? null
    return check(
        id,
        actual?.toLowerCase().startsWith(expectedPrefix) ? 'MATCH' : 'DRIFT',
        expectedPrefix,
        actual,
    )
}

async function checkRedirects(host, fetchImpl) {
    const checks = []
    const base = new URL(host.base)
    const httpUrl = new URL(host.base)
    httpUrl.protocol = 'http:'
    const httpResponse = await request(httpUrl, 'HEAD', fetchImpl)
    const httpLocation = httpResponse.headers.location
    let httpStatus = 'DRIFT'
    if (httpResponse.status === null) httpStatus = 'UNKNOWN'
    else if ([301, 308].includes(httpResponse.status) && httpLocation) {
        const target = new URL(httpLocation, httpUrl)
        httpStatus =
            target.protocol === 'https:' &&
            target.host === base.host &&
            target.pathname === base.pathname
                ? 'MATCH'
                : 'DRIFT'
    }
    checks.push(
        check('redirect.http-to-https', httpStatus, '301/308 to same HTTPS host and path', {
            status: httpResponse.status,
            location: httpLocation ?? null,
        }),
    )

    if (host.platform === 'github-pages') {
        const noSlash = new URL(host.base)
        noSlash.pathname = noSlash.pathname.replace(/\/$/, '')
        const response = await request(noSlash, 'HEAD', fetchImpl)
        const target = response.headers.location
            ? new URL(response.headers.location, noSlash)
            : null
        const status =
            response.status === null
                ? 'UNKNOWN'
                : [301, 308].includes(response.status) && target?.href === host.base
                  ? 'MATCH'
                  : 'DRIFT'
        checks.push(
            check('redirect.github-pages-base-slash', status, `301/308 to ${host.base}`, {
                status: response.status,
                location: response.headers.location ?? null,
            }),
        )
    }
    return checks
}

async function probeHost(host, versionSample, timedOut, expectedSha, policies, fetchImpl) {
    const responses = {}
    const paths = {
        root: '',
        manifest: 'manifest.json',
        serviceWorker: 'sw.js',
        robots: 'robots.txt',
        sitemap: 'sitemap.xml',
        manifestWebmanifest: 'manifest.webmanifest',
        deepRoute: 'plants/deep-route-audit',
        missingScript: '__audit-nonexistent-canna-probe.js',
        indexHtml: 'index.html',
        favicon: 'favicon.ico',
    }
    for (const [key, path] of Object.entries(paths)) {
        responses[key] = await request(urlFor(host, path), 'GET', fetchImpl)
    }

    const checks = [
        check(
            'version.sha',
            versionSample.check.status === 'UNKNOWN' || versionSample.check.status === 'INVALID'
                ? versionSample.check.status
                : classifySha(versionSample.body?.commit, expectedSha, timedOut),
            expectedSha,
            versionSample.body?.commit ?? `HTTP ${versionSample.response.status}`,
            {
                version: versionSample.body?.version ?? null,
                builtAt: versionSample.body?.builtAt ?? null,
            },
        ),
    ]
    for (const key of Object.keys(paths)) {
        checks.push(responseCheck(`http.${key}`, responses[key], expectedStatuses(host, key)))
    }
    for (const key of ['sitemap', 'manifestWebmanifest', 'deepRoute', 'missingScript']) {
        if (responses[key].status === 200) {
            checks.push(contentTypeCheck(`content-type.${key}`, responses[key], 'text/html'))
        }
    }
    if (responses.indexHtml.status === 200) {
        checks.push(contentTypeCheck('content-type.indexHtml', responses.indexHtml, 'text/html'))
    } else if (responses.indexHtml.status === 308) {
        const target = responses.indexHtml.headers.location
            ? new URL(responses.indexHtml.headers.location, responses.indexHtml.url).href
            : null
        checks.push(
            check(
                'redirect.index-html',
                target === host.base ? 'INTENTIONAL_PLATFORM_DIFFERENCE' : 'DRIFT',
                `308 to ${host.base}`,
                {
                    status: responses.indexHtml.status,
                    location: responses.indexHtml.headers.location ?? null,
                },
            ),
        )
    }

    const root = responses.root
    const assets =
        root.status === 200 && !root.error
            ? parseRootAssets(root.body)
            : { entry: null, manifest: null, stylesheetCount: 0, modulepreloadCount: 0 }
    checks.push(
        check(
            'entry.module-script',
            assets.entry ? 'MATCH' : root.error || root.status === null ? 'UNKNOWN' : 'DRIFT',
            'one module entry URL',
            assets.entry,
        ),
    )
    checks.push(
        check(
            'entry.modulepreload-count',
            root.error ? 'UNKNOWN' : assets.modulepreloadCount > 0 ? 'MATCH' : 'DRIFT',
            '> 0',
            assets.modulepreloadCount,
        ),
    )
    checks.push(
        check(
            'entry.manifest-link',
            root.error ? 'UNKNOWN' : assets.manifest ? 'MATCH' : 'DRIFT',
            'manifest URL present',
            assets.manifest,
        ),
    )

    const globalHeaders =
        host.platform === 'vercel' ? policies.vercelSecurity : policies.cloudflareSecurity
    if (root.status === null) {
        // Without a response, an absent header is not evidence of anything -- in
        // particular not of GitHub Pages' intentional header gap.
        for (const name of SECURITY_HEADERS) {
            checks.push(check(`security.${name}`, 'UNKNOWN', 'response headers', root.error))
        }
    } else if (host.platform === 'github-pages') {
        for (const name of SECURITY_HEADERS) {
            const actual = root.headers[name] ?? null
            if (name === 'strict-transport-security') {
                checks.push(
                    check(
                        `security.${name}`,
                        actual ? 'INTENTIONAL_PLATFORM_DIFFERENCE' : 'UNKNOWN',
                        'platform-managed HSTS',
                        actual,
                    ),
                )
            } else if (name === 'content-security-policy') {
                const metaCsp = root.error ? null : getMetaCsp(root.body)
                const configuredCsp = policies.vercelSecurity[name]
                checks.push(
                    check(
                        'security.content-security-policy-meta',
                        root.error
                            ? 'UNKNOWN'
                            : metaCsp && comparableCsp(metaCsp) === comparableCsp(configuredCsp)
                              ? 'MATCH'
                              : 'DRIFT',
                        'repo CSP minus frame-ancestors',
                        metaCsp,
                    ),
                )
                checks.push(
                    check(
                        `security.${name}-header`,
                        actual === null ? 'INTENTIONAL_PLATFORM_DIFFERENCE' : 'DRIFT',
                        'absent; CSP is delivered by meta',
                        actual,
                    ),
                )
            } else {
                checks.push(
                    check(
                        `security.${name}`,
                        actual === null ? 'INTENTIONAL_PLATFORM_DIFFERENCE' : 'DRIFT',
                        'absent on GitHub Pages',
                        actual,
                    ),
                )
            }
        }
    } else {
        const headerResults = compareHeaders(root.headers, globalHeaders)
        for (const [name, result] of Object.entries(headerResults)) {
            checks.push(check(`security.${name}`, result.status, result.expected, result.actual))
        }
    }

    for (const key of ['root', 'version', 'manifest', 'serviceWorker']) {
        const response = key === 'version' ? versionSample.response : responses[key]
        checks.push(cacheCheck(host, key, response, policies))
    }

    const manifestResponse = responses.manifest
    let manifest = null
    try {
        if (manifestResponse.status === 200 && !manifestResponse.error) {
            manifest = JSON.parse(manifestResponse.body)
        }
    } catch {
        manifest = null
    }
    const manifestUrl = urlFor(host, 'manifest.json')
    checks.push(
        check(
            'manifest.valid-json',
            manifestResponse.error ? 'UNKNOWN' : manifest ? 'MATCH' : 'DRIFT',
            'valid JSON',
            manifestResponse.error
                ? manifestResponse.error
                : manifest
                  ? 'valid JSON'
                  : 'invalid JSON',
        ),
    )
    checks.push(
        check(
            'manifest.start-url',
            manifestResponse.error ? 'UNKNOWN' : manifest?.start_url === './' ? 'MATCH' : 'DRIFT',
            './',
            manifest?.start_url ?? null,
        ),
    )
    checks.push(
        check(
            'manifest.scope',
            manifestResponse.error ? 'UNKNOWN' : manifest?.scope === './' ? 'MATCH' : 'DRIFT',
            './',
            manifest?.scope ?? null,
        ),
    )
    const icons = Array.isArray(manifest?.icons) ? manifest.icons : []
    checks.push(
        check(
            'manifest.icons-present',
            manifestResponse.error ? 'UNKNOWN' : icons.length ? 'MATCH' : 'DRIFT',
            'one or more icons',
            icons.length,
        ),
    )
    for (const icon of icons) {
        if (typeof icon.src !== 'string') {
            checks.push(
                check(
                    'manifest.icon',
                    'DRIFT',
                    'same-origin URL or image data URI',
                    icon.src ?? null,
                ),
            )
            continue
        }
        if (icon.src.startsWith('data:image/')) {
            checks.push(
                check(
                    `manifest.icon.${icon.sizes ?? 'inline'}`,
                    'MATCH',
                    'image data URI',
                    'inline image',
                ),
            )
            continue
        }
        let iconUrl
        try {
            iconUrl = new URL(icon.src, manifestUrl)
        } catch {
            checks.push(
                check(`manifest.icon.${icon.src}`, 'DRIFT', 'same-origin HTTPS URL', icon.src),
            )
            continue
        }
        if (iconUrl.protocol !== 'https:' || iconUrl.origin !== new URL(host.base).origin) {
            checks.push(
                check(`manifest.icon.${icon.src}`, 'DRIFT', 'same-origin HTTPS URL', iconUrl.href),
            )
            continue
        }
        const iconResponse = await request(iconUrl, 'HEAD', fetchImpl)
        checks.push(responseCheck(`manifest.icon.${icon.src}`, iconResponse, [200]))
    }

    if (assets.entry) {
        let entryUrl
        try {
            entryUrl = new URL(assets.entry, host.base)
        } catch {
            entryUrl = null
        }
        if (
            !entryUrl ||
            entryUrl.protocol !== 'https:' ||
            entryUrl.origin !== new URL(host.base).origin
        ) {
            checks.push(
                check(
                    'service-worker.registration',
                    'DRIFT',
                    'same-origin module entry',
                    assets.entry,
                ),
            )
        } else {
            const entryResponse = await request(entryUrl, 'GET', fetchImpl)
            checks.push(responseCheck('http.entry', entryResponse, [200]))
            checks.push(cacheCheck(host, 'asset', entryResponse, policies))
            const registered = /serviceWorker\.register|registerSW/.test(entryResponse.body)
            checks.push(
                check(
                    'service-worker.registration',
                    entryResponse.status === null || entryResponse.error
                        ? 'UNKNOWN'
                        : registered
                          ? 'MATCH'
                          : 'DRIFT',
                    'registration call present in entry bundle',
                    registered,
                    {
                        entry: entryUrl.href,
                        modulepreloadCount: assets.modulepreloadCount,
                        stylesheetCount: assets.stylesheetCount,
                    },
                ),
            )
        }
    }

    checks.push(...(await checkRedirects(host, fetchImpl)))

    return {
        host: host.name,
        base: host.base,
        status: aggregateStatus(checks.map((item) => item.status)),
        version: versionSample.body,
        assetGraph: assets,
        checks,
    }
}

export async function runProbe({
    expectedSha,
    fetchImpl = globalThis.fetch,
    waitSeconds = 1800,
    intervalSeconds = 30,
    now = Date.now,
    sleep = (milliseconds) => sleepTimer(milliseconds),
    repoRoot = REPO_ROOT,
} = {}) {
    if (!FULL_SHA.test(expectedSha ?? ''))
        throw new Error('--expected-sha must be a full 40-character commit SHA')
    if (!Number.isInteger(waitSeconds) || waitSeconds < 0 || waitSeconds > 3600)
        throw new Error('--wait-seconds must be an integer from 0 to 3600')
    if (!Number.isInteger(intervalSeconds) || intervalSeconds < 1 || intervalSeconds > 120)
        throw new Error('--interval-seconds must be an integer from 1 to 120')

    const policies = readPolicies(repoRoot)
    const policyMismatch = compareHeaders(policies.vercelSecurity, policies.cloudflareSecurity)
    const waitResult = await waitForMain(
        expectedSha,
        fetchImpl,
        waitSeconds,
        intervalSeconds,
        now,
        sleep,
    )
    const hosts = []
    for (let index = 0; index < HOSTS.length; index++) {
        hosts.push(
            await probeHost(
                HOSTS[index],
                waitResult.samples[index],
                waitResult.timedOut,
                expectedSha,
                policies,
                fetchImpl,
            ),
        )
    }

    const configChecks = Object.entries(policyMismatch).map(([name, result]) =>
        check(`repo-policy.${name}`, result.status, result.expected, result.actual),
    )
    const status = aggregateStatus([
        ...hosts.map((host) => host.status),
        ...configChecks.map((item) => item.status),
    ])
    return {
        generatedAt: new Date(now()).toISOString(),
        expectedMainSha: expectedSha,
        deployWait: {
            attempts: waitResult.attempts,
            timedOut: waitResult.timedOut,
            waitSeconds,
            intervalSeconds,
        },
        status,
        repoPolicyChecks: configChecks,
        hosts,
    }
}

function parseArgs(argv) {
    const options = { waitSeconds: 1800, intervalSeconds: 30, json: false }
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index]
        if (arg === '--json') options.json = true
        else if (arg === '--help' || arg === '-h') options.help = true
        else if (arg === '--expected-sha') options.expectedSha = argv[++index]
        else if (arg === '--wait-seconds') options.waitSeconds = Number(argv[++index])
        else if (arg === '--interval-seconds') options.intervalSeconds = Number(argv[++index])
        else throw new Error(`Unknown argument: ${arg}`)
    }
    return options
}

function printHelp() {
    logger.log(
        'Usage: node scripts/production-parity.mjs --expected-sha <full-main-sha> [--json] [--wait-seconds 1800] [--interval-seconds 30]',
    )
    logger.log(
        'Read-only GET/HEAD checks against the three public production hosts; no credentials or cookies are sent.',
    )
}

async function main() {
    try {
        const options = parseArgs(process.argv.slice(2))
        if (options.help) return printHelp()
        const report = await runProbe(options)
        if (options.json) logger.log(JSON.stringify(report, null, 2))
        else {
            logger.log(`Production parity: ${report.status} against ${report.expectedMainSha}`)
            logger.log(
                `Deploy wait: ${report.deployWait.attempts} attempt(s), timedOut=${report.deployWait.timedOut}`,
            )
            for (const host of report.hosts) {
                const counts = host.checks.reduce(
                    (acc, item) => ((acc[item.status] = (acc[item.status] ?? 0) + 1), acc),
                    {},
                )
                logger.log(`${host.host}: ${host.status} ${JSON.stringify(counts)}`)
            }
        }
        process.exitCode = exitCodeFor(report.status)
    } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error))
        process.exitCode = 2
    }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) await main()
