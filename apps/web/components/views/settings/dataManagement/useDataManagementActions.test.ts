import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
    state: {
        simulation: {
            plants: { entities: {}, ids: [] as string[] },
            plantSlots: [null, null, null] as (string | null)[],
        },
        grows: {
            activeGrowId: 'default-grow',
            grows: { entities: {}, ids: [] as string[] },
        },
    },
    dispatch: vi.fn(),
    addNotification: vi.fn(),
    replacePrimaryPersistedSnapshot: vi.fn(),
    t: vi.fn((key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key),
}))

vi.mock('@/stores/store', () => ({
    useAppDispatch: () => mocks.dispatch,
    useAppSelector: (selector: (state: unknown) => unknown) => selector(mocks.state),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: mocks.t }),
}))

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
    i18nInstance: {},
}))

vi.mock('@/stores/useUIStore', () => ({
    getUISnapshot: () => ({ addNotification: mocks.addNotification }),
}))

vi.mock('@/services/privacyService', () => ({
    getKnownDatabaseNames: () => ['CannaGuideStateDB', 'CannaGuideDB'],
    eraseAllData: vi.fn().mockResolvedValue(true),
    exportAllUserData: vi.fn().mockResolvedValue('{}'),
    eraseSingleDatabase: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/services/dbService', () => ({
    dbService: {
        optimizeSimulationForPersistence: vi.fn(async (s: unknown) => s),
        pruneOldImages: vi.fn().mockResolvedValue(0),
    },
}))

vi.mock('@/services/indexedDbPruneService', () => ({
    pruneOnQuotaThreshold: vi.fn().mockResolvedValue({ prunedEntries: 0 }),
}))

vi.mock('@/services/persistedStateService', () => ({
    replacePrimaryPersistedSnapshot: mocks.replacePrimaryPersistedSnapshot,
}))

vi.mock('@sentry/react', () => ({
    withScope: (fn: (scope: { setTag: () => void }) => void) => fn({ setTag: vi.fn() }),
    captureMessage: vi.fn(),
}))

let useDataManagementActions: typeof import('./useDataManagementActions').useDataManagementActions

