/**
 * Desktop (Tauri) quit and update lifecycle, the web side of
 * apps/desktop/src-tauri/src/{lifecycle,update}.rs.
 *
 * Quit: every user quit (tray, close button, Cmd+Q) emits `tauri://before-quit` and
 * waits; the app exits when `confirm_quit` arrives after the save, or after a 10 s
 * fallback for a frontend that never answers.
 *
 * Update: Rust checks the release endpoint, downloads the bundle (tauri-plugin-updater
 * verifies its minisign signature before returning it) and installs it. This module
 * owns the rules the web app knows about:
 *
 * - Nothing runs outside the desktop app; browser and PWA builds never call it.
 * - Local-Only mode and being offline block checks and downloads, automatic or
 *   manual: both are requests to github.com. Installing an already downloaded bundle
 *   sends nothing, so it stays possible. Rust mirrors Local-Only as a second layer,
 *   and turning it on stops a running check or download, not only the next request.
 * - One step at a time (the Rust side enforces the same); Cancel stops a check or a
 *   download.
 * - Persisted state must be saved before the install, and the save must settle: an
 *   install never runs while an edit is still unsaved (see flushUntilStable). Right
 *   before the process then ends -- the restart, or on Windows the installer taking
 *   over -- update.rs asks for one more save (SAVE_BEFORE_RESTART_EVENT) and waits
 *   for it, so an edit made while the install ran is saved as well.
 * - The updater is the single source of truth for the launch: stage, running step,
 *   progress and the last error live here, and the card subscribes to them. Leaving
 *   Settings > About and coming back, or a startup check finding a newer release
 *   while the card is open, therefore never leaves the card on a stale copy.
 */
import { suspendPersistenceForQuit } from '@/bootstrap/persistenceCoordinator'
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

/** How far this launch got: an update was found, or it is downloaded and verified. */
export type DesktopUpdateStage =
    { kind: 'available'; info: DesktopUpdateInfo } | { kind: 'ready'; info: DesktopUpdateInfo }

export type DesktopUpdateOperation = 'idle' | 'checking' | 'downloading' | 'installing'

export type DesktopUpdateFailure =
    'not-desktop' | 'local-only' | 'offline' | 'busy' | 'not-saved' | 'cancelled' | 'failed'

export interface DesktopUpdateSnapshot {
    stage: DesktopUpdateStage | null
    operation: DesktopUpdateOperation
    progress: DownloadProgress | null
    /**
     * The native download task is registered, so Cancel reaches it. False until
     * update.rs reports `started`: a Cancel shown earlier could miss the task.
     */
    cancellable: boolean
    /** The last finished check found no newer version. */
    upToDate: boolean
    /** The last failed step that the user started (background checks stay quiet). */
    error: { reason: DesktopUpdateFailure; message: string } | null
}

/** Mirrors `DownloadEvent` in update.rs (serde: tag = "event", content = "data"). */
type DownloadEvent =
    { event: 'started' } | { event: 'progress'; data: DownloadProgress } | { event: 'finished' }

export interface TauriBridge {
    invoke: <T>(command: string, args?: Record<string, unknown>) => Promise<T>
    channel: <T>(onMessage: (message: T) => void) => unknown
}

/** The exact error texts of update.rs, mapped to the reasons the card explains. */
const NATIVE_REASONS: Readonly<Record<string, DesktopUpdateFailure>> = {
    'update request cancelled': 'cancelled',
    'Local-only mode is on; the update server is not contacted': 'local-only',
}

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
    /** `background`: a failure is not shown (the startup check). */
    check: (options?: { background?: boolean | undefined }) => Promise<DesktopUpdateInfo | null>
    download: () => Promise<void>
    installAndRestart: () => Promise<void>
    /** Stops the running check or download; resolves true if one was running. */
    cancelDownload: () => Promise<boolean>
    subscribe: (listener: () => void) => () => void
    getSnapshot: () => DesktopUpdateSnapshot
}

export interface DesktopUpdaterDeps {
    isDesktop: () => boolean
    isLocalOnly: () => boolean
    isOnline: () => boolean
    loadBridge: () => Promise<TauriBridge>
    getFlush: () => PersistFlush | undefined
}

const messageOf = (error: unknown): string =>
    error instanceof Error ? error.message : typeof error === 'string' ? error : String(error)

