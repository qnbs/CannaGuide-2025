import { describe, expect, it } from 'vitest'
import type { Strain } from '@/types'
import { compareSelectorStrains, selectorRank } from './InlineStrainSelector'

const strain = (id: string, name: string): Strain => ({ id, name }) as Strain

const users = new Set(['lib-fav', 'lib'])
const favorites = new Set(['lib-fav', 'catalog-fav'])

describe('selectorRank', () => {
    it('keeps a library favorite ahead of the rest of the library', () => {
        expect(selectorRank(strain('lib-fav', 'Zed'), users, favorites)).toBeLessThan(
            selectorRank(strain('lib', 'Alpha'), users, favorites),
        )
    })

    it('keeps a library strain ahead of a catalog favorite', () => {
        expect(selectorRank(strain('lib', 'Zed'), users, favorites)).toBeLessThan(
            selectorRank(strain('catalog-fav', 'Alpha'), users, favorites),
        )
    })

    it('keeps a catalog favorite ahead of an unmarked catalog strain', () => {
        expect(selectorRank(strain('catalog-fav', 'Zed'), users, favorites)).toBeLessThan(
            selectorRank(strain('plain', 'Alpha'), users, favorites),
        )
    })

    it('sorts one rank by name', () => {
        const libraryFavorites = new Set(['beta', 'alpha'])
        expect(
            compareSelectorStrains(
                strain('beta', 'Beta'),
                strain('alpha', 'Alpha'),
                libraryFavorites,
                libraryFavorites,
            ),
        ).toBeGreaterThan(0)
    })
})
