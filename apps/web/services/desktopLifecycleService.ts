/**
 * Desktop (Tauri) quit and update lifecycle, the web side of
 * apps/desktop/src-tauri/src/{lifecycle,update}.rs.
 *
 * Quit: every user quit (tray, close button, Cmd+Q) emits `tauri://before-quit` and
 * waits; the app exits when `confirm_quit` arrives after the flush, or after a
 * timeout for a frontend that never answers.
 *
 * Update: Rust checks the release endpoint, downloads the bundle (tauri-plugin-updater
 * verifies its minisign signature before returning it) and installs it. This module
 * owns the rules the web app knows about:
 *
 * - Nothing runs outside the desktop app; browser and PWA builds never call it.
 * - Local-Only mode blocks checks and downloads, automatic or manual: both are
 *   requests to github.com. Installing an already downloaded bundle sends nothing.
 * - One step at a time (the Rust side enforces the same).
 * - Persisted state must be saved before the install. A flush that fails or reports
 *   "not saved" stops it: on Windows the installer ends the process from inside the
 *   install command, so there is no later chance to save.
 */
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { platform } from '@/services/platformService'

export interface DesktopUpdateInfo {
    version: string
    currentVersion: string
    notes: string | null
    date: string | null
}

export interface DownloadProgress {
    downloaded: number
    total: number | null
}

/** Mirrors `DownloadEvent` in update.rs (serde: tag = "event", content = "data"). */
type DownloadEvent = { event: 'progress'; data: DownloadProgress } | { event: 'finished' }

export interface TauriBridge {
    invoke: <T>(command: string, args?: Record<string, unknown>) => Promise<T>
    channel: <T>(onMessage: (message: T) => void) => unknown
}

export type DesktopUpdateFailure = 'not-desktop' | 'local-only' | 'busy' | 'not-saved' | 'failed'

export class DesktopUpdateError extends Error {
    readonly reason: DesktopUpdateFailure

    constructor(reason: DesktopUpdateFailure, message: string, cause?: unknown) {
        super(message, cause === undefined ? undefined : { cause })
        this.name = 'DesktopUpdateError'
        this.reason = reason
    }
}

/** Saves persisted state; resolves true only when the latest state was written. */
export type PersistFlush = () => Promise<boolean>

export interface DesktopUpdater {
    check: () => Promise<DesktopUpdateInfo | null>
    download: (onProgress: (progress: DownloadProgress) => void) => Promise<void>
    installAndRestart: () => Promise<void>
}

export interface DesktopUpdaterDeps {
    isDesktop: () => boolean
    isLocalOnly: () => boolean
    loadBridge: () => Promise<TauriBridge>
    getFlush: () => PersistFlush | undefined
}

const messageOf = (error: unknown): string =>
    error instanceof Error ? error.message : typeof error === 'string' ? error : String(error)

export const createDesktopUpdater = (deps: DesktopUpdaterDeps): DesktopUpdater => {
    let running = false

    const run = async <T>(step: (bridge: TauriBridge) => Promise<T>): Promise<T> => {
        if (!deps.isDesktop()) {
            throw new DesktopUpdateError('not-desktop', 'updates exist only in the desktop app')
        }
        if (running) throw new DesktopUpdateError('busy', 'another update step is still running')
        running = true
        try {
            return await step(await deps.loadBridge())
        } finally {
            running = false
        }
    }

    const invoke = async <T>(
        bridge: TauriBridge,
        command: string,
        args?: Record<string, unknown>,
    ): Promise<T> => {
        try {
            return await bridge.invoke<T>(command, args)
        } catch (error) {
            throw new DesktopUpdateError('failed', messageOf(error), error)
        }
    }

    const refuseWhenLocalOnly = (): void => {
        if (deps.isLocalOnly()) {
            throw new DesktopUpdateError(
                'local-only',
                'Local-only mode is on; the update server is not contacted',
            )
        }
    }

    return {
        check: () =>
            run(async (bridge) => {
                refuseWhenLocalOnly()
                return invoke<DesktopUpdateInfo | null>(bridge, 'update_check')
            }),
        download: (onProgress) =>
            run(async (bridge) => {
                refuseWhenLocalOnly()
                const onEvent = bridge.channel<DownloadEvent>((message) => {
                    if (message.event === 'progress') onProgress(message.data)
                })
                await invoke<void>(bridge, 'update_download', { onEvent })
            }),
        installAndRestart: () =>
            run(async (bridge) => {
                const flush = deps.getFlush()
                let saved = false
                try {
                    saved = flush ? await flush() : false
                } catch (error) {
                    throw new DesktopUpdateError('not-saved', messageOf(error), error)
                }
                if (!saved) {
                    throw new DesktopUpdateError(
                        'not-saved',
                        'the latest changes could not be saved; the update was not installed',
                    )
                }
                await invoke<void>(bridge, 'update_install')
            }),
    }
}