const INITIAL_SNAPSHOT: DesktopUpdateSnapshot = {
    stage: null,
    operation: 'idle',
    progress: null,
    cancellable: false,
    upToDate: false,
    error: null,
}

export const createDesktopUpdater = (deps: DesktopUpdaterDeps): DesktopUpdater => {
    let snapshot = INITIAL_SNAPSHOT
    const listeners = new Set<() => void>()
    const update = (patch: Partial<DesktopUpdateSnapshot>): void => {
        snapshot = { ...snapshot, ...patch }
        for (const listener of listeners) listener()
    }

    const run = async <T>(
        operation: Exclude<DesktopUpdateOperation, 'idle'>,
        step: (bridge: TauriBridge) => Promise<T>,
        showFailure = true,
    ): Promise<T> => {
        if (!deps.isDesktop()) {
            throw new DesktopUpdateError('not-desktop', 'updates exist only in the desktop app')
        }
        if (snapshot.operation !== 'idle') {
            throw new DesktopUpdateError('busy', 'another update step is still running')
        }
        update({
            operation,
            progress: null,
            cancellable: false,
            ...(showFailure ? { error: null } : {}),
        })
        try {
            return await step(await deps.loadBridge())
        } catch (error) {
            const failure =
                error instanceof DesktopUpdateError
                    ? error
                    : new DesktopUpdateError('failed', messageOf(error), error)
            if (showFailure) {
                update({ error: { reason: failure.reason, message: failure.message } })
            }
            throw failure
        } finally {
            update({ operation: 'idle', progress: null, cancellable: false })
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
            const message = messageOf(error)
            throw new DesktopUpdateError(NATIVE_REASONS[message] ?? 'failed', message, error)
        }
    }

    /** Both requests leave the device; neither may run in Local-Only mode or offline. */
    const refuseNetwork = (): void => {
        if (deps.isLocalOnly()) {
            throw new DesktopUpdateError(
                'local-only',
                'Local-only mode is on; the update server is not contacted',
            )
        }
        if (!deps.isOnline()) {
            throw new DesktopUpdateError('offline', 'the device is offline')
        }
    }

    return {
        check: (options) =>
            run(
                'checking',
                async (bridge) => {
                    refuseNetwork()
                    const info = await invoke<DesktopUpdateInfo | null>(bridge, 'update_check')
                    // update.rs keeps the downloaded bundle for the same version, so a later
                    // check (the startup one) must not send a downloaded update back to
                    // "available". A different version replaces the stage for every viewer.
                    const current = snapshot.stage
                    const keepsDownload =
                        current?.kind === 'ready' &&
                        info !== null &&
                        info.version === current.info.version
                    // A finished check is the newest word, so an older failure no longer
                    // describes the state (CodeAnt on #878).
                    update({
                        stage: info ? { kind: keepsDownload ? 'ready' : 'available', info } : null,
                        upToDate: info === null,
                        error: null,
                    })
                    return info
                },
                options?.background !== true,
            ),
        download: () =>
            run('downloading', async (bridge) => {
                refuseNetwork()
                const onEvent = bridge.channel<DownloadEvent>((message) => {
                    if (message.event === 'started') update({ cancellable: true })
                    if (message.event === 'progress') update({ progress: message.data })
                })
                await invoke<void>(bridge, 'update_download', { onEvent })
                const current = snapshot.stage
                if (current) update({ stage: { kind: 'ready', info: current.info } })
            }),
        installAndRestart: () =>
            run('installing', async (bridge) => {
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
                try {
                    await invoke<void>(bridge, 'update_install')
                } catch (error) {
                    // The installer did not start and the app stays open: the hold
                    // from the final save must not swallow the user's next edits. Only
                    // that hold: a quit that started meanwhile keeps its own.
                    releaseWriteHold('final-save')
                    throw error
                }
            }),
        // Outside the one-step-at-a-time guard: it has to reach a running step.
        cancelDownload: async () => {
            if (!deps.isDesktop()) return false
            const bridge = await deps.loadBridge()
            return invoke<boolean>(bridge, 'update_cancel')
        },
        subscribe: (listener) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
        getSnapshot: () => snapshot,
    }
}

