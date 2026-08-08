import { beforeEach, describe, expect, it, vi } from 'vitest'

let coordinator: typeof import('./persistenceCoordinator')

describe('persistenceCoordinator', () => {
    beforeEach(async () => {
        vi.resetModules()
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
})
