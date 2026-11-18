/**
 * The only place the desktop smoke scripts may delete app data.
 *
 * Windows app folders (%APPDATA%, %LOCALAPPDATA%) cannot be redirected to a temporary
 * profile, so the CI smoke resets them between installs and concurrent rounds. On a
 * person's machine those folders hold their real grow data. Deletion is therefore
 * allowed only on a verified disposable runner, only for the app's own folder directly
 * under its base, and never through a symbolic link or junction.
 */
import { existsSync, lstatSync, realpathSync, rmSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'

export const APP_ID = 'com.cannaguide.desktop'

/**
 * A GitHub-hosted runner: a fresh virtual machine per job that nobody keeps data on.
 * `CI` alone is not enough -- any shell can set it, and self-hosted runners set it too.
 */
export function isDisposableRunner(env = process.env) {
    return env.GITHUB_ACTIONS === 'true' && env.RUNNER_ENVIRONMENT === 'github-hosted'
}

const sameFolder = (left, right, platform) =>
    platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right

/**
 * Removes `<base>/<APP_ID>` if, and only if, every check passes. Returns
 * `{ removed, reason }`; nothing is deleted unless `removed` is true.
 */
export function removeAppFolder(base, { env = process.env, platform = process.platform } = {}) {
    if (!isDisposableRunner(env)) return { removed: false, reason: 'not a disposable runner' }
    if (!base || !isAbsolute(base))
        return { removed: false, reason: 'base folder is not an absolute path' }
    if (!existsSync(base)) return { removed: false, reason: 'base folder does not exist' }
    const canonicalBase = realpathSync(base)
    if (!sameFolder(canonicalBase, resolve(base), platform)) {
        return { removed: false, reason: 'base folder is reached through a link' }
    }
    const target = join(canonicalBase, APP_ID)
    if (!existsSync(target)) return { removed: true, reason: 'nothing to remove' }
    // lstat: a symbolic link or a junction is never followed into what it points at.
    if (lstatSync(target).isSymbolicLink()) {
        return { removed: false, reason: 'app folder is a link' }
    }
    const inside = relative(canonicalBase, realpathSync(target))
    if (inside !== APP_ID || inside.startsWith('..') || inside.includes(sep)) {
        return { removed: false, reason: 'app folder resolves outside its base' }
    }
    try {
        rmSync(target, { recursive: true, force: true })
    } catch (error) {
        return { removed: false, reason: `removal failed: ${error.code ?? error.message}` }
    }
    return existsSync(target)
        ? { removed: false, reason: 'app folder is still there' }
        : { removed: true, reason: 'removed' }
}