const loadTauriBridge = async (): Promise<TauriBridge> => {
    const { invoke, Channel } = await import('@tauri-apps/api/core')
    return {
        invoke: <T>(command: string, args?: Record<string, unknown>) => invoke<T>(command, args),
        channel: <T>(onMessage: (message: T) => void) => new Channel<T>(onMessage),
    }
}

let registeredFlush: PersistFlush | undefined

/** Called once after hydration; the update install saves through it. */
export const registerPersistFlush = (flush: PersistFlush | undefined): void => {
    registeredFlush = flush
}

export const desktopUpdater: DesktopUpdater = createDesktopUpdater({
    isDesktop: () => platform.isTauri,
    isLocalOnly: isLocalOnlyMode,
    isOnline: () => navigator.onLine,
    loadBridge: loadTauriBridge,
    getFlush: () => registeredFlush,
})

/**
 * Tells update.rs whether Local-Only mode is on. Rust then refuses checks and
 * downloads by itself and, when it turns on, stops a running check or download -- a
 * second layer behind the checks above, for a caller that forgot them.
 */
export const syncNativeLocalOnly = async (
    enabled: boolean,
    loadBridge: () => Promise<TauriBridge> = loadTauriBridge,
): Promise<void> => {
    if (!platform.isTauri) return
    const bridge = await loadBridge()
    await bridge.invoke<void>('update_set_local_only', { enabled })
}

export interface FlushUntilStableOptions<S> {
    maxRounds?: number | undefined
    /**
     * Whether two `getState` results write the same snapshot. Default: identity. The
     * app passes the persisted inputs and sameSnapshotInputs, so a change to state
     * the snapshot leaves out never counts as "unsettled".
     */
    isSame?: ((before: S, after: S) => boolean) | undefined
    /**
     * What a store that is still changing after the last round means:
     * - 'accept' (quit): report the last save. The app is closing and its fallback
     *   ends it anyway; a store that never settles must not hold a quit open.
     * - 'refuse' (install): report "not saved". An edit made after the last save
     *   would be lost by the restart, so the install stops and the user retries; it
     *   is refused, not blocked, so nothing waits forever.
     */
    whenUnsettled?: 'accept' | 'refuse' | undefined
}

/**
 * A save for quit and install. One flush saves the state as of its write slot; a
 * change made while that save waits (on the coordinator or the async simulation
 * step) only schedules a debounced save, which a quit or an install would cut off.
 * So it saves again while the state keeps changing, up to `maxRounds`.
 */
export const flushUntilStable =
    <S>(
        flush: PersistFlush,
        getState: () => S,
        options: FlushUntilStableOptions<S> = {},
    ): PersistFlush =>
    async () => {
        const maxRounds = options.maxRounds ?? 3
        const isSame = options.isSame ?? Object.is
        // A comparison that fails must never skip the save itself: the state then
        // counts as unverified, so a quit still saves and an install is refused.
        const read = (): { ok: true; value: S } | { ok: false } => {
            try {
                return { ok: true, value: getState() }
            } catch (error) {
                console.debug('[DesktopLifecycle] cannot compare the saved state:', error)
                return { ok: false }
            }
        }
        for (let round = 1; ; round += 1) {
            const before = read()
            if (!(await flush())) return false
            const after = read()
            if (before.ok && after.ok && isSame(before.value, after.value)) return true
            if (round >= maxRounds) {
                console.debug('[DesktopLifecycle] state still changing after the last save')
                return options.whenUnsettled !== 'refuse'
            }
        }
    }

export interface StartupCheckDeps {
    updater: Pick<DesktopUpdater, 'check'>
    isDesktop: () => boolean
    isLocalOnly: () => boolean
    isOnline: () => boolean
    onAvailable: (info: DesktopUpdateInfo) => void
    delayMs?: number | undefined
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
            .check({ background: true })
            .then((info) => {
                if (info) deps.onAvailable(info)
            })
            .catch((error: unknown) => {
                console.debug('[DesktopUpdate] background check failed:', messageOf(error))
            })
    }, deps.delayMs ?? STARTUP_UPDATE_CHECK_DELAY_MS)
    return () => clearTimeout(timer)
}

/** Emitted by update.rs right before an install ends the process. */
export const SAVE_BEFORE_RESTART_EVENT = 'cannaguide://save-before-restart'

