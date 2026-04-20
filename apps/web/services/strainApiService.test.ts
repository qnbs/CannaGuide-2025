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

    describe('searchOtreeba with fetch mock', () => {
        it('returns parsed results on success', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve({
                        data: [{ name: 'Blue Dream', type: 'Hybrid', thc: '20' }],
                    }),
            })
            vi.stubGlobal('fetch', fetchMock)

            const results = await searchOtreeba('blue', 5)
            expect(results).toHaveLength(1)
            expect(results[0]?.name).toBe('Blue Dream')
            expect(results[0]?.provider).toBe('otreeba')

            vi.unstubAllGlobals()
        })

        it('returns empty on fetch failure', async () => {
            const fetchMock = vi.fn().mockRejectedValue(new Error('Network'))
            vi.stubGlobal('fetch', fetchMock)

            const results = await searchOtreeba('fail')
            expect(results).toEqual([])

            vi.unstubAllGlobals()
        })
    })

    describe('searchCannlytics with fetch mock', () => {
        it('returns parsed results on success', async () => {
            const fetchMock = vi.fn().mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve({
                        data: [
                            {
                                strain_name: 'Gorilla Glue',
                                strain_type: 'Hybrid',
                                total_thc: 25,
                            },
                        ],
                    }),
            })
            vi.stubGlobal('fetch', fetchMock)

            clearStrainApiCache()
            const results = await searchCannlytics('gorilla', 5)
            expect(results).toHaveLength(1)
            expect(results[0]?.name).toBe('Gorilla Glue')
            expect(results[0]?.provider).toBe('cannlytics')
            expect(results[0]?.labTested).toBe(true)

            vi.unstubAllGlobals()
        })
    })
})
