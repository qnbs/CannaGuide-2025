import { describe, it, expect } from 'vitest'
import favoritesReducer, {
    toggleFavorite,
    addMultipleToFavorites,
    removeMultipleFromFavorites,
    setFavorites,
} from '@/stores/slices/favoritesSlice'

const initial = { favoriteIds: [] }

describe('favoritesSlice', () => {
    it('returns initial state', () => {
        const state = favoritesReducer(undefined, { type: 'unknown' })
        expect(state).toEqual(initial)
    })

    it('toggleFavorite adds an id', () => {
        const state = favoritesReducer(initial, toggleFavorite('strain-1'))
        expect(state.favoriteIds).toContain('strain-1')
    })

    it('toggleFavorite removes an existing id', () => {
        const prev = { favoriteIds: ['strain-1', 'strain-2'] }
        const state = favoritesReducer(prev, toggleFavorite('strain-1'))
        expect(state.favoriteIds).not.toContain('strain-1')
        expect(state.favoriteIds).toContain('strain-2')
    })

    it('addMultipleToFavorites adds multiple ids', () => {
        const state = favoritesReducer(initial, addMultipleToFavorites(['a', 'b', 'c']))
        expect(state.favoriteIds).toEqual(['a', 'b', 'c'])
    })

    it('addMultipleToFavorites does not duplicate', () => {
        const prev = { favoriteIds: ['a'] }
        const state = favoritesReducer(prev, addMultipleToFavorites(['a', 'b']))
        expect(state.favoriteIds).toEqual(['a', 'b'])
    })

    it('removeMultipleFromFavorites removes specified ids', () => {
        const prev = { favoriteIds: ['a', 'b', 'c'] }
        const state = favoritesReducer(prev, removeMultipleFromFavorites(['a', 'c']))
        expect(state.favoriteIds).toEqual(['b'])
    })

    it('setFavorites replaces all favorites', () => {
        const prev = { favoriteIds: ['old'] }
        const state = favoritesReducer(prev, setFavorites(['new1', 'new2']))
        expect(state.favoriteIds).toEqual(['new1', 'new2'])
    })
})
