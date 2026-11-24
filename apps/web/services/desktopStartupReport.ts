// ---------------------------------------------------------------------------
// Desktop startup report -- tells the native shell how this start ended
// ---------------------------------------------------------------------------
// Sent once per page, at the end of the start (bootstrap/mountHydratedApp.ts), after
// the writes the start scheduled have settled: a save that is refused there turns the
// page stale first, and the outcome and view are read from that settled state.
// The native side logs the outcome. Under the desktop runtime smoke test
// (CANNAGUIDE_SMOKE_REPORT, scripts/desktop-smoke.mjs) it also writes the report
// to a file and quits through the normal quit handshake. A start that never
// reports is what that test catches: a native crash, a blank window, a bundle
// that never ran, or IPC that never reached the native side.
//
// The report holds no user data: an outcome, the build version, which view is on
// screen, whether the page is visible, where the state came from (saved snapshot,
// backup or fresh), the Local-Only flag, whether a saved snapshot exists, whether a
// service worker controls the page, and for an error only its class name -- never its
// message.
// ---------------------------------------------------------------------------
import { whenPersistenceIdle } from '@/bootstrap/persistenceCoordinator'
import { REDUX_STATE_KEY } from '@/constants'
import { hasStoredItem } from '@/stores/indexedDBStorage'
import { getStartupHydration, type StartupHydration } from '@/stores/store'
import { isLocalOnlyMode } from './localOnlyModeService'
import { platform } from './platformService'

/** How the start ended; mirrors `StartupOutcome` in apps/desktop/src-tauri/src/startup.rs. */
export type DesktopStartupOutcome =
    'started' | 'error' | 'reader' | 'unverified' | 'stale' | 'newer-snapshot'

/** `app`: the main view; `dialog`: a modal such as onboarding on a first start. */
export type DesktopStartupView = 'app' | 'dialog' | 'none'

export interface DesktopStartupReport {
    outcome: DesktopStartupOutcome
    frontendVersion: string
    view: DesktopStartupView
    /** document.visibilityState: a window that starts hidden or minimized reports false. */
    visible: boolean
    /** Whether the started state is the saved snapshot, the backup, or fresh defaults. */
    hydration: StartupHydration
    localOnly: boolean
    /** Diagnostic only: a stored snapshot can exist and still not have been loaded. */
    savedSnapshotPresent: boolean
    /** Whether a service worker controls this page; the desktop shell runs none (GH #931). */
    serviceWorkerControlled: boolean
    /**
     * Whether a service worker is registered for this origin, read once the page has loaded
     * (the old code registered on load). null when the lookup failed or did not answer in time:
     * the smoke test then fails rather than reading "unknown" as "none".
     */
    serviceWorkerRegistered: boolean | null
    /** An error's class name, e.g. "TypeError"; the native side enforces the shape. */
    errorCode?: string
}

const ERROR_CODE = /^[A-Za-z][A-Za-z0-9]{0,63}$/

export const currentStartupView = (doc: Document): DesktopStartupView => {
    if (doc.getElementById('main-content')) return 'app'
    if (doc.querySelector('[role="dialog"]')) return 'dialog'
    return 'none'
}

/** The class name only: a message can carry user text (a file name, a note). */
export const errorCodeOf = (error: unknown): string => {
    const name = error instanceof Error ? error.name : typeof error
    return ERROR_CODE.test(name) ? name : 'UnrecognizedError'
}

/**
 * A blocked IndexedDB open or a stuck service-worker lookup must not hold the report back.
 * A probe that fails or does not answer in time reads as its fallback.
 */
export const SNAPSHOT_PROBE_MS = 2000

/**
 * A cold start can fire `load` late (a slow runner, a large bundle). That wait has its own,
 * longer bound, so it does not eat the registration lookup's probe time; the desktop smoke
 * allows 120 s for the whole report.
 */
export const LOAD_WAIT_MS = 30_000

const withinProbeTime = async <T>(
    probe: () => Promise<T>,
    fallback: T,
    ms = SNAPSHOT_PROBE_MS,
): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const deadline = new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms)
    })
    try {
        return await Promise.race([probe(), deadline])
    } catch {
        return fallback
    } finally {
        clearTimeout(timer)
    }
}

/** Diagnostic only, so an unreadable store reads as no snapshot. */
const snapshotPresent = (): Promise<boolean> =>
    withinProbeTime(() => hasStoredItem(REDUX_STATE_KEY), false)

/** The old code registered the worker from a load listener, so wait for load first. */
const pageLoaded = (): Promise<void> =>
    document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise((resolve) => {
              window.addEventListener('load', () => resolve(), { once: true })
          })

/** A gate reads this, so a failed or unanswered lookup is null, never false. */
const serviceWorkerRegistered = async (): Promise<boolean | null> => {
    if (!('serviceWorker' in navigator)) return false
    const loaded = await withinProbeTime(() => pageLoaded().then(() => true), false, LOAD_WAIT_MS)
    if (!loaded) return null
    // Every registration on the origin, not only one whose scope covers this page.
    return withinProbeTime<boolean | null>(
        async () => (await navigator.serviceWorker.getRegistrations()).length > 0,
        null,
    )
}

export const buildDesktopStartupReport = async (
    outcome: DesktopStartupOutcome,
    error?: unknown,
    doc: Document = document,
): Promise<DesktopStartupReport> => {
    const [saved, registered] = await Promise.all([snapshotPresent(), serviceWorkerRegistered()])
    return {
        outcome,
        frontendVersion: __APP_VERSION__,
        view: currentStartupView(doc),
        visible: doc.visibilityState === 'visible',
        hydration: getStartupHydration(),
        localOnly: isLocalOnlyMode(),
        savedSnapshotPresent: saved,
        serviceWorkerControlled:
            'serviceWorker' in navigator && navigator.serviceWorker.controller !== null,
        serviceWorkerRegistered: registered,
        ...(error === undefined ? {} : { errorCode: errorCodeOf(error) }),
    }
}

/** A hidden or minimized window never paints, so the wait for a frame is bounded. */
export const PAINT_WAIT_MS = 2000

/**
 * Lets React commit the render the start just scheduled before the view is read.
 * requestAnimationFrame does not fire for a hidden page; the report must still go out
 * then (with visible: false), or the start would look like a hang.
 */
const afterNextPaint = (): Promise<void> =>
    new Promise((resolve) => {
        const fallback = setTimeout(resolve, PAINT_WAIT_MS)
        if (typeof requestAnimationFrame !== 'function') return
        requestAnimationFrame(() =>
            setTimeout(() => {
                clearTimeout(fallback)
                resolve()
            }, 0),
        )
    })

let reported = false

/**
 * Reports the outcome once per page. Never throws: a report must not break the start.
 * `outcome` can be a function, read only once the start's writes have settled.
 */
export const reportDesktopStartup = async (
    outcome: DesktopStartupOutcome | (() => DesktopStartupOutcome),
    error?: unknown,
): Promise<void> => {
    if (!platform.isTauri || reported) return
    reported = true
    try {
        await whenPersistenceIdle()
        await afterNextPaint()
        const settled = typeof outcome === 'function' ? outcome() : outcome
        const report = await buildDesktopStartupReport(settled, error)
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('frontend_ready', { report })
    } catch (reportError) {
        console.debug('[Desktop] Could not send the startup report:', reportError)
    }
}

/** Test seam: forget that this page reported. */
export const resetDesktopStartupReportForTests = (): void => {
    reported = false
}
