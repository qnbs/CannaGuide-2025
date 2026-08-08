import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    captureException: vi.fn(),
}))

vi.mock('@/stores/indexedDBStorage', () => ({
    indexedDBStorage: {
        getItem: mocks.getItem,
        setItem: mocks.setItem,
        removeItem: mocks.removeItem,
    },
}))

vi.mock('@/constants', () => ({
    REDUX_STATE_KEY: 'test-state-key',
}))

vi.mock('@/services/sentryService', () => ({
    Sentry: {
        captureException: mocks.captureException,
    },
}))

const BACKUP_KEY = 'test-state-key-backup'
const PRIMARY_KEY = 'test-state-key'

let recovery: typeof import('./recovery')

describe('triggerSafeRecovery', () => {
    beforeEach(async () => {
        vi.restoreAllMocks()
        vi.clearAllMocks()
        vi.resetModules()
        sessionStorage.clear()
        vi.spyOn(console, 'debug').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        recovery = await import('./recovery')
    })

    it('restores a validated backup, preserves the primary, and reloads', async () => {
        const backup = JSON.stringify({ version: 1, simulation: { plants: [] } })
        const primary = JSON.stringify({ version: 1, simulation: { plants: [{ id: 'p1' }] } })
        const reload = vi.fn()
        mocks.getItem
            .mockResolvedValueOnce(backup)
            .mockResolvedValueOnce(primary)
            .mockResolvedValueOnce(backup)

        await expect(
            recovery.triggerSafeRecovery('manual-safe-recovery', undefined, reload),
        ).resolves.toBe(true)

        expect(mocks.getItem).toHaveBeenNthCalledWith(1, BACKUP_KEY)
        expect(mocks.setItem).toHaveBeenNthCalledWith(
            1,
            recovery.SAFE_RECOVERY_ROLLBACK_KEY,
            primary,
        )
        expect(mocks.setItem).toHaveBeenNthCalledWith(2, PRIMARY_KEY, backup)
        expect(mocks.removeItem).not.toHaveBeenCalled()
        expect(sessionStorage.getItem(recovery.SAFE_RECOVERY_ATTEMPT_KEY)).toBe('1')
        expect(reload).toHaveBeenCalledOnce()
    })

    it.each([null, 'not-json', '[]', 'null'])(
        'does not modify the primary when the backup is invalid (%s)',
        async (backup) => {
            mocks.getItem.mockResolvedValue(backup)

            await expect(
                recovery.triggerSafeRecovery('manual-safe-recovery', undefined, vi.fn()),
            ).resolves.toBe(false)

            expect(mocks.setItem).not.toHaveBeenCalled()
            expect(mocks.removeItem).not.toHaveBeenCalled()
            expect(sessionStorage.getItem(recovery.SAFE_RECOVERY_ATTEMPT_KEY)).toBeNull()
        },
    )

    it('rolls the primary back when restored-snapshot verification fails', async () => {
        const backup = JSON.stringify({ version: 1, notes: { notes: [] } })
        const primary = JSON.stringify({ version: 1, notes: { notes: [{ id: 'n1' }] } })
        mocks.getItem
            .mockResolvedValueOnce(backup)
            .mockResolvedValueOnce(primary)
            .mockResolvedValueOnce('unexpected-state')

        await expect(
            recovery.triggerSafeRecovery('manual-safe-recovery', undefined, vi.fn()),
        ).resolves.toBe(false)

        expect(mocks.setItem).toHaveBeenNthCalledWith(2, PRIMARY_KEY, backup)
        expect(mocks.setItem).toHaveBeenNthCalledWith(3, PRIMARY_KEY, primary)
        expect(sessionStorage.getItem(recovery.SAFE_RECOVERY_ATTEMPT_KEY)).toBeNull()
    })

    it('removes a failed restore when no primary snapshot existed', async () => {
        const backup = JSON.stringify({ version: 1, notes: { notes: [] } })
        mocks.getItem
            .mockResolvedValueOnce(backup)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce('unexpected-state')

        await expect(
            recovery.triggerSafeRecovery('manual-safe-recovery', undefined, vi.fn()),
        ).resolves.toBe(false)

        expect(mocks.removeItem).toHaveBeenCalledWith(PRIMARY_KEY)
        expect(sessionStorage.getItem(recovery.SAFE_RECOVERY_ATTEMPT_KEY)).toBeNull()
    })

    it('blocks a concurrent recovery call before the first IndexedDB read completes', async () => {
        let resolveBackup: ((value: string | null) => void) | undefined
        const backupRead = new Promise<string | null>((resolve) => {
            resolveBackup = resolve
        })
        mocks.getItem.mockReturnValueOnce(backupRead)

        const first = recovery.triggerSafeRecovery('manual-safe-recovery', undefined, vi.fn())
        await expect(
            recovery.triggerSafeRecovery('manual-safe-recovery', undefined, vi.fn()),
        ).resolves.toBe(false)
        resolveBackup?.(null)
        await expect(first).resolves.toBe(false)

        expect(mocks.getItem).toHaveBeenCalledOnce()
    })

    it('waits for an active persistence write before reading recovery snapshots', async () => {
        const coordinator = await import('./persistenceCoordinator')
        let finishWrite: (() => void) | undefined
        const writeBlocked = new Promise<void>((resolve) => {
            finishWrite = resolve
        })
        const writeStarted = vi.fn()
        const activeWrite = coordinator.schedulePersistenceWrite(async () => {
            writeStarted()
            await writeBlocked
        })
        await vi.waitFor(() => expect(writeStarted).toHaveBeenCalledOnce())
        mocks.getItem.mockResolvedValue(null)

        const recoveryAttempt = recovery.triggerSafeRecovery(
            'manual-safe-recovery',
            undefined,
            vi.fn(),
        )
        await Promise.resolve()
        expect(mocks.getItem).not.toHaveBeenCalled()

        finishWrite?.()
        await expect(activeWrite).resolves.toBe(true)
        await expect(recoveryAttempt).resolves.toBe(false)
        expect(mocks.getItem).toHaveBeenCalledWith(BACKUP_KEY)
    })

    it('does not repeat recovery during the same page session', async () => {
        sessionStorage.setItem(recovery.SAFE_RECOVERY_ATTEMPT_KEY, '1')

        await expect(
            recovery.triggerSafeRecovery('manual-safe-recovery', undefined, vi.fn()),
        ).resolves.toBe(false)

        expect(mocks.getItem).not.toHaveBeenCalled()
        expect(mocks.setItem).not.toHaveBeenCalled()
    })
})
