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

const VALID_PNG_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F7sAAAAASUVORK5CYII='
const decodeImageMock = vi.fn()

const createPngHeaderDataUrl = (width: number, height: number): string => {
    const header = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0,
        0, 0, 0, 0, 0, 0,
    ])
    const view = new DataView(header.buffer)
    view.setUint32(16, width)
    view.setUint32(20, height)
    return `data:image/png;base64,${btoa(String.fromCharCode(...header))}`
}

const importMockBackup = (state: unknown, images: Record<string, unknown> = {}) => {
    const entries = new Map<string, string>([
        ['cannaguide-state.json', JSON.stringify(state)],
        ...Object.entries(images).map(([id, image]): [string, string] => [
            `images/${id}.json`,
            JSON.stringify(image),
        ]),
    ])
    mocks.loadZip.mockResolvedValueOnce({
        files: Object.fromEntries([...entries.keys()].map((name) => [name, { name }])),
        file: (name: string) => {
            const value = entries.get(name)
            return value === undefined ? null : { async: async () => value }
        },
    })
    return backupService.importBackup(new File(['zip'], 'backup.zip', { type: 'application/zip' }))
}

const recreateImageDatabase = async (): Promise<IDBDatabase> => {
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
    return new Promise((resolve, reject) => {
        openRequest.onsuccess = () => resolve(openRequest.result)
        openRequest.onerror = () => reject(openRequest.error)
    })
}

const writeStoredImage = (db: IDBDatabase, image: unknown): Promise<void> =>
    new Promise((resolve, reject) => {
        const tx = db.transaction('images', 'readwrite')
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
        tx.objectStore('images').put(image)
    })

const readStoredImage = (db: IDBDatabase, id: string): Promise<unknown> =>
    new Promise((resolve, reject) => {
        const request = db.transaction('images', 'readonly').objectStore('images').get(id)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })

