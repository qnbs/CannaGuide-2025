import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { Sentry } from '@/services/sentryService'
import { runPostHydrationServices } from './postHydration'
import settingsReducer from '@/stores/slices/settingsSlice'
import simulationReducer from '@/stores/slices/simulationSlice'

const mockStrainInit = vi.fn().mockResolvedValue(undefined)
const mockTtsInit = vi.fn()
const mockSetAiMode = vi.fn()
const mockMqttInit = vi.fn()
const mockLoadPersistedPassword = vi.fn().mockResolvedValue(undefined)
const mockInitWorkers = vi.fn().mockResolvedValue(undefined)
const mockProactiveInit = vi.fn()
const mockRequestNotification = vi.fn()
const mockScheduleIdlePreload = vi.fn()
const mockStartBackgroundPrecomputation = vi.fn()
const mockSetAppReady = vi.fn()

vi.mock('@/services/strainService', () => ({
    strainService: { init: () => mockStrainInit() },
}))

vi.mock('@/services/ttsService', () => ({
    ttsService: { init: () => mockTtsInit() },
}))

vi.mock('@/services/sentryService', () => ({
    Sentry: { captureException: vi.fn() },
}))

vi.mock('@/stores/useUIStore', () => ({
    getUISnapshot: () => ({ setAppReady: mockSetAppReady }),
}))

vi.mock('@/services/aiService', () => ({
    setAiMode: (...args: unknown[]) => mockSetAiMode(...args),
}))

vi.mock('@/services/mqttClientService', () => ({
    mqttClientService: { init: (...args: unknown[]) => mockMqttInit(...args) },
}))

vi.mock('@/stores/useIotStore', () => ({
    useIotStore: {
        getState: () => ({ loadPersistedPassword: () => mockLoadPersistedPassword() }),
    },
}))

vi.mock('./workers', () => ({
    initializeWorkerInfrastructure: (...args: unknown[]) => mockInitWorkers(...args),
}))

vi.mock('@/services/proactiveCoachService', () => ({
    proactiveCoachService: { init: (...args: unknown[]) => mockProactiveInit(...args) },
}))

vi.mock('@/services/nativeBridgeService', () => ({
    requestNotificationPermission: () => mockRequestNotification(),
}))

vi.mock('@/services/local-ai', () => ({
    localAiPreloadService: { scheduleIdlePreload: () => mockScheduleIdlePreload() },
    startBackgroundPrecomputation: (...args: unknown[]) => mockStartBackgroundPrecomputation(...args),
}))

vi.mock('@/services/platformService', () => ({
    platform: { isTauri: false },
}))

const createTestStore = () =>
    configureStore({
        reducer: combineReducers({
            settings: settingsReducer,
            simulation: simulationReducer,
        }),
    })

describe('runPostHydrationServices', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        document.body.removeAttribute('data-app-ready')
    })

    it('initializes blocking services before parallel imports', async () => {
        const store = createTestStore()
        const callOrder: string[] = []

        mockStrainInit.mockImplementation(async () => {
            callOrder.push('strain')
        })
        mockTtsInit.mockImplementation(() => {
            callOrder.push('tts')
        })
        mockInitWorkers.mockImplementation(async () => {
            callOrder.push('workers')
        })

        await runPostHydrationServices(store)

        expect(callOrder.indexOf('strain')).toBeLessThan(callOrder.indexOf('workers'))
        expect(callOrder.indexOf('tts')).toBeLessThan(callOrder.indexOf('workers'))
        expect(mockSetAiMode).toHaveBeenCalled()
        expect(mockMqttInit).toHaveBeenCalledWith(store)
        expect(mockProactiveInit).toHaveBeenCalledWith(store)
        expect(mockScheduleIdlePreload).toHaveBeenCalled()
        expect(mockStartBackgroundPrecomputation).toHaveBeenCalled()
        expect(mockSetAppReady).toHaveBeenCalledWith(true)
        expect(document.body.getAttribute('data-app-ready')).toBe('true')
    })

    it('captures Sentry when loadPersistedPassword fails', async () => {
        const store = createTestStore()
        mockLoadPersistedPassword.mockRejectedValueOnce(new Error('iot load failed'))

        await runPostHydrationServices(store)

        expect(Sentry.captureException).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({ extra: { context: 'postHydration:loadPersistedPassword' } }),
        )
    })
})
