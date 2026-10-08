import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/services/strain-lookup/strainLookupCache', () => ({
    throttleExternal: vi.fn(async () => undefined),
}))

describe('externalStrainLookups API adapters', () => {
    const originalEnv = import.meta.env

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn())
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        Object.assign(import.meta.env, originalEnv)
    })

    it('does not call Cannlytics while external lookups are disabled', async () => {
        Object.assign(import.meta.env, { VITE_CANNLYTICS_API_KEY: 'test-key' })
        const { lookupCannlytics } = await import('./externalStrainLookups')
        await expect(lookupCannlytics('Blue Dream')).resolves.toBeNull()
        expect(vi.mocked(fetch)).not.toHaveBeenCalled()
    })

    it('does not call Otreeba while external lookups are disabled', async () => {
        const { lookupOtreeba } = await import('./externalStrainLookups')
        await expect(lookupOtreeba('Durban Poison')).resolves.toBeNull()
        expect(vi.mocked(fetch)).not.toHaveBeenCalled()
    })

    it('does not call The Cannabis API while external lookups are disabled', async () => {
        const { lookupCannabisApi } = await import('./externalStrainLookups')
        await expect(lookupCannabisApi('Wedding Cake')).resolves.toBeNull()
        expect(vi.mocked(fetch)).not.toHaveBeenCalled()
    })

    it('lookupWithAI parses structured mentor JSON in German', async () => {
        vi.resetModules()
        vi.doMock('@/services/aiFacade', () => ({
            aiService: {
                getMentorResponse: vi.fn().mockResolvedValue({
                    title: 'AI',
                    content: JSON.stringify({
                        name: 'Purple Haze',
                        breeder: 'Test Breeder',
                        type: 'Sativa',
                        floweringType: 'Autoflower',
                        thc: 18,
                        cbd: 0.5,
                        cbg: 0.1,
                        genetics: 'Haze x Purple',
                        description: 'Classic sativa.',
                        terpenes: [
                            { name: 'Myrcene', percentage: 0.35 },
                            { name: 'Limonene', percentage: 25 },
                        ],
                        flavonoids: [{ name: 'Cannflavin A', role: 'dominant' }],
                        summary: 'Uplifting classic.',
                    }),
                    uiHighlights: [],
                }),
            },
            getAiMode: vi.fn(() => 'hybrid'),
        }))

        document.documentElement.lang = 'de'
        const { lookupWithAI } = await import('./externalStrainLookups')
        const result = await lookupWithAI('Purple Haze')

        expect(result?.name).toBe('Purple Haze')
        expect(result?.floweringType).toBe('Autoflower')
        expect(result?.terpenes.length).toBeGreaterThan(0)
        expect(result?.flavonoids?.length).toBeGreaterThan(0)
        expect(result?.confidenceSource).toBe('ai')
        vi.doUnmock('@/services/aiFacade')
    })

    it('lookupWithAI returns null in eco mode', async () => {
        vi.resetModules()
        vi.doMock('@/services/aiFacade', () => ({
            aiService: { getMentorResponse: vi.fn() },
            getAiMode: vi.fn(() => 'eco'),
        }))

        const { lookupWithAI } = await import('./externalStrainLookups')
        await expect(lookupWithAI('Any Strain')).resolves.toBeNull()
        vi.doUnmock('@/services/aiFacade')
    })

    it('lookupWithAI returns null when mentor response has no JSON', async () => {
        vi.resetModules()
        vi.doMock('@/services/aiFacade', () => ({
            aiService: {
                getMentorResponse: vi.fn().mockResolvedValue({
                    title: 'AI',
                    content: 'No structured payload here.',
                    uiHighlights: [],
                }),
            },
            getAiMode: vi.fn(() => 'hybrid'),
        }))

        document.documentElement.lang = 'en'
        const { lookupWithAI } = await import('./externalStrainLookups')
        await expect(lookupWithAI('Ghost')).resolves.toBeNull()
        vi.doUnmock('@/services/aiFacade')
    })

    it('lookupWithAI builds fallback flavonoids and percentage-normalized terpenes', async () => {
        vi.resetModules()
        vi.doMock('@/services/aiFacade', () => ({
            aiService: {
                getMentorResponse: vi.fn().mockResolvedValue({
                    title: 'AI',
                    content: JSON.stringify({
                        name: 'Northern Lights',
                        type: 'indica',
                        thc: 16,
                        terpenes: [{ name: 'Myrcene', percentage: 1.2 }],
                        summary: 'Classic indica.',
                    }),
                    uiHighlights: [],
                }),
            },
            getAiMode: vi.fn(() => 'hybrid'),
        }))

        document.documentElement.lang = 'en'
        const { lookupWithAI } = await import('./externalStrainLookups')
        const result = await lookupWithAI('Northern Lights')

        expect(result?.type).toBe('Indica')
        expect(result?.flavonoids?.length).toBeGreaterThan(0)
        expect(result?.terpenes[0]?.percentage).toBe(120)
        vi.doUnmock('@/services/aiFacade')
    })

    it('lookupWithAI returns null when mentor response has empty content', async () => {
        vi.resetModules()
        vi.doMock('@/services/aiFacade', () => ({
            aiService: {
                getMentorResponse: vi.fn().mockResolvedValue({
                    title: 'AI',
                    content: '',
                    uiHighlights: [],
                }),
            },
            getAiMode: vi.fn(() => 'hybrid'),
        }))

        const { lookupWithAI } = await import('./externalStrainLookups')
        await expect(lookupWithAI('Ghost')).resolves.toBeNull()
        vi.doUnmock('@/services/aiFacade')
    })
})
