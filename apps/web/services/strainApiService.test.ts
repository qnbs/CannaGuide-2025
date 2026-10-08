import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/localOnlyModeService', () => ({
    isLocalOnlyMode: vi.fn().mockReturnValue(false),
}))

vi.mock('@/services/terpeneService', () => ({
    resolveTerpeneName: vi.fn((name: string) => name.toLowerCase()),
}))

import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import {
    mergeExternalData,
    clearStrainApiCache,
    searchOtreeba,
    fetchOtreebaStrain,
    searchCannlytics,
    searchExternalStrainData,
    getAvailableProviders,
} from '@/services/strainApiService'

describe('strainApiService', () => {
    beforeEach(() => {
        clearStrainApiCache()
        vi.clearAllMocks()
        vi.mocked(isLocalOnlyMode).mockReturnValue(false)
    })

    describe('mergeExternalData', () => {
        it('merges terpene profiles without overwriting existing', () => {
            const existing = {
                terpeneProfile: { Myrcene: 0.5 },
            }
            const external = {
                provider: 'otreeba' as const,
                name: 'Test',
                terpeneProfile: { Myrcene: 0.3, Limonene: 0.2 },
            }
            const result = mergeExternalData(existing, external)
            // existing myrcene (0.5) should NOT be overwritten
            expect(result.terpeneProfile?.Myrcene).toBe(0.5)
            // new limonene should be added
            expect(result.terpeneProfile?.Limonene).toBe(0.2)
        })

        it('merges cannabinoid profiles without overwriting existing', () => {
            const existing = {
                cannabinoidProfile: { THC: 21 },
            }
            const external = {
                provider: 'cannlytics' as const,
                name: 'Test',
                cannabinoidProfile: { THC: 18, CBD: 1 },
            }
            const result = mergeExternalData(existing, external)
            expect(result.cannabinoidProfile?.THC).toBe(21)
            expect(result.cannabinoidProfile?.CBD).toBe(1)
        })

        it('handles empty existing profiles', () => {
            const result = mergeExternalData(
                {},
                {
                    provider: 'otreeba' as const,
                    name: 'Test',
                    terpeneProfile: { Caryophyllene: 0.4 },
                },
            )
            expect(result.terpeneProfile?.Caryophyllene).toBe(0.4)
        })

        it('handles no external profiles', () => {
            const existing = { terpeneProfile: { Myrcene: 0.5 } }
            const result = mergeExternalData(existing, {
                provider: 'otreeba' as const,
                name: 'Test',
            })
            expect(result.terpeneProfile?.Myrcene).toBe(0.5)
        })
    })

    describe('clearStrainApiCache', () => {
        it('clears without error', () => {
            expect(() => clearStrainApiCache()).not.toThrow()
        })
    })

    describe('local-only mode', () => {
        beforeEach(() => {
            vi.mocked(isLocalOnlyMode).mockReturnValue(true)
        })

        it('searchOtreeba returns empty in local-only mode', async () => {
            const results = await searchOtreeba('test')
            expect(results).toEqual([])
        })

        it('fetchOtreebaStrain returns null in local-only mode', async () => {
            const result = await fetchOtreebaStrain('test')
            expect(result).toBeNull()
        })

        it('searchCannlytics returns empty in local-only mode', async () => {
            const results = await searchCannlytics('test')
            expect(results).toEqual([])
        })

        it('searchExternalStrainData returns empty in local-only mode', async () => {
            const results = await searchExternalStrainData('test')
            expect(results).toEqual([])
        })
    })

    describe('getAvailableProviders', () => {
        it('returns empty when no API keys configured', () => {
            const providers = getAvailableProviders()
            expect(providers).toEqual([])
        })
    })

    describe('disabled external lookups', () => {
        it('searchOtreeba does not call fetch', async () => {
            const fetchMock = vi.fn()
            vi.stubGlobal('fetch', fetchMock)
            const results = await searchOtreeba('blue', 5)
            expect(results).toEqual([])
            expect(fetchMock).not.toHaveBeenCalled()
            vi.unstubAllGlobals()
        })

        it('fetchOtreebaStrain does not call fetch', async () => {
            const fetchMock = vi.fn()
            vi.stubGlobal('fetch', fetchMock)
            const result = await fetchOtreebaStrain('blue')
            expect(result).toBeNull()
            expect(fetchMock).not.toHaveBeenCalled()
            vi.unstubAllGlobals()
        })

        it('searchCannlytics does not call fetch', async () => {
            const fetchMock = vi.fn()
            vi.stubGlobal('fetch', fetchMock)
            const results = await searchCannlytics('gorilla', 5)
            expect(results).toEqual([])
            expect(fetchMock).not.toHaveBeenCalled()
            vi.unstubAllGlobals()
        })

        it('searchExternalStrainData does not call fetch', async () => {
            const fetchMock = vi.fn()
            vi.stubGlobal('fetch', fetchMock)
            const results = await searchExternalStrainData('blue')
            expect(results).toEqual([])
            expect(fetchMock).not.toHaveBeenCalled()
            vi.unstubAllGlobals()
        })
    })
})
