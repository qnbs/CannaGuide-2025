import { PORCUPINE_ACCESS_KEY_STORAGE_KEY } from '@/constants'
import { createSecretKeyStore } from '@/services/secretKeyStore'

/** The Picovoice (Porcupine wake word) access key, encrypted outside the settings (#709). */
export const porcupineKeyService = createSecretKeyStore(PORCUPINE_ACCESS_KEY_STORAGE_KEY)
