#!/usr/bin/env node
/**
 * Fail closed on a desktop updater config that would weaken the 2.12+
 * signature/version checks (SNYK-JS-TAURIAPPSPLUGINUPDATER-20081664).
 *
 * This does not reimplement the plugin. It proves the repo stays on the
 * patched line and does not opt into insecure transport or an empty pubkey.
 *
 * Run: node scripts/security/check-updater-policy.mjs
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const MIN = [2, 12, 0]
const PKG = resolve('apps/desktop/package.json')
const CARGO = resolve('apps/desktop/src-tauri/Cargo.toml')
const CONF = resolve('apps/desktop/src-tauri/tauri.conf.json')

function fail(message) {
    console.error(`[FAIL] ${message}`)
    process.exitCode = 1
}

function parseSemver(text) {
    const match = String(text).match(/(\d+)\.(\d+)\.(\d+)/)
    if (!match) return null
    return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function atLeast(version, floor) {
    for (let i = 0; i < 3; i++) {
        if (version[i] > floor[i]) return true
        if (version[i] < floor[i]) return false
    }
    return true
}

const pkg = JSON.parse(readFileSync(PKG, 'utf8'))
const declared = pkg.dependencies?.['@tauri-apps/plugin-updater'] ?? ''
const declaredVersion = parseSemver(declared)
if (!declaredVersion || !atLeast(declaredVersion, MIN)) {
    fail(`@tauri-apps/plugin-updater must declare >=2.12.0 (found "${declared}")`)
}

const cargo = readFileSync(CARGO, 'utf8')
const cargoMatch = cargo.match(/tauri-plugin-updater\s*=\s*"([^"]+)"/)
const cargoVersion = parseSemver(cargoMatch?.[1] ?? '')
if (!cargoVersion || !atLeast(cargoVersion, MIN)) {
    fail(`Cargo.toml tauri-plugin-updater must be >=2.12.0 (found "${cargoMatch?.[1] ?? ''}")`)
}

const conf = JSON.parse(readFileSync(CONF, 'utf8'))
const updater = conf.plugins?.updater
if (!updater || typeof updater !== 'object') {
    fail('tauri.conf.json plugins.updater is missing')
} else {
    const pubkey = typeof updater.pubkey === 'string' ? updater.pubkey.trim() : ''
    if (pubkey.length < 32) fail('updater pubkey is missing or too short')
    const endpoints = Array.isArray(updater.endpoints) ? updater.endpoints : []
    if (endpoints.length === 0) fail('updater endpoints are empty')
    for (const endpoint of endpoints) {
        let url
        try {
            url = new URL(endpoint)
        } catch {
            fail(`updater endpoint is not a URL: ${endpoint}`)
            continue
        }
        if (url.protocol !== 'https:') fail(`updater endpoint is not https: ${endpoint}`)
    }
    if (updater.dangerousInsecureTransportProtocol === true) {
        fail('dangerousInsecureTransportProtocol must not be enabled')
    }
}

if (process.exitCode) process.exit(process.exitCode)
console.log('[OK] Desktop updater is on the patched line with https endpoints and a pubkey.')
