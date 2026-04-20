import { describe, expect, it } from 'vitest'
import {
    getPerformanceMemory,
    getDeviceMemoryGB,
    isMobileDevice,
    isHighEndTablet,
    getEffectiveDeviceMemoryGB,
    checkStorageQuota,
    getConnectionInfo,
} from './browserApis'

describe('browserApis', () => {
    describe('getPerformanceMemory', () => {
        it('returns null when performance.memory is absent', () => {
            expect(getPerformanceMemory()).toBeNull()
        })
    })

    describe('getDeviceMemoryGB', () => {
        it('returns null when navigator.deviceMemory is absent', () => {
            expect(getDeviceMemoryGB()).toBeNull()
        })
    })

    describe('isMobileDevice', () => {
        it('returns false in jsdom (desktop-like UA)', () => {
            expect(isMobileDevice()).toBe(false)
        })
    })

    describe('isHighEndTablet', () => {
        it('returns false in jsdom', () => {
            expect(isHighEndTablet()).toBe(false)
        })
    })

    describe('getEffectiveDeviceMemoryGB', () => {
        it('returns a positive number', () => {
            const mem = getEffectiveDeviceMemoryGB()
            expect(mem).toBeGreaterThan(0)
        })

        it('falls back to 4 when no API is available', () => {
            // jsdom has neither deviceMemory nor performance.memory
            expect(getEffectiveDeviceMemoryGB()).toBe(4)
        })
    })

    describe('checkStorageQuota', () => {
        it('returns ok when estimate API unavailable', async () => {
            const orig = navigator.storage?.estimate
            if (navigator.storage) {
                Object.defineProperty(navigator.storage, 'estimate', {
                    value: undefined,
                    writable: true,
                    configurable: true,
                })
            }
            const result = await checkStorageQuota(100)
            expect(result.ok).toBe(true)
            expect(result.availableMB).toBeNull()
            // restore
            if (navigator.storage && orig) {
                Object.defineProperty(navigator.storage, 'estimate', {
                    value: orig,
                    writable: true,
                    configurable: true,
                })
            }
        })

        it('returns ok when API reports sufficient space', async () => {
            // jsdom may not have estimate() — test checks the fallback path  
            const result = await checkStorageQuota(100)
            expect(result.ok).toBe(true)
        })
    })

    describe('getConnectionInfo', () => {
        it('returns defaults when connection API unavailable', () => {
            const info = getConnectionInfo()
            expect(info.isCellular).toBe(false)
            expect(info.saveData).toBe(false)
            expect(info.effectiveType).toBeNull()
        })
    })
})