/**
 * The SAVE_BEFORE_RESTART_EVENT handler: save, then tell update.rs to go on. It
 * confirms even when the save fails: the new version is already in place (or the
 * installer is starting), and update.rs would go on after its fallback anyway.
 */
/** After this long the page is evidently still here: the quit or restart did not happen. */
export const LAST_SAVE_HOLD_MS = 10_000

type SuspendPersistence = () => Promise<(() => void) | null>

/**
 * No write may start after the last save before a quit or restart: the native side
 * releases the profile lock first and then closes or hides the window, and the
 * `visibilitychange` save that triggers could land after a new instance took the
 * profile (CodeRabbit on #881). A page still here after LAST_SAVE_HOLD_MS was not
 * ended: saving resumes and catches up with one save.
 */
type HoldKind = 'quit' | 'final-save'

let activeHold: { kind: HoldKind; release: () => void } | undefined

/**
 * Ends a write hold early: the update install failed and the app stays open, or a new
 * quit is starting and needs its save. Saving resumes and catches up with one save.
 * With `kind`, only a hold of that kind is ended -- a failed install must not end the
 * hold of a quit that started meanwhile. Does nothing when no matching hold is active.
 */
export const releaseWriteHold = (kind?: HoldKind): void => {
    const hold = activeHold
    if (!hold || (kind && hold.kind !== kind)) return
    activeHold = undefined
    hold.release()
}

const holdWritesAfterLastSave = async (
    flush: PersistFlush | undefined,
    suspend: SuspendPersistence,
    kind: HoldKind,
): Promise<void> => {
    let resume: (() => void) | null = null
    try {
        resume = await suspend()
    } catch (error) {
        console.warn('[Desktop] could not hold writes after the last save:', messageOf(error))
    }
    if (!resume) return
    const resumeWrites = resume
    let timer: ReturnType<typeof setTimeout> | undefined
    const release = (): void => {
        clearTimeout(timer)
        resumeWrites()
        void flush?.().catch(() => undefined)
    }
    activeHold = { kind, release }
    timer = setTimeout(() => releaseWriteHold(kind), LAST_SAVE_HOLD_MS)
}

export const flushThenConfirmFinalSave = async (
    flush: PersistFlush | undefined,
    loadBridge: () => Promise<TauriBridge> = loadTauriBridge,
    suspend: SuspendPersistence = suspendPersistenceForQuit,
): Promise<void> => {
    // Loaded before the save, so after its last comparison only the confirmation's
    // round trip remains (CodeAnt on #878). Marked handled now; awaited below.
    const pendingBridge = loadBridge()
    pendingBridge.catch(() => undefined)
    releaseWriteHold()
    try {
        const saved = flush ? await flush() : false
        if (!saved) console.warn('[DesktopUpdate] latest changes not saved before the restart')
    } catch (error) {
        console.warn('[DesktopUpdate] save before the restart failed:', messageOf(error))
    }
    await holdWritesAfterLastSave(flush, suspend, 'final-save')
    const bridge = await pendingBridge
    await bridge.invoke<void>('confirm_final_save')
}

/**
 * The `tauri://before-quit` handler: save, then let the app exit. The app quits even
 * when the save fails -- the user asked to quit, and holding the window open would
 * not save anything -- but only after the save has finished, not after a fixed delay.
 */
export const flushThenConfirmQuit = async (
    flush: PersistFlush | undefined,
    loadBridge: () => Promise<TauriBridge> = loadTauriBridge,
    suspend: SuspendPersistence = suspendPersistenceForQuit,
): Promise<void> => {
    // Loaded before the save, so after its last comparison only the confirmation's
    // round trip remains (CodeAnt on #878). Marked handled now; awaited below.
    const pendingBridge = loadBridge()
    pendingBridge.catch(() => undefined)
    // A hold left by a failed update install would refuse this quit's save.
    releaseWriteHold()
    let saved = false
    try {
        saved = flush ? await flush() : false
        if (!saved) console.warn('[DesktopQuit] latest changes not saved before quit')
    } catch (error) {
        console.warn('[DesktopQuit] save before quit failed:', messageOf(error))
    }
    await holdWritesAfterLastSave(flush, suspend, 'quit')
    const bridge = await pendingBridge
    // The quit goes on either way; `saved` tells the native side (and the runtime smoke
    // test) whether this run's last changes reached storage.
    await bridge.invoke<void>('confirm_quit', { saved })
}
