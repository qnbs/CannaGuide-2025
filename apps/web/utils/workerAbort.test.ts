import { describe, it, expect, beforeEach } from 'vitest'
import {
    initAbortHandler,
    checkAborted,
    clearAborted,
    isAborted,
    CANCEL_MESSAGE_TYPE,
} from './workerAbort'

// We cannot fully test initAbortHandler in Node because it wraps self.onmessage,
// but we can test the abort state tracking functions directly.

describe('workerAbort', () => {
    describe('CANCEL_MESSAGE_TYPE', () => {
        it('is __CANCEL__', () => {
            expect(CANCEL_MESSAGE_TYPE).toBe('__CANCEL__')
        })
    })

    describe('checkAborted / isAborted / clearAborted', () => {
        beforeEach(() => {
            // Clean up any leftover state
            clearAborted('test-1')
            clearAborted('test-2')
        })

        it('does not throw when messageId is not aborted', () => {
            expect(() => checkAborted('test-1')).not.toThrow()
        })

        it('isAborted returns false for non-aborted messageId', () => {
            expect(isAborted('test-1')).toBe(false)
        })

        it('clearAborted is safe to call on non-existent ids', () => {
            expect(() => clearAborted('non-existent')).not.toThrow()
        })
    })

    describe('initAbortHandler', () => {
        it('is a function', () => {
            expect(typeof initAbortHandler).toBe('function')
        })
    })
})
