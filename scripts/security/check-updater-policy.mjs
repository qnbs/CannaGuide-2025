#!/usr/bin/env node
/**
 * Fail closed on a desktop updater config that would weaken the 2.12+
 * signature/version checks (SNYK-JS-TAURIAPPSPLUGINUPDATER-20081664).
 *
 * This does not reimplement the plugin. It proves the repo stays on the
 * patched line and does not opt into insecure transport or an empty pubkey.
 * The JS package and the Cargo crate must declare the same version. A
 * comment that mentions a newer version cannot satisfy the Cargo check.
 *
 * Run: node scripts/security/check-updater-policy.mjs
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const MIN = [2, 12, 0]
const PKG = resolve('apps/desktop/package.json')
const CARGO = resolve('apps/desktop/src-tauri/Cargo.toml')
const CONF = resolve('apps/desktop/src-tauri/tauri.conf.json')

export function parseSemver(text) {
    const match = String(text).match(/(\d+)\.(\d+)\.(\d+)/)
    if (!match) return null
    return [Number(match[1]), Number(match[2]), Number(match[3])]
}

export function atLeast(version, floor) {
    for (let i = 0; i < 3; i++) {
        if (version[i] > floor[i]) return true
        if (version[i] < floor[i]) return false
    }
    return true
}

export function sameVersion(left, right) {
    return left.length === right.length && left.every((part, index) => part === right[index])
}

function stripHashComment(line) {
    let inString = false
    for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"' && line[i - 1] !== '\\') inString = !inString
        else if (ch === '#' && !inString) return line.slice(0, i).trim()
    }
    return line.trim()
}

/**
 * Read one crate version from the active `[dependencies]` table.
 * Full-line comments and inline `#` comments are ignored, so a comment that
 * quotes a patched version cannot hide an older assignment below it.
 */
export function readCargoDependency(toml, name) {
    let inDeps = false
    const simple = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*"([^"]+)"`)
    const table = new RegExp(
        `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*\\{([^}]*)\\}`,
    )
    for (const line of toml.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.startsWith('[')) {
            inDeps = trimmed === '[dependencies]'
            continue
        }
        if (!inDeps || trimmed === '' || trimmed.startsWith('#')) continue
        const code = stripHashComment(trimmed)
        const direct = code.match(simple)
        if (direct) return direct[1]
        const inline = code.match(table)
        if (inline) {
            const version = inline[1].match(/version\s*=\s*"([^"]+)"/)
            if (version) return version[1]
        }
    }
    return null
}

export function updaterPolicyProblems({ declared, cargoToml, conf }) {
    const problems = []
    const declaredVersion = parseSemver(declared)
    if (!declaredVersion || !atLeast(declaredVersion, MIN)) {
        problems.push(`@tauri-apps/plugin-updater must declare >=2.12.0 (found "${declared}")`)
    }

    const cargoDeclared = readCargoDependency(cargoToml, 'tauri-plugin-updater')
    const cargoVersion = parseSemver(cargoDeclared ?? '')
    if (!cargoVersion || !atLeast(cargoVersion, MIN)) {
        problems.push(
            `Cargo.toml tauri-plugin-updater must be >=2.12.0 (found "${cargoDeclared ?? ''}")`,
        )
    }

    if (declaredVersion && cargoVersion && !sameVersion(declaredVersion, cargoVersion)) {
        problems.push(
            `@tauri-apps/plugin-updater ${declaredVersion.join('.')} and Cargo tauri-plugin-updater ${cargoVersion.join('.')} must declare the same version`,
        )
    }

    const updater = conf?.plugins?.updater
    if (!updater || typeof updater !== 'object') {
        problems.push('tauri.conf.json plugins.updater is missing')
        return problems
    }
    const pubkey = typeof updater.pubkey === 'string' ? updater.pubkey.trim() : ''
    if (pubkey.length < 32) problems.push('updater pubkey is missing or too short')
    const endpoints = Array.isArray(updater.endpoints) ? updater.endpoints : []
    if (endpoints.length === 0) problems.push('updater endpoints are empty')
    for (const endpoint of endpoints) {
        let url
        try {
            url = new URL(endpoint)
        } catch {
            problems.push(`updater endpoint is not a URL: ${endpoint}`)
            continue
        }
        if (url.protocol !== 'https:') problems.push(`updater endpoint is not https: ${endpoint}`)
    }
    if (updater.dangerousInsecureTransportProtocol === true) {
        problems.push('dangerousInsecureTransportProtocol must not be enabled')
    }
    return problems
}

function main() {
    const pkg = JSON.parse(readFileSync(PKG, 'utf8'))
    const declared = pkg.dependencies?.['@tauri-apps/plugin-updater'] ?? ''
    const cargoToml = readFileSync(CARGO, 'utf8')
    const conf = JSON.parse(readFileSync(CONF, 'utf8'))
    const problems = updaterPolicyProblems({ declared, cargoToml, conf })
    if (problems.length > 0) {
        for (const problem of problems) console.error(`[FAIL] ${problem}`)
        process.exit(1)
    }
    console.log('[OK] Desktop updater is on the patched line with https endpoints and a pubkey.')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
