import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
    loadZip: vi.fn(),
    replacePrimaryPersistedSnapshot: vi.fn(),
}))

vi.mock('jszip', () => {
    class MockJSZip {
        files: Record<string, unknown> = {}
        static loadAsync(file: Blob): Promise<unknown> {
            return mocks.loadZip(file)
        }
        file(name: string, _data?: string): MockJSZip {
            this.files[name] = { name }
            return this
        }
        async generateAsync(): Promise<Blob> {
            return new Blob(['mockzip'], { type: 'application/zip' })
        }
    }
    return {
        default: MockJSZip,
    }
})

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
    },
}))

vi.mock('@/constants', () => ({
    REDUX_STATE_KEY: 'test-state-key',
}))

vi.mock('@/services/persistedStateService', () => ({
    replacePrimaryPersistedSnapshot: mocks.replacePrimaryPersistedSnapshot,
}))

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

import { backupService } from '@/services/backupService'
import { indexedDBStorage } from '@/stores/indexedDBStorage'

describe('backupService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.replacePrimaryPersistedSnapshot.mockResolvedValue(true)
    })

    describe('exportBackup', () => {
        it('returns error when no saved state found', async () => {
            vi.mocked(indexedDBStorage.getItem).mockResolvedValue(null)
            const result = await backupService.exportBackup()
            expect(result.success).toBe(false)
            expect(result.error).toContain('No saved state found')
        })

        it('returns a successful result with state', async () => {
            vi.mocked(indexedDBStorage.getItem).mockResolvedValue('{"simulation":{"plants":[]}}')
            const result = await backupService.exportBackup()
            expect(result.success).toBe(true)
            expect(result.blob).toBeInstanceOf(Blob)
            expect(result.filename).toMatch(/^cannaguide-backup-\d{4}-\d{2}-\d{2}/)
            expect(result.metadata).toBeDefined()
            expect(result.metadata?.plantCount).toBe(0)
        })
    })

    describe('importBackup', () => {
        it('rejects oversized files', async () => {
            const bigFile = new File(['x'], 'big.zip', { type: 'application/zip' })
            Object.defineProperty(bigFile, 'size', { value: 600 * 1024 * 1024 })
            const result = await backupService.importBackup(bigFile)
            expect(result.success).toBe(false)
            expect(result.error).toContain('too large')
        })

        it('reports a state restore blocked by safe recovery', async () => {
            const state = '{"version":6}'
            mocks.loadZip.mockResolvedValueOnce({
                files: { 'cannaguide-state.json': { name: 'cannaguide-state.json' } },
                file: (name: string) =>
                    name === 'cannaguide-state.json'
                        ? { async: vi.fn().mockResolvedValue(state) }
                        : null,
            })
            mocks.replacePrimaryPersistedSnapshot.mockResolvedValueOnce(false)

            const result = await backupService.importBackup(
                new File(['zip'], 'backup.zip', { type: 'application/zip' }),
            )

            expect(result).toEqual({
                success: false,
                metadata: null,
                error: 'settingsView.data.restoreBlocked',
            })
        })
    })

    describe('downloadBlob', () => {
        it('creates and clicks a download link', () => {
            const createElementSpy = vi.spyOn(document, 'createElement')
            const appendSpy = vi.spyOn(document.body, 'appendChild')
            const blob = new Blob(['test'])

            backupService.downloadBlob(blob, 'test.zip')

            expect(createElementSpy).toHaveBeenCalledWith('a')
            expect(appendSpy).toHaveBeenCalled()
        })
    })
})
