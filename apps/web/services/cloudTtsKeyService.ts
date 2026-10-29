import { CLOUD_TTS_API_KEY_STORAGE_KEY } from '@/constants'
import { createSecretKeyStore } from '@/services/secretKeyStore'

/** The ElevenLabs (Cloud TTS) API key, encrypted outside the settings (#654). */
export const cloudTtsKeyService = createSecretKeyStore(CLOUD_TTS_API_KEY_STORAGE_KEY)
