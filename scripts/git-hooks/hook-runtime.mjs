#!/usr/bin/env node

import { randomUUID } from 'node:crypto'
import {
    accessSync,
    constants,
    existsSync,
    mkdirSync,
    readFileSync,
    readdirSync,
    renameSync,
    rmdirSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs'
import { hostname, freemem } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, spawnSync } from 'node:child_process'

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const LOCK_DIRECTORY_NAME = 'cannaguide-hook.lock'
const LOCK_METADATA_NAME = 'owner.json'
const REQUIRED_HOOK_TOOLS = ['lint-staged', 'commitlint', 'turbo', 'tsc', 'eslint']

export class HookRuntimeError extends Error {
    constructor(message, options = {}) {
        super(message, options)
        this.name = 'HookRuntimeError'
    }
}

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'))
}

function formatDuration(milliseconds) {
    if (!Number.isFinite(milliseconds)) return 'unknown'
    const seconds = Math.max(0, Math.round(milliseconds / 1000))
    const minutes = Math.floor(seconds / 60)
    const remainder = seconds % 60
    return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`
}

export function readBootIdentity({ platform = process.platform } = {}) {
    if (platform === 'linux') {
        try {
            const id = readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim()
            if (id) return `linux:${id}`
        } catch {
            // A missing procfs is not proof of a reboot. Keep recovery conservative.
        }
    }
    return null
}

function memoryValueMb(meminfo, field) {
    const match = meminfo.match(new RegExp(`^${field}:\\s+(\\d+)\\s+kB$`, 'm'))
    return match ? Math.floor(Number(match[1]) / 1024) : null
}

export function parseMemoryStatus(meminfo) {
    const availableMb = memoryValueMb(meminfo, 'MemAvailable')
    const swapFreeMb = memoryValueMb(meminfo, 'SwapFree')
    const swapTotalMb = memoryValueMb(meminfo, 'SwapTotal')
    if (availableMb === null) return null
    return { availableMb, swapFreeMb, swapTotalMb }
}

export function resourceStatus({ platform = process.platform } = {}) {
    if (platform === 'linux') {
        try {
            const parsed = parseMemoryStatus(readFileSync('/proc/meminfo', 'utf8'))
            if (parsed !== null) return parsed
        } catch {
            // Fall back to Node's cross-platform free-memory reading.
        }
    }
    return { availableMb: Math.floor(freemem() / 1024 / 1024), swapFreeMb: null, swapTotalMb: null }
}

export function assertSafeResourcePressure({ readStatus = resourceStatus } = {}) {
    const status = readStatus()
    const { availableMb, swapFreeMb, swapTotalMb } = status
    const swapKnown = swapFreeMb !== null && swapTotalMb !== null
    // The measured warm web typecheck peaks around 850 MB. Do not reject a
    // legitimate low-memory machine merely for being below that measurement:
    // fail only when immediate headroom is tiny, or both RAM and swap are under
    // severe pressure. Healthy-but-slow work is protected by heartbeats.
    const swapExhausted = swapKnown && (swapTotalMb === 0 || swapFreeMb < 256)
    const clearlyUnsafe = availableMb < 256 || (availableMb < 512 && swapExhausted)

    if (clearlyUnsafe) {
        throw new HookRuntimeError(
            `Dangerous resource pressure: ${availableMb} MB memory available` +
                (swapKnown ? `, ${swapFreeMb}/${swapTotalMb} MB swap free` : '') +
                '. Close memory-heavy applications and retry. The push is aborted; no gate is bypassed.',
        )
    }

    const severity = availableMb < 900 ? 'warning' : 'healthy'
    console.log(
        `[hook] resource preflight (${severity}): ${availableMb} MB memory available` +
            (swapKnown ? `, ${swapFreeMb}/${swapTotalMb} MB swap free` : ''),
    )
    return status
}

function gitCommonDirectory(repoRoot) {
    const result = spawnSync('git', ['rev-parse', '--git-common-dir'], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    })
    if (result.status !== 0) {
        throw new HookRuntimeError(
            `Cannot locate Git common directory: ${(result.stderr || '').trim()}`,
        )
    }
    const path = result.stdout.trim()
    return isAbsolute(path) ? path : resolve(repoRoot, path)
}

function lockMetadataPath(lockDirectory) {
    return join(lockDirectory, LOCK_METADATA_NAME)
}

function readLockMetadata(lockDirectory) {
    try {
        return readJson(lockMetadataPath(lockDirectory))
    } catch (error) {
        throw new HookRuntimeError(
            `Hook lock exists but its metadata is unreadable: ${lockDirectory}. ` +
                'Inspect it before removing anything.',
            { cause: error },
        )
    }
}

function removeKnownLockDirectory(lockDirectory) {
    const entries = readdirSync(lockDirectory)
    if (entries.length !== 1 || entries[0] !== LOCK_METADATA_NAME) {
        throw new HookRuntimeError(
            `Refusing to remove unexpected contents from hook lock: ${lockDirectory}`,
        )
    }
    unlinkSync(lockMetadataPath(lockDirectory))
    rmdirSync(lockDirectory)
}

function recoverProvenStaleLock(lockDirectory, existing, currentBootIdentity) {
    if (
        !existing.bootIdentity ||
        !currentBootIdentity ||
        existing.bootIdentity === currentBootIdentity
    ) {
        return false
    }

    const quarantine = `${lockDirectory}.stale-${process.pid}-${Date.now()}`
    try {
        renameSync(lockDirectory, quarantine)
    } catch (error) {
        if (error && typeof error === 'object' && error.code === 'ENOENT') return true
        throw error
    }
    removeKnownLockDirectory(quarantine)
    console.warn(
        `[hook] recovered a lock from an earlier boot (${existing.bootIdentity} -> ${currentBootIdentity})`,
    )
    return true
}

export function acquireHookLock({
    hookName,
    repoRoot = REPO_ROOT,
    gitCommonDir = gitCommonDirectory(repoRoot),
    bootIdentity = readBootIdentity(),
    pid = process.pid,
    now = () => new Date(),
} = {}) {
    if (!hookName) throw new HookRuntimeError('A hook name is required to acquire the hook lock.')

    const lockDirectory = join(gitCommonDir, LOCK_DIRECTORY_NAME)
    const owner = {
        token: randomUUID(),
        hookName,
        pid,
        host: hostname(),
        bootIdentity,
        startedAt: now().toISOString(),
    }

    for (let attempt = 0; attempt < 2; attempt += 1) {
        let created = false
        try {
            mkdirSync(lockDirectory, { mode: 0o700 })
            created = true
            writeFileSync(lockMetadataPath(lockDirectory), `${JSON.stringify(owner, null, 2)}\n`, {
                mode: 0o600,
            })
            break
        } catch (error) {
            if (created) {
                try {
                    if (existsSync(lockMetadataPath(lockDirectory))) {
                        unlinkSync(lockMetadataPath(lockDirectory))
                    }
                    rmdirSync(lockDirectory)
                } catch {
                    // Preserve anything we cannot identify and remove exactly.
                }
            }
            if (!error || typeof error !== 'object' || error.code !== 'EEXIST') throw error

            const existing = readLockMetadata(lockDirectory)
            if (attempt === 0 && recoverProvenStaleLock(lockDirectory, existing, bootIdentity)) {
                continue
            }

            throw new HookRuntimeError(
                `Another repository hook is already active: ${existing.hookName ?? 'unknown'} ` +
                    `(pid ${existing.pid ?? 'unknown'}, started ${existing.startedAt ?? 'unknown'}, ` +
                    `elapsed ${formatDuration(Date.now() - Date.parse(existing.startedAt))}). ` +
                    `Wait for it to finish. Same-boot locks are never deleted automatically; if the owner was killed, inspect ${lockMetadataPath(lockDirectory)} and prove no hook is active before removing the lock.`,
            )
        }
    }

    let released = false
    return {
        lockDirectory,
        owner,
        release() {
            if (released) return
            const current = readLockMetadata(lockDirectory)
            if (current.token !== owner.token) {
                throw new HookRuntimeError(
                    `Refusing to release a hook lock now owned by another process: ${lockDirectory}`,
                )
            }
            removeKnownLockDirectory(lockDirectory)
            released = true
        },
    }
}

export function assertDependenciesSynchronized({
    repoRoot = REPO_ROOT,
    requiredTools = REQUIRED_HOOK_TOOLS,
} = {}) {
    const rootLock = join(repoRoot, 'pnpm-lock.yaml')
    const installedLock = join(repoRoot, 'node_modules', '.pnpm', 'lock.yaml')
    const modulesMetadata = join(repoRoot, 'node_modules', '.modules.yaml')
    const packageJson = join(repoRoot, 'package.json')

    for (const required of [rootLock, installedLock, modulesMetadata, packageJson]) {
        if (!existsSync(required)) {
            throw new HookRuntimeError(
                `Dependency metadata is missing: ${required}. ` +
                    'Run `corepack pnpm install --frozen-lockfile` deliberately, then retry.',
            )
        }
    }

    if (!readFileSync(rootLock).equals(readFileSync(installedLock))) {
        throw new HookRuntimeError(
            'Installed dependencies do not match pnpm-lock.yaml. Hooks never install implicitly. ' +
                'Run `corepack pnpm install --frozen-lockfile` deliberately, then retry.',
        )
    }

    const expectedManager = readJson(packageJson).packageManager
    const metadata = readFileSync(modulesMetadata, 'utf8')
    const installedManager = metadata.match(
        /^\s*["']?packageManager["']?\s*:\s*["']?([^"',\s]+)["']?,?\s*$/m,
    )?.[1]
    if (!expectedManager || installedManager !== expectedManager) {
        throw new HookRuntimeError(
            `Dependencies were installed with ${installedManager ?? 'an unknown pnpm version'}; ` +
                `the repository requires ${expectedManager ?? 'a pinned package manager'}. ` +
                'Run `corepack pnpm install --frozen-lockfile` deliberately, then retry.',
        )
    }

    for (const tool of requiredTools) resolveLocalBinary(tool, { repoRoot })

    console.log(
        `[hook] dependency preflight: lockfile, ${expectedManager} metadata and ` +
            `${requiredTools.length} local tools match`,
    )
}

export function assertNodeVersion({ minimumMajor = 24 } = {}) {
    const major = Number(process.versions.node.split('.')[0])
    if (!Number.isInteger(major) || major < minimumMajor) {
        throw new HookRuntimeError(
            `Node.js >=${minimumMajor} is required; current runtime is ${process.version}.`,
        )
    }
}

export function resolveLocalBinary(
    name,
    { repoRoot = REPO_ROOT, platform = process.platform } = {},
) {
    const suffix = platform === 'win32' ? '.cmd' : ''
    const candidate = join(repoRoot, 'node_modules', '.bin', `${name}${suffix}`)
    try {
        accessSync(candidate, platform === 'win32' ? constants.F_OK : constants.X_OK)
    } catch (error) {
        throw new HookRuntimeError(
            `Required local tool '${name}' is unavailable at ${candidate}. ` +
                'Run `corepack pnpm install --frozen-lockfile` deliberately, then retry.',
            { cause: error },
        )
    }
    return candidate
}

function terminateProcessTree(child, signal = 'SIGTERM') {
    if (!child.pid) return
    if (process.platform === 'win32') {
        const args = ['/pid', String(child.pid), '/t']
        if (signal === 'SIGKILL') args.push('/f')
        spawnSync('taskkill', args, { stdio: 'ignore', shell: false })
        return
    }
    try {
        process.kill(-child.pid, signal)
    } catch {
        try {
            child.kill(signal)
        } catch {
            // The child may already have exited between checks.
        }
    }
}

export async function runStep(
    label,
    command,
    args = [],
    {
        cwd = REPO_ROOT,
        env = process.env,
        timeoutMs = 10 * 60 * 1000,
        heartbeatMs = 30 * 1000,
        terminationGraceMs = 5 * 1000,
    } = {},
) {
    const started = Date.now()
    console.log(`[hook] START ${label}`)

    const child = spawn(command, args, {
        cwd,
        env,
        stdio: 'inherit',
        shell: process.platform === 'win32',
        detached: process.platform !== 'win32',
    })

    return await new Promise((resolvePromise, rejectPromise) => {
        let reason = null
        let forceKillTimer = null

        const heartbeat = setInterval(() => {
            console.log(
                `[hook] RUNNING ${label} (${formatDuration(Date.now() - started)}, ` +
                    `${resourceStatus().availableMb} MB available)`,
            )
        }, heartbeatMs)
        heartbeat.unref()

        const terminate = (nextReason) => {
            if (reason) return
            reason = nextReason
            terminateProcessTree(child, 'SIGTERM')
            forceKillTimer = setTimeout(
                () => terminateProcessTree(child, 'SIGKILL'),
                terminationGraceMs,
            )
            forceKillTimer.unref()
        }

        const timeout = setTimeout(
            () => terminate(`${label} timed out after ${formatDuration(timeoutMs)}`),
            timeoutMs,
        )
        timeout.unref()

        const onInterrupt = () => terminate(`${label} interrupted by SIGINT`)
        const onTerminate = () => terminate(`${label} interrupted by SIGTERM`)
        process.once('SIGINT', onInterrupt)
        process.once('SIGTERM', onTerminate)

        const cleanup = () => {
            clearInterval(heartbeat)
            clearTimeout(timeout)
            if (forceKillTimer) clearTimeout(forceKillTimer)
            process.removeListener('SIGINT', onInterrupt)
            process.removeListener('SIGTERM', onTerminate)
        }

        child.once('error', (error) => {
            cleanup()
            rejectPromise(
                new HookRuntimeError(`${label} failed to start: ${error.message}`, {
                    cause: error,
                }),
            )
        })

        child.once('exit', (code, signal) => {
            // A parent can exit on SIGTERM while one of its descendants ignores
            // the signal. Kill the still-addressable process group before
            // clearing the grace timer so a timeout cannot orphan local tools.
            if (reason) terminateProcessTree(child, 'SIGKILL')
            cleanup()
            const elapsed = formatDuration(Date.now() - started)
            if (reason) {
                rejectPromise(
                    new HookRuntimeError(`${reason}; child exited via ${signal ?? code}.`),
                )
                return
            }
            if (code !== 0) {
                rejectPromise(
                    new HookRuntimeError(
                        `${label} failed after ${elapsed} (exit ${code ?? 'none'}, signal ${signal ?? 'none'}).`,
                    ),
                )
                return
            }
            console.log(`[hook] PASS ${label} (${elapsed})`)
            resolvePromise()
        })
    })
}

export function runLocalTool(name, args, options = {}) {
    return runStep(options.label ?? name, resolveLocalBinary(name, options), args, options)
}

export function runNodeScript(script, args = [], options = {}) {
    return runStep(
        options.label ?? script,
        process.execPath,
        [resolve(REPO_ROOT, script), ...args],
        options,
    )
}
