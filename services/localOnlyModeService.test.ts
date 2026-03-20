import { describe, it, expect, beforeEach } from 'vitest'
import { setLocalOnlyMode, isLocalOnlyMode } from '@/services/localOnlyModeService'

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
