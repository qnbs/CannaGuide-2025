import { describe, it, expect } from 'vitest'
import { urlService } from '@/services/urlService'
import { StrainType } from '@/types'
import { INITIAL_ADVANCED_FILTERS } from '@/constants'
import type { FiltersState } from '@/stores/slices/filtersSlice'

const defaultFilters: FiltersState = {
    searchTerm: '',
    typeFilter: [],
    showFavoritesOnly: false,
    advancedFilters: INITIAL_ADVANCED_FILTERS,
    letterFilter: null,
    sortKey: 'name',
    sortDirection: 'asc',
}

describe('urlService', () => {
    describe('serializeFiltersToQueryString', () => {
        it('returns empty string for default filters', () => {
            const qs = urlService.serializeFiltersToQueryString(defaultFilters)
            expect(qs).toBe('')
        })

        it('serializes search term', () => {
            const filters = { ...defaultFilters, searchTerm: 'OG Kush' }
            const qs = urlService.serializeFiltersToQueryString(filters)
            expect(qs).toContain('q=OG+Kush')
        })

        it('serializes letter filter', () => {
            const filters = { ...defaultFilters, letterFilter: 'A' }
            const qs = urlService.serializeFiltersToQueryString(filters)
            expect(qs).toContain('l=A')
        })

        it('serializes type filter', () => {
            const filters = { ...defaultFilters, typeFilter: [StrainType.Indica, StrainType.Sativa] }
            const qs = urlService.serializeFiltersToQueryString(filters)
            expect(qs).toContain('t=')
        })

        it('serializes favorites flag', () => {
            const filters = { ...defaultFilters, showFavoritesOnly: true }
            const qs = urlService.serializeFiltersToQueryString(filters)
            expect(qs).toContain('fav=1')
        })

        it('serializes sort key and direction', () => {
            const filters = { ...defaultFilters, sortKey: 'thc' as const, sortDirection: 'desc' as const }
            const qs = urlService.serializeFiltersToQueryString(filters)
            expect(qs).toContain('s=thc-desc')
        })

        it('does not serialize default sort (name-asc)', () => {
            const qs = urlService.serializeFiltersToQueryString(defaultFilters)
            expect(qs).not.toContain('s=')
        })
    })

    describe('parseQueryStringToFilterState', () => {
        it('parses search term', () => {
            const state = urlService.parseQueryStringToFilterState('q=Blue+Dream')
            expect(state.searchTerm).toBe('Blue Dream')
        })

        it('parses letter filter', () => {
            const state = urlService.parseQueryStringToFilterState('l=Z')
            expect(state.letterFilter).toBe('Z')
        })

        it('parses type filter and validates values', () => {
            const state = urlService.parseQueryStringToFilterState('t=Indica,Sativa,InvalidType')
            expect(state.typeFilter).toContain(StrainType.Indica)
            expect(state.typeFilter).toContain(StrainType.Sativa)
            expect(state.typeFilter).not.toContain('InvalidType')
        })

        it('parses favorites flag', () => {
            const state = urlService.parseQueryStringToFilterState('fav=1')
            expect(state.showFavoritesOnly).toBe(true)
        })

        it('parses sort correctly', () => {
            const state = urlService.parseQueryStringToFilterState('s=thc-desc')
            expect(state.sortKey).toBe('thc')
            expect(state.sortDirection).toBe('desc')
        })

        it('ignores invalid sort values', () => {
            const state = urlService.parseQueryStringToFilterState('s=invalid-direction')
            expect(state.sortKey).toBeUndefined()
        })

        it('parses advanced filter ranges', () => {
            const state = urlService.parseQueryStringToFilterState('thc=10,25&cbd=0,5')
            expect(state.advancedFilters?.thcRange).toEqual([10, 25])
            expect(state.advancedFilters?.cbdRange).toEqual([0, 5])
        })

        it('returns empty object for empty query string', () => {
            const state = urlService.parseQueryStringToFilterState('')
            expect(Object.keys(state).length).toBe(0)
        })

        it('roundtrips serialize → parse for complex filters', () => {
            const filters: FiltersState = {
                ...defaultFilters,
                searchTerm: 'Haze',
                typeFilter: [StrainType.Sativa],
                showFavoritesOnly: true,
                sortKey: 'thc',
                sortDirection: 'desc',
            }
            const qs = urlService.serializeFiltersToQueryString(filters)
            const parsed = urlService.parseQueryStringToFilterState(qs)

            expect(parsed.searchTerm).toBe('Haze')
            expect(parsed.typeFilter).toContain(StrainType.Sativa)
            expect(parsed.showFavoritesOnly).toBe(true)
            expect(parsed.sortKey).toBe('thc')
            expect(parsed.sortDirection).toBe('desc')
        })
    })
})
