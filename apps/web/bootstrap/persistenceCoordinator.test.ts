import { beforeEach, describe, expect, it, vi } from 'vitest'

let coordinator: typeof import('./persistenceCoordinator')

describe('persistenceCoordinator', () => {
    beforeEach(async () => {
        vi.resetModules()
        localStorage.clear()
        coordinator = await import('./persistenceCoordinator')
    })

    it('serializes persisted-state writes', async () => {
        const order: string[] = []
        let finishFirst: (() => void) | undefined
        const firstBlocked = new Promise<void>((resolve) => {
            finishFirst = resolve
        })

        const first = coordinator.schedulePersistenceWrite(async () => {
            order.push('first-start')
            await firstBlocked
            order.push('first-end')
        })
        const second = coordinator.schedulePersistenceWrite(async () => {
            order.push('second')
        })

        await vi.waitFor(() => expect(order).toEqual(['first-start']))
        finishFirst?.()

        await expect(Promise.all([first, second])).resolves.toEqual([true, true])
        expect(order).toEqual(['first-start', 'first-end', 'second'])
    })

    it('drains an active write and suppresses new writes during recovery', async () => {
        let finishWrite: (() => void) | undefined
        const writeBlocked = new Promise<void>((resolve) => {
            finishWrite = resolve
        })
        const writeStarted = vi.fn()
        const active = coordinator.schedulePersistenceWrite(async () => {
            writeStarted()
            await writeBlocked
        })
        await vi.waitFor(() => expect(writeStarted).toHaveBeenCalledOnce())

        const suspension = coordinator.suspendPersistenceForRecovery()
        const skippedWrite = vi.fn(async () => {})
        await expect(coordinator.schedulePersistenceWrite(skippedWrite)).resolves.toBe(false)
        expect(skippedWrite).not.toHaveBeenCalled()

        finishWrite?.()
        await expect(active).resolves.toBe(true)
        const resume = await suspension
        expect(resume).not.toBeNull()

        resume?.()
        const resumedWrite = vi.fn(async () => {})
        await expect(coordinator.schedulePersistenceWrite(resumedWrite)).resolves.toBe(true)
        expect(resumedWrite).toHaveBeenCalledOnce()
    })

    it('fences writes from tabs that booted before a recovery commit', async () => {
        expect(coordinator.commitRecoveryEpoch()).toBe(true)
        const staleWrite = vi.fn(async () => {})
        const reload = vi.fn()

        await expect(coordinator.schedulePersistenceWrite(staleWrite)).resolves.toBe(false)
        expect(staleWrite).not.toHaveBeenCalled()
        expect(
            coordinator.handleRecoveryEpochStorageEvent(
                { key: 'cannaguide.recoveryEpoch', newValue: '1' },
                reload,
            ),
        ).toBe(true)
        expect(reload).toHaveBeenCalledOnce()
    })

    it('fails recovery closed when Web Locks are unavailable', async () => {
        const operation = vi.fn(async () => 'recovered')

        await expect(coordinator.runWithExclusiveRecoveryLock(operation)).resolves.toBeNull()
        expect(operation).not.toHaveBeenCalled()
    })

    it('survives denied localStorage access and disables recovery', async () => {
        const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new DOMException('Denied', 'SecurityError')
        })

        try {
            vi.resetModules()
            await expect(import('./persistenceCoordinator')).resolves.toBeDefined()
            coordinator = await import('./persistenceCoordinator')
            await expect(
                coordinator.runWithExclusiveRecoveryLock(async () => 'recovered'),
            ).resolves.toBeNull()
        } finally {
            getItem.mockRestore()
        }
    })

    it('uses a shared Web Lock for writes and an exclusive lock for recovery', async () => {
        const originalLocks = Object.getOwnPropertyDescriptor(navigator, 'locks')
        const request = vi.fn(
            async (
                _name: string,
                _options: LockOptions,
                callback: (lock: Lock | null) => Promise<unknown>,
            ) => callback({ name: 'cannaguide.persisted-state', mode: 'exclusive' } as Lock),
        )
        Object.defineProperty(navigator, 'locks', {
            configurable: true,
            value: { request } as unknown as LockManager,
        })

        try {
            vi.resetModules()
            coordinator = await import('./persistenceCoordinator')

            await expect(coordinator.schedulePersistenceWrite(async () => {})).resolves.toBe(true)
            await expect(
                coordinator.runWithExclusiveRecoveryLock(async () => 'recovered'),
            ).resolves.toBe('recovered')

            expect(request).toHaveBeenNthCalledWith(
                1,
                'cannaguide.persisted-state',
                { mode: 'shared' },
                expect.any(Function),
            )
            expect(request).toHaveBeenNthCalledWith(
                2,
                'cannaguide.persisted-state',
                { mode: 'exclusive' },
                expect.any(Function),
            )
        } finally {
            if (originalLocks) {
                Object.defineProperty(navigator, 'locks', originalLocks)
            } else {
                Reflect.deleteProperty(navigator, 'locks')
            }
        }
    })
})

describe('stopPersistenceForOwnershipLoss (GH #669)', () => {
    let stopCoordinator: typeof import('./persistenceCoordinator')

    beforeEach(async () => {
        vi.resetModules()
        localStorage.clear()
        stopCoordinator = await import('./persistenceCoordinator')
    })

    it('skips every write that has not started, for good', async () => {
        await stopCoordinator.stopPersistenceForOwnershipLoss()
        const skipped = vi.fn(() => Promise.resolve())

        await expect(stopCoordinator.schedulePersistenceWrite(skipped)).resolves.toBe(false)
        await expect(stopCoordinator.schedulePersistenceWrite(skipped)).resolves.toBe(false)
        expect(skipped).not.toHaveBeenCalled()
    })

    it('waits for a write that had already started', async () => {
        let finishWrite: (() => void) | undefined
        const writeBlocked = new Promise<void>((resolve) => {
            finishWrite = resolve
        })
        const started = vi.fn()
        const active = stopCoordinator.schedulePersistenceWrite(async () => {
            started()
            await writeBlocked
        })
        await vi.waitFor(() => expect(started).toHaveBeenCalledOnce())

        let drained = false
        const stopping = stopCoordinator.stopPersistenceForOwnershipLoss().then(() => {
            drained = true
        })
        await Promise.resolve()
        expect(drained).toBe(false)

        finishWrite?.()
        await stopping
        await expect(active).resolves.toBe(true)
        expect(drained).toBe(true)
    })

    it('skips a write that was queued before the stop and queues none after it', async () => {
        const queued = vi.fn(() => Promise.resolve())
        const beforeStop = vi.fn(() => Promise.resolve())
        const first = stopCoordinator.schedulePersistenceWrite(beforeStop)

        await stopCoordinator.stopPersistenceForOwnershipLoss()
        await expect(first).resolves.toBe(false)
        expect(beforeStop).not.toHaveBeenCalled()

        await expect(stopCoordinator.schedulePersistenceWrite(queued)).resolves.toBe(false)
        expect(queued).not.toHaveBeenCalled()
    })

    it('leaves safe recovery available on the error screen', async () => {
        await stopCoordinator.stopPersistenceForOwnershipLoss()

        const resume = await stopCoordinator.suspendPersistenceForRecovery()

        expect(resume).not.toBeNull()
    })
})
