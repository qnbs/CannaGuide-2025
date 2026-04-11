import { describe, it, expect, vi } from 'vitest'

// In the test environment (jsdom), SAB is available as a constructor but
// `self.crossOriginIsolated` is false, so `canUseSharedArrayBuffer()` returns false.
// We test both the "SAB unavailable" path (default) and mock the "SAB available" path.

describe('AtomicsChannel', () => {
    describe('when SAB is unavailable', () => {
        it('create returns null', async () => {
            const { AtomicsChannel } = await import('./atomicsChannel')
            const mockWorker = { postMessage: vi.fn() } as unknown as Worker
            expect(AtomicsChannel.create(mockWorker)).toBeNull()
        })

        it('isSupported returns false', async () => {
            const { AtomicsChannel } = await import('./atomicsChannel')
            expect(AtomicsChannel.isSupported()).toBe(false)
        })
    })

    describe('when SAB is available (mocked)', () => {
        // Directly test the class logic by constructing from a SharedArrayBuffer
        // using fromTransfer (bypasses the canUseSharedArrayBuffer guard)

        it('fromTransfer creates a worker-side channel', async () => {
            const { AtomicsChannel } = await import('./atomicsChannel')
            // 8 slots * 4 bytes = 32 bytes
            const buffer = new SharedArrayBuffer(32)
            const ch = AtomicsChannel.fromTransfer(buffer)
            expect(ch).toBeDefined()
            expect(ch.getBuffer()).toBe(buffer)
        })

        it('data slot read/write', async () => {
            const { AtomicsChannel } = await import('./atomicsChannel')
            const buffer = new SharedArrayBuffer(32)
            const ch = AtomicsChannel.fromTransfer(buffer)

            ch.writeData(0, 42)
            expect(ch.readData(0)).toBe(42)

            ch.writeData(3, 99)
            expect(ch.readData(3)).toBe(99)
        })

        it('dataSlotCount', async () => {
            const { AtomicsChannel } = await import('./atomicsChannel')
            const buffer = new SharedArrayBuffer(32)
            const ch = AtomicsChannel.fromTransfer(buffer)
            expect(ch.dataSlotCount).toBe(6) // 8 total - 2 signal slots
        })

        it('writeData throws for out-of-range slot', async () => {
            const { AtomicsChannel } = await import('./atomicsChannel')
            const buffer = new SharedArrayBuffer(32)
            const ch = AtomicsChannel.fromTransfer(buffer)
            expect(() => ch.writeData(10, 1)).toThrow('out of range')
        })

        it('readData throws for out-of-range slot', async () => {
            const { AtomicsChannel } = await import('./atomicsChannel')
            const buffer = new SharedArrayBuffer(32)
            const ch = AtomicsChannel.fromTransfer(buffer)
            expect(() => ch.readData(-1)).toThrow('out of range')
        })

        it('signal writes to correct slot (worker side writes W2M)', async () => {
            const { AtomicsChannel } = await import('./atomicsChannel')
            const buffer = new SharedArrayBuffer(32)
            const view = new Int32Array(buffer)

            // fromTransfer defaults to 'worker' side
            const workerCh = AtomicsChannel.fromTransfer(buffer)
            workerCh.signal(77)

            // Worker writes to slot 1 (W2M)
            expect(Atomics.load(view, 1)).toBe(77)
        })

        it('read reads from the opposite slot (worker reads from M2W)', async () => {
            const { AtomicsChannel } = await import('./atomicsChannel')
            const buffer = new SharedArrayBuffer(32)
            const view = new Int32Array(buffer)

            // Simulate main thread writing to slot 0 (M2W)
            Atomics.store(view, 0, 55)

            const workerCh = AtomicsChannel.fromTransfer(buffer)
            expect(workerCh.read()).toBe(55)
        })

        it('bidirectional signaling via shared buffer', async () => {
            const { AtomicsChannel } = await import('./atomicsChannel')
            const buffer = new SharedArrayBuffer(32)
            const view = new Int32Array(buffer)

            // Initialize all slots to 0
            for (let i = 0; i < 8; i++) {
                Atomics.store(view, i, 0)
            }

            // Worker side: writes to slot 1, reads from slot 0
            const workerCh = AtomicsChannel.fromTransfer(buffer)

            // Simulate main -> worker signal
            Atomics.store(view, 0, 100)
            expect(workerCh.read()).toBe(100)

            // Worker -> main signal
            workerCh.signal(200)
            expect(Atomics.load(view, 1)).toBe(200)
        })
    })
})
