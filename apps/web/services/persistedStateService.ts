import {
    commitRecoveryEpoch,
    runWithExclusiveRecoveryLock,
    schedulePersistenceWrite,
    suspendPersistenceForRecovery,
} from '@/bootstrap/persistenceCoordinator'
import { migratePersistedSnapshot } from '@/services/migration/persistedSnapshot'
import { replaceSnapshot, updateSnapshot } from '@/stores/snapshotRevision'

export interface RecoverySnapshotReplacementResult {
    success: boolean
    reloadRequired: boolean
    error?: unknown
}

/**
 * Data in another store that the restored snapshot depends on (backup images).
 *
 * The two IndexedDB databases cannot share a transaction, so the order is the
 * protocol: `apply` commits first, and the primary snapshot is replaced only
 * after it succeeded. A failed `apply` therefore leaves the current snapshot
 * untouched. If the primary write then fails, `revert` undoes `apply`; if even
 * that fails, the dependent data is unreferenced but nothing current is lost.
 */
export interface DependentStoreWrite {
    apply: () => Promise<void>
    revert: () => Promise<void>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Validate, migrate, and atomically replace the primary Redux snapshot. Callers
 * reload afterwards, except the repair at start (`continueSaving`).
 */
export const replacePrimaryPersistedSnapshot = async (
    snapshot: string,
    continueSaving = false,
): Promise<boolean> => {
    const migratedSnapshot = migratePersistedSnapshot(snapshot)
    const replaced = await schedulePersistenceWrite(async () => {
        await replaceSnapshot(migratedSnapshot, continueSaving)
    })
    return replaced
}

/** Replace a snapshot and any dependent stores while stale persistence is fenced. */
export const replacePrimaryPersistedSnapshotForRecovery = async (
    snapshot: string,
    dependentWrite?: DependentStoreWrite,
): Promise<RecoverySnapshotReplacementResult> => {
    const migratedSnapshot = migratePersistedSnapshot(snapshot)
    const resumePersistence = await suspendPersistenceForRecovery()
    if (!resumePersistence) {
        return { success: false, reloadRequired: false }
    }

    let recoveryEpochCommitted = false
    try {
        const result = await runWithExclusiveRecoveryLock(async () => {
            let dependentApplied = false
            let primaryReplaced = false
            try {
                await dependentWrite?.apply()
                dependentApplied = true
                await replaceSnapshot(migratedSnapshot)
                primaryReplaced = true
                if (!commitRecoveryEpoch()) {
                    throw new Error('Could not commit the cross-tab restore fence.')
                }
                recoveryEpochCommitted = true
                return { success: true, reloadRequired: true }
            } catch (error) {
                if (primaryReplaced) {
                    // The restored snapshot is live and references the dependent data.
                    recoveryEpochCommitted = commitRecoveryEpoch()
                } else if (dependentApplied && dependentWrite) {
                    try {
                        await dependentWrite.revert()
                    } catch (revertError) {
                        console.debug('[Store] Could not revert restore data:', revertError)
                    }
                }
                return {
                    success: false,
                    reloadRequired: primaryReplaced || recoveryEpochCommitted,
                    error,
                }
            }
        })

        if (result === null) {
            resumePersistence()
            return { success: false, reloadRequired: false }
        }
        if (!result.reloadRequired) resumePersistence()
        return result
    } catch (error) {
        if (!recoveryEpochCommitted) resumePersistence()
        return { success: false, reloadRequired: recoveryEpochCommitted, error }
    }
}

/** Repair a corrupt primary from backup without treating a fenced/failed write as success. */
export const tryRepairPrimaryPersistedSnapshot = async (snapshot: string): Promise<boolean> => {
    try {
        const repaired = await replacePrimaryPersistedSnapshot(snapshot, true)
        if (!repaired) {
            console.debug('[Store] Primary snapshot repair was fenced by recovery.')
        }
        return repaired
    } catch (repairError) {
        console.debug('[Store] Could not repair primary snapshot from backup:', repairError)
        return false
    }
}

/** Remove the primary snapshot without racing recovery or another writer. */
export const removePrimaryPersistedSnapshot = async (): Promise<boolean> => {
    const removed = await schedulePersistenceWrite(async () => {
        await replaceSnapshot(null)
    })
    return removed
}

/**
 * Read-modify-write the primary snapshot while holding the shared persistence lock.
 * A save by another tab between the read and the write makes it throw
 * StaleSnapshotError instead of overwriting that save.
 */
export const updatePrimaryPersistedSnapshot = async (
    update: (state: Record<string, unknown>) => void,
): Promise<boolean> => {
    const updated = await schedulePersistenceWrite(async () => {
        await updateSnapshot((snapshot) => {
            if (!snapshot) return null

            const state: unknown = JSON.parse(snapshot)
            if (!isRecord(state)) {
                throw new TypeError('Persisted state must be an object.')
            }
            // Apply the narrow repair to the raw top-level snapshot first. This lets
            // a caller remove the corrupt slice that would otherwise make canonical
            // migration fail before the repair callback could run.
            update(state)
            return migratePersistedSnapshot(JSON.stringify(state))
        })
    })
    return updated
}
