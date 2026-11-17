import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    setLocalOnlyMode,
    isLocalOnlyMode,
    onLocalOnlyModeChange,
} from '@/services/localOnlyModeService'

describe('localOnlyModeService', () => {
    beforeEach(() => {
        setLocalOnlyMode(false)
    })

    it('defaults to disabled', () => {
        expect(isLocalOnlyMode()).toBe(false)
    })

    it('enables local-only mode', () => {
        setLocalOnlyMode(true)
        expect(isLocalOnlyMode()).toBe(true)
    })

    it('disables local-only mode after enabling', () => {
        setLocalOnlyMode(true)
        expect(isLocalOnlyMode()).toBe(true)
        setLocalOnlyMode(false)
        expect(isLocalOnlyMode()).toBe(false)
    })

    it('handles repeated enables without error', () => {
        setLocalOnlyMode(true)
        setLocalOnlyMode(true)
        expect(isLocalOnlyMode()).toBe(true)
    })
})

describe('localOnlyModeService change listeners', () => {
    beforeEach(() => {
        setLocalOnlyMode(false)
    })

    it('notifies only on a real change and stops after unsubscribing', () => {
        const seen: boolean[] = []
        const unsubscribe = onLocalOnlyModeChange((enabled) => seen.push(enabled))
        setLocalOnlyMode(false)
        setLocalOnlyMode(true)
        setLocalOnlyMode(true)
        setLocalOnlyMode(false)
        unsubscribe()
        setLocalOnlyMode(true)
        expect(seen).toEqual([true, false])
    })

    it('a failing listener does not stop the others or the change', () => {
        const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
        const seen: boolean[] = []
        const first = onLocalOnlyModeChange(() => {
            throw new Error('boom')
        })
        const second = onLocalOnlyModeChange((enabled) => seen.push(enabled))
        setLocalOnlyMode(true)
        expect(isLocalOnlyMode()).toBe(true)
        expect(seen).toEqual([true])
        first()
        second()
        debug.mockRestore()
    })
})