describe('backupService', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        decodeImageMock.mockResolvedValue({ width: 1, height: 1, close: vi.fn() })
        vi.stubGlobal('createImageBitmap', decodeImageMock)
        mocks.replacePrimaryPersistedSnapshot.mockResolvedValue(true)
    })

    afterEach(() => {
        // Windows runs this suite with isolate: false. clearAllMocks keeps
        // spy implementations, so restore the real URL methods before the next file.
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
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
                                    data: VALID_PNG_DATA_URL,
                                    createdAt: 10,
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

            const image = { id: 'photo-1', data: VALID_PNG_DATA_URL, createdAt: 10 }
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
                            data: VALID_PNG_DATA_URL,
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
                    data: VALID_PNG_DATA_URL,
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
                                            imageUrl: VALID_PNG_DATA_URL,
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
                                            imageUrl: VALID_PNG_DATA_URL,
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

    describe('restore hardening regressions', () => {
        it('removes remote saved strain-tip images before restoring state', async () => {
            const state = {
                savedItems: {
                    savedStrainTips: {
                        ids: ['tip-1', 'tip-2'],
                        entities: {
                            'tip-1': { id: 'tip-1', imageUrl: 'https://tracker.example/image.png' },
                            'tip-2': { id: 'tip-2', imageUrl: VALID_PNG_DATA_URL },
                        },
                    },
                },
            }

            const result = await importMockBackup(state)
            const [persistedSnapshot] = mocks.replacePrimaryPersistedSnapshot.mock.calls[0] ?? []

            expect(result.success).toBe(true)
            expect(JSON.parse(String(persistedSnapshot))).toEqual({
                savedItems: {
                    savedStrainTips: {
                        ids: ['tip-1', 'tip-2'],
                        entities: {
                            'tip-1': { id: 'tip-1' },
                            'tip-2': { id: 'tip-2', imageUrl: VALID_PNG_DATA_URL },
                        },
                    },
                },
            })
        })

        it('rejects undecodable image bytes and removes their journal references', async () => {
            decodeImageMock.mockRejectedValueOnce(new Error('invalid raster bytes'))
            const state = {
                simulation: {
                    plants: {
                        ids: ['plant-1'],
                        entities: {
                            'plant-1': {
                                journal: [{ type: 'photo', details: { imageId: 'photo-invalid' } }],
                            },
                        },
                    },
                },
            }

            const result = await importMockBackup(state, {
                'photo-invalid': {
                    id: 'photo-invalid',
                    data: VALID_PNG_DATA_URL,
                    createdAt: 10,
                },
            })
            const [persistedSnapshot] = mocks.replacePrimaryPersistedSnapshot.mock.calls[0] ?? []

            expect(result.success).toBe(true)
            expect(JSON.parse(String(persistedSnapshot))).toEqual({
                simulation: {
                    plants: {
                        ids: ['plant-1'],
                        entities: {
                            'plant-1': { journal: [{ type: 'photo', details: {} }] },
                        },
                    },
                },
            })
        })

        it('rejects raster dimensions above the bounded decode limit before browser decoding', async () => {
            const state = {
                simulation: {
                    plants: {
                        ids: ['plant-1'],
                        entities: {
                            'plant-1': {
                                journal: [{ type: 'photo', details: { imageId: 'photo-large' } }],
                            },
                        },
                    },
                },
            }

            const result = await importMockBackup(state, {
                'photo-large': {
                    id: 'photo-large',
                    data: createPngHeaderDataUrl(8193, 8193),
                    createdAt: 10,
                },
            })
            const [persistedSnapshot] = mocks.replacePrimaryPersistedSnapshot.mock.calls[0] ?? []

            expect(result.success).toBe(true)
            expect(decodeImageMock).not.toHaveBeenCalled()
            expect(JSON.parse(String(persistedSnapshot))).toEqual({
                simulation: {
                    plants: {
                        ids: ['plant-1'],
                        entities: {
                            'plant-1': { journal: [{ type: 'photo', details: {} }] },
                        },
                    },
                },
            })
        })

        it('rejects missing or invalid image timestamps and removes their references', async () => {
            const state = {
                simulation: {
                    plants: {
                        ids: ['plant-1'],
                        entities: {
                            'plant-1': {
                                journal: [
                                    { type: 'photo', details: { imageId: 'photo-legacy' } },
                                    { type: 'photo', details: { imageId: 'photo-invalid-time' } },
                                ],
                            },
                        },
                    },
                },
            }

            const result = await importMockBackup(state, {
                'photo-legacy': { id: 'photo-legacy', data: VALID_PNG_DATA_URL },
                'photo-invalid-time': {
                    id: 'photo-invalid-time',
                    data: VALID_PNG_DATA_URL,
                    createdAt: 'yesterday',
                },
            })
            const [persistedSnapshot] = mocks.replacePrimaryPersistedSnapshot.mock.calls[0] ?? []

            expect(result.success).toBe(true)
            expect(decodeImageMock).not.toHaveBeenCalled()
            expect(JSON.parse(String(persistedSnapshot))).toEqual({
                simulation: {
                    plants: {
                        ids: ['plant-1'],
                        entities: {
                            'plant-1': {
                                journal: [
                                    { type: 'photo', details: {} },
                                    { type: 'photo', details: {} },
                                ],
                            },
                        },
                    },
                },
            })
        })

        it('preserves an existing image and removes references when its backup entry is rejected', async () => {
            const db = await recreateImageDatabase()
            const existingImage = {
                id: 'photo-collision',
                data: VALID_PNG_DATA_URL,
                createdAt: 10,
            }
            await writeStoredImage(db, existingImage)
            const state = {
                simulation: {
                    plants: {
                        ids: ['plant-1'],
                        entities: {
                            'plant-1': {
                                journal: [
                                    { type: 'photo', details: { imageId: 'photo-collision' } },
                                ],
                            },
                        },
                    },
                },
            }

            const result = await importMockBackup(state, {
                'photo-collision': {
                    id: 'photo-collision',
                    data: 'https://tracker.example/image.png',
                    createdAt: 20,
                },
            })
            const [persistedSnapshot] = mocks.replacePrimaryPersistedSnapshot.mock.calls[0] ?? []
            const preservedImage = await readStoredImage(db, 'photo-collision')
            db.close()

            expect(result.success).toBe(true)
            expect(JSON.parse(String(persistedSnapshot))).toEqual({
                simulation: {
                    plants: {
                        ids: ['plant-1'],
                        entities: {
                            'plant-1': { journal: [{ type: 'photo', details: {} }] },
                        },
                    },
                },
            })
            expect(preservedImage).toEqual(existingImage)
        })

        it('blocks a conflicting valid image ID before replacing persisted state', async () => {
            const db = await recreateImageDatabase()
            const existingImage = {
                id: 'photo-collision',
                data: VALID_PNG_DATA_URL,
                createdAt: 10,
            }
            await writeStoredImage(db, existingImage)

            const result = await importMockBackup(
                { version: 6 },
                {
                    'photo-collision': {
                        id: 'photo-collision',
                        data: VALID_PNG_DATA_URL,
                        createdAt: 11,
                    },
                },
            )
            const preservedImage = await readStoredImage(db, 'photo-collision')
            db.close()

            expect(result.success).toBe(false)
            expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
            expect(preservedImage).toEqual(existingImage)
        })

        it('does not rewrite an existing image when backup content is identical', async () => {
            const db = await recreateImageDatabase()
            const existingImage = {
                id: 'photo-existing',
                data: VALID_PNG_DATA_URL,
                createdAt: 10,
            }
            await writeStoredImage(db, existingImage)

            const result = await importMockBackup(
                { version: 6 },
                {
                    'photo-existing': existingImage,
                },
            )
            const preservedImage = await readStoredImage(db, 'photo-existing')
            db.close()

            expect(result.success).toBe(true)
            expect(preservedImage).toEqual(existingImage)
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
