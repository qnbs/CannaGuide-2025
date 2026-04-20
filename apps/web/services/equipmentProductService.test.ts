import { describe, expect, it } from 'vitest'
import { resolveProductLinks, getVendorColor, VENDOR_COLORS } from './equipmentProductService'

describe('equipmentProductService', () => {
    describe('resolveProductLinks', () => {
        it('matches Mars Hydro tent', () => {
            const links = resolveProductLinks('Mars Hydro 120x120 Grow Tent', 'tent')
            expect(links.length).toBeGreaterThan(0)
            expect(links.some((l) => l.vendor === 'Mars Hydro')).toBe(true)
        })

        it('matches Secret Jardin tent', () => {
            const links = resolveProductLinks('Secret Jardin DR120', 'tent')
            expect(links.length).toBeGreaterThan(0)
            expect(links.some((l) => l.vendor === 'Secret Jardin')).toBe(true)
        })

        it('matches Spider Farmer light', () => {
            const links = resolveProductLinks('Spider Farmer SF2000', 'light')
            expect(links.length).toBeGreaterThan(0)
            expect(links.some((l) => l.vendor === 'Spider Farmer')).toBe(true)
        })

        it('matches Mars Hydro TS1000 light', () => {
            const links = resolveProductLinks('Mars Hydro TS1000', 'light')
            expect(links.length).toBeGreaterThan(0)
        })

        it('matches Sanlight LED', () => {
            const links = resolveProductLinks('Sanlight EVO 4-120', 'light')
            expect(links.length).toBeGreaterThan(0)
        })

        it('matches AC Infinity ventilation', () => {
            const links = resolveProductLinks('AC Infinity CLOUDLINE T6', 'ventilation')
            expect(links.length).toBeGreaterThan(0)
            expect(links.some((l) => l.vendor === 'AC Infinity')).toBe(true)
        })

        it('matches Prima Klima ventilation', () => {
            const links = resolveProductLinks('Prima Klima 125mm', 'ventilation')
            expect(links.length).toBeGreaterThan(0)
        })

        it('matches BioBizz nutrients', () => {
            const links = resolveProductLinks('BioBizz Bio-Grow', 'nutrients')
            expect(links.length).toBeGreaterThan(0)
            expect(links.some((l) => l.vendor === 'BioBizz')).toBe(true)
        })

        it('matches CANNA nutrients', () => {
            const links = resolveProductLinks('CANNA Terra Vega', 'nutrients')
            expect(links.length).toBeGreaterThan(0)
        })

        it('matches Plagron nutrients', () => {
            const links = resolveProductLinks('Plagron Alga Grow', 'nutrients')
            expect(links.length).toBeGreaterThan(0)
        })

        it('matches Advanced Nutrients', () => {
            const links = resolveProductLinks('Advanced Nutrients pH Perfect', 'nutrients')
            expect(links.length).toBeGreaterThan(0)
        })

        it('matches Air-Pot', () => {
            const links = resolveProductLinks('Air-Pot 20L', 'pots')
            expect(links.length).toBeGreaterThan(0)
        })

        it('matches fabric pots', () => {
            const links = resolveProductLinks('Fabric Pot 15L', 'pots')
            expect(links.length).toBeGreaterThan(0)
        })

        it('generates generic links for unknown products', () => {
            const links = resolveProductLinks('Unknown Brand XL-3000', 'light')
            expect(links.length).toBe(2)
            expect(links.some((l) => l.vendor === 'Amazon')).toBe(true)
            expect(links.some((l) => l.vendor === 'Google Shopping')).toBe(true)
        })

        it('returns empty for very short names', () => {
            const links = resolveProductLinks('AB', 'light')
            expect(links).toEqual([])
        })

        it('matches case-insensitively', () => {
            const links = resolveProductLinks('biobizz LIGHT-MIX', 'soil')
            expect(links.length).toBeGreaterThan(0)
        })

        it('matches HLG lights', () => {
            const links = resolveProductLinks('HLG 300 Rspec', 'light')
            expect(links.length).toBeGreaterThan(0)
        })

        it('matches Lumatek lights', () => {
            const links = resolveProductLinks('Lumatek Attis 300W', 'light')
            expect(links.length).toBeGreaterThan(0)
        })
    })

    describe('getVendorColor', () => {
        it('returns color for known vendors', () => {
            expect(getVendorColor('Mars Hydro')).toContain('red')
            expect(getVendorColor('Spider Farmer')).toContain('green')
            expect(getVendorColor('AC Infinity')).toContain('blue')
            expect(getVendorColor('BioBizz')).toContain('lime')
        })

        it('returns default color for unknown vendors', () => {
            expect(getVendorColor('Unknown')).toContain('slate')
        })
    })

    describe('VENDOR_COLORS', () => {
        it('has entries for all major vendors', () => {
            expect(VENDOR_COLORS['Mars Hydro']).toBeDefined()
            expect(VENDOR_COLORS['Amazon']).toBeDefined()
            expect(VENDOR_COLORS['Google Shopping']).toBeDefined()
        })
    })
})