const loadTauriBridge = async (): Promise<TauriBridge> => {
    const { invoke, Channel } = await import('@tauri-apps/api/core')
    return {
        invoke: <T>(command: string, args?: Record<string, unknown>) => invoke<T>(command, args),
        channel: <T>(onMessage: (message: T) => void) => {
            return new Channel<T>(onMessage)
        },
    }
}

let registeredFlush: PersistFlush | undefined

/** Called once after hydration; the quit and update paths save through it. */
export const registerPersistFlush = (flush: PersistFlush | undefined): void => {
    registeredFlush = flush
}

export const desktopUpdater: DesktopUpdater = createDesktopUpdater({
    isDesktop: () => platform.isTauri,
    isLocalOnly: isLocalOnlyMode,
    loadBridge: loadTauriBridge,
    getFlush: () => registeredFlush,
})

export interface StartupCheckDeps {
    updater: Pick<DesktopUpdater, 'check'>
    isDesktop: () => boolean
    isLocalOnly: () => boolean
    isOnline: () => boolean
    onAvailable: (info: DesktopUpdateInfo) => void
    delayMs?: number
}

/** Default delay, so the check never competes with startup work. */
export const STARTUP_UPDATE_CHECK_DELAY_MS = 15_000

/**
 * One background check per launch, desktop only, skipped in Local-Only mode or
 * offline -- also when either changes during the delay. A failed background check
 * stays quiet; Settings > About shows errors for a manual check. Returns a cancel.
 */
export const scheduleStartupUpdateCheck = (deps: StartupCheckDeps): (() => void) => {
    const allowed = (): boolean => deps.isDesktop() && !deps.isLocalOnly() && deps.isOnline()
    if (!allowed()) return () => undefined
    const timer = setTimeout(() => {
        if (!allowed()) return
        deps.updater
            .check()
            .then((info) => {
                if (info) deps.onAvailable(info)
            })
            .catch((error: unknown) => {
                console.debug('[DesktopUpdate] background check failed:', messageOf(error))
            })
    }, deps.delayMs ?? STARTUP_UPDATE_CHECK_DELAY_MS)
    return () => clearTimeout(timer)
}

/**
 * The `tauri://before-quit` handler: save, then let the app exit. The app quits even
 * when the save fails -- the user asked to quit, and holding the window open would
 * not save anything -- but only after the save has finished, not after a fixed delay.
 */
export const flushThenConfirmQuit = async (
    flush: PersistFlush | undefined,
    loadBridge: () => Promise<TauriBridge> = loadTauriBridge,
): Promise<void> => {
    try {
        const saved = flush ? await flush() : false
        if (!saved) console.warn('[DesktopQuit] latest changes not saved before quit')
    } catch (error) {
        console.warn('[DesktopQuit] save before quit failed:', messageOf(error))
    }
    const bridge = await loadBridge()
    await bridge.invoke<void>('confirm_quit')
}
