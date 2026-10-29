import 'fake-indexeddb/auto'
import JSZip from 'jszip'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ restore: vi.fn() }))

// Only the restore boundary is mocked: these tests are about what happens
// before it -- reading an untrusted archive with real JSZip (#671).
vi.mock('@/services/persistedStateService', () => ({
    replacePrimaryPersistedSnapshot: vi.fn(),
    replacePrimaryPersistedSnapshotForRecovery: mocks.restore,
}))
vi.mock('@/i18n', () => ({ getT: () => (key: string) => key }))

import { BACKUP_IMPORT_LIMITS, backupService } from '@/services/backupService'
import { closeDB, releaseDBAfterErase } from '@/services/db/connection'

const KIB = 1024

const archive = async (entries: Record<string, string>): Promise<File> => {
    const zip = new JSZip()
    for (const [name, text] of Object.entries(entries)) zip.file(name, text)
    const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
    })
    return new File([blob], 'backup.zip', { type: 'application/zip' })
}

const state = (filler = '') => JSON.stringify({ version: 6, filler })

describe('ZIP import inflation limits (#671)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.restore.mockResolvedValue({ success: true, reloadRequired: true })
        vi.stubGlobal(
            'createImageBitmap',
            vi.fn(async () => ({ width: 1, height: 1, close: vi.fn() })),
        )
    })

    afterEach(() => {
        closeDB()
        releaseDBAfterErase()
        vi.unstubAllGlobals()
    })

    it('refuses a state entry that inflates beyond its limit, before restoring anything', async () => {
        // 2 MiB of repetitive JSON compresses to a few KiB.
        const file = await archive({ 'cannaguide-state.json': state('a'.repeat(2048 * KIB)) })
        expect(file.size).toBeLessThan(64 * KIB)
        const result = await backupService.importBackup(file, {
            ...BACKUP_IMPORT_LIMITS,
            maxStateBytes: 256 * KIB,
        })
        expect(result).toMatchObject({ success: false, errorCode: 'limitExceeded' })
        expect(mocks.restore).not.toHaveBeenCalled()
    })

    it('refuses an oversized photo entry instead of skipping it as corrupt', async () => {
        const file = await archive({
            'cannaguide-state.json': state(),
            'images/photo-1.json': JSON.stringify({
                id: 'photo-1',
                data: `data:image/png;base64,${'A'.repeat(512 * KIB)}`,
                createdAt: 1,
            }),
        })
        const result = await backupService.importBackup(file, {
            ...BACKUP_IMPORT_LIMITS,
            maxImageEntryBytes: 64 * KIB,
        })
        expect(result).toMatchObject({ success: false, errorCode: 'limitExceeded' })
        expect(mocks.restore).not.toHaveBeenCalled()
    })

    it('refuses an archive whose entries together inflate beyond the total budget', async () => {
        const entries: Record<string, string> = { 'cannaguide-state.json': state() }
        for (let i = 0; i < 20; i += 1) {
            entries[`images/photo-${i}.json`] = JSON.stringify({
                id: `photo-${i}`,
                data: `data:image/png;base64,${'A'.repeat(32 * KIB)}`,
                createdAt: i,
            })
        }
        const file = await archive(entries)
        const result = await backupService.importBackup(file, {
            ...BACKUP_IMPORT_LIMITS,
            maxImageEntryBytes: 64 * KIB,
            maxTotalBytes: 256 * KIB,
        })
        expect(result).toMatchObject({ success: false, errorCode: 'limitExceeded' })
        expect(mocks.restore).not.toHaveBeenCalled()
    })

    it('refuses an archive with more entries than a backup has', async () => {
        const entries: Record<string, string> = { 'cannaguide-state.json': state() }
        for (let i = 0; i < 10; i += 1) entries[`images/photo-${i}.json`] = '{}'
        const file = await archive(entries)
        const result = await backupService.importBackup(file, {
            ...BACKUP_IMPORT_LIMITS,
            maxEntries: 5,
        })
        expect(result).toMatchObject({ success: false, errorCode: 'limitExceeded' })
        expect(mocks.restore).not.toHaveBeenCalled()
    })

    it('restores a real backup that stays within the limits', async () => {
        const file = await archive({
            'cannaguide-state.json': state('ok'),
            'backup-meta.json': JSON.stringify({ version: '1.0', exportedAt: 1, imageCount: 0 }),
        })
        const result = await backupService.importBackup(file)
        expect(result.success).toBe(true)
        expect(result.errorCode).toBeUndefined()
        expect(mocks.restore).toHaveBeenCalledTimes(1)
    })
})
