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

    it('cooldown prevents duplicate alerts for same metric within 2 hours', async () => {
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')

        let callCount = 0
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
                                    co2Level: 400,
                                },
                                medium: { ph: 6.2, ec: 1.5, moisture: 60 },
                            },
                        },
                        ids: ['p1'],
                    },
                },
                grows: { grows: { entities: {} } },
            }),
            subscribe: vi.fn((cb: () => void) => {
                // Call subscriber twice to trigger two evaluations
                cb()
                callCount++
                if (callCount < 2) {
                    setTimeout(() => cb(), 3000)
                }
                return () => undefined
            }),
        }

        proactiveCoachService.init(mockStore as never)

        // First evaluation - should generate alert
        await vi.advanceTimersByTimeAsync(2500)
        const firstAlertCount = useAlertsStore.getState().alerts.length

        // Second evaluation (3s later, still within 2h cooldown) - should NOT add another
        await vi.advanceTimersByTimeAsync(3500)
        const secondAlertCount = useAlertsStore.getState().alerts.length

        // Cooldown should prevent duplicate temperature alert for same plant
        expect(secondAlertCount).toBe(firstAlertCount)

        proactiveCoachService.dispose()
    })

    it('detects humidity breach', async () => {
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')
        const { useAlertsStore: freshAlertsStore } = await import('@/stores/useAlertsStore')

        const mockStore = {
            getState: () => ({
                simulation: {
                    plants: {
                        entities: {
                            p1: {
                                id: 'p1',
                                name: 'Humid Plant',
                                environment: {
                                    internalTemperature: 24,
                                    internalHumidity: 90,
                                    vpd: 1.0,
                                    co2Level: 400,
                                },
                                medium: { ph: 6.2, ec: 1.5, moisture: 60 },
                            },
                        },
                        ids: ['p1'],
                    },
                },
                grows: { grows: { entities: {} } },
            }),
            subscribe: vi.fn((cb: () => void) => {
                cb()
                return () => undefined
            }),
        }

        proactiveCoachService.init(mockStore as never)
        await vi.advanceTimersByTimeAsync(2500)

        const alerts = freshAlertsStore.getState().alerts
        expect(alerts.length).toBeGreaterThanOrEqual(1)
        expect(alerts.some((a) => a.metric === 'humidity')).toBe(true)

        proactiveCoachService.dispose()
    })

    it('detects VPD breach', async () => {
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')
        const { useAlertsStore: freshAlertsStore } = await import('@/stores/useAlertsStore')

        const mockStore = {
            getState: () => ({
                simulation: {
                    plants: {
                        entities: {
                            p1: {
                                id: 'p1',
                                name: 'VPD Plant',
                                environment: {
                                    internalTemperature: 24,
                                    internalHumidity: 55,
                                    vpd: 2.5,
                                    co2Level: 400,
                                },
                                medium: { ph: 6.2, ec: 1.5, moisture: 60 },
                            },
                        },
                        ids: ['p1'],
                    },
                },
                grows: { grows: { entities: {} } },
            }),
            subscribe: vi.fn((cb: () => void) => {
                cb()
                return () => undefined
            }),
        }

        proactiveCoachService.init(mockStore as never)
        await vi.advanceTimersByTimeAsync(2500)

        const alerts = freshAlertsStore.getState().alerts
        expect(alerts.some((a) => a.metric === 'vpd')).toBe(true)

        proactiveCoachService.dispose()
    })

    it('detects pH breach', async () => {
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')
        const { useAlertsStore: freshAlertsStore } = await import('@/stores/useAlertsStore')

        const mockStore = {
            getState: () => ({
                simulation: {
                    plants: {
                        entities: {
                            p1: {
                                id: 'p1',
                                name: 'Acidic Plant',
                                environment: {
                                    internalTemperature: 24,
                                    internalHumidity: 55,
                                    vpd: 1.0,
                                    co2Level: 400,
                                },
                                medium: { ph: 3.5, ec: 1.5, moisture: 60 },
                            },
                        },
                        ids: ['p1'],
                    },
                },
                grows: { grows: { entities: {} } },
            }),
            subscribe: vi.fn((cb: () => void) => {
                cb()
                return () => undefined
            }),
        }

        proactiveCoachService.init(mockStore as never)
        await vi.advanceTimersByTimeAsync(2500)

        const alerts = freshAlertsStore.getState().alerts
        expect(alerts.some((a) => a.metric === 'ph')).toBe(true)

        proactiveCoachService.dispose()
    })

    it('detects EC breach', async () => {
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')
        const { useAlertsStore: freshAlertsStore } = await import('@/stores/useAlertsStore')

        const mockStore = {
            getState: () => ({
                simulation: {
                    plants: {
                        entities: {
                            p1: {
                                id: 'p1',
                                name: 'Salty Plant',
                                environment: {
                                    internalTemperature: 24,
                                    internalHumidity: 55,
                                    vpd: 1.0,
                                    co2Level: 400,
                                },
                                medium: { ph: 6.2, ec: 5.0, moisture: 60 },
                            },
                        },
                        ids: ['p1'],
                    },
                },
                grows: { grows: { entities: {} } },
            }),
            subscribe: vi.fn((cb: () => void) => {
                cb()
                return () => undefined
            }),
        }

        proactiveCoachService.init(mockStore as never)
        await vi.advanceTimersByTimeAsync(2500)

        const alerts = freshAlertsStore.getState().alerts
        expect(alerts.some((a) => a.metric === 'ec')).toBe(true)

        proactiveCoachService.dispose()
    })

    it('handles plants with missing grows gracefully', async () => {
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')

        const mockStore = {
            getState: () => ({
                simulation: {
                    plants: {
                        entities: {
                            p1: {
                                id: 'p1',
                                name: 'Orphan Plant',
                                growId: 'nonexistent-grow',
                                environment: {
                                    internalTemperature: 35,
                                    internalHumidity: 55,
                                    vpd: 1.0,
                                    co2Level: 400,
                                },
                                medium: { ph: 6.2, ec: 1.5, moisture: 60 },
                            },
                        },
                        ids: ['p1'],
                    },
                },
                grows: { grows: { entities: {} } },
            }),
            subscribe: vi.fn((cb: () => void) => {
                cb()
                return () => undefined
            }),
        }

        // Should not throw with a missing grow entity
        proactiveCoachService.init(mockStore as never)
        await vi.advanceTimersByTimeAsync(2500)

        proactiveCoachService.dispose()
    })

    it('handles AI advice failure gracefully', async () => {
        // Override the aiFacade mock for this test
        const { aiService } = await import('@/services/aiFacade')
        vi.mocked(aiService.getPlantAdvice).mockRejectedValueOnce(new Error('AI unavailable'))

        const { proactiveCoachService } = await import('@/services/proactiveCoachService')

        const mockStore = {
            getState: () => ({
                simulation: {
                    plants: {
                        entities: {
                            p1: {
                                id: 'p1',
                                name: 'Error Plant',
                                environment: {
                                    internalTemperature: 35,
                                    internalHumidity: 55,
                                    vpd: 1.0,
                                    co2Level: 400,
                                },
                                medium: { ph: 6.2, ec: 1.5, moisture: 60 },
                            },
                        },
                        ids: ['p1'],
                    },
                },
                grows: { grows: { entities: {} } },
            }),
            subscribe: vi.fn((cb: () => void) => {
                cb()
                return () => undefined
            }),
        }

        proactiveCoachService.init(mockStore as never)
        // Should not throw even when AI fails
        await vi.advanceTimersByTimeAsync(2500)

        proactiveCoachService.dispose()
    })
})
