import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
    },
}))

vi.mock('@/constants', () => ({
    REDUX_STATE_KEY: 'test-state-key',
}))

vi.mock('@/services/sentryService', () => ({
    Sentry: {
        captureException: vi.fn(),
    },
}))

import {
    SAFE_RECOVERY_ATTEMPT_KEY,
    SAFE_RECOVERY_ROLLBACK_KEY,
    triggerSafeRecovery,
} from './recovery'
import { indexedDBStorage } from '@/stores/indexedDBStorage'

const BACKUP_KEY = 'test-state-key-backup'
const PRIMARY_KEY = 'test-state-key'

describe('triggerSafeRecovery', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        sessionStorage.clear()
        vi.spyOn(console, 'debug').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('restores a validated backup, preserves the primary, and reloads', async () => {
        const backup = JSON.stringify({ version: 1, simulation: { plants: [] } })
        const primary = JSON.stringify({ version: 1, simulation: { plants: [{ id: 'p1' }] } })
        const reload = vi.fn()
        vi.mocked(indexedDBStorage.getItem)
            .mockResolvedValueOnce(backup)
            .mockResolvedValueOnce(primary)
            .mockResolvedValueOnce(backup)

        await expect(triggerSafeRecovery('manual-safe-recovery', undefined, reload)).resolves.toBe(
            true,
        )

        expect(indexedDBStorage.getItem).toHaveBeenNthCalledWith(1, BACKUP_KEY)
        expect(indexedDBStorage.setItem).toHaveBeenNthCalledWith(
            1,
            SAFE_RECOVERY_ROLLBACK_KEY,
            primary,
        )
        expect(indexedDBStorage.setItem).toHaveBeenNthCalledWith(2, PRIMARY_KEY, backup)
        expect(indexedDBStorage.removeItem).not.toHaveBeenCalled()
        expect(sessionStorage.getItem(SAFE_RECOVERY_ATTEMPT_KEY)).toBe('1')
        expect(reload).toHaveBeenCalledOnce()
    })

    it.each([null, 'not-json', '[]', 'null'])(
        'does not modify the primary when the backup is invalid (%s)',
        async (backup) => {
            vi.mocked(indexedDBStorage.getItem).mockResolvedValue(backup)

            await expect(
                triggerSafeRecovery('manual-safe-recovery', undefined, vi.fn()),
            ).resolves.toBe(false)

            expect(indexedDBStorage.setItem).not.toHaveBeenCalled()
            expect(indexedDBStorage.removeItem).not.toHaveBeenCalled()
            expect(sessionStorage.getItem(SAFE_RECOVERY_ATTEMPT_KEY)).toBeNull()
        },
    )

    it('rolls the primary back when restored-snapshot verification fails', async () => {
        const backup = JSON.stringify({ version: 1, notes: { notes: [] } })
        const primary = JSON.stringify({ version: 1, notes: { notes: [{ id: 'n1' }] } })
        vi.mocked(indexedDBStorage.getItem)
            .mockResolvedValueOnce(backup)
            .mockResolvedValueOnce(primary)
            .mockResolvedValueOnce('unexpected-state')

        await expect(triggerSafeRecovery('manual-safe-recovery', undefined, vi.fn())).resolves.toBe(
            false,
        )

        expect(indexedDBStorage.setItem).toHaveBeenNthCalledWith(2, PRIMARY_KEY, backup)
        expect(indexedDBStorage.setItem).toHaveBeenNthCalledWith(3, PRIMARY_KEY, primary)
        expect(sessionStorage.getItem(SAFE_RECOVERY_ATTEMPT_KEY)).toBeNull()
    })

    it('does not repeat recovery during the same page session', async () => {
        sessionStorage.setItem(SAFE_RECOVERY_ATTEMPT_KEY, '1')

        await expect(triggerSafeRecovery('manual-safe-recovery', undefined, vi.fn())).resolves.toBe(
            false,
        )

        expect(indexedDBStorage.getItem).not.toHaveBeenCalled()
        expect(indexedDBStorage.setItem).not.toHaveBeenCalled()
    })
})
