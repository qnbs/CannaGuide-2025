import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'

const mocks = vi.hoisted(() => ({
    loadZip: vi.fn(),
    zipEntries: new Map<string, unknown>(),
    replacePrimaryPersistedSnapshot: vi.fn(),
    // Race injection points around the dependent (image) write.
    beforeDependentApply: vi.fn(async () => {}),
    afterDependentApply: vi.fn(async () => {}),
}))

vi.mock('jszip', () => {
    class MockJSZip {
        files: Record<string, unknown> = {}
        static loadAsync(file: Blob): Promise<unknown> {
            return mocks.loadZip(file)
        }
        file(name: string, data?: string): MockJSZip {
            mocks.zipEntries.set(name, data)
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
    DB_NAME: 'CannaGuideDB',
    DB_VERSION: 5,
    STRAINS_STORE: 'strains',
    IMAGES_STORE: 'images',
    METADATA_STORE: 'metadata',
    STRAIN_SEARCH_INDEX_STORE: 'strain_search_index',
    OFFLINE_ACTIONS_STORE: 'offline_actions',
    CALCULATOR_HISTORY_STORE: 'calculator_history',
    STRAIN_INDEX_TYPE: 'by_type',
    STRAIN_INDEX_THC: 'by_thc',
    STRAIN_INDEX_CBD: 'by_cbd',
    STRAIN_INDEX_FLOWERING: 'by_floweringTime',
}))

vi.mock('@/services/persistedStateService', () => ({
    replacePrimaryPersistedSnapshot: mocks.replacePrimaryPersistedSnapshot,
    // Mirrors the ordering contract proven in persistedStateService.test.ts: the
    // dependent write commits first, the snapshot only after it, and a failed
    // snapshot replacement reverts the dependent write.
    replacePrimaryPersistedSnapshotForRecovery: async (
        snapshot: string,
        dependentWrite?: { apply: () => Promise<void>; revert: () => Promise<void> },
    ) => {
        try {
            await mocks.beforeDependentApply()
            await dependentWrite?.apply()
            await mocks.afterDependentApply()
        } catch (error) {
            return { success: false, reloadRequired: false, error }
        }
        let replaced = false
        let replaceError: unknown
        try {
            replaced = await mocks.replacePrimaryPersistedSnapshot(snapshot)
        } catch (error) {
            replaceError = error
        }
        if (replaced) return { success: true, reloadRequired: true }
        await dependentWrite?.revert().catch(() => {})
        return { success: false, reloadRequired: false, error: replaceError }
    },
}))

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

import { backupService } from '@/services/backupService'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { closeDB, releaseDBAfterErase } from '@/services/db/connection'

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

const concatBytes = (...parts: Uint8Array[]): Uint8Array => {
    const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0))
    let offset = 0
    for (const part of parts) {
        result.set(part, offset)
        offset += part.length
    }
    return result
}

const createIsoBmffBox = (type: string, payload: Uint8Array): Uint8Array => {
    const result = new Uint8Array(8 + payload.length)
    new DataView(result.buffer).setUint32(0, result.length)
    result.set(
        [...type].map((character) => character.charCodeAt(0)),
        4,
    )
    result.set(payload, 8)
    return result
}

