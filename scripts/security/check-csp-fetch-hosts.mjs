#!/usr/bin/env node
/**
 * Fetch hosts in the PWA must be in production connect-src, or named on the
 * gated-host list while the matching constants stay `true`.
 *
 * A third-party CORS proxy must not appear in app source at all.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const APP = join(ROOT, 'apps', 'web')

/** Hosts that stay in source but must not be requested while their flags are true. */
export const GATED_FETCH_HOSTS = [
    ['api.github.com', ['CLOUD_SYNC_DISABLED', 'COMMUNITY_SHARE_DISABLED']],
    ['api.otreeba.com', ['EXTERNAL_STRAIN_LOOKUPS_DISABLED']],
    ['otreeba.com', ['EXTERNAL_STRAIN_LOOKUPS_DISABLED']],
    ['cannlytics.com', ['EXTERNAL_STRAIN_LOOKUPS_DISABLED']],
    ['the-cannabis-api.vercel.app', ['EXTERNAL_STRAIN_LOOKUPS_DISABLED']],
    ['api.cannabis.wiki', ['EXTERNAL_STRAIN_LOOKUPS_DISABLED']],
    ['the-strain-api.p.rapidapi.com', ['EXTERNAL_STRAIN_LOOKUPS_DISABLED']],
    ['cannseek.scu.edu.au', ['EXTERNAL_STRAIN_LOOKUPS_DISABLED']],
    ['api.openthc.org', ['EXTERNAL_STRAIN_LOOKUPS_DISABLED']],
    ['cansativagw.azure-api.net', ['CANSATIVA_LOOKUP_DISABLED']],
]

const PROXY_MARKERS = ['allorigins.win', 'corsproxy.io']

export function stripComments(source) {
    let out = ''
    let i = 0
    const n = source.length
    while (i < n) {
        const c = source[i]
        const next = source[i + 1]
        if (c === '/' && next === '/') {
            i += 2
            while (i < n && source[i] !== '\n') i += 1
            continue
        }
        if (c === '/' && next === '*') {
            i += 2
            while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i += 1
            i = Math.min(n, i + 2)
            continue
        }
        if (c === "'" || c === '"') {
            const q = c
            out += c
            i += 1
            while (i < n) {
                out += source[i]
                if (source[i] === '\\') {
                    i += 1
                    if (i < n) out += source[i]
                    i += 1
                    continue
                }
                if (source[i] === q) {
                    i += 1
                    break
                }
                i += 1
            }
            continue
        }
        if (c === '`') {
            out += c
            i += 1
            while (i < n) {
                out += source[i]
                if (source[i] === '\\') {
                    i += 1
                    if (i < n) {
                        out += source[i]
                        i += 1
                    }
                    continue
                }
                if (source[i] === '`') {
                    i += 1
                    break
                }
                i += 1
            }
            continue
        }
        out += c
        i += 1
    }
    return out
}

export function connectSrcHosts(securityHeadersSource) {
    const match = securityHeadersSource.match(/connect-src[^"]+/)
    const hosts = new Set()
    if (!match) return hosts
    for (const token of match[0].split(/\s+/)) {
        const host = token.match(/^https:\/\/([A-Za-z0-9.-]+)/)
        if (host?.[1]) hosts.add(host[1].toLowerCase())
    }
    return hosts
}

export function flagEnabled(constantsSource, name) {
    return new RegExp(`export const ${name} = true\\b`).test(constantsSource)
}

export function fetchTargetHosts(source) {
    const code = stripComments(source)
    if (!/\bfetch\s*\(/.test(code)) return []
    const hosts = new Set()
    const re = /(['"`])https:\/\/([A-Za-z0-9.-]+)/g
    let match
    while ((match = re.exec(code))) {
        if (match[2]) hosts.add(match[2].toLowerCase())
    }
    return [...hosts]
}

function gatedFlags(host) {
    const row = GATED_FETCH_HOSTS.find(([name]) => name === host)
    return row ? row[1] : null
}

/**
 * @param {string} source
 * @param {Set<string>} allowed
 * @param {string} constantsSource
 * @param {string} label
 */
export function violationsInSource(source, allowed, constantsSource, label) {
    const violations = []
    for (const host of fetchTargetHosts(source)) {
        if (allowed.has(host)) continue
        const flags = gatedFlags(host)
        if (!flags) {
            violations.push(`${label}: fetch host ${host} is not in connect-src or the gated list`)
            continue
        }
        for (const flag of flags) {
            if (!flagEnabled(constantsSource, flag)) {
                violations.push(`${label}: fetch host ${host} requires ${flag} = true`)
            }
        }
    }
    return violations
}

function isSkippedFile(name) {
    return (
        name.endsWith('.test.ts') ||
        name.endsWith('.test.tsx') ||
        name.endsWith('.spec.ts') ||
        name.endsWith('.spec.tsx') ||
        name.endsWith('.e2e.ts') ||
        name.endsWith('.d.ts')
    )
}

function walkApp(dir, files) {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name)
        const info = statSync(path)
        if (info.isDirectory()) {
            if (name === 'node_modules' || name === 'dist' || name === 'locales') continue
            walkApp(path, files)
            continue
        }
        if (!/\.(ts|tsx)$/.test(name) || isSkippedFile(name)) continue
        files.push(path)
    }
}

function walkProxy(dir, hits) {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name)
        const info = statSync(path)
        if (info.isDirectory()) {
            if (name === 'node_modules' || name === 'dist') continue
            walkProxy(path, hits)
            continue
        }
        if (!/\.(ts|tsx|js|mjs|html|json)$/.test(name) || isSkippedFile(name)) continue
        const text = readFileSync(path, 'utf8')
        for (const marker of PROXY_MARKERS) {
            if (text.includes(marker)) {
                hits.push(`${relative(ROOT, path)}: contains ${marker}`)
            }
        }
    }
}

export function violationsInTree(root = ROOT) {
    const app = join(root, 'apps', 'web')
    const allowed = connectSrcHosts(readFileSync(join(app, 'securityHeaders.ts'), 'utf8'))
    const constantsSource = readFileSync(join(app, 'constants.ts'), 'utf8')
    const files = []
    walkApp(app, files)
    const violations = []
    for (const file of files) {
        const source = readFileSync(file, 'utf8')
        violations.push(
            ...violationsInSource(source, allowed, constantsSource, relative(root, file)),
        )
    }
    walkProxy(app, violations)
    return violations
}

function main() {
    const violations = violationsInTree(ROOT)
    if (violations.length > 0) {
        for (const line of violations) console.error(`[FAIL] ${line}`)
        process.exit(1)
    }
    console.log('[OK] CSP fetch hosts are allowlisted or gated')
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
    main()
}
