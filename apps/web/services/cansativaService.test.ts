import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks -- must be set up before module import
// ---------------------------------------------------------------------------

vi.mock('@/services/localOnlyModeService', () => ({
    isLocalOnlyMode: vi.fn(() => false),
}))

// Vitest uses import.meta.env which is readonly in TS.
// Cast to mutable for test env manipulation.
const env = import.meta.env as Record<string, string>
env['VITE_CANSATIVA_API_KEY'] = 'test-subscription-key'

const { isLocalOnlyMode } = await import('@/services/localOnlyModeService')
const {
    fetchInventory,
    fetchMenu,
    fetchPartners,
    fetchByPostalCode,
    isCansativaAvailable,
    clearCansativaCache,
} = await import('./cansativaService')

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
    vi.clearAllMocks()
    clearCansativaCache()
    vi.mocked(isLocalOnlyMode).mockReturnValue(false)
    env['VITE_CANSATIVA_API_KEY'] = 'test-subscription-key'
})

// ---------------------------------------------------------------------------
// isCansativaAvailable
// ---------------------------------------------------------------------------

describe('isCansativaAvailable', () => {
    it('returns true when key is set and not local-only', () => {
        expect(isCansativaAvailable()).toBe(true)
    })

    it('returns false in local-only mode', () => {
        vi.mocked(isLocalOnlyMode).mockReturnValue(true)
        expect(isCansativaAvailable()).toBe(false)
    })

    it('returns false when no API key', () => {
        env['VITE_CANSATIVA_API_KEY'] = ''
        expect(isCansativaAvailable()).toBe(false)
    })
})

// ---------------------------------------------------------------------------
// fetchInventory
// ---------------------------------------------------------------------------

describe('fetchInventory', () => {
    it('returns normalized products on success', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                {
                    id: 'prod-1',
                    product_name: 'Bedrocan',
                    thc: 22,
                    cbd: 0.5,
                    pzn: '12345678',
                    origin: 'Netherlands',
                    terpenes: { Myrcene: 0.8, Limonene: 0.4 },
                },
            ],
        })

        const results = await fetchInventory()
        expect(results).toHaveLength(1)
        expect(results[0]!.name).toBe('Bedrocan')
        expect(results[0]!.thc).toBe(22)
        expect(results[0]!.pzn).toBe('12345678')
        expect(results[0]!.terpenes).toEqual({ Myrcene: 0.8, Limonene: 0.4 })
    })

    it('sends correct headers with subscription key', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        })

        await fetchInventory()

        expect(mockFetch).toHaveBeenCalledWith(
            'https://cansativagw.azure-api.net/v2/inventory',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Ocp-Apim-Subscription-Key': 'test-subscription-key',
                    'Cache-Control': 'no-cache',
                }),
            }),
        )
    })

    it('returns empty array in local-only mode', async () => {
        vi.mocked(isLocalOnlyMode).mockReturnValue(true)
        const results = await fetchInventory()
        expect(results).toEqual([])
        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('returns empty array on fetch error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))
        const results = await fetchInventory()
        expect(results).toEqual([])
    })

    it('returns empty array on non-ok response', async () => {
        mockFetch.mockResolvedValueOnce({ ok: false, status: 401 })
        const results = await fetchInventory()
        expect(results).toEqual([])
    })

    it('uses cache on second call within TTL', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [{ name: 'Cached Strain' }],
        })

        await fetchInventory()
        await fetchInventory()

        expect(mockFetch).toHaveBeenCalledTimes(1)
    })
})

// ---------------------------------------------------------------------------
// fetchMenu
// ---------------------------------------------------------------------------

describe('fetchMenu', () => {
    it('returns normalized menu items', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { product_id: 'p1', product_name: 'Tilray 10:10', available: true, price: 9.5 },
            ],
        })

        const items = await fetchMenu()
        expect(items).toHaveLength(1)
        expect(items[0]!.productName).toBe('Tilray 10:10')
        expect(items[0]!.available).toBe(true)
        expect(items[0]!.price).toBe(9.5)
    })
})

// ---------------------------------------------------------------------------
// fetchPartners
// ---------------------------------------------------------------------------

describe('fetchPartners', () => {
    it('returns normalized partner data', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [
                { id: '1', name: 'Apotheke am Markt', plz: '10115', stadt: 'Berlin' },
            ],
        })

        const partners = await fetchPartners()
        expect(partners).toHaveLength(1)
        expect(partners[0]!.name).toBe('Apotheke am Markt')
        expect(partners[0]!.postalCode).toBe('10115')
        expect(partners[0]!.city).toBe('Berlin')
    })
})

// ---------------------------------------------------------------------------
// fetchByPostalCode
// ---------------------------------------------------------------------------

describe('fetchByPostalCode', () => {
    it('validates PLZ format (5 digits)', async () => {
        const results = await fetchByPostalCode('123')
        expect(results).toEqual([])
        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('rejects non-numeric PLZ', async () => {
        const results = await fetchByPostalCode('abcde')
        expect(results).toEqual([])
    })

    it('sends PLZ in request body', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        })

        await fetchByPostalCode('10115')

        expect(mockFetch).toHaveBeenCalledWith(
            'https://cansativagw.azure-api.net/v2/plz',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ plz: '10115' }),
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': 'test-subscription-key',
                }),
            }),
        )
    })
})
