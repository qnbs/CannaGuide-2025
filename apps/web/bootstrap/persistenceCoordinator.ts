type ResumePersistence = () => void

const PERSISTENCE_LOCK_NAME = 'cannaguide.persisted-state'
const RECOVERY_EPOCH_KEY = 'cannaguide.recoveryEpoch'

let persistenceSuspended = false
// Set for good when this page no longer owns the saved data (GH #669). Unlike
// the recovery suspension it is never resumed.
let persistenceStopped = false
let activeWrite: Promise<void> = Promise.resolve()

type RecoveryEpoch = { available: true; value: string | null } | { available: false }

const readRecoveryEpoch = (): RecoveryEpoch => {
    try {
        if (typeof localStorage === 'undefined') return { available: false }
        return { available: true, value: localStorage.getItem(RECOVERY_EPOCH_KEY) }
    } catch {
        return { available: false }
    }
}

const bootRecoveryEpoch = readRecoveryEpoch()

const recoveryEpochChanged = (): boolean => {
    const currentEpoch = readRecoveryEpoch()
    return (
        bootRecoveryEpoch.available &&
        currentEpoch.available &&
        currentEpoch.value !== bootRecoveryEpoch.value
    )
}

const runWithSharedPersistenceLock = async (write: () => Promise<void>): Promise<void> => {
    if (typeof navigator === 'undefined' || !navigator.locks) {
        await write()
        return
    }

    await navigator.locks.request(PERSISTENCE_LOCK_NAME, { mode: 'shared' }, write)
}

/**
 * Serialize recovery against writes in every tab. Recovery is unavailable
 * when Web Locks or the epoch fence are unavailable; silently falling back
 * would permit an in-flight write from another tab to overwrite the restore.
 */
export const runWithExclusiveRecoveryLock = async <T>(
    operation: () => Promise<T>,
): Promise<T | null> => {
    if (typeof navigator === 'undefined' || !navigator.locks || !bootRecoveryEpoch.available)
        return null

    return navigator.locks.request(PERSISTENCE_LOCK_NAME, { mode: 'exclusive' }, async (lock) =>
        lock && !recoveryEpochChanged() ? operation() : null,
    )
}

/** Fence every already-open tab from persisting stale state after recovery. */
export const commitRecoveryEpoch = (): boolean => {
    const current = readRecoveryEpoch()
    if (!current.available) return false

    try {
        const numericEpoch = Number.parseInt(current.value ?? '0', 10)
        localStorage.setItem(
            RECOVERY_EPOCH_KEY,
            Number.isSafeInteger(numericEpoch) ? String(numericEpoch + 1) : '1',
        )
        return true
    } catch {
        return false
    }
}

/** Reload an old tab as soon as another tab commits a recovered snapshot. */
export const handleRecoveryEpochStorageEvent = (
    event: Pick<StorageEvent, 'key' | 'newValue'>,
    reload: () => void = () => globalThis.location.reload(),
): boolean => {
    if (
        event.key !== RECOVERY_EPOCH_KEY ||
        !bootRecoveryEpoch.available ||
        event.newValue === bootRecoveryEpoch.value
    ) {
        return false
    }

    persistenceSuspended = true
    reload()
    return true
}

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        void handleRecoveryEpochStorageEvent(event)
    })
}

const persistenceBlocked = (): boolean =>
    persistenceSuspended || persistenceStopped || recoveryEpochChanged()

/** Serialize writes and skip any write that has not started when recovery begins. */
export const schedulePersistenceWrite = async (write: () => Promise<void>): Promise<boolean> => {
    if (persistenceBlocked()) return false

    let completed = false
    const scheduledWrite = activeWrite.then(async () => {
        if (persistenceBlocked()) return
        await runWithSharedPersistenceLock(async () => {
            // Re-check after acquiring the cross-tab lock. Recovery may have
            // committed a new epoch while this write was queued.
            if (persistenceBlocked()) return
            await write()
            completed = true
        })
    })
    activeWrite = scheduledWrite.catch(() => {})
    await scheduledWrite
    return completed
}

/**
 * Stop new persistence writes and wait for the current one to finish. The caller
 * must resume after a failed recovery; successful recovery stays suspended until reload.
 */
export const suspendPersistenceForRecovery = async (): Promise<ResumePersistence | null> => {
    if (persistenceSuspended) return null

    persistenceSuspended = true
    await activeWrite

    let resumed = false
    return () => {
        if (resumed) return
        resumed = true
        persistenceSuspended = false
    }
}

/**
 * This page must not save any more because another tab may own the data now
 * (the writer role was given up after a failed start, or the page came back
 * from the back/forward cache without the lock). New and queued writes are
 * skipped at once; the returned promise settles when a write that had already
 * started is done. Safe recovery stays available.
 */
export const stopPersistenceForOwnershipLoss = async (): Promise<void> => {
    persistenceStopped = true
    await activeWrite
}
