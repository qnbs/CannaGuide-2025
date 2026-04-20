import { describe, expect, it, beforeEach } from 'vitest'
import { useFiltersStore, getFiltersSnapshot } from './useFiltersStore'
import { StrainType } from '@cannaguide/ai-core'

describe('useFiltersStore', () => {
    beforeEach(() => {
        useFiltersStore.getState().resetAllFilters()
    })

    describe('setSearchTerm', () => {
        it('sets search term', () => {
            useFiltersStore.getState().setSearchTerm('haze')
            expect(useFiltersStore.getState().searchTerm).toBe('haze')
        })

        it('clears search term', () => {
            useFiltersStore.getState().setSearchTerm('test')
            useFiltersStore.getState().setSearchTerm('')
            expect(useFiltersStore.getState().searchTerm).toBe('')
        })
    })

    describe('toggleTypeFilter', () => {
        it('adds a type filter', () => {
            useFiltersStore.getState().toggleTypeFilter(StrainType.Sativa)
            expect(useFiltersStore.getState().typeFilter).toContain(StrainType.Sativa)
        })

        it('removes type filter on second toggle', () => {
            useFiltersStore.getState().toggleTypeFilter(StrainType.Indica)
            useFiltersStore.getState().toggleTypeFilter(StrainType.Indica)
            expect(useFiltersStore.getState().typeFilter).not.toContain(StrainType.Indica)
        })

        it('supports multiple type filters', () => {
            useFiltersStore.getState().toggleTypeFilter(StrainType.Sativa)
            useFiltersStore.getState().toggleTypeFilter(StrainType.Hybrid)
            expect(useFiltersStore.getState().typeFilter).toContain(StrainType.Sativa)
            expect(useFiltersStore.getState().typeFilter).toContain(StrainType.Hybrid)
        })
    })

    describe('setAdvancedFilters', () => {
        it('sets partial advanced filters', () => {
            useFiltersStore.getState().setAdvancedFilters({ thcRange: [15, 30] })
            expect(useFiltersStore.getState().advancedFilters.thcRange).toEqual([15, 30])
        })
    })

    describe('setSort', () => {
        it('sets sort key and direction', () => {
            useFiltersStore.getState().setSort({ key: 'thc', direction: 'desc' })
            expect(useFiltersStore.getState().sortKey).toBe('thc')
            expect(useFiltersStore.getState().sortDirection).toBe('desc')
        })
    })

    describe('resetAllFilters', () => {
        it('resets all filters to defaults', () => {
            useFiltersStore.getState().setSearchTerm('test')
            useFiltersStore.getState().toggleTypeFilter(StrainType.Sativa)
            useFiltersStore.getState().resetAllFilters()
            expect(useFiltersStore.getState().searchTerm).toBe('')
            expect(useFiltersStore.getState().typeFilter).toHaveLength(0)
        })
    })

    describe('showFavoritesOnly', () => {
        it('sets favorites filter', () => {
            useFiltersStore.getState().setShowFavoritesOnly(true)
            expect(useFiltersStore.getState().showFavoritesOnly).toBe(true)
            useFiltersStore.getState().setShowFavoritesOnly(false)
            expect(useFiltersStore.getState().showFavoritesOnly).toBe(false)
        })
    })

    describe('letterFilter', () => {
        it('sets letter filter', () => {
            useFiltersStore.getState().setLetterFilter('A')
            expect(useFiltersStore.getState().letterFilter).toBe('A')
        })

        it('clears letter filter', () => {
            useFiltersStore.getState().setLetterFilter('B')
            useFiltersStore.getState().setLetterFilter(null)
            expect(useFiltersStore.getState().letterFilter).toBeNull()
        })
    })

    describe('getFiltersSnapshot', () => {
        it('returns state snapshot without actions', () => {
            useFiltersStore.getState().setSearchTerm('og kush')
            const snapshot = getFiltersSnapshot()
            expect(snapshot.searchTerm).toBe('og kush')
            // Should not contain action functions
            expect(typeof snapshot).toBe('object')
            expect('setSearchTerm' in snapshot).toBe(false)
        })
    })
})
