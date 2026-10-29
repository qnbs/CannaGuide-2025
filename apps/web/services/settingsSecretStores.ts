import type { AppSettings } from '@/types'
import type { SecretSettingPath } from '@/utils/redactSecrets'
import type { SecretKeyStore } from '@/services/secretKeyStore'
import { cloudTtsKeyService } from '@/services/cloudTtsKeyService'
import { porcupineKeyService } from '@/services/porcupineKeyService'

export interface SettingsSecretStore {
    /** Where older versions kept the key in plain text. */
    path: SecretSettingPath
    readLegacy: (settings: AppSettings) => string | null
    store: SecretKeyStore
}

export const CLOUD_TTS_SECRET: SettingsSecretStore = {
    path: 'tts.cloudTtsApiKey',
    readLegacy: (settings) => settings.tts.cloudTtsApiKey,
    store: cloudTtsKeyService,
}

export const PORCUPINE_SECRET: SettingsSecretStore = {
    path: 'voiceControl.porcupineAccessKey',
    readLegacy: (settings) => settings.voiceControl.porcupineAccessKey,
    store: porcupineKeyService,
}

/** Every credential that has its own encrypted store instead of a settings field. */
export const SETTINGS_SECRET_STORES: readonly SettingsSecretStore[] = [
    CLOUD_TTS_SECRET,
    PORCUPINE_SECRET,
]

/** Settings paths whose legacy plaintext must stay in the snapshot for now. */
export const pendingLegacySecretPaths = (): SecretSettingPath[] =>
    SETTINGS_SECRET_STORES.filter(({ store }) => store.isLegacyKeyPending()).map(({ path }) => path)
