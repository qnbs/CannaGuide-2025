import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
    getWebLlmLoadingSnapshot,
    subscribeWebLlmLoading,
    reportWebLlmProgress,
    reportWebLlmReady,
    reportWebLlmError,
    resetWebLlmLoadingState,
} from './progressEmitter'

describe('progressEmitter', () => {
    beforeEach(() => {
        resetWebLlmLoadingState()
    })

    it('starts with idle state', () => {
        const state = getWebLlmLoadingSnapshot()
        expect(state.status).toBe('idle')
    })

    it('reports loading progress', () => {
        reportWebLlmProgress({ progress: 0.5, text: 'Loading model...', timeElapsed: 3 })
        const state = getWebLlmLoadingSnapshot()
        expect(state.status).toBe('loading')
        if (state.status === 'loading') {
            expect(state.report.progress).toBe(0.5)
            expect(state.report.text).toBe('Loading model...')
            expect(state.report.timeElapsed).toBe(3)
        }
    })

    it('reports ready state', () => {
        reportWebLlmReady()
        const state = getWebLlmLoadingSnapshot()
        expect(state.status).toBe('ready')
    })

    it('reports error state', () => {
        reportWebLlmError('GPU unavailable')
        const state = getWebLlmLoadingSnapshot()
        expect(state.status).toBe('error')
        if (state.status === 'error') {
            expect(state.message).toBe('GPU unavailable')
        }
    })

    it('resets to idle', () => {
        reportWebLlmReady()
        resetWebLlmLoadingState()
        expect(getWebLlmLoadingSnapshot().status).toBe('idle')
    })

    it('notifies subscribers on progress', () => {
        const listener = vi.fn()
        subscribeWebLlmLoading(listener)
        reportWebLlmProgress({ progress: 0.1, text: 'Starting...', timeElapsed: 1 })
        expect(listener).toHaveBeenCalledOnce()
    })

    it('notifies subscribers on ready', () => {
        const listener = vi.fn()
        subscribeWebLlmLoading(listener)
        reportWebLlmReady()
        expect(listener).toHaveBeenCalledOnce()
    })

    it('notifies subscribers on error', () => {
        const listener = vi.fn()
        subscribeWebLlmLoading(listener)
        reportWebLlmError('fail')
        expect(listener).toHaveBeenCalledOnce()
    })

    it('notifies subscribers on reset', () => {
        const listener = vi.fn()
        subscribeWebLlmLoading(listener)
        resetWebLlmLoadingState()
        expect(listener).toHaveBeenCalledOnce()
    })

    it('unsubscribes correctly', () => {
        const listener = vi.fn()
        const unsub = subscribeWebLlmLoading(listener)
        unsub()
        reportWebLlmReady()
        expect(listener).not.toHaveBeenCalled()
    })

    it('supports multiple subscribers', () => {
        const listener1 = vi.fn()
        const listener2 = vi.fn()
        subscribeWebLlmLoading(listener1)
        subscribeWebLlmLoading(listener2)
        reportWebLlmReady()
        expect(listener1).toHaveBeenCalledOnce()
        expect(listener2).toHaveBeenCalledOnce()
    })

    it('state transitions: idle -> loading -> ready', () => {
        expect(getWebLlmLoadingSnapshot().status).toBe('idle')
        reportWebLlmProgress({ progress: 0.5, text: 'test', timeElapsed: 2 })
        expect(getWebLlmLoadingSnapshot().status).toBe('loading')
        reportWebLlmReady()
        expect(getWebLlmLoadingSnapshot().status).toBe('ready')
    })

    it('state transitions: idle -> loading -> error', () => {
        expect(getWebLlmLoadingSnapshot().status).toBe('idle')
        reportWebLlmProgress({ progress: 0.1, text: 'start', timeElapsed: 1 })
        expect(getWebLlmLoadingSnapshot().status).toBe('loading')
        reportWebLlmError('oom')
        expect(getWebLlmLoadingSnapshot().status).toBe('error')
    })
})
