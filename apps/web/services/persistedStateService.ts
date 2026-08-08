import { REDUX_STATE_KEY } from '@/constants'
import { schedulePersistenceWrite } from '@/bootstrap/persistenceCoordinator'
import { migratePersistedSnapshot } from '@/services/migration/persistedSnapshot'
import { indexedDBStorage } from '@/stores/indexedDBStorage'

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

/** Validate, migrate, and atomically replace the primary Redux snapshot. */
export const replacePrimaryPersistedSnapshot = async (snapshot: string): Promise<boolean> => {
    const migratedSnapshot = migratePersistedSnapshot(snapshot)
    return schedulePersistenceWrite(async () => {
        await indexedDBStorage.setItem(REDUX_STATE_KEY, migratedSnapshot)
    })
}

/** Repair a corrupt primary from backup without treating a fenced/failed write as success. */
export const tryRepairPrimaryPersistedSnapshot = async (snapshot: string): Promise<boolean> => {
    try {
        const repaired = await replacePrimaryPersistedSnapshot(snapshot)
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
export const removePrimaryPersistedSnapshot = async (): Promise<boolean> =>
    schedulePersistenceWrite(async () => {
        await indexedDBStorage.removeItem(REDUX_STATE_KEY)
    })

/** Read-modify-write the primary snapshot while holding the shared persistence lock. */
export const updatePrimaryPersistedSnapshot = async (
    update: (state: Record<string, unknown>) => void,
): Promise<boolean> =>
    schedulePersistenceWrite(async () => {
        const snapshot = await indexedDBStorage.getItem(REDUX_STATE_KEY)
        if (!snapshot) return

        const state: unknown = JSON.parse(snapshot)
        if (!isRecord(state)) {
            throw new TypeError('Persisted state must be an object.')
        }
        // Apply the narrow repair to the raw top-level snapshot first. This lets
        // a caller remove the corrupt slice that would otherwise make canonical
        // migration fail before the repair callback could run.
        update(state)
        await indexedDBStorage.setItem(
            REDUX_STATE_KEY,
            migratePersistedSnapshot(JSON.stringify(state)),
        )
    })
