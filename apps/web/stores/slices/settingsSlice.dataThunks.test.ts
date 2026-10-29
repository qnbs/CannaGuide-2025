import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportAllData, resetAllData } from '@/stores/slices/settingsSlice'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { removePrimaryPersistedSnapshot } from '@/services/persistedStateService'
import { porcupineKeyService } from '@/services/porcupineKeyService'

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: { removeItem: vi.fn(async () => undefined) },
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

    it('deletes the startup backup and the recovery rollback with the snapshot', async () => {
        const result = await runReset()
        expect(result.meta.requestStatus).toBe('fulfilled')
        const removed = vi.mocked(indexedDBStorage.removeItem).mock.calls.map(([key]) => key)
        expect(removed).toEqual(
            expect.arrayContaining([
                'cannaguide-redux-storage-backup',
                'cannaguide-redux-storage-recovery-rollback',
                'geminiApiKey',
            ]),
        )
        expect(porcupineKeyService.clearApiKey).toHaveBeenCalled()
        expect(reload).toHaveBeenCalled()
    })

    it('keeps every copy when safe recovery blocks the reset', async () => {
        vi.mocked(removePrimaryPersistedSnapshot).mockResolvedValueOnce(false)
        const result = await runReset()
        expect(result.meta.requestStatus).toBe('rejected')
        expect(indexedDBStorage.removeItem).not.toHaveBeenCalled()
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
        const state = {
            settings: {
                settings: {
                    tts: { cloudTtsApiKey: CANARY },
                    voiceControl: { porcupineAccessKey: 'pv_canary_0000000000000000000000000000' },
                },
                version: 5,
            },
            simulation: { marker: 'plants-kept' },
        }
        await exportAllData()(vi.fn(), () => state as never, undefined)
        const json = await readBlob(createObjectURL.mock.calls[0]![0])
        expect(json).not.toContain(CANARY)
        expect(json).not.toContain('pv_canary_0000000000000000000000000000')
        expect(json).toContain('plants-kept')
        expect(click).toHaveBeenCalled()
        click.mockRestore()
    })
})
