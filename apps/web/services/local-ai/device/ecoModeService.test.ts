import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    isEcoMode,
    setEcoModeExplicit,
    registerModeAccessors,
    detectEcoCondition,
    detectBatteryRecovered,
    applyAdaptiveMode,
    registerEcoCallbacks,
    isCriticalBattery,
    _resetNotificationFlags,
} from './ecoModeService'

describe('aiEcoModeService', () => {
    let originalGetBattery: unknown

    beforeEach(() => {
        setEcoModeExplicit(false)
        _resetNotificationFlags()
        registerModeAccessors(
            () => 'hybrid',
            () => {},
        )
        // Store original getBattery
        const nav = navigator as unknown as {
            getBattery?: () => Promise<{ level: number; charging: boolean }>
        }
        originalGetBattery = nav.getBattery
    })

    afterEach(() => {
        // Restore original getBattery
        const nav = navigator as unknown as {
            getBattery?: () => Promise<{ level: number; charging: boolean }>
        }
        if (originalGetBattery !== undefined) {
            nav.getBattery = originalGetBattery as () => Promise<{
                level: number
                charging: boolean
            }>
        } else {
            delete nav.getBattery
        }
    })

    it('defaults to eco mode disabled', () => {
        expect(isEcoMode()).toBe(false)
    })

    it('enables eco mode explicitly', () => {
        setEcoModeExplicit(true)
        expect(isEcoMode()).toBe(true)
    })

    it('disables eco mode explicitly', () => {
        setEcoModeExplicit(true)
        setEcoModeExplicit(false)
        expect(isEcoMode()).toBe(false)
    })

    describe('detectEcoCondition', () => {
        it('returns false when battery is sufficient', async () => {
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            nav.getBattery = () => Promise.resolve({ level: 0.5, charging: false })
            const result = await detectEcoCondition()
            expect(result).toBe(false)
        })

        it('returns true when battery is low (<25%) and not charging', async () => {
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            nav.getBattery = () => Promise.resolve({ level: 0.2, charging: false })
            const result = await detectEcoCondition()
            expect(result).toBe(true)
        })

        it('returns false when battery is low but charging', async () => {
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            nav.getBattery = () => Promise.resolve({ level: 0.2, charging: true })
            const result = await detectEcoCondition()
            expect(result).toBe(false)
        })

        it('returns false when Battery API is unavailable', async () => {
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            delete nav.getBattery
            const result = await detectEcoCondition()
            expect(result).toBe(false)
        })
    })

    describe('detectBatteryRecovered', () => {
        it('returns true when battery is above 30%', async () => {
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            nav.getBattery = () => Promise.resolve({ level: 0.35, charging: false })
            const result = await detectBatteryRecovered()
            expect(result).toBe(true)
        })

        it('returns true when charging regardless of level', async () => {
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            nav.getBattery = () => Promise.resolve({ level: 0.15, charging: true })
            const result = await detectBatteryRecovered()
            expect(result).toBe(true)
        })

        it('returns false when battery is still low and not charging', async () => {
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            nav.getBattery = () => Promise.resolve({ level: 0.2, charging: false })
            const result = await detectBatteryRecovered()
            expect(result).toBe(false)
        })
    })

    describe('applyAdaptiveMode', () => {
        it('does not switch mode when current mode is not hybrid', async () => {
            const setter = vi.fn()
            registerModeAccessors(() => 'cloud', setter)
            await applyAdaptiveMode()
            expect(setter).not.toHaveBeenCalled()
            expect(isEcoMode()).toBe(false)
        })

        it('switches to eco when hybrid and low battery detected', async () => {
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            nav.getBattery = () => Promise.resolve({ level: 0.2, charging: false })
            const setter = vi.fn()
            registerModeAccessors(() => 'hybrid', setter)
            await applyAdaptiveMode()
            expect(setter).toHaveBeenCalledWith('eco')
            expect(isEcoMode()).toBe(true)
        })

        it('does not switch when hybrid with sufficient battery', async () => {
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            nav.getBattery = () => Promise.resolve({ level: 0.5, charging: false })
            const setter = vi.fn()
            registerModeAccessors(() => 'hybrid', setter)
            await applyAdaptiveMode()
            expect(setter).not.toHaveBeenCalled()
        })

        it('deactivates eco when battery recovers (auto-activated only)', async () => {
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            // First: trigger low battery eco activation
            nav.getBattery = () => Promise.resolve({ level: 0.2, charging: false })
            let currentMode = 'hybrid'
            const setter = vi.fn((mode: string) => {
                currentMode = mode
            })
            registerModeAccessors(() => currentMode, setter)
            await applyAdaptiveMode()
            expect(setter).toHaveBeenCalledWith('eco')
            expect(isEcoMode()).toBe(true)

            // Then: battery recovers (do NOT reset flags -- _ecoAutoActivated must stay true)
            nav.getBattery = () => Promise.resolve({ level: 0.35, charging: false })
            await applyAdaptiveMode()
            expect(setter).toHaveBeenLastCalledWith('hybrid')
            expect(isEcoMode()).toBe(false)
        })
    })

    describe('registerEcoCallbacks', () => {
        it('fires onBatteryGating when critical battery detected', async () => {
            const onGating = vi.fn()
            registerEcoCallbacks({ onBatteryGating: onGating })

            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            nav.getBattery = () => Promise.resolve({ level: 0.1, charging: false })
            registerModeAccessors(
                () => 'cloud',
                () => {},
            )
            // Reset critical state
            setEcoModeExplicit(false)
            await applyAdaptiveMode()
            expect(isCriticalBattery()).toBe(true)
            expect(onGating).toHaveBeenCalledWith(10)
            // Cleanup
            registerEcoCallbacks({})
        })

        it('fires onEcoAutoActivated when auto-switching to eco', async () => {
            const onEcoActivated = vi.fn()
            registerEcoCallbacks({ onEcoAutoActivated: onEcoActivated })
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            nav.getBattery = () => Promise.resolve({ level: 0.2, charging: false })
            const setter = vi.fn()
            registerModeAccessors(() => 'hybrid', setter)
            await applyAdaptiveMode()
            expect(onEcoActivated).toHaveBeenCalledOnce()
            // Cleanup
            registerEcoCallbacks({})
        })

        it('does not fire callbacks when not registered', async () => {
            registerEcoCallbacks({})
            const nav = navigator as unknown as {
                getBattery?: () => Promise<{ level: number; charging: boolean }>
            }
            nav.getBattery = () => Promise.resolve({ level: 0.2, charging: false })
            const setter = vi.fn()
            registerModeAccessors(() => 'hybrid', setter)
            // Should not throw
            await expect(applyAdaptiveMode()).resolves.toBeUndefined()
        })
    })
})
