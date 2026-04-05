import { describe, it, expect, vi } from 'vitest'
import savedItemsReducer, {
    updateSetup,
    deleteSetup,
    deleteMultipleSetups,
    addStrainTip,
    updateStrainTip,
    deleteStrainTip,
    addExport,
    updateExport,
    deleteExport,
    deleteMultipleExports,
    setSavedSetups,
    setSavedStrainTips,
    setSavedExports,
    savedSetupsAdapter,
    savedStrainTipsAdapter,
    savedExportsAdapter,
    type SavedItemsState,
} from '@/stores/slices/savedItemsSlice'
import type { SavedSetup, SavedStrainTip, SavedExport, Strain } from '@/types'

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

vi.mock('@/stores/useUIStore', () => ({
    getUISnapshot: () => ({
        addNotification: vi.fn(),
        closeExportModal: vi.fn(),
    }),
}))

const initial: SavedItemsState = {
    savedSetups: savedSetupsAdapter.getInitialState(),
    savedStrainTips: savedStrainTipsAdapter.getInitialState(),
    savedExports: savedExportsAdapter.getInitialState(),
}

const makeSetup = (id: string, name = 'Test Setup'): SavedSetup =>
    ({
        id,
        name,
        createdAt: Date.now(),
        recommendation: {},
        totalCost: 100,
        sourceDetails: {
            plantCount: '2',
            experience: 'beginner',
            budget: 500,
            priorities: ['yield'],
            customNotes: '',
            growSpace: { width: 1, depth: 1 },
            floweringTypePreference: 'any',
        },
    }) as unknown as SavedSetup

const makeTip = (id: string, strainId = 'strain-1'): SavedStrainTip => ({
    id,
    createdAt: Date.now(),
    strainId,
    strainName: 'Test Strain',
    title: 'Grow Tip',
    nutrientTip: 'Use calmag',
    trainingTip: 'LST recommended',
    environmentalTip: 'Keep 24C',
    proTip: 'Flush before harvest',
})

const makeExport = (id: string): SavedExport => ({
    id,
    name: 'export.pdf',
    createdAt: Date.now(),
    format: 'pdf',
    strainIds: ['s1', 's2'],
    sourceDescription: 'Favorites',
})

