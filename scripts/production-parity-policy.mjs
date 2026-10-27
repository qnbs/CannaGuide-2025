import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const SECURITY_HEADERS = [
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy',
    'cross-origin-opener-policy',
    'cross-origin-embedder-policy',
    'strict-transport-security',
    'x-dns-prefetch-control',
]

const EXPECTED_PATH_STATUS = {
    root: { all: [200] },
    version: { all: [200] },
    manifest: { all: [200] },
    serviceWorker: { all: [200] },
    robots: { all: [200] },
    sitemap: { vercel: [200], cloudflare: [200], 'github-pages': [404] },
    manifestWebmanifest: { vercel: [200], cloudflare: [200], 'github-pages': [404] },
    deepRoute: { vercel: [200], cloudflare: [200], 'github-pages': [404] },
    missingScript: { vercel: [200], cloudflare: [200], 'github-pages': [404] },
    indexHtml: { all: [200], cloudflare: [308] },
    favicon: { all: [200] },
}

export function check(id, status, expected, actual, details = {}) {
    return { id, status, expected, actual, ...details }
}

// Only these states count as parity. Anything else -- EXPECTED_SKEW, INVALID or a
// status this module does not know -- is unproven, so it can never aggregate to MATCH.
export const PASS_STATUSES = new Set(['MATCH', 'EXACT_MAIN', 'INTENTIONAL_PLATFORM_DIFFERENCE'])

export function aggregateStatus(statuses) {
    if (statuses.includes('DRIFT')) return 'DRIFT'
    return statuses.every((status) => PASS_STATUSES.has(status)) ? 'MATCH' : 'UNKNOWN'
}

export function exitCodeFor(status) {
    if (status === 'MATCH') return 0
    return status === 'DRIFT' ? 1 : 2
}

export function normalizeHeader(value) {
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/;\s*$/, '')
        .toLowerCase()
}

export function compareHeaders(actual, expected) {
    const result = {}
    for (const [name, value] of Object.entries(expected)) {
        const got = actual[name.toLowerCase()] ?? null
        result[name.toLowerCase()] = {
            status: normalizeHeader(got) === normalizeHeader(value) ? 'MATCH' : 'DRIFT',
            expected: value,
            actual: got,
        }
    }
    return result
}

const FULL_SHA = /^[0-9a-f]{40}$/i

export function classifySha(commit, expectedSha, timedOut = false) {
    if (!FULL_SHA.test(expectedSha ?? '') || !FULL_SHA.test(commit ?? '')) return 'INVALID'
    if (commit.toLowerCase() === expectedSha.toLowerCase()) return 'EXACT_MAIN'
    return timedOut ? 'DRIFT' : 'EXPECTED_SKEW'
}

function parseVercelRules(config) {
    return (config.headers ?? []).map((rule) => ({
        source: rule.source,
        headers: Object.fromEntries(
            (rule.headers ?? []).map(({ key, value }) => [key.toLowerCase(), value]),
        ),
    }))
}

function parseCloudflareRules(text) {
    const rules = []
    let current = null
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue
        if (line.startsWith('/')) {
            current = { source: line, headers: {} }
            rules.push(current)
            continue
        }
        const match = line.match(/^([^:]+):\s*(.*)$/)
        if (current && match) current.headers[match[1].trim().toLowerCase()] = match[2].trim()
    }
    return rules
}

function ruleMatches(source, pathname) {
    if (source === '/(.*)' || source === '/*') return true
    if (source.endsWith('/(.*)')) return pathname.startsWith(source.slice(0, -4))
    if (source.endsWith('/*')) return pathname.startsWith(source.slice(0, -1))
    return source === pathname
}

function headersFor(rules, pathname) {
    return Object.assign(
        {},
        ...rules.filter((rule) => ruleMatches(rule.source, pathname)).map((rule) => rule.headers),
    )
}

export function readPolicies(repoRoot) {
    const vercel = JSON.parse(readFileSync(resolve(repoRoot, 'vercel.json'), 'utf8'))
    const cloudflare = readFileSync(resolve(repoRoot, 'apps/web/public/_headers'), 'utf8')
    const vercelRules = parseVercelRules(vercel)
    const cloudflareRules = parseCloudflareRules(cloudflare)
    const vercelSecurity = headersFor(vercelRules, '/')
    const cloudflareSecurity = headersFor(cloudflareRules, '/')
    const csp = vercelSecurity['content-security-policy']
    return { vercelRules, cloudflareRules, vercelSecurity, cloudflareSecurity, csp }
}

export function expectedStatuses(host, key) {
    const rule = EXPECTED_PATH_STATUS[key]
    return rule[host.platform] ?? rule.all
}

function parseAttributes(tag) {
    const attributes = {}
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
        attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? ''
    }
    return attributes
}

export function parseRootAssets(html) {
    const tags = [...html.matchAll(/<(?:script|link)\b[^>]*>/gi)].map(([tag]) => tag)
    let entry = null
    let manifest = null
    let stylesheetCount = 0
    let modulepreloadCount = 0
    for (const tag of tags) {
        const attributes = parseAttributes(tag)
        if (
            tag.toLowerCase().startsWith('<script') &&
            attributes.type === 'module' &&
            attributes.src &&
            !entry
        ) {
            entry = attributes.src
        }
        if (tag.toLowerCase().startsWith('<link') && attributes.rel === 'manifest')
            manifest = attributes.href ?? null
        if (tag.toLowerCase().startsWith('<link') && attributes.rel === 'stylesheet')
            stylesheetCount++
        if (tag.toLowerCase().startsWith('<link') && attributes.rel === 'modulepreload')
            modulepreloadCount++
    }
    return { entry, manifest, stylesheetCount, modulepreloadCount }
}

export function getMetaCsp(html) {
    for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
        const attributes = parseAttributes(tag)
        if (attributes['http-equiv']?.toLowerCase() === 'content-security-policy')
            return attributes.content ?? null
    }
    return null
}

export function comparableCsp(value) {
    return normalizeHeader(value)
        .replace(/;?\s*frame-ancestors\s+[^;]+/i, '')
        .replace(/;\s*$/, '')
}

export function platformCacheExpectation(host, pathKind, policies) {
    // Generated version.json has no explicit route rule; use each platform's document default.
    if (host.platform === 'github-pages') return 'max-age=600'
    const pathForRule = {
        root: '/index.html',
        version: '/version.json',
        manifest: '/manifest.json',
        serviceWorker: '/sw.js',
        asset: '/assets/entry.js',
    }[pathKind]
    const rules = host.platform === 'vercel' ? policies.vercelRules : policies.cloudflareRules
    const configured = headersFor(rules, pathForRule)['cache-control']
    if (configured) return configured
    if (pathKind === 'version') return 'public, max-age=0, must-revalidate'
    if (pathKind === 'root') return 'public, max-age=0, must-revalidate'
    return null
}

export function cacheCheck(host, key, response, policies) {
    const expected = platformCacheExpectation(host, key, policies)
    const actual = response.headers['cache-control'] ?? null
    // No response means no headers to compare: unproven, not drift.
    if (response.status === null) {
        return check(
            `cache.${key}`,
            'UNKNOWN',
            expected ?? 'configured cache policy',
            response.error,
        )
    }
    if (!expected) return check(`cache.${key}`, 'UNKNOWN', 'configured cache policy', actual)
    return check(
        `cache.${key}`,
        normalizeHeader(actual) === normalizeHeader(expected) ? 'MATCH' : 'DRIFT',
        expected,
        actual,
        { url: response.url },
    )
}
