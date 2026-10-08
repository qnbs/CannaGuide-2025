import { describe, it, expect, vi, beforeEach } from 'vitest'

const isLocalOnlyModeMock = vi.fn(() => false)

vi.mock('@/services/localOnlyModeService', () => ({
    isLocalOnlyMode: () => isLocalOnlyModeMock(),
}))

const env = import.meta.env as Record<string, string>
env['VITE_CANSATIVA_API_KEY'] = 'test-subscription-key'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

type CansativaModule = typeof import('./cansativaService')
const loadService = async (): Promise<CansativaModule> => import('./cansativaService')

let fetchInventory: CansativaModule['fetchInventory']
let fetchMenu: CansativaModule['fetchMenu']
let fetchPartners: CansativaModule['fetchPartners']
let fetchByPostalCode: CansativaModule['fetchByPostalCode']
let isCansativaAvailable: CansativaModule['isCansativaAvailable']

beforeEach(async () => {
    vi.resetModules()
    vi.clearAllMocks()
    isLocalOnlyModeMock.mockReturnValue(false)
    env['VITE_CANSATIVA_API_KEY'] = 'test-subscription-key'
    const mod = await loadService()
    fetchInventory = mod.fetchInventory
    fetchMenu = mod.fetchMenu
    fetchPartners = mod.fetchPartners
    fetchByPostalCode = mod.fetchByPostalCode
    isCansativaAvailable = mod.isCansativaAvailable
})

describe('Cansativa lookups while the CSP gate is on', () => {
    it('reports the API as unavailable even when a key is set', () => {
        expect(isCansativaAvailable()).toBe(false)
    })

    it('does not fetch inventory, menu, partners, or a postal code', async () => {
        expect(await fetchInventory()).toEqual([])
        expect(await fetchMenu()).toEqual([])
        expect(await fetchPartners()).toEqual([])
        expect(await fetchByPostalCode('10115')).toEqual([])
        expect(mockFetch).not.toHaveBeenCalled()
    })
})