const createHeifDataUrl = (
    mimeType: 'image/heic' | 'image/heif',
    width = 1,
    height = 1,
): string => {
    const majorBrand = mimeType === 'image/heic' ? 'heic' : 'mif1'
    const ftyp = createIsoBmffBox(
        'ftyp',
        concatBytes(
            new TextEncoder().encode(majorBrand),
            new Uint8Array(4),
            new TextEncoder().encode('mif1'),
        ),
    )
    const dimensions = new Uint8Array(12)
    new DataView(dimensions.buffer).setUint32(4, width)
    new DataView(dimensions.buffer).setUint32(8, height)
    const ispe = createIsoBmffBox('ispe', dimensions)
    const ipco = createIsoBmffBox('ipco', ispe)
    const iprp = createIsoBmffBox('iprp', ipco)
    const meta = createIsoBmffBox('meta', concatBytes(new Uint8Array(4), iprp))
    const bytes = concatBytes(ftyp, meta)
    return `data:${mimeType};base64,${btoa(String.fromCharCode(...bytes))}`
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

    const openRequest = indexedDB.open('CannaGuideDB', 5)
    openRequest.onupgradeneeded = () => {
        const db = openRequest.result
        const strains = db.createObjectStore('strains', { keyPath: 'id' })
        strains.createIndex('by_type', 'type', { unique: false })
        strains.createIndex('by_thc', 'thc', { unique: false })
        strains.createIndex('by_cbd', 'cbd', { unique: false })
        strains.createIndex('by_floweringTime', 'floweringTime', { unique: false })
        db.createObjectStore('images', { keyPath: 'id' })
        db.createObjectStore('metadata', { keyPath: 'key' })
        db.createObjectStore('strain_search_index', { keyPath: 'word' })
        db.createObjectStore('offline_actions', { autoIncrement: true })
        db.createObjectStore('calculator_history', { keyPath: 'id' })
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
        closeDB()
        releaseDBAfterErase()
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

        it('writes no Cloud TTS key into the ZIP (#654)', async () => {
            // A synthetic canary, never a real key.
            const canary = 'sk_canary_0000000000000000000000000000'
            mocks.zipEntries.clear()
            vi.mocked(indexedDBStorage.getItem).mockResolvedValue(
                JSON.stringify({
                    settings: { settings: { tts: { cloudTtsApiKey: canary } }, version: 5 },
                    simulation: { plants: [] },
                }),
            )
            const result = await backupService.exportBackup()
            expect(result.success).toBe(true)
            expect(mocks.zipEntries.size).toBeGreaterThan(0)
            for (const data of mocks.zipEntries.values()) {
                expect(String(data)).not.toContain(canary)
            }
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
                rejectedImageCount: 0,
                reloadRequired: false,
                error: 'settingsView.data.restoreBlocked',
            })
        })

        it('opens a missing image database with the current application schema', async () => {
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

            expect(result.success).toBe(true)
            const request = indexedDB.open('CannaGuideDB')
            const database = await new Promise<IDBDatabase>((resolve, reject) => {
                request.onsuccess = () => resolve(request.result)
                request.onerror = () => reject(request.error)
            })
            const databaseVersion = database.version
            const hasImageStore = database.objectStoreNames.contains('images')
            const hasStrainStore = database.objectStoreNames.contains('strains')
            const hasSearchIndexStore = database.objectStoreNames.contains('strain_search_index')
            const hasOfflineActionsStore = database.objectStoreNames.contains('offline_actions')
            const hasCalculatorHistoryStore =
                database.objectStoreNames.contains('calculator_history')
            database.close()
            expect(databaseVersion).toBe(5)
            expect(hasImageStore).toBe(true)
            expect(hasStrainStore).toBe(true)
            expect(hasSearchIndexStore).toBe(true)
            expect(hasOfflineActionsStore).toBe(true)
            expect(hasCalculatorHistoryStore).toBe(true)
        })

        it.each(['image/heic', 'image/heif'] as const)(
            'preserves valid bounded %s journal and stored images',
            async (mimeType) => {
                const removeRequest = indexedDB.deleteDatabase('CannaGuideDB')
                await new Promise<void>((resolve, reject) => {
                    removeRequest.onsuccess = () => resolve()
                    removeRequest.onerror = () => reject(removeRequest.error)
                    removeRequest.onblocked = () =>
                        reject(new Error('Image database deletion blocked'))
                })
                const imageData = createHeifDataUrl(mimeType)
                const state = {
                    simulation: {
                        plants: [
                            {
                                journal: [
                                    { details: { imageId: 'photo-heif', imageUrl: imageData } },
                                ],
                            },
                        ],
                    },
                }
                const result = await importMockBackup(state, {
                    'photo-heif': { id: 'photo-heif', data: imageData, createdAt: 10 },
                })
                const [persistedSnapshot] =
                    mocks.replacePrimaryPersistedSnapshot.mock.calls[0] ?? []
                const database = await new Promise<IDBDatabase>((resolve, reject) => {
                    const request = indexedDB.open('CannaGuideDB')
                    request.onsuccess = () => resolve(request.result)
                    request.onerror = () => reject(request.error)
                })
                const hasImageStore = database.objectStoreNames.contains('images')
                const storedImage = hasImageStore
                    ? await readStoredImage(database, 'photo-heif')
                    : undefined
                database.close()

                expect(result.success).toBe(true)
                expect(result.rejectedImageCount).toBe(0)
                expect(JSON.parse(String(persistedSnapshot))).toEqual(state)
                expect(storedImage).toEqual({
                    id: 'photo-heif',
                    data: imageData,
                    createdAt: 10,
                })
            },
        )

        it('reports browser-unsupported HEIC images after sanitizing their journal reference', async () => {
            const imageData = createHeifDataUrl('image/heic')
            decodeImageMock.mockRejectedValue(new Error('Unsupported image format'))
            const state = {
                simulation: {
                    plants: [
                        {
                            journal: [
                                {
                                    details: {
                                        imageId: 'photo-heic',
                                        imageUrl: imageData,
                                    },
                                },
                            ],
                        },
                    ],
                },
            }

            const result = await importMockBackup(state, {
                'photo-heic': { id: 'photo-heic', data: imageData, createdAt: 10 },
            })
            const [persistedSnapshot] = mocks.replacePrimaryPersistedSnapshot.mock.calls[0] ?? []

            expect(result.success).toBe(true)
            expect(result.rejectedImageCount).toBe(1)
            expect(JSON.parse(String(persistedSnapshot))).toEqual({
                simulation: {
                    plants: [{ journal: [{ details: {} }] }],
                },
            })
        })

        it('counts and removes image references with unsafe raw IDs', async () => {
            const state = {
                simulation: {
                    plants: [{ journal: [{ details: { imageId: 'unsafe/photo' } }] }],
                },
            }
            const result = await importMockBackup(state, {
                'unsafe/photo': {
                    id: 'unsafe/photo',
                    data: 'https://tracker.example/photo.png',
                    createdAt: 10,
                },
            })
            const [persistedSnapshot] = mocks.replacePrimaryPersistedSnapshot.mock.calls[0] ?? []

            expect(result.rejectedImageCount).toBe(1)
            expect(JSON.parse(String(persistedSnapshot))).toEqual({
                simulation: { plants: [{ journal: [{ details: {} }] }] },
            })
        })

        it('counts rejected image records without parseable IDs', async () => {
            const state = { version: 6 }
            const statePath = 'cannaguide-state.json'
            const missingIdPath = 'images/missing-id.json'
            const corruptPath = 'images/corrupt.json'
            const entries = new Map([
                [statePath, JSON.stringify(state)],
                [missingIdPath, JSON.stringify({ data: 'invalid raster', createdAt: 10 })],
                [corruptPath, '{invalid json'],
            ])
            mocks.loadZip.mockResolvedValueOnce({
                files: Object.fromEntries([...entries.keys()].map((name) => [name, { name }])),
                file: (name: string) => {
                    const value = entries.get(name)
                    return value === undefined ? null : { async: async () => value }
                },
            })

            const result = await backupService.importBackup(
                new File(['zip'], 'backup.zip', { type: 'application/zip' }),
            )

            expect(result.success).toBe(true)
            expect(result.rejectedImageCount).toBe(2)
        })

        it('rejects HEIF extents above the bounded decode limit before browser decoding', async () => {
            const imageData = createHeifDataUrl('image/heic', 8193, 1)
            const state = {
                simulation: {
                    plants: [{ journal: [{ details: { imageUrl: imageData } }] }],
                },
            }

            const result = await importMockBackup(state)
            const [persistedSnapshot] = mocks.replacePrimaryPersistedSnapshot.mock.calls[0] ?? []

            expect(result.success).toBe(true)
            expect(result.rejectedImageCount).toBe(1)
            expect(JSON.parse(String(persistedSnapshot))).toEqual({
                simulation: {
                    plants: [{ journal: [{ details: {} }] }],
                },
            })
            expect(decodeImageMock).not.toHaveBeenCalled()
        })

        it('writes asynchronously decompressed image data in an active IndexedDB transaction', async () => {
            const db = await recreateImageDatabase()

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
            const db = await recreateImageDatabase()

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
            expect(result.rejectedImageCount).toBe(2)
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
            expect(result.rejectedImageCount).toBe(1)
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
            expect(result.rejectedImageCount).toBe(1)
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

        it('normalizes legacy saved strain-tip image URLs before validating them', async () => {
            const rawPngBase64 = VALID_PNG_DATA_URL.slice(VALID_PNG_DATA_URL.indexOf(',') + 1)
            const state = {
                savedItems: {
                    savedStrainTips: {
                        ids: ['tip-raw', 'tip-nested'],
                        entities: {
                            'tip-raw': { id: 'tip-raw', imageUrl: rawPngBase64 },
                            'tip-nested': {
                                id: 'tip-nested',
                                imageUrl: `data:image/png;base64,${VALID_PNG_DATA_URL}`,
                            },
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
                        ids: ['tip-raw', 'tip-nested'],
                        entities: {
                            'tip-raw': { id: 'tip-raw', imageUrl: VALID_PNG_DATA_URL },
                            'tip-nested': { id: 'tip-nested', imageUrl: VALID_PNG_DATA_URL },
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

    // Images and the Redux snapshot live in different IndexedDB databases, so no
    // transaction spans both. These cases pin the no-loss order: images commit
    // atomically first, the snapshot is replaced only after them.
    describe('importBackup restore order', () => {
        const existingPhoto = { id: 'photo-existing', data: VALID_PNG_DATA_URL, createdAt: 1 }
        const restoredPhotos = {
            'photo-a': { id: 'photo-a', data: VALID_PNG_DATA_URL, createdAt: 10 },
            'photo-b': { id: 'photo-b', data: VALID_PNG_DATA_URL, createdAt: 11 },
        }

        const seedImageStore = async (): Promise<IDBDatabase> => {
            const db = await recreateImageDatabase()
            await writeStoredImage(db, existingPhoto)
            return db
        }

        const storedIds = (db: IDBDatabase): Promise<string[]> =>
            new Promise((resolve, reject) => {
                const request = db
                    .transaction('images', 'readonly')
                    .objectStore('images')
                    .getAllKeys()
                request.onsuccess = () => resolve(request.result.map(String).sort())
                request.onerror = () => reject(request.error)
            })

        // Fail the batch at its second image, after the first add was queued.
        const failSecondImageAdd = (mode: 'abort' | 'throw') => {
            const originalAdd = IDBObjectStore.prototype.add
            let calls = 0
            vi.spyOn(IDBObjectStore.prototype, 'add').mockImplementation(function (
                this: IDBObjectStore,
                ...args: Parameters<IDBObjectStore['add']>
            ) {
                calls += 1
                if (calls === 2 && mode === 'throw') {
                    throw new DOMException('Image quota exceeded', 'QuotaExceededError')
                }
                const request = originalAdd.apply(this, args)
                if (calls === 2) this.transaction.abort()
                return request
            })
        }

        it.each(['abort', 'throw'] as const)(
            'keeps the current state and photos when the image batch fails (%s)',
            async (mode) => {
                const db = await seedImageStore()
                failSecondImageAdd(mode)

                const result = await importMockBackup({ version: 6 }, restoredPhotos)
                const ids = await storedIds(db)
                const preserved = await readStoredImage(db, existingPhoto.id)
                db.close()

                expect(result).toMatchObject({ success: false, reloadRequired: false })
                expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
                // No partial batch: the first image's queued add did not commit either.
                expect(ids).toEqual(['photo-existing'])
                expect(preserved).toEqual(existingPhoto)
            },
        )

        it('removes only the restored images when the snapshot write fails', async () => {
            const db = await seedImageStore()
            mocks.replacePrimaryPersistedSnapshot.mockRejectedValueOnce(
                new DOMException('State quota exceeded', 'QuotaExceededError'),
            )

            const result = await importMockBackup({ version: 6 }, restoredPhotos)
            const ids = await storedIds(db)
            const preserved = await readStoredImage(db, existingPhoto.id)
            db.close()

            expect(result).toMatchObject({ success: false, reloadRequired: false })
            expect(ids).toEqual(['photo-existing'])
            expect(preserved).toEqual(existingPhoto)
        })

        it('does not revert over a newer write to a restored image ID', async () => {
            const db = await seedImageStore()
            const newerPhoto = { id: 'photo-a', data: VALID_PNG_DATA_URL, createdAt: 99 }
            mocks.afterDependentApply.mockImplementationOnce(async () => {
                await writeStoredImage(db, newerPhoto)
            })
            mocks.replacePrimaryPersistedSnapshot.mockRejectedValueOnce(new Error('write failed'))

            const result = await importMockBackup({ version: 6 }, restoredPhotos)
            const ids = await storedIds(db)
            const kept = await readStoredImage(db, 'photo-a')
            db.close()

            expect(result.success).toBe(false)
            expect(ids).toEqual(['photo-a', 'photo-existing'])
            expect(kept).toEqual(newerPhoto)
        })

        it('aborts the whole batch when another writer takes a restored image ID', async () => {
            const db = await seedImageStore()
            const racingPhoto = { id: 'photo-b', data: VALID_PNG_DATA_URL, createdAt: 50 }
            // Between the collision check and the write, another tab stores photo-b.
            mocks.beforeDependentApply.mockImplementationOnce(async () => {
                await writeStoredImage(db, racingPhoto)
            })

            const result = await importMockBackup({ version: 6 }, restoredPhotos)
            const ids = await storedIds(db)
            const racing = await readStoredImage(db, 'photo-b')
            db.close()

            expect(result).toMatchObject({ success: false, reloadRequired: false })
            expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
            expect(ids).toEqual(['photo-b', 'photo-existing'])
            expect(racing).toEqual(racingPhoto)
        })

        it('completes on retry and stays idempotent when repeated', async () => {
            const db = await seedImageStore()
            failSecondImageAdd('abort')
            const failed = await importMockBackup({ version: 6 }, restoredPhotos)
            vi.mocked(IDBObjectStore.prototype.add).mockRestore()

            const retried = await importMockBackup({ version: 6 }, restoredPhotos)
            const repeated = await importMockBackup({ version: 6 }, restoredPhotos)
            const ids = await storedIds(db)
            const restoredA = await readStoredImage(db, 'photo-a')
            db.close()

            expect(failed.success).toBe(false)
            expect(retried).toMatchObject({ success: true, reloadRequired: true })
            expect(repeated).toMatchObject({ success: true, reloadRequired: true })
            expect(mocks.replacePrimaryPersistedSnapshot).toHaveBeenCalledTimes(2)
            expect(ids).toEqual(['photo-a', 'photo-b', 'photo-existing'])
            expect(restoredA).toEqual(restoredPhotos['photo-a'])
        })

        it('leaves only unreferenced images after an interrupted restore, then retries', async () => {
            const db = await seedImageStore()
            // The snapshot write fails and the revert cannot open its transaction
            // either -- the closest model of a tab closed between the two commits.
            mocks.replacePrimaryPersistedSnapshot.mockRejectedValueOnce(new Error('tab closed'))
            const originalTransaction = IDBDatabase.prototype.transaction
            let readwriteCalls = 0
            vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (
                this: IDBDatabase,
                ...args: Parameters<IDBDatabase['transaction']>
            ) {
                if (args[1] === 'readwrite' && ++readwriteCalls === 2) {
                    throw new DOMException('The connection is closing', 'InvalidStateError')
                }
                return originalTransaction.apply(this, args)
            })

            const interrupted = await importMockBackup({ version: 6 }, restoredPhotos)
            const leftover = await storedIds(db)
            const retried = await importMockBackup({ version: 6 }, restoredPhotos)
            const preserved = await readStoredImage(db, existingPhoto.id)
            db.close()

            expect(interrupted).toMatchObject({ success: false, reloadRequired: false })
            // The current snapshot was never replaced; the extra images are inert.
            expect(leftover).toEqual(['photo-a', 'photo-b', 'photo-existing'])
            expect(retried).toMatchObject({ success: true, reloadRequired: true })
            expect(preserved).toEqual(existingPhoto)
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
