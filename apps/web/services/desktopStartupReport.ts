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

/** A blocked IndexedDB open must not hold the report back; the flag is diagnostic only. */
export const SNAPSHOT_PROBE_MS = 2000

const snapshotPresent = async (): Promise<boolean> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const deadline = new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), SNAPSHOT_PROBE_MS)
    })
    try {
        return await Promise.race([hasStoredItem(REDUX_STATE_KEY), deadline])
    } catch {
        return false
    } finally {
        clearTimeout(timer)
    }
}

export const buildDesktopStartupReport = async (
    outcome: DesktopStartupOutcome,
    error?: unknown,
    doc: Document = document,
): Promise<DesktopStartupReport> => ({
    outcome,
    frontendVersion: __APP_VERSION__,
    view: currentStartupView(doc),
    visible: doc.visibilityState === 'visible',
    hydration: getStartupHydration(),
    localOnly: isLocalOnlyMode(),
    savedSnapshotPresent: await snapshotPresent(),
    serviceWorkerControlled:
        'serviceWorker' in navigator && navigator.serviceWorker.controller !== null,
    ...(error === undefined ? {} : { errorCode: errorCodeOf(error) }),
})

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
