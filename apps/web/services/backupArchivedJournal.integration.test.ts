import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'

const mocks = vi.hoisted(() => ({
    loadZip: vi.fn(),
    zipEntries: new Map<string, unknown>(),
    replacePrimaryPersistedSnapshot: vi.fn(),
    // Race injection points around the dependent (image) write.
    beforeDependentApply: vi.fn(() => Promise.resolve()),
    afterDependentApply: vi.fn(() => Promise.resolve()),
}))

vi.mock('jszip', () => {
    type FakeEntry = { async: (type?: string) => Promise<string> }
    // The import reads entries through ZipObject#internalStream (#671); give
    // every fake entry one that emits exactly what its async() returns.
    const withInflateStream = (name: string, entry: FakeEntry) => ({
        name,
        ...entry,
        internalStream: () => {
            const handlers: Record<string, (arg?: unknown) => void> = {}
            const stream = {
                on(event: string, listener: (arg?: unknown) => void) {
                    handlers[event] = listener
                    return stream
                },
                pause: () => stream,
                resume() {
                    entry.async('string').then(
                        (text) => {
                            handlers['data']?.(new TextEncoder().encode(text))
                            handlers['end']?.()
                        },
                        (error: unknown) => handlers['error']?.(error),
                    )
                    return stream
                },
            }
            return stream
        },
    })
    class MockJSZip {
        files: Record<string, unknown> = {}
        static async loadAsync(file: Blob): Promise<unknown> {
            const zip = (await mocks.loadZip(file)) as {
                files: Record<string, unknown>
                file: (name: string) => FakeEntry | null
            }
            return {
                ...zip,
                file: (name: string) => {
                    const entry = zip.file(name)
                    return entry ? withInflateStream(name, entry) : null
                },
            }
        }
        file(name: string, data?: string): MockJSZip {
            mocks.zipEntries.set(name, data)
            this.files[name] = { name }
            return this
        }
        generateAsync(): Promise<Blob> {
            const recorded = Object.keys(this.files).length
            return Promise.resolve(new Blob([`mockzip:${recorded}`], { type: 'application/zip' }))
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
        await dependentWrite?.revert().catch(() => undefined)
        return { success: false, reloadRequired: false, error: replaceError }
    },
}))

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

import { backupService } from '@/services/backupService'
import { createArchivedJournalRestoreWrite } from '@/services/backupArchivedJournal'
import { metadataStore } from '@/services/db/metadataStore'
import { ARCHIVED_LOGS_METADATA_KEY } from '@/services/db/types'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { closeDB, releaseDBAfterErase } from '@/services/db/connection'

