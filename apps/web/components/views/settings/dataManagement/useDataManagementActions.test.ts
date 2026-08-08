import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useDataManagementActions } from './useDataManagementActions'

const mockDispatch = vi.fn()
const mocks = vi.hoisted(() => ({
    addNotification: vi.fn(),
    replacePrimaryPersistedSnapshot: vi.fn(),
}))

vi.mock('@/stores/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({
            simulation: {
                plants: { entities: {}, ids: [] },
                plantSlots: [null, null, null],
            },
            grows: {
                activeGrowId: 'default-grow',
                grows: { entities: {}, ids: [] },
            },
        }),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    }),
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

describe('useDataManagementActions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.replacePrimaryPersistedSnapshot.mockResolvedValue(true)
    })

    it('exposes known databases and erase phrase constants', () => {
        const { result } = renderHook(() => useDataManagementActions())
        expect(result.current.knownDatabases).toEqual(['CannaGuideStateDB', 'CannaGuideDB'])
        expect(result.current.erasePhrase).toBe('DELETE ALL')
        expect(result.current.isEraseDisabled).toBe(true)
    })

    it('dispatches resetAllData on handleResetAll', () => {
        const { result } = renderHook(() => useDataManagementActions())
        act(() => {
            result.current.handleResetAll()
        })
        expect(mockDispatch).toHaveBeenCalled()
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
        expect(mockDispatch).toHaveBeenCalled()
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
})
