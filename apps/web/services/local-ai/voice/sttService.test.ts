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

import { transcribeAudio } from './sttService'

describe('sttService (skeleton)', () => {
    it('throws FeatureDisabledError when OFFLINE_STT flag is off', async () => {
        const audio = new Blob([new Uint8Array([0])])
        await expect(transcribeAudio(audio)).rejects.toThrow(/OFFLINE_STT/)
        await expect(transcribeAudio(audio)).rejects.toThrow(/disabled/)
    })

    it('throws synchronously enough that test runners see the rejection promptly', async () => {
        const audio = new Blob([new Uint8Array([0])])
        const start = Date.now()
        await expect(transcribeAudio(audio)).rejects.toBeDefined()
        expect(Date.now() - start).toBeLessThan(50)
    })
})
