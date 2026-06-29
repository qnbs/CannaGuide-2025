import { describe, expect, it } from 'vitest'
import { FeatureDisabledError, FEATURES } from '@/utils/featureFlags'

describe('featureFlags', () => {
    it('exposes compile-time feature flags', () => {
        expect(typeof FEATURES.OFFLINE_STT).toBe('boolean')
        expect(typeof FEATURES.OFFLINE_TTS).toBe('boolean')
        expect(typeof FEATURES.AR_DIGITAL_TWIN).toBe('boolean')
    })

    it('FeatureDisabledError names the feature', () => {
        const err = new FeatureDisabledError('OFFLINE_STT')
        expect(err).toBeInstanceOf(Error)
        expect(err.name).toBe('FeatureDisabledError')
        expect(err.message).toContain('OFFLINE_STT')
    })
})
