import { describe, it, expect, vi } from 'vitest'
import userStrainsReducer, {
    addUserStrain,
    updateUserStrain,
    deleteUserStrain,
    deleteMultipleUserStrains,
    setUserStrains,
    userStrainsAdapter,
} from '@/stores/slices/userStrainsSlice'
import type { Strain } from '@/types'

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

vi.mock('@/stores/useUIStore', () => ({
    getUISnapshot: () => ({
        addNotification: vi.fn(),
        closeAddModal: vi.fn(),
    }),
}))

const selectors = userStrainsAdapter.getSelectors()

const makeStrain = (id: string, name = 'Test Strain'): Strain =>
    ({
        id,
        name,
        type: 'Hybrid',
        floweringType: 'Photoperiod',
        thc: 20,
        cbd: 1,
        floweringTime: 60,
        agronomic: { difficulty: 'Easy', yield: 'High', height: 'Medium' },
        geneticModifiers: {},
    }) as unknown as Strain

describe('userStrainsSlice', () => {
    it('returns initial state (empty entity adapter)', () => {
        const state = userStrainsReducer(undefined, { type: 'unknown' })
        expect(selectors.selectAll(state)).toHaveLength(0)
        expect(selectors.selectTotal(state)).toBe(0)
    })

    it('addUserStrain adds a strain', () => {
        const state = userStrainsReducer(undefined, addUserStrain(makeStrain('s1', 'Blue Dream')))
        const all = selectors.selectAll(state)
        expect(all).toHaveLength(1)
        expect(all[0]!.name).toBe('Blue Dream')
    })

    it('addUserStrain adds multiple strains sequentially', () => {
        let state = userStrainsReducer(undefined, addUserStrain(makeStrain('s1', 'A')))
        state = userStrainsReducer(state, addUserStrain(makeStrain('s2', 'B')))
        state = userStrainsReducer(state, addUserStrain(makeStrain('s3', 'C')))
        expect(selectors.selectTotal(state)).toBe(3)
    })

    it('updateUserStrain modifies an existing strain', () => {
        let state = userStrainsReducer(undefined, addUserStrain(makeStrain('s1', 'Original Name')))
        state = userStrainsReducer(state, updateUserStrain(makeStrain('s1', 'Updated Name')))
        const strain = selectors.selectById(state, 's1')
        expect(strain?.name).toBe('Updated Name')
    })

    it('updateUserStrain on non-existent id is a no-op', () => {
        let state = userStrainsReducer(undefined, addUserStrain(makeStrain('s1')))
        state = userStrainsReducer(state, updateUserStrain(makeStrain('nonexistent', 'Ghost')))
        expect(selectors.selectTotal(state)).toBe(1)
        expect(selectors.selectById(state, 'nonexistent')).toBeUndefined()
    })

    it('deleteUserStrain removes a single strain', () => {
        let state = userStrainsReducer(undefined, addUserStrain(makeStrain('s1')))
        state = userStrainsReducer(state, addUserStrain(makeStrain('s2')))
        state = userStrainsReducer(state, deleteUserStrain('s1'))
        expect(selectors.selectTotal(state)).toBe(1)
        expect(selectors.selectById(state, 's1')).toBeUndefined()
        expect(selectors.selectById(state, 's2')).toBeDefined()
    })

    it('deleteUserStrain with non-existent id is a no-op', () => {
        let state = userStrainsReducer(undefined, addUserStrain(makeStrain('s1')))
        state = userStrainsReducer(state, deleteUserStrain('nonexistent'))
        expect(selectors.selectTotal(state)).toBe(1)
    })

    it('deleteMultipleUserStrains removes several strains', () => {
        let state = userStrainsReducer(undefined, addUserStrain(makeStrain('s1')))
        state = userStrainsReducer(state, addUserStrain(makeStrain('s2')))
        state = userStrainsReducer(state, addUserStrain(makeStrain('s3')))
        state = userStrainsReducer(state, deleteMultipleUserStrains(['s1', 's3']))
        const all = selectors.selectAll(state)
        expect(all).toHaveLength(1)
        expect(all[0]!.id).toBe('s2')
    })

    it('deleteMultipleUserStrains with empty array is a no-op', () => {
        let state = userStrainsReducer(undefined, addUserStrain(makeStrain('s1')))
        state = userStrainsReducer(state, deleteMultipleUserStrains([]))
        expect(selectors.selectTotal(state)).toBe(1)
    })

    it('setUserStrains replaces all strains', () => {
        let state = userStrainsReducer(undefined, addUserStrain(makeStrain('old')))
        state = userStrainsReducer(
            state,
            setUserStrains([makeStrain('new1', 'A'), makeStrain('new2', 'B')]),
        )
        const all = selectors.selectAll(state)
        expect(all).toHaveLength(2)
        expect(selectors.selectById(state, 'old')).toBeUndefined()
        expect(selectors.selectById(state, 'new1')?.name).toBe('A')
        expect(selectors.selectById(state, 'new2')?.name).toBe('B')
    })

    it('setUserStrains with empty array clears all strains', () => {
        let state = userStrainsReducer(undefined, addUserStrain(makeStrain('s1')))
        state = userStrainsReducer(state, setUserStrains([]))
        expect(selectors.selectTotal(state)).toBe(0)
    })
})
