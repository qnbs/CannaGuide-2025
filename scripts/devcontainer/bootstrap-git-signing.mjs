import {
    mkdirSync,
    readFileSync,
    writeFileSync,
    appendFileSync,
    accessSync,
    constants as FS,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const PREFIX = '[devcontainer:bootstrap-git]'
const SSH_DIR = path.join(os.homedir(), '.ssh')
const KEY_PATH = path.join(SSH_DIR, 'signing_key')
const PUB_PATH = `${KEY_PATH}.pub`
const ALLOWED_SIGNERS = path.join(SSH_DIR, 'allowed_signers')

const run = (cmd, args) =>
    spawnSync(cmd, args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
    })

const gitGet = (key) => {
    const result = run('git', ['config', '--get', key])
    return result.status === 0 ? result.stdout.trim() : ''
}

const gitSet = (key, value) => {
    const result = run('git', ['config', key, value])
    if (result.status !== 0) {
        throw new Error(result.stderr?.trim() || `failed to set ${key}`)
    }
}

/**
 * Neutralise Codespaces' default GIT_COMMITTER_NAME=GitHub / GIT_COMMITTER_EMAIL=noreply@github.com
 * environment variables which override git config user.name/user.email at commit time and cause
 * pre-commit identity checks to fail.
 */
const neutraliseCommitterOverrides = () => {
    const bashrc = path.join(os.homedir(), '.bashrc')
    const marker = '# bootstrap-git-signing: unset committer overrides'
    try {
        if (readFileSync(bashrc, 'utf8').includes(marker)) return
    } catch {
        // File doesn't exist yet — will be created by appendFileSync below
    }
    appendFileSync(
        bashrc,
        `\n${marker}\nunset GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL 2>/dev/null\n`,
    )
    // Also unset in current process so downstream postCreateCommand steps are clean
    delete process.env.GIT_COMMITTER_NAME
    delete process.env.GIT_COMMITTER_EMAIL
}

/**
 * Generate an ED25519 SSH signing key if none exists.
 */
const ensureSigningKey = (email) => {
    const hasPrivateKey = (() => {
        try {
            accessSync(KEY_PATH, FS.F_OK)
            return true
        } catch {
            return false
        }
    })()

    const hasPublicKey = (() => {
        try {
            accessSync(PUB_PATH, FS.F_OK)
            return true
        } catch {
            return false
        }
    })()

    if (hasPrivateKey && hasPublicKey) {
        console.log(`${PREFIX} existing signing key found at ${KEY_PATH}`)
        return
    }

    if (hasPrivateKey || hasPublicKey) {
        throw new Error(
            `signing key files are inconsistent (private: ${hasPrivateKey}, public: ${hasPublicKey}). ` +
                `Remove stale key files before rerunning bootstrap: rm -f ${KEY_PATH} ${PUB_PATH}`,
        )
    }

    mkdirSync(SSH_DIR, { mode: 0o700, recursive: true })

    const result = run('ssh-keygen', ['-t', 'ed25519', '-C', email, '-f', KEY_PATH, '-N', ''])
    if (result.status !== 0) {
        throw new Error(`ssh-keygen failed: ${result.stderr?.trim()}`)
    }
    console.log(`${PREFIX} generated new ED25519 signing key at ${KEY_PATH}`)
}

/**
 * Create the allowed_signers file so `git log --show-signature` can verify locally.
 */
const ensureAllowedSigners = (email) => {
    const pubKey = readFileSync(PUB_PATH, 'utf8').trim()
    const entry = `${email} ${pubKey}`

    try {
        const existing = readFileSync(ALLOWED_SIGNERS, 'utf8')
        if (existing.includes(pubKey)) return
    } catch {
        // File doesn't exist yet — will be created below
    }

    writeFileSync(ALLOWED_SIGNERS, `${entry}\n`, { mode: 0o644 })
    console.log(`${PREFIX} wrote ${ALLOWED_SIGNERS}`)
}

/**
 * Try to register the signing key on GitHub via `gh ssh-key add`.
 * Requires admin:ssh_signing_key scope — fails gracefully if scope is missing.
 */
const tryRegisterKeyOnGitHub = () => {
    const ghPath = run('which', ['gh'])
    if (ghPath.status !== 0) {
        console.log(`${PREFIX} gh CLI not found — skip key registration`)
        return
    }

    // Check if any key on GitHub already matches our public key
    const pubKey = readFileSync(PUB_PATH, 'utf8').trim().split(' ').slice(0, 2).join(' ')
    const existing = run('gh', ['api', 'user/ssh_signing_keys', '--jq', '.[].key'])
    if (existing.status === 0 && existing.stdout.includes(pubKey)) {
        console.log(`${PREFIX} signing key already registered on GitHub`)
        return
    }

    const hostname = os.hostname()
    const title = `codespaces-${hostname}`
    const result = run('gh', ['ssh-key', 'add', PUB_PATH, '--type', 'signing', '--title', title])
    if (result.status === 0) {
        console.log(`${PREFIX} registered signing key on GitHub as "${title}"`)
    } else {
        console.log(
            `${PREFIX} could not auto-register key on GitHub (scope issue?). Register manually:\n` +
                `  gh ssh-key add ${PUB_PATH} --type signing --title "${title}"`,
        )
    }
}

try {
    neutraliseCommitterOverrides()

    const email = gitGet('user.email')
    if (!email) {
        console.log(`${PREFIX} user.email not set — signing bootstrap skipped`)
        process.exit(0)
    }

    ensureSigningKey(email)
    ensureAllowedSigners(email)

    // Configure git for SSH signing
    gitSet('commit.gpgsign', 'true')
    gitSet('gpg.format', 'ssh')
    gitSet('user.signingkey', KEY_PATH)
    gitSet('gpg.ssh.allowedSignersFile', ALLOWED_SIGNERS)

    tryRegisterKeyOnGitHub()

    console.log(`${PREFIX} complete ✓`)
} catch (error) {
    console.error(`${PREFIX} failed:`, error instanceof Error ? error.message : String(error))
    process.exit(1)
}
