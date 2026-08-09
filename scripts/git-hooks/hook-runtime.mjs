#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto'
import {
    accessSync,
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

import { assertDependencyMetadataSynchronized } from './dependency-state.mjs'

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const LOCK_DIRECTORY_PREFIX = 'cannaguide-hook'
const LOCK_METADATA_NAME = 'owner.json'
const LOCAL_TOOL_PACKAGES = {
    'anti-trojan-source': ['anti-trojan-source', 'anti-trojan-source'],
    commitlint: ['@commitlint/cli', 'commitlint'],
    eslint: ['eslint', 'eslint'],
    'lint-staged': ['lint-staged', 'lint-staged'],
    prettier: ['prettier', 'prettier'],
    tsc: ['typescript', 'tsc'],
    turbo: ['turbo', 'turbo'],
}
const RESOURCE_PRESSURE_MB = {
    criticalAvailable: 256,
    lowAvailable: 512,
    minimumSwapFree: 256,
    warningAvailable: 900,
}

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
        } catch {}
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

export function parseCgroupHeadroomMb(limit, usage) {
    if (!limit || limit.trim() === 'max') return null
    try {
        const limitBytes = BigInt(limit.trim())
        const usageBytes = BigInt(usage.trim())
        if (limitBytes >= 1n << 60n) return null
        return Number((limitBytes > usageBytes ? limitBytes - usageBytes : 0n) / 1_048_576n)
    } catch {
        return null
    }
}

function decodeMountInfoPath(path) {
    const escapes = { '011': '\t', '012': '\n', '040': ' ', 134: '\\' }
    return path.replace(/\\(011|012|040|134)/g, (_match, code) => escapes[code])
}

function cgroupHierarchyStatus({ version, membership, mounts, readText, hostSwapFreeMb }) {
    const cgroupPath = membership.split(':')[2]
    const candidates = mounts.filter((line) => {
        const [, typeAndOptions = ''] = line.split(' - ')
        return version === 2
            ? typeAndOptions.startsWith('cgroup2 ')
            : typeAndOptions.startsWith('cgroup ') &&
                  typeAndOptions.split(' ')[2]?.split(',').includes('memory')
    })
    const mount = candidates
        .map((line) => line.split(' - ')[0].split(' '))
        .map((fields) => ({
            mountRoot: decodeMountInfoPath(fields[3]),
            mountPoint: decodeMountInfoPath(fields[4]),
        }))
        .filter(
            ({ mountRoot }) =>
                mountRoot === '/' ||
                cgroupPath === mountRoot ||
                cgroupPath.startsWith(`${mountRoot}/`),
        )
        .sort((left, right) => right.mountRoot.length - left.mountRoot.length)[0]
    if (!mount) return null
    const relative =
        mount.mountRoot === '/'
            ? cgroupPath
            : cgroupPath === mount.mountRoot
              ? '/'
              : cgroupPath.slice(mount.mountRoot.length)
    const directory = join(mount.mountPoint, relative.slice(1))
    const [memoryNames, totalNames] =
        version === 2
            ? [
                  ['max', 'current'],
                  ['swap.max', 'swap.current'],
              ]
            : [
                  ['limit_in_bytes', 'usage_in_bytes'],
                  ['memsw.limit_in_bytes', 'memsw.usage_in_bytes'],
              ]
    const directories = []
    for (let current = directory; ; current = dirname(current)) {
        directories.push(current)
        if (current === mount.mountPoint) break
    }
    const tightestHeadroom = ([limit, usage]) => {
        const values = directories
            .map((current) => {
                try {
                    return parseCgroupHeadroomMb(
                        readText(join(current, `memory.${limit}`)),
                        readText(join(current, `memory.${usage}`)),
                    )
                } catch {
                    return null
                }
            })
            .filter((value) => value !== null)
        return values.length === 0 ? null : Math.min(...values)
    }
    const memoryAvailableMb = tightestHeadroom(memoryNames)
    if (memoryAvailableMb === null) return null
    const auxiliaryHeadroomMb = tightestHeadroom(totalNames)
    const swapAvailableMb =
        version !== 2
            ? null
            : auxiliaryHeadroomMb === null
              ? hostSwapFreeMb
              : hostSwapFreeMb === null
                ? auxiliaryHeadroomMb
                : Math.min(auxiliaryHeadroomMb, hostSwapFreeMb)
    const totalAvailableMb =
        version === 1
            ? (auxiliaryHeadroomMb ?? memoryAvailableMb)
            : swapAvailableMb === null
              ? null
              : memoryAvailableMb + swapAvailableMb
    return { memoryAvailableMb, totalAvailableMb, version }
}

