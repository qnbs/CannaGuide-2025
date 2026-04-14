import { describe, it, expect } from 'vitest'
import { detectPlatform } from '@/services/nativeBridgeService'

describe('nativeBridgeService', () => {
    describe('detectPlatform', () => {
        it('returns "web" when not in Tauri or PWA context', () => {
            expect(detectPlatform()).toBe('web')
        })
    })
})
