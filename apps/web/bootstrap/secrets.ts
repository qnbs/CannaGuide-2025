import type { AppStore } from '@/stores/store'
import { setSetting } from '@/stores/slices/settingsSlice'
import { cloudTtsKeyService } from '@/services/cloudTtsKeyService'

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
