type ResumePersistence = () => void

const PERSISTENCE_LOCK_NAME = 'cannaguide.persisted-state'
const RECOVERY_EPOCH_KEY = 'cannaguide.recoveryEpoch'

let persistenceSuspended = false
let activeWrite: Promise<void> = Promise.resolve()
const bootRecoveryEpoch =
    typeof localStorage === 'undefined' ? null : localStorage.getItem(RECOVERY_EPOCH_KEY)

const recoveryEpochChanged = (): boolean =>
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(RECOVERY_EPOCH_KEY) !== bootRecoveryEpoch

const runWithSharedPersistenceLock = async (write: () => Promise<void>): Promise<void> => {
    if (typeof navigator === 'undefined' || !navigator.locks) {
        await write()
        return
    }

    await navigator.locks.request(PERSISTENCE_LOCK_NAME, { mode: 'shared' }, write)
}

/**
 * Serialize recovery against writes in every tab. `ifAvailable` prevents a
 * second recovery operation from waiting and later replaying stale intent.
 */
export const runWithExclusiveRecoveryLock = async <T>(
    operation: () => Promise<T>,
): Promise<T | null> => {
    if (typeof navigator === 'undefined' || !navigator.locks) {
        return operation()
    }

    return navigator.locks.request(
        PERSISTENCE_LOCK_NAME,
        { mode: 'exclusive', ifAvailable: true },
        async (lock) => (lock ? operation() : null),
    )
}

/** Fence every already-open tab from persisting stale state after recovery. */
export const commitRecoveryEpoch = (): void => {
    if (typeof localStorage === 'undefined') return

    const currentEpoch = Number.parseInt(localStorage.getItem(RECOVERY_EPOCH_KEY) ?? '0', 10)
    localStorage.setItem(
        RECOVERY_EPOCH_KEY,
        Number.isSafeInteger(currentEpoch) ? String(currentEpoch + 1) : '1',
    )
}

/** Serialize writes and skip any write that has not started when recovery begins. */
export const schedulePersistenceWrite = async (write: () => Promise<void>): Promise<boolean> => {
    if (persistenceSuspended || recoveryEpochChanged()) return false

    let completed = false
    const scheduledWrite = activeWrite.then(async () => {
        if (persistenceSuspended || recoveryEpochChanged()) return
        await runWithSharedPersistenceLock(async () => {
            // Re-check after acquiring the cross-tab lock. Recovery may have
            // committed a new epoch while this write was queued.
            if (persistenceSuspended || recoveryEpochChanged()) return
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
