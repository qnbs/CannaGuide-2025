import { describe, it, expect } from 'vitest'
import { StrainViewTab } from '@/types'
import strainsViewReducer, {
    setStrainsViewTab,
    setSelectedStrainId,
    setStrainsViewMode,
    toggleStrainSelection,
    toggleAllStrainSelection,
    clearStrainSelection,
} from '@/stores/slices/strainsViewSlice'

const initial = {
    strainsViewTab: StrainViewTab.All,
    strainsViewMode: 'list' as const,
    selectedStrainIds: [],
    selectedStrainId: null,
}

describe('strainsViewSlice', () => {
    it('returns initial state', () => {
        const state = strainsViewReducer(undefined, { type: 'unknown' })
        expect(state).toEqual(initial)
    })

    it('setStrainsViewTab updates tab and clears selection', () => {
        const prev = { ...initial, selectedStrainIds: ['a', 'b'], selectedStrainId: 'a' }
        const state = strainsViewReducer(prev, setStrainsViewTab(StrainViewTab.MyStrains))
        expect(state.strainsViewTab).toBe(StrainViewTab.MyStrains)
        expect(state.selectedStrainIds).toEqual([])
        expect(state.selectedStrainId).toBeNull()
    })

    it('setSelectedStrainId updates selected strain', () => {
        const state = strainsViewReducer(initial, setSelectedStrainId('strain-1'))
        expect(state.selectedStrainId).toBe('strain-1')
    })

    it('setStrainsViewMode toggles between list and grid', () => {
        const state = strainsViewReducer(initial, setStrainsViewMode('grid'))
        expect(state.strainsViewMode).toBe('grid')
    })

    it('toggleStrainSelection adds and removes ids', () => {
        let state = strainsViewReducer(initial, toggleStrainSelection('a'))
        expect(state.selectedStrainIds).toContain('a')

        state = strainsViewReducer(state, toggleStrainSelection('a'))
        expect(state.selectedStrainIds).not.toContain('a')
    })

    it('toggleAllStrainSelection selects all when not all selected', () => {
        const state = strainsViewReducer(
            initial,
            toggleAllStrainSelection({ ids: ['a', 'b', 'c'] }),
        )
        expect(state.selectedStrainIds).toEqual(['a', 'b', 'c'])
    })

    it('toggleAllStrainSelection deselects all when all selected', () => {
        const prev = { ...initial, selectedStrainIds: ['a', 'b', 'c'] }
        const state = strainsViewReducer(
            prev,
            toggleAllStrainSelection({ ids: ['a', 'b', 'c'] }),
        )
        expect(state.selectedStrainIds).toEqual([])
    })

    it('clearStrainSelection clears all', () => {
        const prev = { ...initial, selectedStrainIds: ['a', 'b'] }
        const state = strainsViewReducer(prev, clearStrainSelection())
        expect(state.selectedStrainIds).toEqual([])
    })
})
