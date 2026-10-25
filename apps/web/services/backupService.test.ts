import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'

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

    afterEach(() => {
        // Windows runs this suite with isolate: false. clearAllMocks keeps
        // spy implementations, so restore the real URL methods before the next file.
        vi.restoreAllMocks()
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

        it('reports failure when backed-up images have no destination store', async () => {
            const removeRequest = indexedDB.deleteDatabase('CannaGuideDB')
            await new Promise<void>((resolve, reject) => {
                removeRequest.onsuccess = () => resolve()
                removeRequest.onerror = () => reject(removeRequest.error)
                removeRequest.onblocked = () => reject(new Error('Image database deletion blocked'))
            })
            const imagePath = 'images/photo-1.json'
            mocks.loadZip.mockResolvedValueOnce({
                files: {
                    'cannaguide-state.json': { name: 'cannaguide-state.json' },
                    [imagePath]: { name: imagePath },
                },
                file: (name: string) => {
                    if (name === 'cannaguide-state.json') {
                        return { async: async () => '{"version":6}' }
                    }
                    if (name === imagePath) {
                        return {
                            async: async () =>
                                JSON.stringify({
                                    id: 'photo-1',
                                    data: 'data:image/jpeg;base64,AA==',
                                }),
                        }
                    }
                    return null
                },
            })

            const result = await backupService.importBackup(
                new File(['zip'], 'backup.zip', { type: 'application/zip' }),
            )

            expect(result.success).toBe(false)
            expect(result.error).toContain('Image storage unavailable')
            expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
        })

        it('writes asynchronously decompressed image data in an active IndexedDB transaction', async () => {
            const removeRequest = indexedDB.deleteDatabase('CannaGuideDB')
            await new Promise<void>((resolve, reject) => {
                removeRequest.onsuccess = () => resolve()
                removeRequest.onerror = () => reject(removeRequest.error)
                removeRequest.onblocked = () => reject(new Error('Image database deletion blocked'))
            })

            const openRequest = indexedDB.open('CannaGuideDB', 1)
            openRequest.onupgradeneeded = () => {
                openRequest.result.createObjectStore('images', { keyPath: 'id' })
            }
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                openRequest.onsuccess = () => resolve(openRequest.result)
                openRequest.onerror = () => reject(openRequest.error)
            })

            const image = { id: 'photo-1', data: 'data:image/jpeg;base64,AA==' }
            const imagePath = 'images/photo-1.json'
            mocks.loadZip.mockResolvedValueOnce({
                files: {
                    'cannaguide-state.json': { name: 'cannaguide-state.json' },
                    [imagePath]: { name: imagePath },
                },
                file: (name: string) => {
                    if (name === 'cannaguide-state.json') {
                        return { async: async () => '{"version":6}' }
                    }
                    if (name === imagePath) {
                        return {
                            async: async () => {
                                await new Promise((resolve) => setTimeout(resolve, 0))
                                return JSON.stringify(image)
                            },
                        }
                    }
                    return null
                },
            })

            const importResult = await Promise.race([
                backupService.importBackup(
                    new File(['zip'], 'backup.zip', { type: 'application/zip' }),
                ),
                new Promise<'timed-out'>((resolve) => setTimeout(() => resolve('timed-out'), 1000)),
            ])

            expect(importResult).not.toBe('timed-out')
            expect(importResult).toMatchObject({ success: true })

            const restoredImage = await new Promise<unknown>((resolve, reject) => {
                const request = db
                    .transaction('images', 'readonly')
                    .objectStore('images')
                    .get('photo-1')
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
            expect(restoredImage).toEqual(image)
            db.close()
        })

        it('does not restore image entries with external or missing image data', async () => {
            const removeRequest = indexedDB.deleteDatabase('CannaGuideDB')
            await new Promise<void>((resolve, reject) => {
                removeRequest.onsuccess = () => resolve()
                removeRequest.onerror = () => reject(removeRequest.error)
                removeRequest.onblocked = () => reject(new Error('Image database deletion blocked'))
            })

            const openRequest = indexedDB.open('CannaGuideDB', 1)
            openRequest.onupgradeneeded = () => {
                openRequest.result.createObjectStore('images', { keyPath: 'id' })
            }
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                openRequest.onsuccess = () => resolve(openRequest.result)
                openRequest.onerror = () => reject(openRequest.error)
            })

            const statePath = 'cannaguide-state.json'
            const validPath = 'images/photo-valid.json'
            const externalPath = 'images/photo-external.json'
            const incompletePath = 'images/photo-incomplete.json'
            const entries: Record<string, { async: () => Promise<string> }> = {
                [statePath]: { async: async () => '{"version":6}' },
                [validPath]: {
                    async: async () =>
                        JSON.stringify({
                            id: 'photo-valid',
                            data: 'data:image/jpeg;base64,/9j/AA==',
                            createdAt: 10,
                        }),
                },
                [externalPath]: {
                    async: async () =>
                        JSON.stringify({
                            id: 'photo-external',
                            data: 'https://images.example.test/tracker.png',
                            createdAt: 11,
                        }),
                },
                [incompletePath]: {
                    async: async () => JSON.stringify({ id: 'photo-incomplete', createdAt: 12 }),
                },
            }
            mocks.loadZip.mockResolvedValueOnce({
                files: Object.fromEntries(Object.keys(entries).map((name) => [name, { name }])),
                file: (name: string) => entries[name] ?? null,
            })

            const result = await backupService.importBackup(
                new File(['zip'], 'backup.zip', { type: 'application/zip' }),
            )
            const restoredImages = await new Promise<unknown[]>((resolve, reject) => {
                const request = db.transaction('images', 'readonly').objectStore('images').getAll()
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })

            expect(result.success).toBe(true)
            expect(restoredImages).toEqual([
                {
                    id: 'photo-valid',
                    data: 'data:image/jpeg;base64,/9j/AA==',
                    createdAt: 10,
                },
            ])
            db.close()
        })

        it('removes external image URLs from restored journal state', async () => {
            const statePath = 'cannaguide-state.json'
            const state = {
                version: 6,
                simulation: {
                    plants: {
                        ids: ['plant-1'],
                        entities: {
                            'plant-1': {
                                journal: [
                                    {
                                        type: 'photo',
                                        details: {
                                            imageId: 'photo-1',
                                            imageUrl: 'https://images.example.test/tracker.png',
                                        },
                                    },
                                    {
                                        type: 'photo',
                                        details: {
                                            imageUrl: 'data:image/jpeg;base64,/9j/AA==',
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            }
            mocks.loadZip.mockResolvedValueOnce({
                files: { [statePath]: { name: statePath } },
                file: (name: string) =>
                    name === statePath ? { async: async () => JSON.stringify(state) } : null,
            })

            const result = await backupService.importBackup(
                new File(['zip'], 'backup.zip', { type: 'application/zip' }),
            )
            const [persistedSnapshot] = mocks.replacePrimaryPersistedSnapshot.mock.calls[0] ?? []

            expect(result.success).toBe(true)
            expect(JSON.parse(String(persistedSnapshot))).toEqual({
                ...state,
                simulation: {
                    plants: {
                        ids: ['plant-1'],
                        entities: {
                            'plant-1': {
                                journal: [
                                    { type: 'photo', details: { imageId: 'photo-1' } },
                                    {
                                        type: 'photo',
                                        details: {
                                            imageUrl: 'data:image/jpeg;base64,/9j/AA==',
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            })
        })
    })

    describe('downloadBlob', () => {
        it('creates and clicks a download link', () => {
            const createElementSpy = vi.spyOn(document, 'createElement')
            const appendSpy = vi.spyOn(document.body, 'appendChild')
            // jsdom 30 createObjectURL reads an internal blob buffer that Node's Blob
            // does not have. The download path only needs a URL string.
            vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
            vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
            const blob = new Blob(['test'])

            backupService.downloadBlob(blob, 'test.zip')

            expect(createElementSpy).toHaveBeenCalledWith('a')
            expect(appendSpy).toHaveBeenCalled()
        })
    })
})
