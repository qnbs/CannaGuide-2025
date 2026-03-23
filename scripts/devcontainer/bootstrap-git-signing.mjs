import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const run = (args) =>
    spawnSync('git', args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
    })

const get = (key) => {
    const result = run(['config', '--get', key])
    return result.status === 0 ? result.stdout.trim() : ''
}

const set = (key, value) => {
    const result = run(['config', key, value])
    if (result.status !== 0) {
        const message = result.stderr?.trim() || `failed to set ${key}`
        throw new Error(message)
    }
}

const signingKeyCandidates = [
    path.join(os.homedir(), '.ssh/id_ed25519_github_signing_v3.pub'),
    path.join(os.homedir(), '.ssh/id_ed25519_github_signing_v2.pub'),
    path.join(os.homedir(), '.ssh/id_ed25519_github_signing.pub'),
]

const selectedSigningKey = signingKeyCandidates.find((candidate) => existsSync(candidate))

try {
    // Ensure signing defaults are consistently set inside dev containers.
    set('commit.gpgsign', 'true')
    set('gpg.format', 'ssh')

    if (selectedSigningKey) {
        set('user.signingkey', selectedSigningKey)
    }

    const userName = get('user.name')
    const userEmail = get('user.email')

    if (!userName || !userEmail) {
        console.log(
            '[devcontainer:bootstrap-git] user.name/user.email missing. Configure with: git config user.name "<name>" && git config user.email "<email>"',
        )
    }

    if (!selectedSigningKey) {
        console.log(
            '[devcontainer:bootstrap-git] no SSH signing key found in ~/.ssh (expected id_ed25519_github_signing*.pub).',
        )
    }

    if (process.env.GIT_AUTHOR_NAME || process.env.GIT_AUTHOR_EMAIL) {
        console.log(
            '[devcontainer:bootstrap-git] detected GIT_AUTHOR_* environment override; unset it if commits show unexpected author.',
        )
    }

    if (process.env.GIT_COMMITTER_NAME || process.env.GIT_COMMITTER_EMAIL) {
        console.log(
            '[devcontainer:bootstrap-git] detected GIT_COMMITTER_* environment override; unset it if commits show unexpected committer.',
        )
    }

    console.log('[devcontainer:bootstrap-git] complete')
} catch (error) {
    console.error(
        '[devcontainer:bootstrap-git] failed:',
        error instanceof Error ? error.message : String(error),
    )
    process.exit(1)
}