describe('useDataManagementActions', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        vi.resetModules()
        mocks.state.grows.grows.ids = []
        // Thunks run against the mocked state, like the real thunk middleware.
        mocks.dispatch.mockImplementation((action: unknown) =>
            typeof action === 'function'
                ? (action as (d: unknown, g: () => unknown) => unknown)(
                      mocks.dispatch,
                      () => mocks.state,
                  )
                : { unwrap: vi.fn(() => Promise.resolve()) },
        )
        mocks.replacePrimaryPersistedSnapshot.mockResolvedValue(true)
        ;({ useDataManagementActions } = await import('./useDataManagementActions'))
    })

    it('exposes known databases and erase phrase constants', () => {
        const { result } = renderHook(() => useDataManagementActions())
        expect(result.current.knownDatabases).toEqual(['CannaGuideStateDB', 'CannaGuideDB'])
        expect(result.current.erasePhrase).toBe('DELETE ALL')
        expect(result.current.isEraseDisabled).toBe(true)
    })

    it('dispatches resetAllData on handleResetAll', async () => {
        const { result } = renderHook(() => useDataManagementActions())
        await act(async () => {
            await result.current.handleResetAll()
        })
        expect(mocks.dispatch).toHaveBeenCalled()
    })

    it('opens export confirm via setIsExportConfirmOpen', () => {
        const { result } = renderHook(() => useDataManagementActions())
        act(() => {
            result.current.setIsExportConfirmOpen(true)
        })
        expect(result.current.isExportConfirmOpen).toBe(true)
    })

    it('handleConfirmExportAll dispatches exportAllData', () => {
        const { result } = renderHook(() => useDataManagementActions())
        act(() => {
            result.current.handleConfirmExportAll()
        })
        expect(mocks.dispatch).toHaveBeenCalled()
    })

    it('reports a failed full-data export instead of downloading a file (#670)', async () => {
        const privacy = await import('@/services/privacyService')
        vi.mocked(privacy.exportAllUserData).mockRejectedValueOnce(new Error('read failed'))
        const createObjectURL = vi.fn(() => 'blob:export')
        vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() })
        try {
            const { result } = renderHook(() => useDataManagementActions())
            await act(async () => {
                await result.current.handleExportAllUserData()
            })
            expect(createObjectURL).not.toHaveBeenCalled()
            expect(mocks.addNotification).toHaveBeenCalledWith({
                type: 'error',
                message: 'settingsView.data.gdprExportError',
            })
            expect(result.current.isExportingAll).toBe(false)
        } finally {
            vi.unstubAllGlobals()
        }
    })

    it('reports only removed photos in the storage cleanup message', async () => {
        const { dbService } = await import('@/services/dbService')
        const { pruneOnQuotaThreshold } = await import('@/services/indexedDbPruneService')
        vi.mocked(dbService.pruneOldImages).mockResolvedValueOnce(3)
        vi.mocked(pruneOnQuotaThreshold).mockResolvedValueOnce({
            prunedEntries: 40,
        } as Awaited<ReturnType<typeof pruneOnQuotaThreshold>>)
        const { result } = renderHook(() => useDataManagementActions())

        await act(async () => {
            await result.current.handleRunStorageCleanup()
        })

        // 40 search-index entries are not photos and must not inflate the count.
        expect(mocks.t).toHaveBeenCalledWith('settingsView.data.cleanupSuccess', { count: 3 })
        expect(mocks.addNotification).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'success' }),
        )
    })

    it('reports a validation failure from confirmed state import', async () => {
        const { result } = renderHook(() => useDataManagementActions())
        const file = new File(['{"version":6,"settings":"invalid"}'], 'invalid.json', {
            type: 'application/json',
        })

        act(() => {
            result.current.handleFileChange({
                target: { files: [file], value: '' },
            } as unknown as Parameters<typeof result.current.handleFileChange>[0])
        })
        await waitFor(() => expect(result.current.isImportConfirmOpen).toBe(true))
        mocks.replacePrimaryPersistedSnapshot.mockRejectedValueOnce(
            new TypeError('Invalid persisted state'),
        )

        await act(async () => {
            await result.current.confirmImport()
        })

        expect(mocks.addNotification).toHaveBeenCalledWith({
            type: 'error',
            message: 'settingsView.data.importError',
        })
        expect(result.current.isImportConfirmOpen).toBe(true)
    })

    it('keeps the reset dialog open when persisted-state removal is blocked', async () => {
        const unwrap = vi.fn().mockRejectedValue(new Error('blocked'))
        mocks.dispatch.mockReturnValueOnce({ unwrap })
        const { result } = renderHook(() => useDataManagementActions())
        act(() => result.current.setIsResetConfirmOpen(true))

        await act(async () => {
            await result.current.handleResetAll()
        })

        expect(result.current.isResetConfirmOpen).toBe(true)
        expect(mocks.addNotification).toHaveBeenCalledWith({
            type: 'error',
            message: 'settingsView.data.resetError',
        })
    })

    it('keeps the slice dialog open when a slice reset is blocked', async () => {
        const unwrap = vi.fn().mockRejectedValue(new Error('blocked'))
        mocks.dispatch.mockReturnValueOnce({ unwrap })
        const { result } = renderHook(() => useDataManagementActions())
        act(() => result.current.setSliceToReset('simulation'))

        await act(async () => {
            await result.current.handleConfirmSliceReset()
        })

        expect(result.current.sliceToReset).toBe('simulation')
        expect(mocks.addNotification).toHaveBeenCalledWith({
            type: 'error',
            message: 'settingsView.data.sliceResetError',
        })
    })

    describe('grow import (GH #674)', () => {
        const growFile = async (plantCount: number): Promise<File> => {
            const { plantSimulationService } = await import('@/services/plantSimulationService')
            const strain = {
                id: 'strain-hook-test',
                name: 'Hook Strain',
                type: 'Hybrid',
                floweringType: 'Photoperiod',
                agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
            }
            const setup = {
                lightType: 'LED',
                lightWattage: 300,
                lightHours: 18,
                ventilation: 'medium',
                hasCirculationFan: true,
                potSize: 11,
                potType: 'Fabric',
                medium: 'Soil',
                dynamicLighting: false,
            }
            const plants = Array.from({ length: plantCount }, (_, index) => ({
                ...plantSimulationService.createPlant(
                    strain as Parameters<typeof plantSimulationService.createPlant>[0],
                    setup as Parameters<typeof plantSimulationService.createPlant>[1],
                    `Plant ${String(index)}`,
                ),
                id: `p${String(index)}`,
                growId: 'default-grow',
            }))
            const body = JSON.stringify({
                version: '2.0',
                exportedAt: 1,
                grow: { id: 'default-grow', name: 'Balcony', isActive: true },
                plants,
            })
            return new File([body], 'grow.json', { type: 'application/json' })
        }

        const importFile = async (file: File) => {
            const { result } = renderHook(() => useDataManagementActions())
            act(() => {
                result.current.handleGrowFileChange({
                    target: { files: [file], value: 'grow.json' },
                } as unknown as Parameters<typeof result.current.handleGrowFileChange>[0])
            })
            await waitFor(() => expect(mocks.addNotification).toHaveBeenCalled())
        }

        const dispatchedActions = (): { type: string; payload: unknown }[] =>
            mocks.dispatch.mock.calls
                .map(([action]) => action as { type?: string; payload?: unknown })
                .filter((action) => typeof action.type === 'string')
                .map((action) => ({ type: String(action.type), payload: action.payload }))
        const dispatchedTypes = (): string[] => dispatchedActions().map(({ type }) => type)

        it('adds the grow and every plant, then reports success', async () => {
            await importFile(await growFile(2))

            expect(dispatchedTypes()).toEqual([
                'grows/addGrow',
                'simulation/addPlant',
                'simulation/addPlant',
            ])
            expect(mocks.addNotification).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'success' }),
            )
        })

        it('adds nothing and says why when the plants exceed the free slots', async () => {
            await importFile(await growFile(4))

            expect(dispatchedTypes()).toEqual([])
            expect(mocks.addNotification).toHaveBeenCalledWith({
                type: 'error',
                message: 'settingsView.data.growImportPlantLimit',
            })
            expect(mocks.addNotification).not.toHaveBeenCalledWith(
                expect.objectContaining({ type: 'success' }),
            )
        })

        it('gives the grow a new id in a profile that already has the default grow', async () => {
            mocks.state.grows.grows.ids = ['default-grow']

            await importFile(await growFile(2))

            const [growAction, ...plantActions] = dispatchedActions()
            const growId = (growAction?.payload as { id: string }).id
            expect(growId).not.toBe('default-grow')
            expect(
                plantActions.map(
                    ({ payload }) => (payload as { plant: { growId: string } }).plant.growId,
                ),
            ).toEqual([growId, growId])
        })
    })
})
