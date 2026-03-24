import { readFileSync, appendFileSync, accessSync, constants as FS } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const PREFIX = '[devcontainer:bootstrap-git]'

const run = (cmd, args) =>
    spawnSync(cmd, args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
    })

const gitSet = (key, value) => {
    const result = run('git', ['config', key, value])
    if (result.status !== 0) {
        throw new Error(result.stderr?.trim() || `failed to set ${key}`)
    }
}

const gitUnset = (key) => {
    run('git', ['config', '--local', '--unset', key])
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
    delete process.env.GIT_COMMITTER_NAME
    delete process.env.GIT_COMMITTER_EMAIL
}

/**
 * Detect GitHub Codespaces environment.
 * In Codespaces, /etc/gitconfig provides gpg.program=/.codespaces/bin/gh-gpgsign
 * which signs commits with GitHub's web-flow GPG key → always "Verified" on GitHub.
 * SSH signing generates ephemeral keys that become unverified across sessions.
 */
const isCodespaces = () => {
    if (process.env.CODESPACES === 'true') return true
    try {
        accessSync('/.codespaces/bin/gh-gpgsign', FS.F_OK)
        return true
    } catch {
        return false
    }
}

/**
 * Remove any local SSH signing config that would override Codespaces' GPG signing.
 */
const cleanSshSigningOverrides = () => {
    gitUnset('gpg.format')
    gitUnset('user.signingkey')
    gitUnset('gpg.ssh.allowedSignersFile')
    console.log(`${PREFIX} cleaned SSH signing overrides (using Codespaces GPG signing)`)
}

try {
    neutraliseCommitterOverrides()

    if (isCodespaces()) {
        // In Codespaces: use the built-in gh-gpgsign from /etc/gitconfig.
        // Only ensure commit.gpgsign is on and remove any SSH overrides from previous sessions.
        cleanSshSigningOverrides()
        gitSet('commit.gpgsign', 'true')
        console.log(`${PREFIX} Codespaces detected -- using native gh-gpgsign`)
    } else {
        // Outside Codespaces: just enable signing (user must configure GPG/SSH themselves)
        gitSet('commit.gpgsign', 'true')
        console.log(`${PREFIX} non-Codespaces environment -- commit signing enabled`)
    }
} catch (error) {
    console.error(`${PREFIX} failed:`, error instanceof Error ? error.message : String(error))
    process.exit(1)
}
