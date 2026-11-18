// ---------------------------------------------------------------------------
// Desktop startup report -- tells the native shell how this start ended
// ---------------------------------------------------------------------------
// Sent once per page, at the end of the start (bootstrap/mountHydratedApp.ts).
// The native side logs the outcome. Under the desktop runtime smoke test
// (CANNAGUIDE_SMOKE_REPORT, scripts/desktop-smoke.mjs) it also writes the report
// to a file and quits through the normal quit handshake. A start that never
// reports is what that test catches: a native crash, a blank window, a bundle
// that never ran, or IPC that never reached the native side.
//
// The report holds no user data: an outcome, the build version, which view is
// on screen, the Local-Only flag and whether a saved snapshot exists.
// ---------------------------------------------------------------------------
import { REDUX_STATE_KEY } from '@/constants'
import { hasStoredItem } from '@/stores/indexedDBStorage'
import { isLocalOnlyMode } from './localOnlyModeService'
import { platform } from './platformService'

/** How the start ended; mirrors `StartupOutcome` in apps/desktop/src-tauri/src/startup.rs. */
export type DesktopStartupOutcome =
    | 'started'
    | 'error'
    | 'reader'
    | 'unverified'
    | 'stale'
    | 'newer-snapshot'

/** `app`: the main view; `dialog`: a modal such as onboarding on a first start. */
export type DesktopStartupView = 'app' | 'dialog' | 'none'

export interface DesktopStartupReport {
    outcome: DesktopStartupOutcome
    frontendVersion: string
    view: DesktopStartupView
    localOnly: boolean
    savedSnapshotPresent: boolean
    detail?: string
}

const MAX_DETAIL_LENGTH = 300

export const currentStartupView = (doc: Document): DesktopStartupView => {
    if (doc.getElementById('main-content')) return 'app'
    if (doc.querySelector('[role="dialog"]')) return 'dialog'
    return 'none'
}

const describeError = (error: unknown): string =>
    (error instanceof Error ? `${error.name}: ${error.message}` : String(error)).slice(
        0,
        MAX_DETAIL_LENGTH,
    )

const snapshotPresent = async (): Promise<boolean> => {
    try {
        return await hasStoredItem(REDUX_STATE_KEY)
    } catch {
        return false
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
    localOnly: isLocalOnlyMode(),
    savedSnapshotPresent: await snapshotPresent(),
    ...(error === undefined ? {} : { detail: describeError(error) }),
})

/** Lets React commit the render the start just scheduled before the view is read. */
const afterNextPaint = (): Promise<void> =>
    new Promise((resolve) => {
        if (typeof requestAnimationFrame !== 'function') {
            resolve()
            return
        }
        requestAnimationFrame(() => setTimeout(resolve, 0))
    })

let reported = false

/** Reports the outcome once per page. Never throws: a report must not break the start. */
export const reportDesktopStartup = async (
    outcome: DesktopStartupOutcome,
    error?: unknown,
): Promise<void> => {
    if (!platform.isTauri || reported) return
    reported = true
    try {
        await afterNextPaint()
        const report = await buildDesktopStartupReport(outcome, error)
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
