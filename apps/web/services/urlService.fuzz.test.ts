import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { urlService } from '@/services/urlService'
import { StrainType } from '@/types'
import { INITIAL_ADVANCED_FILTERS } from '@/constants'
import type { FiltersState } from '@/stores/useFiltersStore'

const defaultFilters: FiltersState = {
    searchTerm: '',
    typeFilter: [],
    showFavoritesOnly: false,
    advancedFilters: INITIAL_ADVANCED_FILTERS,
    letterFilter: null,
    sortKey: 'name',
    sortDirection: 'asc',
}

const SORT_KEYS: FiltersState['sortKey'][] = [
    'name',
    'type',
    'thc',
    'cbd',
    'floweringTime',
    'difficulty',
    'yield',
    'height',
]

const SAFE_TOKEN = fc
    .string({ minLength: 1, maxLength: 16 })
    .filter((value) => !/[,&=]/.test(value))

const LETTER_FILTER = fc.option(fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), { nil: null })

const filtersArbitrary: fc.Arbitrary<FiltersState> = fc.record({
    searchTerm: fc.string({ maxLength: 48 }),
    typeFilter: fc.uniqueArray(fc.constantFrom(...Object.values(StrainType)), { maxLength: 3 }),
    showFavoritesOnly: fc.boolean(),
    letterFilter: LETTER_FILTER,
    sortKey: fc.constantFrom(...SORT_KEYS),
    sortDirection: fc.constantFrom('asc', 'desc'),
    advancedFilters: fc.record({
        thcRange: fc.tuple(fc.integer({ min: 0, max: 40 }), fc.integer({ min: 0, max: 40 })),
        cbdRange: fc.tuple(fc.integer({ min: 0, max: 30 }), fc.integer({ min: 0, max: 30 })),
        floweringRange: fc.tuple(fc.integer({ min: 5, max: 20 }), fc.integer({ min: 5, max: 20 })),
        selectedDifficulties: fc.uniqueArray(fc.constantFrom('Easy', 'Medium', 'Hard'), {
            maxLength: 3,
        }),
        selectedYields: fc.uniqueArray(fc.constantFrom('Low', 'Medium', 'High'), {
            maxLength: 3,
        }),
        selectedHeights: fc.uniqueArray(fc.constantFrom('Short', 'Medium', 'Tall'), {
            maxLength: 3,
        }),
        selectedAromas: fc.uniqueArray(SAFE_TOKEN, { maxLength: 4 }),
        selectedTerpenes: fc.uniqueArray(SAFE_TOKEN, { maxLength: 4 }),
    }),
})

const hydrateParsedState = (parsed: Partial<FiltersState>): FiltersState => ({
    ...defaultFilters,
    ...parsed,
    advancedFilters: {
        ...defaultFilters.advancedFilters,
        ...(parsed.advancedFilters ?? {}),
    },
})

describe('urlService property-based fuzzing', () => {
    it('parseQueryStringToFilterState throws not for arbitrary input', () => {
        fc.assert(
            fc.property(fc.string({ maxLength: 2048 }), (queryString) => {
                expect(() => urlService.parseQueryStringToFilterState(queryString)).not.toThrow()
            }),
            { numRuns: 500 },
        )
    })

    it('serialize -> parse -> serialize is stable for generated filter states', () => {
        fc.assert(
            fc.property(filtersArbitrary, (filters) => {
                const initialQuery = urlService.serializeFiltersToQueryString(filters)
                const parsed = urlService.parseQueryStringToFilterState(initialQuery)
                const hydrated = hydrateParsedState(parsed)
                const reserializedQuery = urlService.serializeFiltersToQueryString(hydrated)

                expect(reserializedQuery).toBe(initialQuery)
            }),
            { numRuns: 200 },
        )
    })
})
