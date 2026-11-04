import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportAllData, resetAllData, resetSliceData } from '@/stores/slices/settingsSlice'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { stopPersistenceForOwnershipLoss } from '@/bootstrap/persistenceCoordinator'
import {
    removePrimaryPersistedSnapshot,
    updatePrimaryPersistedSnapshot,
} from '@/services/persistedStateService'
import { porcupineKeyService } from '@/services/porcupineKeyService'

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: { removeItem: vi.fn(async () => undefined) },
}))
vi.mock('@/bootstrap/persistenceCoordinator', () => ({
    stopPersistenceForOwnershipLoss: vi.fn(() => Promise.resolve()),
}))
vi.mock('@/services/persistedStateService', () => ({
    removePrimaryPersistedSnapshot: vi.fn(async () => true),
    updatePrimaryPersistedSnapshot: vi.fn(),
}))
vi.mock('@/services/aiProviderService', () => ({
    aiProviderService: { clearAllProviderApiKeys: vi.fn(async () => undefined) },
}))
vi.mock('@/services/cloudTtsKeyService', () => ({
    cloudTtsKeyService: { clearApiKey: vi.fn(async () => undefined) },
}))
vi.mock('@/services/porcupineKeyService', () => ({
    porcupineKeyService: { clearApiKey: vi.fn(async () => undefined) },
}))

const reload = vi.fn()
const runReset = () => resetAllData()(vi.fn(), () => ({}), undefined)

describe('resetAllData (#711 review)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...window.location, reload },
        })
    })

    it('deletes the startup backup, the rollback and the quarantine with the snapshot', async () => {
        const result = await runReset()
        expect(result.meta.requestStatus).toBe('fulfilled')
        const removed = vi.mocked(indexedDBStorage.removeItem).mock.calls.map(([key]) => key)
        expect(removed).toEqual(
            expect.arrayContaining([
                'cannaguide-redux-storage-backup',
                'cannaguide-redux-storage-recovery-rollback',
                'cannaguide-redux-storage-quarantine',
                'geminiApiKey',
            ]),
        )
        expect(porcupineKeyService.clearApiKey).toHaveBeenCalled()
        expect(stopPersistenceForOwnershipLoss).toHaveBeenCalledOnce()
        expect(vi.mocked(stopPersistenceForOwnershipLoss).mock.invocationCallOrder[0]).toBeLessThan(
            reload.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
        )
        expect(reload).toHaveBeenCalled()
    })

    it('stops this page saving before a slice reset reloads it (#669)', async () => {
        vi.mocked(updatePrimaryPersistedSnapshot).mockResolvedValueOnce(true)

        const result = await resetSliceData('notes')(vi.fn(), () => ({}), null)

        expect(result.meta.requestStatus).toBe('fulfilled')
        expect(stopPersistenceForOwnershipLoss).toHaveBeenCalledOnce()
        expect(reload).toHaveBeenCalledOnce()
        expect(vi.mocked(stopPersistenceForOwnershipLoss).mock.invocationCallOrder[0]).toBeLessThan(
            reload.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
        )
    })

    it('keeps every copy when safe recovery blocks the reset', async () => {
        vi.mocked(removePrimaryPersistedSnapshot).mockResolvedValueOnce(false)
        const result = await runReset()
        expect(result.meta.requestStatus).toBe('rejected')
        expect(indexedDBStorage.removeItem).not.toHaveBeenCalled()
        expect(stopPersistenceForOwnershipLoss).not.toHaveBeenCalled()
        expect(reload).not.toHaveBeenCalled()
    })
})

// A synthetic canary, never a real key (#654).
const CANARY = 'sk_canary_0000000000000000000000000000'

const readBlob = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsText(blob)
    })

describe('exportAllData (#654)', () => {
    it('downloads the state without the Cloud TTS key', async () => {
        const createObjectURL = vi.fn((_blob: Blob) => 'blob:export')
        Object.defineProperty(URL, 'createObjectURL', {
            configurable: true,
            value: createObjectURL,
        })
        Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
        // A real initial state, because the export writes the persisted snapshot
        // format, with secrets added where they would sit in Redux.
        const { createAppStoreSync } = await import('@/stores/store')
        const { addGrow } = await import('@/stores/slices/growsSlice')
        const store = createAppStoreSync()
        store.dispatch(addGrow({ id: 'grow-export-sentinel', name: 'Tent', isActive: true }))
        const base = store.getState()
        const state = {
            ...base,
            settings: {
                ...base.settings,
                settings: {
                    ...base.settings.settings,
                    tts: { ...base.settings.settings.tts, cloudTtsApiKey: CANARY },
                    voiceControl: {
                        ...base.settings.settings.voiceControl,
                        porcupineAccessKey: 'pv_canary_0000000000000000000000000000',
                    },
                },
            },
        }
        await exportAllData()(vi.fn(), () => state as never, undefined)
        const json = await readBlob(createObjectURL.mock.calls[0]![0])
        expect(json).not.toContain(CANARY)
        expect(json).not.toContain('pv_canary_0000000000000000000000000000')
        // The real import path: the version gate, then the migration pipeline.
        const { isImportableSnapshot } = await import('@/services/persistedSnapshotFormat')
        const { parseAndMigratePersistedSnapshot } =
            await import('@/services/migration/persistedSnapshot')
        expect(isImportableSnapshot(JSON.parse(json))).toBe(true)
        const restored = parseAndMigratePersistedSnapshot(json)
        expect(restored.grows?.grows.ids).toContain('grow-export-sentinel')
        expect(restored.simulation?.plantSlots).toEqual(base.simulation.plantSlots)
        expect(click).toHaveBeenCalled()
        click.mockRestore()
    })
})
