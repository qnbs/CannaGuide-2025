import { describe, it, expect, vi, afterEach } from 'vitest'
import {
    getDeviceConcurrencyLimit,
    getAdaptiveConcurrencyLimit,
    MIN_CONCURRENCY,
    MAX_CONCURRENCY,
} from './deviceCapabilities'

describe('deviceCapabilities', () => {
    const originalHardwareConcurrency = navigator.hardwareConcurrency

    afterEach(() => {
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            value: originalHardwareConcurrency,
            configurable: true,
        })
    })

    describe('getDeviceConcurrencyLimit', () => {
        it('returns floor(cores * 0.6) for typical devices', () => {
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                value: 8,
                configurable: true,
            })
            // 8 * 0.6 = 4.8 -> floor = 4
            expect(getDeviceConcurrencyLimit()).toBe(4)
        })

        it('clamps to MIN_CONCURRENCY for low-core devices', () => {
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                value: 2,
                configurable: true,
            })
            // 2 * 0.6 = 1.2 -> floor = 1 -> clamped to MIN_CONCURRENCY (2)
            expect(getDeviceConcurrencyLimit()).toBe(MIN_CONCURRENCY)
        })

        it('clamps to MAX_CONCURRENCY for high-core devices', () => {
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                value: 64,
                configurable: true,
            })
            // 64 * 0.6 = 38.4 -> clamped to MAX_CONCURRENCY (12)
            expect(getDeviceConcurrencyLimit()).toBe(MAX_CONCURRENCY)
        })

        it('uses FALLBACK_CORES when hardwareConcurrency is undefined', () => {
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                value: undefined,
                configurable: true,
            })
            // fallback 4 * 0.6 = 2.4 -> floor = 2
            expect(getDeviceConcurrencyLimit()).toBe(2)
        })
    })

    describe('getAdaptiveConcurrencyLimit', () => {
        it('returns normal limit when battery API is not available', async () => {
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                value: 8,
                configurable: true,
            })
            // No getBattery -> returns normal limit
            const limit = await getAdaptiveConcurrencyLimit()
            expect(limit).toBe(4)
        })

        it('halves limit when battery is low', async () => {
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                value: 8,
                configurable: true,
            })
            const mockGetBattery = vi.fn().mockResolvedValue({
                level: 0.15,
                charging: false,
            })
            Object.defineProperty(navigator, 'getBattery', {
                value: mockGetBattery,
                configurable: true,
                writable: true,
            })

            const limit = await getAdaptiveConcurrencyLimit()
            // 4 / 2 = 2, clamped to MIN_CONCURRENCY
            expect(limit).toBe(MIN_CONCURRENCY)

            // Cleanup
            Object.defineProperty(navigator, 'getBattery', {
                value: undefined,
                configurable: true,
                writable: true,
            })
        })

        it('does not halve limit when battery is charging', async () => {
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                value: 8,
                configurable: true,
            })
            const mockGetBattery = vi.fn().mockResolvedValue({
                level: 0.1,
                charging: true,
            })
            Object.defineProperty(navigator, 'getBattery', {
                value: mockGetBattery,
                configurable: true,
                writable: true,
            })

            const limit = await getAdaptiveConcurrencyLimit()
            expect(limit).toBe(4) // not halved because charging

            Object.defineProperty(navigator, 'getBattery', {
                value: undefined,
                configurable: true,
                writable: true,
            })
        })
    })
})
