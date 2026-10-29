import type { AppStore } from '@/stores/store'
import { setSetting } from '@/stores/slices/settingsSlice'
import { SETTINGS_SECRET_STORES, pendingLegacySecretPaths } from '@/services/settingsSecretStores'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_BACKUP_KEY, REDUX_STATE_KEY } from '@/constants'
import { redactSnapshotSecrets } from '@/utils/redactSecrets'

/**
 * Moves credentials that older versions kept in plain text in the settings
 * (Cloud TTS key, Porcupine access key) into their encrypted key stores,
 * before the first save (#654, #709). A settings value is cleared only after
 * its encrypted copy reads back. Returns true when a key was moved: the
 * stored snapshot still holds it in plain text until it is rewritten, so the
 * caller saves at once.
 */
export const migrateLegacySecrets = async (hydratedStore: AppStore): Promise<boolean> => {
    let moved = false
    for (const { path, readLegacy, store } of SETTINGS_SECRET_STORES) {
        const legacy = readLegacy(hydratedStore.getState().settings.settings)
        if (legacy === null) continue
        if (await store.migrateLegacyKey(legacy)) {
            hydratedStore.dispatch(setSetting({ path, value: null }))
            moved = true
        }
    }
    return moved
}

/**
 * The startup backup (stores/store.ts) was copied from the stored snapshot
 * before the move, so it still holds the plaintext key. Once the rewritten
 * snapshot is saved, it replaces the backup -- as the next start would -- so
 * a recovery point remains, without the key (#711 review). Redacted again:
 * another tab that still holds the key may have written the snapshot since.
 * A key whose own migration is still pending stays, as in the snapshot: one
 * key moving must not cost the backup the other one (#744 review).
 */
export const replaceBackupWithSavedSnapshot = async (): Promise<void> => {
    const saved = await indexedDBStorage.getItem(REDUX_STATE_KEY)
    if (typeof saved === 'string') {
        await indexedDBStorage.setItem(
            REDUX_STATE_BACKUP_KEY,
            redactSnapshotSecrets(saved, pendingLegacySecretPaths()),
        )
    }
}
