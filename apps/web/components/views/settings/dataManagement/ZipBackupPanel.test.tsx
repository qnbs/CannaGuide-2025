import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    addNotification: vi.fn(),
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
        exportBackup: vi.fn(),
        importBackup: mocks.importBackup,
        downloadBlob: vi.fn(),
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
})
