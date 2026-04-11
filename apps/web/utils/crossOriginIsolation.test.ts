import { describe, it, expect } from 'vitest'
import {
    isCrossOriginIsolated,
    canUseSharedArrayBuffer,
    getCrossOriginIsolationStatus,
} from './crossOriginIsolation'

describe('crossOriginIsolation', () => {
    describe('isCrossOriginIsolated', () => {
        it('returns false when self.crossOriginIsolated is false', () => {
            // In test environment, crossOriginIsolated is typically false/undefined
            expect(isCrossOriginIsolated()).toBe(false)
        })
    })

    describe('canUseSharedArrayBuffer', () => {
        it('returns false when not cross-origin isolated', () => {
            // SAB constructor may exist but isolation is required
            expect(canUseSharedArrayBuffer()).toBe(false)
        })
    })

    describe('getCrossOriginIsolationStatus', () => {
        it('returns a complete status object', () => {
            const status = getCrossOriginIsolationStatus()
            expect(status).toHaveProperty('isolated')
            expect(status).toHaveProperty('sabAvailable')
            expect(status).toHaveProperty('atomicsAvailable')
            expect(status).toHaveProperty('canUseLockFree')
            expect(typeof status.isolated).toBe('boolean')
            expect(typeof status.sabAvailable).toBe('boolean')
            expect(typeof status.atomicsAvailable).toBe('boolean')
            expect(typeof status.canUseLockFree).toBe('boolean')
        })

        it('canUseLockFree is false when not isolated', () => {
            const status = getCrossOriginIsolationStatus()
            expect(status.canUseLockFree).toBe(false)
        })
    })
})
