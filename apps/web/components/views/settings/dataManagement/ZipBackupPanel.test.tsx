import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    addNotification: vi.fn(),
    exportBackup: vi.fn(),
    downloadBlob: vi.fn(),
    importBackup: vi.fn(),
    reload: vi.fn(),
    translate: vi.fn(
        (key: string, options?: { count?: number }) => `${key}:${options?.count ?? ''}`,
    ),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: mocks.translate }),
}))

vi.mock('@/stores/useUIStore', () => ({
    getUISnapshot: () => ({ addNotification: mocks.addNotification }),
}))

vi.mock('@/services/backupService', () => ({
    backupService: {
        exportBackup: mocks.exportBackup,
        importBackup: mocks.importBackup,
        downloadBlob: mocks.downloadBlob,
    },
}))

import { ZipBackupPanel } from './ZipBackupPanel'

describe('ZipBackupPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.stubGlobal('location', { reload: mocks.reload })
        mocks.importBackup.mockResolvedValue({
            success: true,
            metadata: null,
            rejectedImageCount: 2,
        })
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
    })

    it('shows the rejected-image count before reloading after a partial restore', async () => {
        const { container } = render(<ZipBackupPanel />)
        const input = container.querySelector<HTMLInputElement>('#import-zip-file-input')
        expect(input).not.toBeNull()

        await act(async () => {
            fireEvent.change(input!, {
                target: {
                    files: [new File(['backup'], 'backup.zip', { type: 'application/zip' })],
                },
            })
            await Promise.resolve()
        })

        expect(mocks.addNotification).toHaveBeenCalledWith({
            type: 'info',
            message: 'settingsView.zipBackup.importPartialSuccess:2',
        })
        expect(mocks.reload).not.toHaveBeenCalled()

        await act(async () => {
            vi.advanceTimersByTime(3500)
        })
        expect(mocks.reload).toHaveBeenCalledOnce()
    })

    it('keeps immediate reload behavior when all images restore', async () => {
        mocks.importBackup.mockResolvedValue({
            success: true,
            metadata: null,
            rejectedImageCount: 0,
        })
        const { container } = render(<ZipBackupPanel />)
        const input = container.querySelector<HTMLInputElement>('#import-zip-file-input')
        expect(input).not.toBeNull()

        await act(async () => {
            fireEvent.change(input!, {
                target: {
                    files: [new File(['backup'], 'backup.zip', { type: 'application/zip' })],
                },
            })
            await Promise.resolve()
        })

        expect(mocks.addNotification).not.toHaveBeenCalled()
        expect(mocks.reload).toHaveBeenCalledOnce()
    })

    it('shows a failure notification and reloads when restore fencing reports a partial write', async () => {
        mocks.importBackup.mockResolvedValue({
            success: false,
            metadata: null,
            rejectedImageCount: 0,
            reloadRequired: true,
            error: 'settingsView.data.restoreBlocked',
        })
        const { container } = render(<ZipBackupPanel />)
        const input = container.querySelector<HTMLInputElement>('#import-zip-file-input')

        await act(async () => {
            fireEvent.change(input!, {
                target: {
                    files: [new File(['backup'], 'backup.zip', { type: 'application/zip' })],
                },
            })
            await Promise.resolve()
        })

        expect(mocks.addNotification).toHaveBeenCalledWith({
            type: 'error',
            message: 'settingsView.zipBackup.importError:',
        })
        expect(mocks.reload).not.toHaveBeenCalled()

        await act(async () => {
            vi.advanceTimersByTime(3500)
        })
        expect(mocks.reload).toHaveBeenCalledOnce()
    })

    it('shows an error notification when import fails before replacing stored state', async () => {
        mocks.importBackup.mockResolvedValue({
            success: false,
            metadata: null,
            rejectedImageCount: 0,
            error: 'settingsView.data.restoreBlocked',
        })
        const { container } = render(<ZipBackupPanel />)
        const input = container.querySelector<HTMLInputElement>('#import-zip-file-input')

        await act(async () => {
            fireEvent.change(input!, {
                target: {
                    files: [new File(['backup'], 'backup.zip', { type: 'application/zip' })],
                },
            })
            await Promise.resolve()
        })

        expect(mocks.addNotification).toHaveBeenCalledWith({
            type: 'error',
            message: 'settingsView.zipBackup.importError:',
        })
        expect(mocks.reload).not.toHaveBeenCalled()
    })

    describe('export (#665)', () => {
        const clickExport = async () => {
            render(<ZipBackupPanel />)
            await act(async () => {
                fireEvent.click(screen.getByText('settingsView.zipBackup.exportZip:'))
                await Promise.resolve()
            })
        }

        it('downloads a complete archive without an error', async () => {
            const blob = new Blob(['zip'])
            mocks.exportBackup.mockResolvedValue({
                success: true,
                blob,
                filename: 'cannaguide-backup.zip',
                metadata: null,
            })
            await clickExport()
            expect(mocks.downloadBlob).toHaveBeenCalledWith(blob, 'cannaguide-backup.zip')
            expect(mocks.addNotification).not.toHaveBeenCalled()
        })

        it('explains an unreadable photo store instead of downloading', async () => {
            mocks.exportBackup.mockResolvedValue({
                success: false,
                blob: null,
                filename: '',
                metadata: null,
                errorCode: 'imagesUnreadable',
            })
            await clickExport()
            expect(mocks.downloadBlob).not.toHaveBeenCalled()
            expect(mocks.addNotification).toHaveBeenCalledWith({
                type: 'error',
                message: 'settingsView.zipBackup.exportImagesError:',
            })
        })

        it('reports any other export failure', async () => {
            mocks.exportBackup.mockResolvedValue({
                success: false,
                blob: null,
                filename: '',
                metadata: null,
                error: 'No saved state found in IndexedDB',
            })
            await clickExport()
            expect(mocks.addNotification).toHaveBeenCalledWith({
                type: 'error',
                message: 'settingsView.zipBackup.exportError:',
            })
        })
    })
})
