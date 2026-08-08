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

        const state: unknown = JSON.parse(migratePersistedSnapshot(snapshot))
        if (!isRecord(state)) {
            throw new TypeError('Migrated persisted state must be an object.')
        }
        update(state)
        await indexedDBStorage.setItem(
            REDUX_STATE_KEY,
            migratePersistedSnapshot(JSON.stringify(state)),
        )
    })
