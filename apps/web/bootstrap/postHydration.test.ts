import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { runPostHydrationServices } from './postHydration'
import { createAppStoreSync } from '@/stores/store'
import { releaseWriteHold } from '@/services/desktopLifecycleService'
import type { AppStore } from '@/stores/store'
import settingsReducer, { setSetting } from '@/stores/slices/settingsSlice'
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
const platformMocks = vi.hoisted(() => ({
    isTauri: false,
    listen: vi.fn(),
    invoke: vi.fn(),
    order: [] as string[],
}))

vi.mock('@/services/strainService', () => ({
    strainService: { init: () => mockStrainInit() },
}))

vi.mock('@/services/ttsService', () => ({
    ttsService: { init: () => mockTtsInit() },
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
    startBackgroundPrecomputation: (...args: unknown[]) =>
        mockStartBackgroundPrecomputation(...args),
}))

vi.mock('@/services/platformService', () => ({
    platform: {
        get isTauri() {
            return platformMocks.isTauri
        },
    },
}))

vi.mock('@tauri-apps/api/event', () => ({
    listen: platformMocks.listen,
}))

vi.mock('@tauri-apps/api/core', () => ({
    invoke: platformMocks.invoke,
    Channel: class {},
}))

vi.mock('@/services/offlineActionReplayService', () => ({
    registerOfflineActionReplayListener: vi.fn(),
}))

vi.mock('@/i18n', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/i18n')>()
    return {
        ...actual,
        changeAppLanguage: vi.fn().mockResolvedValue(undefined),
    }
})

const createTestStore = (): AppStore =>
    configureStore({
        reducer: combineReducers({
            settings: settingsReducer,
            simulation: simulationReducer,
        }),
    }) as unknown as AppStore

// A quit's write hold must not leak into the next test's quit or final save.
afterEach(() => releaseWriteHold())

