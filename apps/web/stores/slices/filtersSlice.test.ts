import { describe, it, expect } from 'vitest'
import filtersReducer, {
    setSearchTerm,
    toggleTypeFilter,
    setShowFavoritesOnly,
    setAdvancedFilters,
    setLetterFilter,
} from '@/stores/slices/filtersSlice'
import { StrainType } from '@/types'
import { INITIAL_ADVANCED_FILTERS } from '@/constants'

describe('filtersSlice', () => {
    it('returns initial state', () => {
        const state = filtersReducer(undefined, { type: 'unknown' })
        expect(state.searchTerm).toBe('')
        expect(state.typeFilter).toEqual([])
        expect(state.sortKey).toBe('name')
        expect(state.sortDirection).toBe('asc')
    })

    it('setSearchTerm updates search', () => {
        const state = filtersReducer(undefined, setSearchTerm('OG Kush'))
        expect(state.searchTerm).toBe('OG Kush')
    })

    it('toggleTypeFilter adds type', () => {
        const state = filtersReducer(undefined, toggleTypeFilter(StrainType.Indica))
        expect(state.typeFilter).toContain(StrainType.Indica)
    })

    it('toggleTypeFilter removes existing type', () => {
        let state = filtersReducer(undefined, toggleTypeFilter(StrainType.Indica))
        state = filtersReducer(state, toggleTypeFilter(StrainType.Indica))
        expect(state.typeFilter).not.toContain(StrainType.Indica)
    })

    it('setShowFavoritesOnly toggles favorites filter', () => {
        const state = filtersReducer(undefined, setShowFavoritesOnly(true))
        expect(state.showFavoritesOnly).toBe(true)
    })

    it('setAdvancedFilters merges partial advanced filters', () => {
        const state = filtersReducer(undefined, setAdvancedFilters({ thcRange: [10, 25] }))
        expect(state.advancedFilters.thcRange).toEqual([10, 25])
        // Other advanced filters should remain default
        expect(state.advancedFilters.cbdRange).toEqual(INITIAL_ADVANCED_FILTERS.cbdRange)
    })

    it('setLetterFilter sets a letter', () => {
        const state = filtersReducer(undefined, setLetterFilter('B'))
        expect(state.letterFilter).toBe('B')
    })

    it('setLetterFilter clears with null', () => {
        let state = filtersReducer(undefined, setLetterFilter('A'))
        state = filtersReducer(state, setLetterFilter(null))
        expect(state.letterFilter).toBeNull()
    })
})