const importMockBackup = (
    state: unknown,
    images: Record<string, unknown> = {},
    extraEntries: Record<string, string> = {},
) => {
    const entries = new Map<string, string>([
        ['cannaguide-state.json', JSON.stringify(state)],
        ...Object.entries(images).map(([id, image]): [string, string] => [
            `images/${id}.json`,
            JSON.stringify(image),
        ]),
        ...Object.entries(extraEntries),
    ])
    mocks.loadZip.mockResolvedValueOnce({
        files: Object.fromEntries([...entries.keys()].map((name) => [name, { name }])),
        file: (name: string) => {
            const value = entries.get(name)
            return value === undefined ? null : { async: () => Promise.resolve(value) }
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

const VALID_PNG_DATA_URL =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/F7sAAAAASUVORK5CYII='
const decodeImageMock = vi.fn()

const ARCHIVE_ENTRY = 'archived-journal.json'
const META_ENTRY = 'backup-meta.json'
const STATE = JSON.stringify({
    simulation: { plants: { ids: ['p1'], entities: { p1: { id: 'p1' } } } },
})

const archivedEntry = (
    id: string,
    details: Record<string, unknown> = {},
    notes = `note ${id}`,
) => ({
    id,
    createdAt: 1,
    type: 'OBSERVATION',
    notes,
    details,
})

const archive = () => ({
    p1: [archivedEntry('old-1'), archivedEntry('old-2', { imageId: 'photo-a' })],
    p2: [archivedEntry('old-3')],
})

/** The archive file as the export writes it. */
const archiveFile = (journals: unknown, version = 1): string =>
    JSON.stringify({ version, journals })

/** The metadata entry of a backup that declares this many archived entries. */
const metaDeclaring = (archivedJournalEntryCount: number): string =>
    JSON.stringify({
        version: '1.0',
        exportedAt: 1,
        appVersion: '1.6.0',
        plantCount: 1,
        imageCount: 0,
        archivedJournalEntryCount,
    })

const storedArchive = (): Promise<unknown> => metadataStore.getMetadata(ARCHIVED_LOGS_METADATA_KEY)

const gateNextArchiveMetadataOperation = () => {
    let operationStarted!: () => void
    let continueOperation!: () => void
    let isPaused = false
    const started = new Promise<void>((resolve) => {
        operationStarted = resolve
    })
    const mayContinue = new Promise<void>((resolve) => {
        continueOperation = resolve
    })
    const pauseOnce = async (): Promise<void> => {
        if (isPaused) return
        isPaused = true
        operationStarted()
        await mayContinue
    }

    const originalGet = metadataStore.getMetadata.bind(metadataStore)
    const getSpy = vi.spyOn(metadataStore, 'getMetadata').mockImplementation(async (key) => {
        const current = await originalGet(key)
        if (key === ARCHIVED_LOGS_METADATA_KEY) await pauseOnce()
        return current
    })
    const originalUpdate = metadataStore.updateMetadata.bind(metadataStore)
    const updateSpy = vi
        .spyOn(metadataStore, 'updateMetadata')
        .mockImplementation(async (key, update) => {
            if (key === ARCHIVED_LOGS_METADATA_KEY) await pauseOnce()
            return originalUpdate(key, update)
        })

    return {
        started,
        resume: continueOperation,
        restoreSpies: () => {
            getSpy.mockRestore()
            updateSpy.mockRestore()
        },
    }
}

describe('archived plant journals in the ZIP backup (#667)', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        decodeImageMock.mockResolvedValue({ width: 1, height: 1, close: vi.fn() })
        vi.stubGlobal('createImageBitmap', decodeImageMock)
        mocks.replacePrimaryPersistedSnapshot.mockResolvedValue(true)
        mocks.zipEntries.clear()
        ;(await recreateImageDatabase()).close()
    })

    afterEach(() => {
        closeDB()
        releaseDBAfterErase()
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    describe('export', () => {
        it('writes the archived entries into a versioned file and declares their number', async () => {
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, archive())
            vi.mocked(indexedDBStorage.getItem).mockResolvedValue(STATE)

            const result = await backupService.exportBackup()

            expect(result.success).toBe(true)
            expect(JSON.parse(String(mocks.zipEntries.get(ARCHIVE_ENTRY)))).toEqual({
                version: 1,
                journals: archive(),
            })
            expect(result.metadata?.archivedJournalEntryCount).toBe(3)
        })

        it('writes no archive entry when no journal was ever archived', async () => {
            vi.mocked(indexedDBStorage.getItem).mockResolvedValue(STATE)

            const result = await backupService.exportBackup()

            expect(result.success).toBe(true)
            expect(mocks.zipEntries.has(ARCHIVE_ENTRY)).toBe(false)
            expect(result.metadata).not.toHaveProperty('archivedJournalEntryCount')
        })

        it('writes no archive entry for an archive without entries', async () => {
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, { p1: [] })
            vi.mocked(indexedDBStorage.getItem).mockResolvedValue(STATE)

            await backupService.exportBackup()

            expect(mocks.zipEntries.has(ARCHIVE_ENTRY)).toBe(false)
        })

        it('creates no backup when the archive has an unexpected shape', async () => {
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, { p1: 'not a list' })
            vi.mocked(indexedDBStorage.getItem).mockResolvedValue(STATE)
            vi.spyOn(console, 'error').mockImplementation(() => undefined)

            const result = await backupService.exportBackup()

            expect(result).toMatchObject({
                success: false,
                blob: null,
                errorCode: 'archivedJournalUnreadable',
            })
        })

        it.each([
            ['a Date', () => new Date(0)],
            ['a Map', () => new Map([['p1', [{ id: 'a' }]]])],
            ['an entry that is a Date', () => ({ p1: [new Date(0)] })],
        ])('creates no backup when the stored archive is %s', async (_label, make) => {
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, make())
            vi.mocked(indexedDBStorage.getItem).mockResolvedValue(STATE)
            vi.spyOn(console, 'error').mockImplementation(() => undefined)

            const result = await backupService.exportBackup()

            expect(result).toMatchObject({
                success: false,
                errorCode: 'archivedJournalUnreadable',
            })
        })

        it('creates no backup when a stored entry list has a hole', async () => {
            // Index 1 is never assigned, so the list has a hole there.
            const withHole: unknown[] = []
            withHole[0] = archivedEntry('a')
            withHole[2] = archivedEntry('b')
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, { p1: withHole })
            vi.mocked(indexedDBStorage.getItem).mockResolvedValue(STATE)
            vi.spyOn(console, 'error').mockImplementation(() => undefined)

            const result = await backupService.exportBackup()

            expect(result).toMatchObject({
                success: false,
                errorCode: 'archivedJournalUnreadable',
            })
        })

        it('does not log the journal text when it refuses', async () => {
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, {
                p1: [{ id: 'secret-id', notes: 'private diary text' }, 'broken'],
            })
            vi.mocked(indexedDBStorage.getItem).mockResolvedValue(STATE)
            const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined)

            await backupService.exportBackup()

            expect(JSON.stringify(logged.mock.calls)).not.toContain('private diary text')
        })
    })

    describe('import', () => {
        it('restores the archived entries together with the state', async () => {
            const result = await importMockBackup(
                { version: 6 },
                {},
                { [ARCHIVE_ENTRY]: archiveFile({ p1: [archivedEntry('old-1')] }) },
            )

            expect(result).toMatchObject({ success: true, reloadRequired: true })
            expect(await storedArchive()).toEqual({ p1: [archivedEntry('old-1')] })
        })

        it('adds the backup entries to the archive that is there and keeps the rest', async () => {
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, {
                other: [archivedEntry('x')],
                p1: [archivedEntry('old-0')],
            })

            await importMockBackup(
                { version: 6 },
                {},
                { [ARCHIVE_ENTRY]: archiveFile({ p1: [archivedEntry('old-1')] }) },
            )

            expect(await storedArchive()).toEqual({
                other: [archivedEntry('x')],
                p1: [archivedEntry('old-0'), archivedEntry('old-1')],
            })
        })

        it('does not overwrite an archive update committed while restore is preparing its merge', async () => {
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, {
                p1: [archivedEntry('old-0')],
            })
            const gate = gateNextArchiveMetadataOperation()
            const restoreWrite = createArchivedJournalRestoreWrite({
                p1: [archivedEntry('backup-1')],
            })
            const applying = restoreWrite.apply()
            try {
                await gate.started
                await metadataStore.updateMetadata<Record<string, unknown[]>>(
                    ARCHIVED_LOGS_METADATA_KEY,
                    (current) => ({
                        ...current,
                        p1: [...(current?.p1 ?? []), archivedEntry('optimizer-1')],
                    }),
                )
            } finally {
                gate.resume()
                await applying
                gate.restoreSpies()
            }

            expect(await storedArchive()).toEqual({
                p1: [
                    archivedEntry('old-0'),
                    archivedEntry('optimizer-1'),
                    archivedEntry('backup-1'),
                ],
            })
        })

        it('does not roll back an archive changed by another writer after restore apply', async () => {
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, {
                p1: [archivedEntry('old-0')],
            })
            const restoreWrite = createArchivedJournalRestoreWrite({
                p1: [archivedEntry('backup-1')],
            })
            await restoreWrite.apply()

            const gate = gateNextArchiveMetadataOperation()
            const reverting = restoreWrite.revert()
            try {
                await gate.started
                await metadataStore.updateMetadata<Record<string, unknown[]>>(
                    ARCHIVED_LOGS_METADATA_KEY,
                    (current) => ({
                        ...current,
                        p1: [...(current?.p1 ?? []), archivedEntry('optimizer-1')],
                    }),
                )
            } finally {
                gate.resume()
                await reverting
                gate.restoreSpies()
            }

            expect(await storedArchive()).toEqual({
                p1: [
                    archivedEntry('old-0'),
                    archivedEntry('backup-1'),
                    archivedEntry('optimizer-1'),
                ],
            })
        })

        it('keeps the stored entry when the backup has one with the same id', async () => {
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, {
                p1: [archivedEntry('old-1', {}, 'stored text')],
            })

            await importMockBackup(
                { version: 6 },
                {},
                {
                    [ARCHIVE_ENTRY]: archiveFile({
                        p1: [archivedEntry('old-1', {}, 'backup text'), archivedEntry('old-2')],
                    }),
                },
            )

            expect(await storedArchive()).toEqual({
                p1: [archivedEntry('old-1', {}, 'stored text'), archivedEntry('old-2')],
            })
        })

        it('does not duplicate entries when the same backup is restored twice', async () => {
            const entries = { [ARCHIVE_ENTRY]: archiveFile(archive()) }

            await importMockBackup({ version: 6 }, {}, entries)
            await importMockBackup({ version: 6 }, {}, entries)

            expect(await storedArchive()).toEqual(archive())
        })

        it('leaves the archive alone when the backup carries none (an older backup)', async () => {
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, {
                p9: [archivedEntry('keep')],
            })

            const result = await importMockBackup({ version: 6 })

            expect(result.success).toBe(true)
            expect(await storedArchive()).toEqual({ p9: [archivedEntry('keep')] })
        })

        it('refuses a corrupt archive before anything is written', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined)
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, {
                p9: [archivedEntry('keep')],
            })

            const result = await importMockBackup(
                { version: 6 },
                {},
                { [ARCHIVE_ENTRY]: '{not json' },
            )

            expect(result.success).toBe(false)
            expect(result.error).toContain('corrupt archived journal')
            expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
            expect(await storedArchive()).toEqual({ p9: [archivedEntry('keep')] })
        })

        it('does not repeat the journal text in the error it reports', async () => {
            const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined)

            const result = await importMockBackup(
                { version: 6 },
                {},
                { [ARCHIVE_ENTRY]: '{"version":1,"journals":{"p1":[{"notes":"private diary text"' },
            )

            expect(result.success).toBe(false)
            expect(String(result.error)).not.toContain('private diary text')
            expect(JSON.stringify(logged.mock.calls)).not.toContain('private diary text')
        })

        it('refuses an archive whose entries are not objects', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined)

            const result = await importMockBackup(
                { version: 6 },
                {},
                { [ARCHIVE_ENTRY]: archiveFile({ p1: ['text'] }) },
            )

            expect(result.success).toBe(false)
            expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
        })

        it('refuses an archive of a version it does not know', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined)

            const result = await importMockBackup(
                { version: 6 },
                {},
                { [ARCHIVE_ENTRY]: archiveFile({ p1: [archivedEntry('old-1')] }, 99) },
            )

            expect(result.success).toBe(false)
            expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
        })

        it('refuses a backup that declares archived entries but has no archive file', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined)

            const result = await importMockBackup(
                { version: 6 },
                {},
                { [META_ENTRY]: metaDeclaring(3) },
            )

            expect(result.success).toBe(false)
            expect(result.error).toContain('missing or incomplete')
            expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
        })

        it('refuses a backup whose archive holds fewer entries than it declares', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined)

            const result = await importMockBackup(
                { version: 6 },
                {},
                {
                    [META_ENTRY]: metaDeclaring(3),
                    [ARCHIVE_ENTRY]: archiveFile({ p1: [archivedEntry('old-1')] }),
                },
            )

            expect(result.success).toBe(false)
            expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
        })

        it('refuses a backup whose declared count is damaged, with or without the file', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined)
            const damaged = JSON.stringify({
                version: '1.0',
                exportedAt: 1,
                appVersion: '1.6.0',
                plantCount: 1,
                imageCount: 0,
                archivedJournalEntryCount: 'three',
            })

            const result = await importMockBackup(
                { version: 6 },
                {},
                { [META_ENTRY]: damaged, [ARCHIVE_ENTRY]: archiveFile(archive()) },
            )

            expect(result.success).toBe(false)
            expect(result.error).toContain('not valid')
            expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
        })

        it('accepts a backup whose archive holds as many entries as it declares', async () => {
            const result = await importMockBackup(
                { version: 6 },
                {},
                { [META_ENTRY]: metaDeclaring(3), [ARCHIVE_ENTRY]: archiveFile(archive()) },
            )

            expect(result.success).toBe(true)
        })

        it('refuses to merge into a stored archive it cannot read', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined)
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, { p1: 'garbage' })

            const result = await importMockBackup(
                { version: 6 },
                {},
                { [ARCHIVE_ENTRY]: archiveFile({ p1: [archivedEntry('old-1')] }) },
            )

            expect(result.success).toBe(false)
            expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
            expect(await storedArchive()).toEqual({ p1: 'garbage' })
        })

        it('fails the restore without replacing the state when the archive cannot be stored', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => undefined)
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, {
                p9: [archivedEntry('keep')],
            })
            vi.spyOn(metadataStore, 'updateMetadata').mockRejectedValue(
                new Error('QuotaExceededError'),
            )

            const result = await importMockBackup(
                { version: 6 },
                {},
                { [ARCHIVE_ENTRY]: archiveFile({ p1: [archivedEntry('old-1')] }) },
            )

            expect(result.success).toBe(false)
            expect(mocks.replacePrimaryPersistedSnapshot).not.toHaveBeenCalled()
            expect(await storedArchive()).toEqual({ p9: [archivedEntry('keep')] })
        })

        it('puts the previous archive back when the snapshot cannot be replaced', async () => {
            await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, {
                p9: [archivedEntry('keep')],
            })
            mocks.replacePrimaryPersistedSnapshot.mockResolvedValue(false)

            const result = await importMockBackup(
                { version: 6 },
                {},
                { [ARCHIVE_ENTRY]: archiveFile({ p1: [archivedEntry('old-1')] }) },
            )

            expect(result.success).toBe(false)
            expect(await storedArchive()).toEqual({ p9: [archivedEntry('keep')] })
        })

        it('removes the archive again when there was none before and the restore fails', async () => {
            mocks.replacePrimaryPersistedSnapshot.mockResolvedValue(false)

            await importMockBackup(
                { version: 6 },
                {},
                { [ARCHIVE_ENTRY]: archiveFile({ p1: [archivedEntry('old-1')] }) },
            )

            expect(await storedArchive()).toBeUndefined()
        })

        it('drops the photo id of a rejected photo from archived entries', async () => {
            const result = await importMockBackup(
                { version: 6 },
                { 'photo-bad': { id: 'photo-bad', data: 'not-an-image', createdAt: 1 } },
                {
                    [ARCHIVE_ENTRY]: archiveFile({
                        p1: [archivedEntry('old-1', { imageId: 'photo-bad' })],
                    }),
                },
            )

            expect(result.success).toBe(true)
            expect(result.rejectedImageCount).toBeGreaterThan(0)
            expect(await storedArchive()).toEqual({ p1: [archivedEntry('old-1', {})] })
        })

        it('keeps the photo id of a photo that was restored', async () => {
            const result = await importMockBackup(
                { version: 6 },
                { 'photo-a': { id: 'photo-a', data: VALID_PNG_DATA_URL, createdAt: 1 } },
                {
                    [ARCHIVE_ENTRY]: archiveFile({
                        p1: [archivedEntry('old-2', { imageId: 'photo-a' })],
                    }),
                },
            )

            expect(result.success).toBe(true)
            expect(await storedArchive()).toEqual({
                p1: [archivedEntry('old-2', { imageId: 'photo-a' })],
            })
        })
    })

    it('exports what it imports: an archive survives a round trip', async () => {
        await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, archive())
        vi.mocked(indexedDBStorage.getItem).mockResolvedValue(STATE)
        const exported = await backupService.exportBackup()
        const file = String(mocks.zipEntries.get(ARCHIVE_ENTRY))
        const meta = JSON.stringify(exported.metadata)

        await metadataStore.setMetadata(ARCHIVED_LOGS_METADATA_KEY, {})
        const result = await importMockBackup(
            { version: 6 },
            {},
            { [ARCHIVE_ENTRY]: file, [META_ENTRY]: meta },
        )

        expect(result.success).toBe(true)
        expect(await storedArchive()).toEqual(archive())
    })
})
