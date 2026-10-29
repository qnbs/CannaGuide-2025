import type { AppStore } from '@/stores/store'
import { setSetting } from '@/stores/slices/settingsSlice'
import { cloudTtsKeyService } from '@/services/cloudTtsKeyService'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_BACKUP_KEY, REDUX_STATE_KEY } from '@/constants'
import { redactSnapshotSecrets } from '@/utils/redactSecrets'

/**
 * Moves a Cloud TTS key that older versions kept in plain text in the
 * settings into the encrypted key store, before the first save (#654). The
 * settings value is cleared only after the encrypted copy reads back.
 * Returns true when a key was moved: the stored snapshot still holds it in
 * plain text until it is rewritten, so the caller saves at once.
 */
export const migrateLegacySecrets = async (hydratedStore: AppStore): Promise<boolean> => {
    const legacy = hydratedStore.getState().settings.settings.tts.cloudTtsApiKey
    if (legacy === null) return false
    const moved = await cloudTtsKeyService.migrateLegacyKey(legacy)
    if (moved) hydratedStore.dispatch(setSetting({ path: 'tts.cloudTtsApiKey', value: null }))
    return moved
}

/**
 * The startup backup (stores/store.ts) was copied from the stored snapshot
 * before the move, so it still holds the plaintext key. Once the rewritten
 * snapshot is saved, it replaces the backup -- as the next start would -- so
 * a recovery point remains, without the key (#711 review). Redacted again:
 * another tab that still holds the key may have written the snapshot since.
 */
export const replaceBackupWithSavedSnapshot = async (): Promise<void> => {
    const saved = await indexedDBStorage.getItem(REDUX_STATE_KEY)
    if (typeof saved === 'string') {
        await indexedDBStorage.setItem(REDUX_STATE_BACKUP_KEY, redactSnapshotSecrets(saved))
    }
}
