import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAlertsStore } from '@/stores/useAlertsStore'

// Mock AI facade
vi.mock('@/services/aiFacade', () => ({
    aiService: {
        getPlantAdvice: vi.fn().mockResolvedValue({ content: 'Lower temperature to 25C' }),
    },
}))

// Mock native bridge
vi.mock('@/services/nativeBridgeService', () => ({
    sendNotification: vi.fn().mockResolvedValue(undefined),
}))

// Mock secure random
vi.mock('@/utils/random', () => ({
    secureRandom: () => 0.42,
}))

describe('proactiveCoachService', () => {
    beforeEach(() => {
        useAlertsStore.getState().clearAlerts()
        vi.useFakeTimers()
    })

    afterEach(async () => {
        vi.useRealTimers()
        // Reset modules to clear module-level state (cooldownMap, pendingCalls)
        vi.resetModules()
    })

    it('alerts when temperature exceeds threshold', async () => {
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')

        const mockStore = {
            getState: () => ({
                simulation: {
                    plants: {
                        entities: {
                            p1: {
                                id: 'p1',
                                name: 'Hot Plant',
                                environment: {
                                    internalTemperature: 35,
                                    internalHumidity: 55,
                                    vpd: 1.0,
                                    co2: 400,
                                    lightIntensityPar: 600,
                                    lightIntensityLux: 30000,
                                    lightHoursPerDay: 18,
                                    lightSpectrumDescription: 'LED',
                                },
                                medium: { type: 'soil', ph: 6.2, ec: 1.5, waterTemperature: 22 },
                            },
                        },
                        ids: ['p1'],
                    },
                },
            }),
            subscribe: vi.fn((cb: () => void) => {
                cb()
                return () => undefined
            }),
        }

        proactiveCoachService.init(mockStore as never)
        await vi.advanceTimersByTimeAsync(2500)

        const alerts = useAlertsStore.getState().alerts
        expect(alerts.length).toBeGreaterThanOrEqual(1)
        expect(alerts[0]!.metric).toBe('temperature')
        expect(alerts[0]!.plantId).toBe('p1')

        proactiveCoachService.dispose()
    })

    it('does not alert when values are within range', async () => {
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')

        const mockStore = {
            getState: () => ({
                simulation: {
                    plants: {
                        entities: {
                            p1: {
                                id: 'p1',
                                name: 'Happy Plant',
                                environment: {
                                    internalTemperature: 24,
                                    internalHumidity: 55,
                                    vpd: 1.0,
                                    co2: 400,
                                    lightIntensityPar: 600,
                                    lightIntensityLux: 30000,
                                    lightHoursPerDay: 18,
                                    lightSpectrumDescription: 'LED',
                                },
                                medium: { type: 'soil', ph: 6.2, ec: 1.5, waterTemperature: 22 },
                            },
                        },
                        ids: ['p1'],
                    },
                },
            }),
            subscribe: vi.fn((cb: () => void) => {
                cb()
                return () => undefined
            }),
        }

        proactiveCoachService.init(mockStore as never)
        await vi.advanceTimersByTimeAsync(2500)

        expect(useAlertsStore.getState().alerts).toHaveLength(0)
        proactiveCoachService.dispose()
    })

    it('prevents double init', async () => {
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')

        const subscribeFn = vi.fn(() => () => undefined)
        const mockStore = {
            getState: () => ({
                simulation: { plants: { entities: {}, ids: [] } },
            }),
            subscribe: subscribeFn,
        }

        proactiveCoachService.init(mockStore as never)
        proactiveCoachService.init(mockStore as never)

        expect(subscribeFn).toHaveBeenCalledTimes(1)
        proactiveCoachService.dispose()
    })

    it('dispose unsubscribes from store', async () => {
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')

        const unsubFn = vi.fn()
        const mockStore = {
            getState: () => ({
                simulation: { plants: { entities: {}, ids: [] } },
            }),
            subscribe: vi.fn(() => unsubFn),
        }

        proactiveCoachService.init(mockStore as never)
        proactiveCoachService.dispose()

        expect(unsubFn).toHaveBeenCalled()
    })

    it('handles empty plant list without errors', async () => {
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')

        const mockStore = {
            getState: () => ({
                simulation: { plants: { entities: {}, ids: [] } },
            }),
            subscribe: vi.fn((cb: () => void) => {
                cb()
                return () => undefined
            }),
        }

        proactiveCoachService.init(mockStore as never)
        await vi.advanceTimersByTimeAsync(2500)

        expect(useAlertsStore.getState().alerts).toHaveLength(0)
        proactiveCoachService.dispose()
    })
})
