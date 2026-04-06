import { describe, it, expect } from 'vitest'
import { detectPlatform } from '@/services/nativeBridgeService'

describe('nativeBridgeService', () => {
    describe('detectPlatform', () => {
        it('always returns "web"', () => {
            expect(detectPlatform()).toBe('web')
        })
    })
})
