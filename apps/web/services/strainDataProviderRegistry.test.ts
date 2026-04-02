/**
 * Tests for strainDataProviderRegistry
 */

import { describe, it, expect } from 'vitest'
import {
    PROVIDER_CONFIGS,
    getProviderStatus,
    getProvidersForCapability,
    getAvailableProviders,
    getProvidersByQuality,
    buildProvenance,
} from '@/services/strainDataProviderRegistry'

describe('PROVIDER_CONFIGS', () => {
    it('contains 8 providers', () => {
        expect(Object.keys(PROVIDER_CONFIGS)).toHaveLength(8)
    })

    it('all providers have required config fields', () => {
        for (const [, config] of Object.entries(PROVIDER_CONFIGS)) {
            expect(config.name).toBeTruthy()
            expect(typeof config.baseUrl).toBe('string')
            expect(config.capabilities).toBeInstanceOf(Array)
            expect(config.capabilities.length).toBeGreaterThan(0)
            expect(config.qualityTier).toBeGreaterThanOrEqual(1)
            expect(config.qualityTier).toBeLessThanOrEqual(3)
            expect(config.rateLimitPerMin).toBeGreaterThan(0)
        }
    })
})

describe('getProviderStatus', () => {
    it('returns status string for known provider', () => {
        const status = getProviderStatus('otreeba')
        expect(typeof status).toBe('string')
        expect(['available', 'unavailable', 'rate-limited', 'no-key']).toContain(status)
    })
})

describe('getProvidersForCapability', () => {
    it('returns providers with search capability', () => {
        const providers = getProvidersForCapability('search')
        expect(providers.length).toBeGreaterThan(0)
        for (const p of providers) {
            expect(p.capabilities).toContain('search')
        }
    })

    it('returns providers with lineage capability', () => {
        const providers = getProvidersForCapability('lineage')
        expect(providers.length).toBeGreaterThan(0)
    })

    it('returns providers with lab-results capability', () => {
        const providers = getProvidersForCapability('lab-results')
        expect(providers.length).toBeGreaterThan(0)
    })
})

describe('getAvailableProviders', () => {
    it('returns an array of provider configs', () => {
        const providers = getAvailableProviders()
        expect(providers).toBeInstanceOf(Array)
        expect(providers.length).toBeGreaterThan(0)
    })
})

describe('getProvidersByQuality', () => {
    it('returns providers sorted by quality tier', () => {
        const providers = getProvidersByQuality()
        for (let i = 1; i < providers.length; i++) {
            const prev = providers[i - 1]
            const curr = providers[i]
            if (prev && curr) {
                expect(prev.qualityTier).toBeLessThanOrEqual(curr.qualityTier)
            }
        }
    })
})

describe('buildProvenance', () => {
    it('creates a provenance record', () => {
        const prov = buildProvenance('otreeba', 'ot-123', true)
        expect(prov.provider).toBe('otreeba')
        expect(prov.externalId).toBe('ot-123')
        expect(prov.labVerified).toBe(true)
        expect(prov.fetchedAt).toBeTruthy()
        expect(prov.confidence).toBeGreaterThan(0)
    })

    it('uses provider tier for confidence', () => {
        const tier1 = buildProvenance('cannlytics', 'c-1', false)
        const tier3 = buildProvenance('kushy', 'k-1', false)
        expect(tier1.confidence).toBeGreaterThan(tier3.confidence)
    })
})
