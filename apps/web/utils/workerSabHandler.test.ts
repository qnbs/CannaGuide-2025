import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock crossOriginIsolation so SAB utils think SAB is unavailable (default)
// ---------------------------------------------------------------------------

vi.mock('@/utils/crossOriginIsolation', () => ({
    canUseSharedArrayBuffer: () => false,
    isCrossOriginIsolated: () => false,
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('workerSabHandler', () => {
    let originalOnMessage: typeof self.onmessage

    beforeEach(() => {
        originalOnMessage = self.onmessage
    })

    afterEach(() => {
        self.onmessage = originalOnMessage
        vi.restoreAllMocks()
    })

    it('initSabHandler wraps self.onmessage and forwards normal messages', async () => {
        const handler = vi.fn()
        self.onmessage = handler

        const { initSabHandler } = await import('./workerSabHandler')
        initSabHandler()

        // Fire a normal message
        const event = new MessageEvent('message', {
            data: { messageId: '123', type: 'TEST', payload: {} },
        })
        self.onmessage?.(event)

        expect(handler).toHaveBeenCalledTimes(1)
    })

    it('getWorkerChannel returns null before any SAB message', async () => {
        const { getWorkerChannel, getWorkerRingBuffer } = await import('./workerSabHandler')
        expect(getWorkerChannel()).toBeNull()
        expect(getWorkerRingBuffer()).toBeNull()
    })
})
