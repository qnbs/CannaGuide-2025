import { create } from 'zustand'
import { subscribeWithSelector, devtools } from 'zustand/middleware'
import { AdvancedFilterState, StrainType, SortKey, SortDirection } from '@/types'
import { INITIAL_ADVANCED_FILTERS } from '@/constants'

export interface FiltersState {
    searchTerm: string
    typeFilter: StrainType[]
    showFavoritesOnly: boolean
    advancedFilters: AdvancedFilterState
    letterFilter: string | null
    sortKey: SortKey
    sortDirection: SortDirection
}

export interface FiltersActions {
    setFiltersState: (state: FiltersState) => void
    setSearchTerm: (term: string) => void
    toggleTypeFilter: (type: StrainType) => void
    setShowFavoritesOnly: (show: boolean) => void
    setAdvancedFilters: (filters: Partial<AdvancedFilterState>) => void
    setLetterFilter: (letter: string | null) => void
    setSort: (payload: { key: SortKey; direction: SortDirection }) => void
    hydrateFilters: (partial: Partial<FiltersState>) => void
    resetAllFilters: () => void
}

const initialState: FiltersState = {
    searchTerm: '',
    typeFilter: [],
    showFavoritesOnly: false,
    advancedFilters: INITIAL_ADVANCED_FILTERS,
    letterFilter: null,
    sortKey: 'name',
    sortDirection: 'asc',
}

export const useFiltersStore = create<FiltersState & FiltersActions>()(
    devtools(
        subscribeWithSelector((set) => ({
        ...initialState,

        setFiltersState: (state) => set(state),

        setSearchTerm: (term) => set({ searchTerm: term }),

        toggleTypeFilter: (type) =>
            set((state) => {
                const index = state.typeFilter.indexOf(type)
                if (index > -1) {
                    return { typeFilter: state.typeFilter.filter((t) => t !== type) }
                }
                return { typeFilter: [...state.typeFilter, type] }
            }),

        setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),

        setAdvancedFilters: (filters) =>
            set((state) => ({
                advancedFilters: { ...state.advancedFilters, ...filters },
            })),

        setLetterFilter: (letter) =>
            set((state) => ({
                letterFilter: state.letterFilter === letter ? null : letter,
            })),

        setSort: (payload) => set({ sortKey: payload.key, sortDirection: payload.direction }),

        hydrateFilters: (partial) =>
            set((state) => {
                const { advancedFilters, ...rest } = partial
                const next: Partial<FiltersState> = { ...rest }
                if (advancedFilters) {
                    next.advancedFilters = { ...state.advancedFilters, ...advancedFilters }
                }
                return next
            }),

        resetAllFilters: () => set(initialState),
    })),
        { name: 'filters', enabled: import.meta.env.DEV },
    ),
)

/**
 * Returns only the serializable filter state (without actions).
 */
export const getFiltersSnapshot = (): FiltersState => {
    const {
        setFiltersState: _a,
        setSearchTerm: _b,
        toggleTypeFilter: _c,
        setShowFavoritesOnly: _d,
        setAdvancedFilters: _e,
        setLetterFilter: _f,
        setSort: _g,
        hydrateFilters: _h,
        resetAllFilters: _i,
        ...state
    } = useFiltersStore.getState()
    return state
}
