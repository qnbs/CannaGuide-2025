import { describe, it, expect, beforeEach } from 'vitest'
import { detectPlatform } from '@/services/nativeBridgeService'

describe('nativeBridgeService', () => {
    describe('detectPlatform', () => {
        beforeEach(() => {
            delete (window as unknown as Record<string, unknown>)['__TAURI_INTERNALS__']
            delete (window as unknown as Record<string, unknown>)['Capacitor']
        })

        it('returns "web" by default', () => {
            expect(detectPlatform()).toBe('web')
        })

        it('detects Tauri when __TAURI_INTERNALS__ is present', () => {
            ;(window as unknown as Record<string, unknown>)['__TAURI_INTERNALS__'] = {}
            expect(detectPlatform()).toBe('tauri')
        })

        it('detects Capacitor when Capacitor.isNativePlatform() returns true', () => {
            ;(window as unknown as Record<string, unknown>)['Capacitor'] = {
                isNativePlatform: () => true,
            }
            expect(detectPlatform()).toBe('capacitor')
        })

        it('prefers Tauri over Capacitor when both are present', () => {
            ;(window as unknown as Record<string, unknown>)['__TAURI_INTERNALS__'] = {}
            ;(window as unknown as Record<string, unknown>)['Capacitor'] = {
                isNativePlatform: () => true,
            }
            expect(detectPlatform()).toBe('tauri')
        })

        it('returns "web" when Capacitor exists but isNativePlatform is false', () => {
            ;(window as unknown as Record<string, unknown>)['Capacitor'] = {
                isNativePlatform: () => false,
            }
            expect(detectPlatform()).toBe('web')
        })
    })
})
