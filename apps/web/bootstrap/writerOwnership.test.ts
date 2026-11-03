import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    claimWriterRole,
    releaseWriterRole,
    waitForWriterRole,
    watchForCacheRestore,
} from './writerOwnership'

type LockCallback = (lock: object) => unknown

/**
 * One origin's lock manager shared by every simulated tab. A lock is held until
 * its callback settles or `closeHolder` simulates the holding tab going away;
 * waiters are served in order and can be aborted, as the Web Locks API does.
 */
const createLockManager = () => {
    let held = false
    const queue: (() => void)[] = []
    const grantNext = () => queue.shift()?.()
    return {
        closeHolder: () => {
            held = false
            grantNext()
        },
        isHeld: () => held,
        request: (_name: string, options: { signal?: AbortSignal }, callback: LockCallback) =>
            new Promise<unknown>((resolve, reject) => {
                const start = () => {
                    held = true
                    Promise.resolve(callback({}))
                        .then(resolve, reject)
                        .then(() => {
                            held = false
                            grantNext()
                        })
                }
                if (!held) {
                    start()
                    return
                }
                queue.push(start)
                options.signal?.addEventListener('abort', () => {
                    const index = queue.indexOf(start)
                    if (index === -1) return
                    queue.splice(index, 1)
                    reject(new DOMException('The request was aborted.', 'AbortError'))
                })
            }),
    }
}

const stubLocks = (locks?: unknown) => {
    vi.stubGlobal('navigator', { locks })
}

describe('claimWriterRole', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('makes the first tab the writer and a second tab a reader', async () => {
        stubLocks(createLockManager())

        await expect(claimWriterRole(10)).resolves.toBe('writer')
        await expect(claimWriterRole(10)).resolves.toBe('reader')
    })

    it('waits briefly, so a reload does not lose the role to the page it replaces', async () => {
        const locks = createLockManager()
        stubLocks(locks)
        await claimWriterRole(10)

        const reloaded = claimWriterRole(500)
        locks.closeHolder()

        await expect(reloaded).resolves.toBe('writer')
    })

    it('does not stay queued behind the writer once it has given up', async () => {
        const locks = createLockManager()
        stubLocks(locks)
        await claimWriterRole(10)
        await expect(claimWriterRole(10)).resolves.toBe('reader')

        locks.closeHolder()

        expect(locks.isHeld()).toBe(false)
    })

    it('reports that ownership cannot be decided without Web Locks', async () => {
        stubLocks()

        await expect(claimWriterRole(10)).resolves.toBe('unsupported')
    })

    it('treats a lock request the browser refuses as unsupported, not as a reader', async () => {
        stubLocks({
            request: () => Promise.reject(new DOMException('Not allowed.', 'SecurityError')),
        })

        await expect(claimWriterRole(10)).resolves.toBe('unsupported')
    })
})

describe('releaseWriterRole', () => {
    afterEach(() => {
        // The module keeps the hold of the last claim; do not hand it to the next test.
        releaseWriterRole()
        vi.unstubAllGlobals()
    })

    it('hands the role to the next tab while this page stays open', async () => {
        stubLocks(createLockManager())
        await claimWriterRole(10)
        await expect(claimWriterRole(10)).resolves.toBe('reader')

        releaseWriterRole()

        await expect(claimWriterRole(10)).resolves.toBe('writer')
    })

    it('does nothing when this page holds no role', () => {
        expect(() => releaseWriterRole()).not.toThrow()
    })
})

describe('waitForWriterRole', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('calls back once when the writer goes away', async () => {
        const locks = createLockManager()
        stubLocks(locks)
        await claimWriterRole(10)
        const onAvailable = vi.fn()

        waitForWriterRole(onAvailable)
        expect(onAvailable).not.toHaveBeenCalled()

        locks.closeHolder()
        await vi.waitFor(() => expect(onAvailable).toHaveBeenCalledOnce())
    })

    it('stops waiting when cancelled', async () => {
        const locks = createLockManager()
        stubLocks(locks)
        await claimWriterRole(10)
        const onAvailable = vi.fn()

        const cancel = waitForWriterRole(onAvailable)
        cancel()
        locks.closeHolder()
        await Promise.resolve()

        expect(onAvailable).not.toHaveBeenCalled()
    })

    it('does nothing without Web Locks', () => {
        stubLocks()
        const onAvailable = vi.fn()

        expect(() => waitForWriterRole(onAvailable)()).not.toThrow()
        expect(onAvailable).not.toHaveBeenCalled()
    })
})

describe('watchForCacheRestore', () => {
    const showPage = (persisted: boolean) =>
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted }))

    it('calls back only when the page comes back from the back/forward cache', () => {
        const onRestore = vi.fn()
        const stop = watchForCacheRestore(onRestore)

        showPage(false)
        expect(onRestore).not.toHaveBeenCalled()

        showPage(true)
        expect(onRestore).toHaveBeenCalledOnce()
        stop()
    })

    it('stops calling back once removed', () => {
        const onRestore = vi.fn()
        watchForCacheRestore(onRestore)()

        showPage(true)

        expect(onRestore).not.toHaveBeenCalled()
    })
})