describe('savedItemsSlice', () => {
    it('returns initial state', () => {
        const state = savedItemsReducer(undefined, { type: 'unknown' })
        expect(savedSetupsAdapter.getSelectors().selectAll(state.savedSetups)).toHaveLength(0)
        expect(savedStrainTipsAdapter.getSelectors().selectAll(state.savedStrainTips)).toHaveLength(
            0,
        )
        expect(savedExportsAdapter.getSelectors().selectAll(state.savedExports)).toHaveLength(0)
    })

    // -----------------------------------------------------------------------
    // Setups
    // -----------------------------------------------------------------------
    describe('setups', () => {
        it('setSavedSetups replaces all setups', () => {
            const setups = [makeSetup('s1', 'A'), makeSetup('s2', 'B')]
            const state = savedItemsReducer(initial, setSavedSetups(setups))
            const all = savedSetupsAdapter.getSelectors().selectAll(state.savedSetups)
            expect(all).toHaveLength(2)
            expect(all[0]!.name).toBe('A')
        })

        it('updateSetup modifies an existing setup', () => {
            let state = savedItemsReducer(initial, setSavedSetups([makeSetup('s1', 'Original')]))
            state = savedItemsReducer(state, updateSetup({ ...makeSetup('s1'), name: 'Updated' }))
            const setup = savedSetupsAdapter.getSelectors().selectById(state.savedSetups, 's1')
            expect(setup?.name).toBe('Updated')
        })

        it('deleteSetup removes a single setup', () => {
            let state = savedItemsReducer(
                initial,
                setSavedSetups([makeSetup('s1'), makeSetup('s2')]),
            )
            state = savedItemsReducer(state, deleteSetup('s1'))
            const all = savedSetupsAdapter.getSelectors().selectAll(state.savedSetups)
            expect(all).toHaveLength(1)
            expect(all[0]!.id).toBe('s2')
        })

        it('deleteMultipleSetups removes several setups', () => {
            let state = savedItemsReducer(
                initial,
                setSavedSetups([makeSetup('s1'), makeSetup('s2'), makeSetup('s3')]),
            )
            state = savedItemsReducer(state, deleteMultipleSetups(['s1', 's3']))
            const all = savedSetupsAdapter.getSelectors().selectAll(state.savedSetups)
            expect(all).toHaveLength(1)
            expect(all[0]!.id).toBe('s2')
        })

        it('deleteSetup with non-existent id is a no-op', () => {
            let state = savedItemsReducer(initial, setSavedSetups([makeSetup('s1')]))
            state = savedItemsReducer(state, deleteSetup('nonexistent'))
            expect(savedSetupsAdapter.getSelectors().selectAll(state.savedSetups)).toHaveLength(1)
        })
    })

    // -----------------------------------------------------------------------
    // Strain Tips
    // -----------------------------------------------------------------------
    describe('strain tips', () => {
        const mockStrain = { id: 'strain-1', name: 'Blue Dream' } as Strain

        it('addStrainTip adds a valid tip', () => {
            const state = savedItemsReducer(
                initial,
                addStrainTip({
                    strain: mockStrain,
                    tip: {
                        nutrientTip: 'Calmag',
                        trainingTip: 'LST',
                        environmentalTip: '24C',
                        proTip: 'Flush',
                    },
                    title: 'My Tip',
                }),
            )
            const all = savedStrainTipsAdapter.getSelectors().selectAll(state.savedStrainTips)
            expect(all).toHaveLength(1)
            expect(all[0]!.strainName).toBe('Blue Dream')
            expect(all[0]!.id).toMatch(/^tip-strain-1-/)
        })

        it('addStrainTip rejects empty/invalid tip (missing nutrientTip)', () => {
            const state = savedItemsReducer(
                initial,
                addStrainTip({
                    strain: mockStrain,
                    tip: {
                        nutrientTip: '',
                        trainingTip: 'LST',
                        environmentalTip: '24C',
                        proTip: 'Flush',
                    },
                    title: 'Bad Tip',
                }),
            )
            const all = savedStrainTipsAdapter.getSelectors().selectAll(state.savedStrainTips)
            expect(all).toHaveLength(0)
        })

        it('addStrainTip rejects when all tip fields are missing', () => {
            const state = savedItemsReducer(
                initial,
                addStrainTip({
                    strain: mockStrain,
                    tip: {
                        nutrientTip: '',
                        trainingTip: '',
                        environmentalTip: '',
                        proTip: '',
                    },
                    title: 'Empty',
                }),
            )
            expect(
                savedStrainTipsAdapter.getSelectors().selectAll(state.savedStrainTips),
            ).toHaveLength(0)
        })

        it('addStrainTip normalizes imageUrl', () => {
            const state = savedItemsReducer(
                initial,
                addStrainTip({
                    strain: mockStrain,
                    tip: {
                        nutrientTip: 'N',
                        trainingTip: 'T',
                        environmentalTip: 'E',
                        proTip: 'P',
                    },
                    title: 'With Image',
                    imageUrl: 'data:image/png;base64,abc',
                }),
            )
            const all = savedStrainTipsAdapter.getSelectors().selectAll(state.savedStrainTips)
            expect(all).toHaveLength(1)
            expect(all[0]!.imageUrl).toBeDefined()
        })

        it('setSavedStrainTips replaces all tips', () => {
            const tips = [makeTip('t1'), makeTip('t2')]
            const state = savedItemsReducer(initial, setSavedStrainTips(tips))
            expect(
                savedStrainTipsAdapter.getSelectors().selectAll(state.savedStrainTips),
            ).toHaveLength(2)
        })

        it('updateStrainTip modifies an existing tip', () => {
            let state = savedItemsReducer(initial, setSavedStrainTips([makeTip('t1')]))
            state = savedItemsReducer(
                state,
                updateStrainTip({ ...makeTip('t1'), title: 'Updated Title' }),
            )
            const tip = savedStrainTipsAdapter
                .getSelectors()
                .selectById(state.savedStrainTips, 't1')
            expect(tip?.title).toBe('Updated Title')
        })

        it('deleteStrainTip removes a single tip', () => {
            let state = savedItemsReducer(
                initial,
                setSavedStrainTips([makeTip('t1'), makeTip('t2')]),
            )
            state = savedItemsReducer(state, deleteStrainTip('t1'))
            expect(
                savedStrainTipsAdapter.getSelectors().selectAll(state.savedStrainTips),
            ).toHaveLength(1)
        })
    })

    // -----------------------------------------------------------------------
    // Exports
    // -----------------------------------------------------------------------
    describe('exports', () => {
        it('addExport creates a new export entry', () => {
            const state = savedItemsReducer(
                initial,
                addExport({
                    name: 'favorites.pdf',
                    format: 'pdf',
                    strainIds: ['s1'],
                    sourceDescription: 'Favorites',
                }),
            )
            const all = savedExportsAdapter.getSelectors().selectAll(state.savedExports)
            expect(all).toHaveLength(1)
            expect(all[0]!.name).toBe('favorites.pdf')
            expect(all[0]!.id).toMatch(/^export-/)
        })

        it('setSavedExports replaces all exports', () => {
            const exports = [makeExport('e1'), makeExport('e2')]
            const state = savedItemsReducer(initial, setSavedExports(exports))
            expect(savedExportsAdapter.getSelectors().selectAll(state.savedExports)).toHaveLength(2)
        })

        it('updateExport modifies an existing export', () => {
            let state = savedItemsReducer(initial, setSavedExports([makeExport('e1')]))
            state = savedItemsReducer(
                state,
                updateExport({ ...makeExport('e1'), name: 'renamed.pdf' }),
            )
            const exp = savedExportsAdapter.getSelectors().selectById(state.savedExports, 'e1')
            expect(exp?.name).toBe('renamed.pdf')
        })

        it('deleteExport removes a single export', () => {
            let state = savedItemsReducer(
                initial,
                setSavedExports([makeExport('e1'), makeExport('e2')]),
            )
            state = savedItemsReducer(state, deleteExport('e1'))
            expect(savedExportsAdapter.getSelectors().selectAll(state.savedExports)).toHaveLength(1)
        })

        it('deleteMultipleExports removes several exports', () => {
            let state = savedItemsReducer(
                initial,
                setSavedExports([makeExport('e1'), makeExport('e2'), makeExport('e3')]),
            )
            state = savedItemsReducer(state, deleteMultipleExports(['e1', 'e3']))
            const all = savedExportsAdapter.getSelectors().selectAll(state.savedExports)
            expect(all).toHaveLength(1)
            expect(all[0]!.id).toBe('e2')
        })
    })
})