describe('runPostHydrationServices', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockLoadPersistedPassword.mockReset()
        mockLoadPersistedPassword.mockResolvedValue(undefined)
        platformMocks.isTauri = false
        platformMocks.listen.mockReset()
        platformMocks.invoke.mockReset()
        platformMocks.order.length = 0
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
        expect(mockSetAppReady).toHaveBeenCalledWith(true)
        expect(document.body.getAttribute('data-app-ready')).toBe('true')
        expect(mockSetAiMode).toHaveBeenCalled()
        expect(mockMqttInit).toHaveBeenCalledWith(store)
        expect(mockProactiveInit).toHaveBeenCalledWith(store)
        // The offline-model preload is opt-in (localAi.autoPreloadOnStartup,
        // default false), so boot must NOT start a multi-hundred-megabyte
        // download. See the dedicated cases below for both directions.
        expect(mockScheduleIdlePreload).not.toHaveBeenCalled()
        expect(mockStartBackgroundPrecomputation).toHaveBeenCalled()
        expect(mockSetAppReady).toHaveBeenCalledWith(true)
        expect(document.body.getAttribute('data-app-ready')).toBe('true')
    })

    it.each([false, true])(
        'restores the saved Local-Only setting before any service starts (local-only: %s)',
        async (localOnly) => {
            const { isLocalOnlyMode, setLocalOnlyMode } =
                await import('@/services/localOnlyModeService')
            setLocalOnlyMode(!localOnly)
            const store = createTestStore()
            if (localOnly)
                store.dispatch(setSetting({ path: 'privacy.localOnlyMode', value: true }))
            await runPostHydrationServices(store)
            expect(isLocalOnlyMode()).toBe(localOnly)
        },
    )

    it('does not preload offline models when the opt-in is off (default)', async () => {
        const store = createTestStore()
        await runPostHydrationServices(store)
        expect(mockScheduleIdlePreload).not.toHaveBeenCalled()
    })

    it('preloads offline models once the user opts in', async () => {
        const store = createTestStore()
        store.dispatch(setSetting({ path: 'localAi.autoPreloadOnStartup', value: true }))
        await runPostHydrationServices(store)
        expect(mockScheduleIdlePreload).toHaveBeenCalled()
    })

    /** Holds a save open until the test releases it. */
    const saveGate = (() => {
        let held: Promise<void> | null = null
        let release: () => void = () => undefined
        return {
            hold: () => {
                held = new Promise<void>((resolve) => (release = resolve))
            },
            release: () => {
                release()
                held = null
            },
            wait: () => held ?? Promise.resolve(),
        }
    })()

    /** Collects the Tauri event listeners by event name. */
    const captureListeners = (onListen?: (event: string) => void) => {
        const listeners = new Map<string, () => Promise<void>>()
        platformMocks.listen.mockImplementation(
            async (event: string, callback: () => Promise<void>) => {
                onListen?.(event)
                listeners.set(event, callback)
                return () => {}
            },
        )
        return listeners
    }

    it('routes the Tauri before-quit flush through the coordinated persistence path', async () => {
        // The real store: the desktop save compares every slice a snapshot writes.
        const store = createAppStoreSync()
        const flushPersistedState = vi.fn().mockResolvedValue(true)
        platformMocks.isTauri = true
        const listeners = captureListeners()

        await runPostHydrationServices(store, flushPersistedState)
        await listeners.get('tauri://before-quit')?.()

        expect(platformMocks.listen).toHaveBeenCalledWith(
            'tauri://before-quit',
            expect.any(Function),
        )
        expect(flushPersistedState).toHaveBeenCalledOnce()
    })

    it('registers the quit listener before slower startup work and confirms only after the save', async () => {
        // The real store: the desktop save compares every slice a snapshot writes.
        const store = createAppStoreSync()
        const flushPersistedState = vi.fn(async () => {
            platformMocks.order.push('save')
            await saveGate.wait()
            return true
        })
        platformMocks.isTauri = true
        const listeners = captureListeners((event) => platformMocks.order.push(`listen ${event}`))
        mockStrainInit.mockImplementation(async () => {
            platformMocks.order.push('strains')
        })
        platformMocks.invoke.mockImplementation(async (command: string) => {
            platformMocks.order.push(command)
        })

        await runPostHydrationServices(store, flushPersistedState)
        // CodeAnt on #878: a quit during the slower startup steps found no listener.
        expect(platformMocks.order.indexOf('listen tauri://before-quit')).toBeLessThan(
            platformMocks.order.indexOf('strains'),
        )

        // The listener must wait for the save, not only start it (CodeRabbit on #878).
        platformMocks.order.length = 0
        saveGate.hold()
        const quitting = listeners.get('tauri://before-quit')?.()
        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(platformMocks.order).toEqual(['save'])
        saveGate.release()
        await quitting
        expect(platformMocks.order).toEqual(['save', 'confirm_quit'])
    })

    it('saves once more right before an install restarts the app, then lets update.rs go on', async () => {
        // CodeRabbit and CodeAnt on #878: an edit made while the install ran was in no
        // earlier save. update.rs now waits for this confirmation before the restart.
        // The real store: the desktop save compares every slice a snapshot writes.
        const store = createAppStoreSync()
        const flushPersistedState = vi.fn(async () => {
            platformMocks.order.push('save')
            await saveGate.wait()
            return true
        })
        platformMocks.isTauri = true
        const listeners = captureListeners()
        platformMocks.invoke.mockImplementation(async (command: string) => {
            platformMocks.order.push(command)
        })

        await runPostHydrationServices(store, flushPersistedState)
        const finalSave = listeners.get('cannaguide://save-before-restart')
        expect(finalSave).toBeDefined()
        platformMocks.order.length = 0
        saveGate.hold()
        const saving = finalSave?.()
        await new Promise((resolve) => setTimeout(resolve, 0))
        expect(platformMocks.order).toEqual(['save'])
        saveGate.release()
        await saving
        expect(platformMocks.order).toEqual(['save', 'confirm_final_save'])
    })
})
