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

    it('lookupCannlytics returns null without API key', async () => {
        Object.assign(import.meta.env, { VITE_CANNLYTICS_API_KEY: '' })
        const { lookupCannlytics } = await import('./externalStrainLookups')
        await expect(lookupCannlytics('Blue Dream')).resolves.toBeNull()
    })

    it('lookupCannlytics maps cannlytics payload', async () => {
        Object.assign(import.meta.env, { VITE_CANNLYTICS_API_KEY: 'test-key' })
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    strain_name: 'Blue Dream',
                    total_thc: 18,
                    total_cbd: 0.2,
                    type: 'sativa dominant',
                    terpenes: { myrcene: 0.4, limonene: 0.2 },
                },
            }),
        } as Response)

        const { lookupCannlytics } = await import('./externalStrainLookups')
        const result = await lookupCannlytics('Blue Dream')

        expect(result?.name).toBe('Blue Dream')
        expect(result?.type).toBe('Sativa')
        expect(result?.terpenes.length).toBeGreaterThan(0)
        expect(result?.confidenceSource).toBe('cannlytics')
    })

    it('lookupOtreeba maps first matching endpoint item', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            json: async () => ({}),
        } as Response)
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                data: [
                    {
                        name: 'OG Kush',
                        thc: 22,
                        cbd: 0.1,
                        race: 'indica',
                        flavors: ['Earthy', 'Pine', 'UnknownFlavor'],
                        parents: ['Chemdawg', 'Hindu Kush'],
                    },
                ],
            }),
        } as Response)

        const { lookupOtreeba } = await import('./externalStrainLookups')
        const result = await lookupOtreeba('OG Kush')

        expect(result?.type).toBe('Indica')
        expect(result?.genetics).toContain('Chemdawg')
        expect(result?.terpenes[0]?.name).toBe('Myrcene')
    })

    it('lookupOtreeba returns null when all endpoints fail', async () => {
        vi.mocked(fetch).mockRejectedValue(new Error('network down'))
        const { lookupOtreeba } = await import('./externalStrainLookups')
        await expect(lookupOtreeba('Missing')).resolves.toBeNull()
    })

    it('lookupCannabisApi handles array and object responses', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    name: 'Gelato',
                    type: 'hybrid',
                    flavors: ['citrus', 'sweet', 'unknown'],
                    description: 'Dessert strain',
                },
            ],
        } as Response)

        const { lookupCannabisApi } = await import('./externalStrainLookups')
        const fromArray = await lookupCannabisApi('Gelato')
        expect(fromArray?.name).toBe('Gelato')
        expect(fromArray?.terpenes.length).toBeGreaterThan(0)

        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                name: 'Zkittlez',
                type: 'indica',
                flavors: ['berry'],
            }),
        } as Response)

        const fromObject = await lookupCannabisApi('Zkittlez')
        expect(fromObject?.type).toBe('Indica')
    })

    it('lookupCannlytics returns null when response is not ok', async () => {
        Object.assign(import.meta.env, { VITE_CANNLYTICS_API_KEY: 'test-key' })
        vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
        const { lookupCannlytics } = await import('./externalStrainLookups')
        await expect(lookupCannlytics('Ghost')).resolves.toBeNull()
    })

    it('lookupCannlytics maps indica type and raw terpene object', async () => {
        Object.assign(import.meta.env, { VITE_CANNLYTICS_API_KEY: 'test-key' })
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => ({
                name: 'Afghan Kush',
                thc: 20,
                cbd: 0,
                strain_type: 'indica',
            }),
        } as Response)

        const { lookupCannlytics } = await import('./externalStrainLookups')
        const result = await lookupCannlytics('Afghan Kush')
        expect(result?.type).toBe('Indica')
    })

    it('lookupOtreeba reads items array on first endpoint', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [{ name: 'Sour Diesel', thcRatio: 19, race: 'sativa', flavors: ['Citrus'] }],
            }),
        } as Response)

        const { lookupOtreeba } = await import('./externalStrainLookups')
        const result = await lookupOtreeba('Sour Diesel')
        expect(result?.type).toBe('Sativa')
        expect(result?.terpenes[0]?.name).toBe('Limonene')
    })

    it('lookupCannabisApi returns null without a named hit', async () => {
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => ({ strains: [] }),
        } as Response)

        const { lookupCannabisApi } = await import('./externalStrainLookups')
        await expect(lookupCannabisApi('Ghost')).resolves.toBeNull()
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

    it('lookupCannlytics returns null on fetch error', async () => {
        Object.assign(import.meta.env, { VITE_CANNLYTICS_API_KEY: 'test-key' })
        vi.mocked(fetch).mockRejectedValue(new Error('network'))
        const { lookupCannlytics } = await import('./externalStrainLookups')
        await expect(lookupCannlytics('Fail')).resolves.toBeNull()
    })

    it('lookupCannlytics maps cbg and hybrid type from raw payload', async () => {
        Object.assign(import.meta.env, { VITE_CANNLYTICS_API_KEY: 'test-key' })
        vi.mocked(fetch).mockResolvedValue({
            ok: true,
            json: async () => ({
                data: {
                    name: 'Balanced',
                    thc: 12,
                    cbd: 1,
                    cbg: 0.5,
                    type: 'balanced hybrid',
                    terpenes: { myrcene: 0, limonene: 0.3 },
                },
            }),
        } as Response)

        const { lookupCannlytics } = await import('./externalStrainLookups')
        const result = await lookupCannlytics('Balanced')
        expect(result?.type).toBe('Hybrid')
        expect(result?.cannabinoids.some((c) => c.name === 'CBG')).toBe(true)
        expect(result?.terpenes).toHaveLength(1)
    })

    it('lookupOtreeba maps sativa race and unmapped flavor names', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                items: [
                    {
                        name: 'Durban Poison',
                        thc: 17,
                        race: 'sativa',
                        flavors: ['Berry'],
                    },
                ],
            }),
        } as Response)

        const { lookupOtreeba } = await import('./externalStrainLookups')
        const result = await lookupOtreeba('Durban Poison')
        expect(result?.type).toBe('Sativa')
        expect(result?.terpenes[0]?.name).toBe('Ocimene')
    })

    it('lookupCannabisApi uses strains wrapper and pepper flavor mapping', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                strains: [{ name: 'Wedding Cake', type: 'hybrid', flavors: ['pepper', 'mystery'] }],
            }),
        } as Response)

        const { lookupCannabisApi } = await import('./externalStrainLookups')
        const result = await lookupCannabisApi('Wedding Cake')
        expect(result?.terpenes[0]?.name).toBe('Caryophyllene')
        expect(result?.terpenes).toHaveLength(1)
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
})
