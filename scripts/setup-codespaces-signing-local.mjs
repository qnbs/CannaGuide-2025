#!/usr/bin/env node
/**
 * Lokale SSH-Commit-Signierung auf den GitHub Signing-Key abstimmen,
 * dessen Öffentlicher Fingerprint unter GitHub → SSH keys → Signing angezeigt wird.
 *
 * Erwartete Dateien nach Export aus Codespaces (oder Secret):
 *   ~/.ssh/codespaces-cannaguide-2025      (chmod 600)
 *   ~/.ssh/codespaces-cannaguide-2025.pub  (optional – wird aus Private regeneriert wenn fehlt)
 *
 * Bekannter Fingerabdruck (GitHub UI, März 2026):
 *   SHA256:8JfPA5/5U60dfyjsB8xILjskz3UMSHY9jewkm0ad71c
 */
import os from 'node:os'
import path from 'node:path'
import { accessSync, readFileSync, writeFileSync, chmodSync, constants as FS } from 'node:fs'
import { spawnSync } from 'node:child_process'

const PREFIX = '[setup-codespaces-signing]'

/** @type {`${string}:${string}`} */
const EXPECTED_SHA256_BODY = '8JfPA5/5U60dfyjsB8xILjskz3UMSHY9jewkm0ad71c'

const KEY_BASE = path.join(os.homedir(), '.ssh', 'codespaces-cannaguide-2025')
const ALLOWED = path.join(os.homedir(), '.ssh', 'git_allowed_signers')

const run = (cmd, args, opts = {}) =>
    spawnSync(cmd, args, { encoding: 'utf8', shell: false, ...opts })

const fingerprintFromPubContent = (pubContent) => {
    const fp = run('ssh-keygen', ['-lf', '-', '-E', 'sha256'], { input: pubContent.trim() + '\n' })
    if (fp.status !== 0 || !fp.stdout) return null
    const line = fp.stdout.trim().split('\n')[0] ?? ''
    const m = line.match(/SHA256:([+/A-Za-z0-9]+)/)
    return m?.[1] ? `SHA256:${m[1]}` : null
}

const fingerprintFromPubPath = (pubPath) => {
    try {
        const fp = run('ssh-keygen', ['-lf', pubPath, '-E', 'sha256'])
        if (fp.status !== 0 || !fp.stdout) return null
        const line = fp.stdout.trim().split('\n')[0] ?? ''
        const m = line.match(/SHA256:([+/A-Za-z0-9]+)/)
        return m?.[1] ? `SHA256:${m[1]}` : null
    } catch {
        return null
    }
}

const gitEmail = () => run('git', ['config', '--global', 'user.email']).stdout?.trim()

const ensurePubFromPrivate = (privPath, pubPath) => {
    const gen = run('ssh-keygen', ['-y', '-f', privPath])
    if (gen.status !== 0 || !gen.stdout?.trim()) {
        console.error(`${PREFIX} konnte .pub nicht aus Private Key erzeugen.`)
        process.exit(1)
    }
    writeFileSync(pubPath, `${gen.stdout.trim()}\n`, { mode: 0o644 })
}

const normalizeFp = (s) => String(s ?? '').trim().replace(/^SHA256:/i, '').toLowerCase()

const gitGlobal = (key, value) => {
    const res = run('git', ['config', '--global', key, value])
    if (res.status !== 0) {
        console.error(res.stderr?.trim() || `${PREFIX} git config failed: ${key}`)
        process.exit(1)
    }
}

const verifyOnly = process.argv.includes('--verify-only')

try {
    accessSync(KEY_BASE, FS.F_OK)
} catch {
    console.error(`${PREFIX} Private Key nicht gefunden: ${KEY_BASE}`)
    console.error(
        `${PREFIX} Export aus Codespaces (oder Secret): Datei dort speichern, chmod 600, dann Skript erneut ausführen.`,
    )
    console.error(
        `${PREFIX} Erwarteter GitHub-Fingerprint (Signing „codespaces-cannaguide-2025“): SHA256:${EXPECTED_SHA256_BODY}`,
    )
    process.exit(1)
}

chmodSync(KEY_BASE, 0o600)
const pubPath = `${KEY_BASE}.pub`
try {
    accessSync(pubPath, FS.R_OK)
} catch {
    ensurePubFromPrivate(KEY_BASE, pubPath)
}

let fpDisplay = fingerprintFromPubPath(pubPath)
if (!fpDisplay) {
    const pubBody = readFileSync(pubPath, 'utf8')
    fpDisplay = fingerprintFromPubContent(pubBody)
}
if (!fpDisplay) {
    console.error(`${PREFIX} Fingerabdruck konnte nicht ermittelt werden.`)
    process.exit(1)
}

if (normalizeFp(fpDisplay) !== normalizeFp(`SHA256:${EXPECTED_SHA256_BODY}`)) {
    console.error(`${PREFIX} Fingerabdruck passt NICHT zur GitHub-Signatur „codespaces-cannaguide-2025“.`)
    console.error(`${PREFIX}   lokal (pub): ${fpDisplay}`)
    console.error(`${PREFIX}   GitHub-Ziel: SHA256:${EXPECTED_SHA256_BODY}`)
    console.error(
        `${PREFIX} Falsche oder alte Private-Datei – bitte korrektes Key-Material vom Codespace kopieren.`,
    )
    process.exit(1)
}

const email =
    gitEmail() || `${process.env.GITHUB_USER_EMAIL || ''}`.trim() || '155236708+qnbs@users.noreply.github.com'
const pubLine = readFileSync(pubPath, 'utf8').trim()
writeFileSync(`${ALLOWED}_codespaces`, `${email} namespaces=\"git\" ${pubLine}\n`, { mode: 0o644 })

if (verifyOnly) {
    console.log(`${PREFIX} OK – Fingerabdruck verifiziert: ${fpDisplay}`)
    process.exit(0)
}

gitGlobal('gpg.format', 'ssh')
gitGlobal('user.signingkey', pubPath)
gitGlobal('gpg.ssh.allowedSignersFile', `${ALLOWED}_codespaces`)
gitGlobal('commit.gpgsign', 'true')
gitGlobal('tag.gpgsign', 'true')

console.log(`${PREFIX} Git signiert nun mit:`)
console.log(`${PREFIX}   user.signingkey = ${pubPath}`)
console.log(`${PREFIX}   Fingerprint ${fpDisplay} (verified vs GitHub-Eintrag)`)
console.log(`${PREFIX} Führe im Repo aus: node ./scripts/check-commit-identity.mjs`)
