import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    isEcoMode,
    setEcoModeExplicit,
    registerModeAccessors,
    detectEcoCondition,
    applyAdaptiveMode,
} from './ecoModeService'

describe('aiEcoModeService', () => {
    beforeEach(() => {
        setEcoModeExplicit(false)
        registerModeAccessors(
            () => 'hybrid',
            () => {},
        )
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
        it('returns false when navigator has sufficient memory', async () => {
            Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true })
            const result = await detectEcoCondition()
            expect(result).toBe(false)
        })

        it('returns true when device has low memory', async () => {
            Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true })
            const result = await detectEcoCondition()
            expect(result).toBe(true)
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

        it('switches to eco when hybrid and low resources detected', async () => {
            Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true })
            const setter = vi.fn()
            registerModeAccessors(() => 'hybrid', setter)
            await applyAdaptiveMode()
            expect(setter).toHaveBeenCalledWith('eco')
            expect(isEcoMode()).toBe(true)
        })

        it('does not switch when hybrid with sufficient resources', async () => {
            Object.defineProperty(navigator, 'deviceMemory', { value: 8, configurable: true })
            const setter = vi.fn()
            registerModeAccessors(() => 'hybrid', setter)
            await applyAdaptiveMode()
            expect(setter).not.toHaveBeenCalled()
        })
    })
})
