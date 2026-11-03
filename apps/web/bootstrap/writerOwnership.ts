/**
 * One writer tab (GH #669).
 *
 * Every tab holds its own Redux store and saves the whole snapshot to the same
 * IndexedDB key. Two tabs that each saved their own copy would overwrite one
 * another's edits, and an idle tab does so too, because its simulation keeps
 * dispatching. So only one tab may persist: the first one takes this lock and
 * holds it until the page is gone, and any other tab is a reader that shows a
 * notice instead of the app and never starts the store (bootstrap/mountHydratedApp.ts).
 *
 * Without Web Locks the browser cannot tell us whether another tab exists. The
 * role is then 'unsupported' and the app starts as it always did; that case is
 * not covered by this module.
 */

export type WriterRole = 'writer' | 'reader' | 'unsupported'

const WRITER_LOCK_NAME = 'cannaguide.persisted-state.writer'

/**
 * A reload hands the lock over a moment after the new page starts, because the
 * old page is only torn down then. Waiting this long keeps a reload from turning
 * its own tab into a reader.
 */
const CLAIM_PATIENCE_MS = 1500

const getLocks = (): LockManager | undefined =>
    typeof navigator === 'undefined' ? undefined : navigator.locks

const isAbort = (error: unknown): boolean =>
    error instanceof DOMException && error.name === 'AbortError'

/** A lock callback that never returns keeps the lock until the page is destroyed. */
const holdUntilPageIsGone = (): Promise<void> => new Promise<void>(() => undefined)

export const claimWriterRole = (patienceMs: number = CLAIM_PATIENCE_MS): Promise<WriterRole> => {
    const locks = getLocks()
    if (!locks) return Promise.resolve('unsupported')

    return new Promise<WriterRole>((resolve) => {
        const controller = new AbortController()
        const giveUp = setTimeout(() => controller.abort(), patienceMs)
        locks
            .request(WRITER_LOCK_NAME, { signal: controller.signal }, () => {
                clearTimeout(giveUp)
                resolve('writer')
                return holdUntilPageIsGone()
            })
            .catch((error: unknown) => {
                clearTimeout(giveUp)
                resolve(isAbort(error) ? 'reader' : 'unsupported')
            })
    })
}

/**
 * For a reader: calls `onAvailable` once, when the writer is gone and the role
 * is free. The returned function stops waiting.
 */
export const waitForWriterRole = (onAvailable: () => void): (() => void) => {
    const locks = getLocks()
    if (!locks) return () => undefined

    const controller = new AbortController()
    locks
        .request(WRITER_LOCK_NAME, { signal: controller.signal }, () => {
            onAvailable()
            return holdUntilPageIsGone()
        })
        .catch(() => undefined)
    return () => controller.abort()
}
