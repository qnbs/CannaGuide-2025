import { describe, expect, it, beforeEach, vi } from 'vitest'
import { porcupineWakeWordService } from '@/services/porcupineWakeWordService'

// Mock dynamic imports -- Porcupine is an optional dependency
vi.mock('@picovoice/porcupine-web', () => ({
    PorcupineWorker: {
        create: vi.fn().mockRejectedValue(new Error('WASM not available in test')),
    },
    BuiltInKeyword: {},
}))

vi.mock('@picovoice/web-voice-processor', () => ({
    WebVoiceProcessor: {
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
    },
}))

describe('porcupineWakeWordService', () => {
    beforeEach(() => {
        // Reset service state via dispose
        porcupineWakeWordService.dispose().catch(() => {})
    })

    it('starts in disposed state after beforeEach cleanup', () => {
        // Singleton is disposed via beforeEach -- expected lifecycle
        expect(porcupineWakeWordService.getState()).toBe('disposed')
    })

    it('isAvailable returns false when not initialized', () => {
        expect(porcupineWakeWordService.isAvailable()).toBe(false)
    })

    it('setCallback stores the callback without error', () => {
        const cb = vi.fn()
        porcupineWakeWordService.setCallback(cb)
        // No assertion needed -- should not throw
    })

    it('stop resolves without error when not started', async () => {
        await expect(porcupineWakeWordService.stop()).resolves.toBeUndefined()
    })

    it('dispose resolves without error when not initialized', async () => {
        await expect(porcupineWakeWordService.dispose()).resolves.toBeUndefined()
    })

    it('init returns false when WASM is unavailable', async () => {
        // init catches errors internally and returns false
        const result = await porcupineWakeWordService.init('test-access-key', 'COMPUTER')
        expect(result).toBe(false)
        expect(porcupineWakeWordService.getState()).toBe('error')
    })

    it('start resolves silently when not initialized', async () => {
        // start() is a no-op when state is not 'ready'
        await expect(porcupineWakeWordService.start()).resolves.toBeUndefined()
    })
})
