import { describe, it, expect, vi } from 'vitest'

vi.mock('@/utils/featureFlags', () => ({
    FEATURES: { OFFLINE_STT: false, OFFLINE_TTS: false, AR_DIGITAL_TWIN: false },
    FeatureDisabledError: class FeatureDisabledError extends Error {
        constructor(feature: string) {
            super(`Feature "${feature}" is disabled.`)
            this.name = 'FeatureDisabledError'
        }
    },
}))

import { synthesizeSpeech } from './ttsOfflineService'

describe('ttsOfflineService (skeleton)', () => {
    it('throws FeatureDisabledError when OFFLINE_TTS flag is off', async () => {
        await expect(synthesizeSpeech('hello world')).rejects.toThrow(/OFFLINE_TTS/)
        await expect(synthesizeSpeech('hello world')).rejects.toThrow(/disabled/)
    })

    it('rejects synchronously without touching the network', async () => {
        const start = Date.now()
        await expect(synthesizeSpeech('test')).rejects.toBeDefined()
        expect(Date.now() - start).toBeLessThan(50)
    })
})
