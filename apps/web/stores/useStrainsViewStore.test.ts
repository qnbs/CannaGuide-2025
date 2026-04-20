import { describe, expect, it, beforeEach } from 'vitest'
import { useStrainsViewStore } from './useStrainsViewStore'
import { StrainViewTab } from '@/types'

describe('useStrainsViewStore', () => {
    beforeEach(() => {
        useStrainsViewStore.setState({
            strainsViewTab: StrainViewTab.All,
            strainsViewMode: 'list',
            selectedStrainIds: [],
            selectedStrainId: null,
        })
    })

    describe('setStrainsViewTab', () => {
        it('sets the active tab', () => {
            useStrainsViewStore.getState().setStrainsViewTab(StrainViewTab.MyStrains)
            expect(useStrainsViewStore.getState().strainsViewTab).toBe(StrainViewTab.MyStrains)
        })

        it('clears selections when changing tab', () => {
            useStrainsViewStore.getState().toggleStrainSelection('s1')
            useStrainsViewStore.getState().setSelectedStrainId('s1')
            useStrainsViewStore.getState().setStrainsViewTab(StrainViewTab.Favorites)
            expect(useStrainsViewStore.getState().selectedStrainIds).toHaveLength(0)
            expect(useStrainsViewStore.getState().selectedStrainId).toBeNull()
        })
    })

    describe('setStrainsViewMode', () => {
        it('switches to grid mode', () => {
            useStrainsViewStore.getState().setStrainsViewMode('grid')
            expect(useStrainsViewStore.getState().strainsViewMode).toBe('grid')
        })

        it('switches to list mode', () => {
            useStrainsViewStore.getState().setStrainsViewMode('grid')
            useStrainsViewStore.getState().setStrainsViewMode('list')
            expect(useStrainsViewStore.getState().strainsViewMode).toBe('list')
        })
    })

    describe('setSelectedStrainId', () => {
        it('selects a strain by id', () => {
            useStrainsViewStore.getState().setSelectedStrainId('strain-42')
            expect(useStrainsViewStore.getState().selectedStrainId).toBe('strain-42')
        })

        it('clears selection', () => {
            useStrainsViewStore.getState().setSelectedStrainId('strain-42')
            useStrainsViewStore.getState().setSelectedStrainId(null)
            expect(useStrainsViewStore.getState().selectedStrainId).toBeNull()
        })
    })

    describe('toggleStrainSelection', () => {
        it('selects a strain', () => {
            useStrainsViewStore.getState().toggleStrainSelection('a')
            expect(useStrainsViewStore.getState().selectedStrainIds).toContain('a')
        })

        it('deselects a strain on second toggle', () => {
            useStrainsViewStore.getState().toggleStrainSelection('a')
            useStrainsViewStore.getState().toggleStrainSelection('a')
            expect(useStrainsViewStore.getState().selectedStrainIds).not.toContain('a')
        })

        it('supports multiple selections', () => {
            useStrainsViewStore.getState().toggleStrainSelection('a')
            useStrainsViewStore.getState().toggleStrainSelection('b')
            expect(useStrainsViewStore.getState().selectedStrainIds).toEqual(
                expect.arrayContaining(['a', 'b']),
            )
        })
    })

    describe('toggleAllStrainSelection', () => {
        it('selects all when none are selected', () => {
            useStrainsViewStore.getState().toggleAllStrainSelection(['a', 'b', 'c'])
            expect(useStrainsViewStore.getState().selectedStrainIds).toHaveLength(3)
        })

        it('deselects all when all are already selected', () => {
            useStrainsViewStore.getState().toggleAllStrainSelection(['a', 'b'])
            useStrainsViewStore.getState().toggleAllStrainSelection(['a', 'b'])
            expect(useStrainsViewStore.getState().selectedStrainIds).toHaveLength(0)
        })

        it('selects remaining when only some are selected', () => {
            useStrainsViewStore.getState().toggleStrainSelection('a')
            useStrainsViewStore.getState().toggleAllStrainSelection(['a', 'b', 'c'])
            expect(useStrainsViewStore.getState().selectedStrainIds).toEqual(
                expect.arrayContaining(['a', 'b', 'c']),
            )
        })
    })

    describe('clearStrainSelection', () => {
        it('clears all selections', () => {
            useStrainsViewStore.getState().toggleStrainSelection('a')
            useStrainsViewStore.getState().toggleStrainSelection('b')
            useStrainsViewStore.getState().clearStrainSelection()
            expect(useStrainsViewStore.getState().selectedStrainIds).toHaveLength(0)
        })
    })

    describe('setStrainsViewState', () => {
        it('replaces full state', () => {
            useStrainsViewStore.getState().setStrainsViewState({
                strainsViewTab: StrainViewTab.Favorites,
                strainsViewMode: 'grid',
                selectedStrainIds: ['x'],
                selectedStrainId: 'x',
            })
            const state = useStrainsViewStore.getState()
            expect(state.strainsViewTab).toBe(StrainViewTab.Favorites)
            expect(state.strainsViewMode).toBe('grid')
            expect(state.selectedStrainIds).toEqual(['x'])
            expect(state.selectedStrainId).toBe('x')
        })
    })
})