export function readCgroupStatus(
    readText = (path) => readFileSync(path, 'utf8'),
    { hostSwapFreeMb = null } = {},
) {
    try {
        const memberships = readText('/proc/self/cgroup').trim().split('\n')
        const mounts = readText('/proc/self/mountinfo').trim().split('\n')
        const hierarchies = [
            [2, memberships.find((line) => line.startsWith('0::'))],
            [1, memberships.find((line) => line.split(':')[1]?.split(',').includes('memory'))],
        ]
        for (const [version, membership] of hierarchies) {
            if (!membership) continue
            const status = cgroupHierarchyStatus({
                version,
                membership,
                mounts,
                readText,
                hostSwapFreeMb,
            })
            if (status) return status
        }
        return null
    } catch {
        return null
    }
}

export function resourceStatus({ platform = process.platform } = {}) {
    if (platform === 'linux') {
        try {
            const parsed = parseMemoryStatus(readFileSync('/proc/meminfo', 'utf8'))
            if (parsed !== null) {
                const cgroup = readCgroupStatus(undefined, {
                    hostSwapFreeMb: parsed.swapFreeMb,
                })
                if (cgroup?.memoryAvailableMb != null) {
                    return {
                        ...parsed,
                        availableMb: Math.min(parsed.availableMb, cgroup.memoryAvailableMb),
                        cgroupAvailableMb: cgroup.memoryAvailableMb,
                        cgroupTotalAvailableMb: cgroup.totalAvailableMb,
                        cgroupVersion: cgroup.version,
                    }
                }
                return parsed
            }
        } catch {}
    }
    return { availableMb: Math.floor(freemem() / 1024 / 1024), swapFreeMb: null, swapTotalMb: null }
}

export function assertSafeResourcePressure({ readStatus = resourceStatus } = {}) {
    const status = readStatus()
    const { availableMb, swapFreeMb, swapTotalMb, cgroupAvailableMb, cgroupTotalAvailableMb } =
        status
    const swapKnown = swapFreeMb !== null && swapTotalMb !== null
    const swapExhausted =
        swapKnown && (swapTotalMb === 0 || swapFreeMb < RESOURCE_PRESSURE_MB.minimumSwapFree)
    const clearlyUnsafe =
        availableMb < RESOURCE_PRESSURE_MB.criticalAvailable ||
        (availableMb < RESOURCE_PRESSURE_MB.lowAvailable && swapExhausted) ||
        (cgroupTotalAvailableMb !== undefined &&
            cgroupTotalAvailableMb !== null &&
            cgroupTotalAvailableMb < RESOURCE_PRESSURE_MB.warningAvailable)

    if (clearlyUnsafe) {
        throw new HookRuntimeError(
            `Dangerous resource pressure: ${availableMb} MB memory available` +
                (swapKnown ? `, ${swapFreeMb}/${swapTotalMb} MB swap free` : '') +
                (cgroupAvailableMb !== undefined
                    ? `, cgroup ${cgroupAvailableMb} MB memory / ${cgroupTotalAvailableMb ?? 'unbounded'} MB total headroom`
                    : '') +
                '. Close memory-heavy applications and retry. The push is aborted; no gate is bypassed.',
        )
    }

    const severity = availableMb < RESOURCE_PRESSURE_MB.warningAvailable ? 'warning' : 'healthy'
    console.log(
        `[hook] resource preflight (${severity}): ${availableMb} MB memory available` +
            (swapKnown ? `, ${swapFreeMb}/${swapTotalMb} MB swap free` : '') +
            (cgroupAvailableMb !== undefined
                ? `, cgroup v${status.cgroupVersion} ${cgroupAvailableMb} MB memory / ${cgroupTotalAvailableMb ?? 'unbounded'} MB total headroom`
                : ''),
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

function lockDirectoryName(bootIdentity) {
    if (!bootIdentity) return `${LOCK_DIRECTORY_PREFIX}.lock`
    const bootKey = createHash('sha256').update(bootIdentity).digest('hex').slice(0, 16)
    return `${LOCK_DIRECTORY_PREFIX}-${bootKey}.lock`
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

    // Linux boot identity is part of the lock name. A hard power-off can leave
    // the previous directory intact, but a later boot uses a different name and
    // never has to delete an observed lock. Platforms without a trustworthy boot
    // identity conservatively reuse one fixed name and require manual recovery.
    const lockDirectory = join(gitCommonDir, lockDirectoryName(bootIdentity))
    const owner = {
        token: randomUUID(),
        hookName,
        pid,
        host: hostname(),
        bootIdentity,
        startedAt: now().toISOString(),
    }

    const candidateDirectory = `${lockDirectory}.candidate-${pid}-${owner.token}`
    try {
        mkdirSync(candidateDirectory, { mode: 0o700 })
        writeFileSync(lockMetadataPath(candidateDirectory), `${JSON.stringify(owner, null, 2)}\n`, {
            mode: 0o600,
        })
        renameSync(candidateDirectory, lockDirectory)
    } catch (error) {
        if (existsSync(candidateDirectory)) {
            try {
                removeKnownLockDirectory(candidateDirectory)
            } catch {}
        }
        if (!error || typeof error !== 'object' || !['EEXIST', 'ENOTEMPTY'].includes(error.code)) {
            throw error
        }

        const existing = readLockMetadata(lockDirectory)
        throw new HookRuntimeError(
            `Another repository hook is already active: ${existing.hookName ?? 'unknown'} ` +
                `(pid ${existing.pid ?? 'unknown'}, started ${existing.startedAt ?? 'unknown'}, ` +
                `elapsed ${formatDuration(Date.now() - Date.parse(existing.startedAt))}). ` +
                `Wait for it to finish. Current-boot locks are never deleted automatically; if the owner was killed, inspect ${lockMetadataPath(lockDirectory)} and prove no hook is active before removing the lock.`,
        )
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
            const cleanupDirectory = `${lockDirectory}.cleanup-${owner.pid}-${owner.token}`
            renameSync(lockDirectory, cleanupDirectory)
            released = true
            removeKnownLockDirectory(cleanupDirectory)
        },
    }
}

export function assertDependenciesSynchronized({
    repoRoot = REPO_ROOT,
    requiredTools = [],
    source = 'worktree',
} = {}) {
    const { expectedManager, sourceLabel } = assertDependencyMetadataSynchronized({
        repoRoot,
        source,
    })
    for (const tool of requiredTools) resolveLocalTool(tool, { repoRoot })
    console.log(
        `[hook] dependency preflight (${sourceLabel}): successful-install stamp, ` +
            `${expectedManager} metadata and ${requiredTools.length} local tools match`,
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

export function resolveLocalTool(name, { repoRoot = REPO_ROOT } = {}) {
    const specification = LOCAL_TOOL_PACKAGES[name]
    if (!specification) throw new HookRuntimeError(`Unknown local hook tool '${name}'.`)
    const [packageName, binName] = specification
    const manifestPath = join(repoRoot, 'node_modules', packageName, 'package.json')
    try {
        const manifest = readJson(manifestPath)
        const declaredBin =
            typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.[binName]
        if (!declaredBin) throw new Error(`package does not declare bin '${binName}'`)
        const entrypoint = resolve(dirname(manifestPath), declaredBin)
        accessSync(entrypoint)
        return {
            command: process.execPath,
            argsPrefix: [entrypoint],
            displayPath: entrypoint,
        }
    } catch (error) {
        throw new HookRuntimeError(
            `Required installed local tool '${name}' is unavailable through ${manifestPath}. ` +
                'Run `corepack pnpm install --frozen-lockfile` deliberately, then retry.',
            { cause: error },
        )
    }
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
        } catch {}
    }
}

function processTreeStillRunning(child) {
    if (!child.pid) return false
    if (process.platform === 'win32') {
        return child.exitCode === null && child.signalCode === null
    }
    try {
        process.kill(-child.pid, 0)
        return true
    } catch {
        return false
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
        signalEmitter = process,
    } = {},
) {
    const started = Date.now()
    console.log(`[hook] START ${label}`)

    const child = spawn(command, args, {
        cwd,
        env,
        stdio: 'inherit',
        shell: false,
        detached: process.platform !== 'win32',
    })

    return await new Promise((resolvePromise, rejectPromise) => {
        let reason = null
        let forceKillTimer = null
        let pendingExit = null

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
            forceKillTimer = setTimeout(() => {
                if (processTreeStillRunning(child)) {
                    terminateProcessTree(child, 'SIGKILL')
                }
                forceKillTimer = null
                if (pendingExit) finish(...pendingExit)
            }, terminationGraceMs)
            forceKillTimer.unref()
        }

        const timeout = setTimeout(
            () => terminate(`${label} timed out after ${formatDuration(timeoutMs)}`),
            timeoutMs,
        )
        timeout.unref()

        const onInterrupt = () => terminate(`${label} interrupted by SIGINT`)
        const onTerminate = () => terminate(`${label} interrupted by SIGTERM`)
        const onHangup = () => terminate(`${label} interrupted by SIGHUP`)
        signalEmitter.once('SIGINT', onInterrupt)
        signalEmitter.once('SIGTERM', onTerminate)
        signalEmitter.once('SIGHUP', onHangup)

        const cleanup = () => {
            clearInterval(heartbeat)
            clearTimeout(timeout)
            if (forceKillTimer) clearTimeout(forceKillTimer)
            signalEmitter.removeListener('SIGINT', onInterrupt)
            signalEmitter.removeListener('SIGTERM', onTerminate)
            signalEmitter.removeListener('SIGHUP', onHangup)
        }

        child.once('error', (error) => {
            cleanup()
            rejectPromise(
                new HookRuntimeError(`${label} failed to start: ${error.message}`, {
                    cause: error,
                }),
            )
        })

        const finish = (code, signal) => {
            cleanup()
            const elapsed = formatDuration(Date.now() - started)
            if (reason) {
                const outcome = signal
                    ? `child terminated by ${signal}`
                    : `child exited with code ${code}`
                rejectPromise(new HookRuntimeError(`${reason}; ${outcome}.`))
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
        }

        child.once('exit', (code, signal) => {
            if (reason && processTreeStillRunning(child)) {
                pendingExit = [code, signal]
                return
            }
            finish(code, signal)
        })
    })
}

export function runLocalTool(name, args, options = {}) {
    const localTool = resolveLocalTool(name, options)
    return runStep(
        options.label ?? name,
        localTool.command,
        [...localTool.argsPrefix, ...args],
        options,
    )
}

export function runNodeScript(script, args = [], options = {}) {
    return runStep(
        options.label ?? script,
        process.execPath,
        [resolve(REPO_ROOT, script), ...args],
        options,
    )
}
