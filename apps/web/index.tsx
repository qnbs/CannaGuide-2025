import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { App } from '@/components/views/plants/App'
import { createAppStore, createAppStoreSync, AppStore, RootState } from '@/stores/store'
import type { Plant } from '@/types'
import { i18nPromise, i18nInstance } from './i18n'
import { getUISnapshot } from './stores/useUIStore'
import { strainService } from './services/strainService'
import { initializeSimulation } from './stores/slices/simulationSlice'
import { ttsService } from './services/ttsService'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { indexedDBStorage } from './stores/indexedDBStorage'
import { REDUX_STATE_KEY, SLICE_SCHEMA_VERSIONS } from './constants'
import { workerBus } from './services/workerBus'
import { dbService } from './services/dbService'
import { growReminderService } from './services/growReminderService'
import { BootstrapConsentGate } from './components/common/BootstrapConsentGate'
import { consentService } from './services/consentService'
import { initSentry, Sentry } from './services/sentryService'

// Initialize Sentry as early as possible
initSentry()

const root = ReactDOM.createRoot(document.getElementById('root')!)
const SAFE_RECOVERY_ATTEMPT_KEY = 'cannaguide.safeRecoveryAttempted'

const triggerSafeRecovery = async (reason: string, error?: unknown): Promise<boolean> => {
    try {
        const alreadyAttempted = sessionStorage.getItem(SAFE_RECOVERY_ATTEMPT_KEY) === '1'
        if (alreadyAttempted) {
            return false
        }

        sessionStorage.setItem(SAFE_RECOVERY_ATTEMPT_KEY, '1')
        console.debug(`[SafeRecovery] Triggered by: ${reason}`, error)
        if (error instanceof Error) {
            Sentry.captureException(error, { tags: { recovery: reason } })
        }
        await indexedDBStorage.removeItem(REDUX_STATE_KEY)
        window.location.reload()
        return true
    } catch (recoveryError) {
        console.error('[SafeRecovery] Failed to reset persisted state.', recoveryError)
        return false
    }
}

const registerServiceWorker = () => {
    if (!('serviceWorker' in navigator)) {
        return
    }

    const baseUrl = import.meta.env.BASE_URL || '/'
    const scopeUrl = new URL(baseUrl, window.location.origin)
    const swUrl = new URL('sw.js', scopeUrl)

    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register(swUrl.pathname, { scope: scopeUrl.pathname, updateViaCache: 'none' })
            .then((registration) => {
                console.debug('ServiceWorker registration successful:', registration)
                void growReminderService.registerPeriodicSync(registration).catch((error) => {
                    console.debug('[SW] Could not register periodic reminder sync:', error)
                })

                // Only reload on SW update (not first install where controller is null)
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.addEventListener(
                        'controllerchange',
                        () => {
                            window.location.reload()
                        },
                        { once: true },
                    )
                }

                const dispatchSwUpdate = () => {
                    const event = new CustomEvent('swUpdate', { detail: registration })
                    window.dispatchEvent(event)
                    // Fallback: also tell the waiting SW to skip waiting
                    registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
                }

                if (registration.waiting && navigator.serviceWorker.controller) {
                    dispatchSwUpdate()
                }

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (
                                newWorker.state === 'installed' &&
                                navigator.serviceWorker.controller
                            ) {
                                dispatchSwUpdate()
                                console.debug(
                                    '[SW] New content is available and will be used when all tabs for this page are closed. Firing swUpdate event.',
                                )
                            }
                        })
                    }
                })

                const triggerUpdateCheck = () => {
                    registration.update().catch((error) => {
                        console.debug('[SW] Update check failed:', error)
                    })
                }

                triggerUpdateCheck()
                window.setInterval(triggerUpdateCheck, 5 * 60 * 1000)
                window.addEventListener('focus', triggerUpdateCheck)
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        triggerUpdateCheck()
                    }
                })
            })
            .catch((error) => {
                console.error('ServiceWorker registration failed:', error)
            })
    })
}

const renderError = (error: Error) => {
    root.render(
        <div style={{ padding: '2rem', color: '#f87171', textAlign: 'center' }}>
            <h1>Application Error</h1>
            <p>Could not start the application due to a critical error:</p>
            <pre
                style={{
                    marginTop: '1rem',
                    background: '#1e293b',
                    padding: '1rem',
                    borderRadius: '8px',
                    color: '#cbd5e1',
                }}
            >
                {error.message}
            </pre>
        </div>,
    )
}

const renderBootstrapConsentGate = (onAccept: () => Promise<void>) => {
    root.render(
        <React.StrictMode>
            <I18nextProvider i18n={i18nInstance}>
                <BootstrapConsentGate onAccept={onAccept} />
            </I18nextProvider>
        </React.StrictMode>,
    )
}

const renderAppWithStore = (store: AppStore) => {
    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <Provider store={store}>
                    <I18nextProvider i18n={i18nInstance}>
                        <App />
                    </I18nextProvider>
                </Provider>
            </ErrorBoundary>
        </React.StrictMode>,
    )
}

const mountHydratedApp = async () => {
    try {
        window.addEventListener(
            'cannaguide-runtime-error',
            () => {
                void triggerSafeRecovery('runtime-error-event')
            },
            { once: true },
        )
        window.addEventListener(
            'cannaguide-safe-recovery-request',
            () => {
                void triggerSafeRecovery('manual-safe-recovery')
            },
            { once: true },
        )

        // 1. Wait for i18n to be ready
        await i18nPromise

        // 2. Render app shell immediately with an empty store so the browser
        //    can paint while IndexedDB hydration runs in the background.
        //    This prevents large databases from blocking First Contentful Paint.
        const shellStore: AppStore = createAppStoreSync()
        renderAppWithStore(shellStore)

        // 3. Hydrate from IndexedDB in the background (non-blocking).
        //    Once complete, re-render with the fully hydrated store.
        const hydratedStore: AppStore = await createAppStore()
        renderAppWithStore(hydratedStore)

        // 4. Setup robust, event-driven persistence
        const saveState = async () => {
            try {
                const state = hydratedStore.getState() as RootState
                const optimizedSimulation = await dbService.optimizeSimulationForPersistence(
                    state.simulation,
                )
                // Construct a state object with only the slices we want to persist.
                // TTS is now a Zustand store (runtime-only, never persisted).
                // navigationSlice was removed (dead code, useUIStore handles it).
                const stateToSave = {
                    version: state.settings.version,
                    _sliceVersions: SLICE_SCHEMA_VERSIONS,
                    settings: state.settings,
                    simulation: optimizedSimulation,
                    userStrains: state.userStrains,
                    favorites: state.favorites,
                    notes: state.notes,
                    archives: state.archives,
                    savedItems: state.savedItems,
                    knowledge: state.knowledge,
                    breeding: state.breeding,
                    genealogy: state.genealogy,
                    nutrientPlanner: {
                        schedule: state.nutrientPlanner.schedule,
                        readings: state.nutrientPlanner.readings,
                        alerts: state.nutrientPlanner.alerts,
                        autoAdjustEnabled: state.nutrientPlanner.autoAdjustEnabled,
                        medium: state.nutrientPlanner.medium,
                        activePluginId: state.nutrientPlanner.activePluginId,
                        // Strip transient AI loading state
                        isAiLoading: false,
                        lastAiRecommendation: state.nutrientPlanner.lastAiRecommendation,
                        autoAdjustRecommendation: state.nutrientPlanner.autoAdjustRecommendation,
                    },
                    sandbox: {
                        savedExperiments: state.sandbox.savedExperiments,
                        // Strip transient runtime status -- always starts idle
                        currentExperiment: null,
                        status: 'idle' as const,
                    },
                    hydro: state.hydro,
                    ui: {
                        // Only persist essential, non-transient UI state
                        lastActiveView: getUISnapshot().lastActiveView,
                        onboardingStep: getUISnapshot().onboardingStep,
                        equipmentViewTab: getUISnapshot().equipmentViewTab,
                        knowledgeViewTab: getUISnapshot().knowledgeViewTab,
                    },
                }
                const serializedState = JSON.stringify(stateToSave)
                await indexedDBStorage.setItem(REDUX_STATE_KEY, serializedState)
            } catch (e) {
                console.error('[Persistence] Failed to save state:', e)
            }
        }

        let saveTimeout: number
        hydratedStore.subscribe(() => {
            // Debounced save for frequent actions
            clearTimeout(saveTimeout)
            const persistenceDelay =
                hydratedStore.getState().settings.settings.data.persistenceIntervalMs ?? 1500
            saveTimeout = window.setTimeout(() => {
                void saveState()
            }, persistenceDelay)
        })

        // Save immediately when the page is being closed or hidden
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                clearTimeout(saveTimeout) // Cancel any pending debounced save
                void saveState()
            }
        })

        window.addEventListener('pagehide', () => {
            clearTimeout(saveTimeout)
            void saveState()
            workerBus.dispose()
        })

        // 5. Now that the store is hydrated and the app is rendered, initialize services
        // and dispatch post-hydration actions.
        await strainService.init()
        hydratedStore.dispatch(initializeSimulation())
        ttsService.init()

        // Sync AI mode from persisted settings into the service layer
        const { setAiMode } = await import('@/services/aiService')
        setAiMode(hydratedStore.getState().settings.settings.aiMode ?? 'hybrid')

        // Initialize MQTT IoT sensor bridge
        const { mqttClientService } = await import('@/services/mqttClientService')
        mqttClientService.init(hydratedStore)

        // Decrypt and load persisted IoT password into runtime state
        const { useIotStore } = await import('@/stores/useIotStore')
        await useIotStore.getState().loadPersistedPassword()

        // Initialize WorkerBus state-sync and telemetry
        const { initWorkerStateSync } = await import('@/services/workerStateSyncService')
        const { initWorkerTelemetry } = await import('@/services/workerTelemetryService')
        initWorkerStateSync()
        initWorkerTelemetry(hydratedStore.dispatch)

        // Initialize proactive smart coach (monitors sensor thresholds -> AI advice)
        const { proactiveCoachService } = await import('@/services/proactiveCoachService')
        proactiveCoachService.init(hydratedStore)

        // Pre-request notification permissions so native alerts work immediately
        const { requestNotificationPermission } = await import('@/services/nativeBridgeService')
        void requestNotificationPermission()

        // Schedule local AI model preloading during browser idle time
        const { localAiPreloadService } = await import('@/services/localAiPreloadService')
        localAiPreloadService.scheduleIdlePreload()

        // Schedule background embedding precomputation for RAG semantic ranking
        const { startBackgroundPrecomputation } =
            await import('@/services/ragEmbeddingCacheService')
        const plantEntities = (hydratedStore.getState() as RootState).simulation.plants.entities
        const allPlants = Object.values(plantEntities).filter((p): p is Plant => p !== undefined)
        startBackgroundPrecomputation(allPlants)

        // 6. Signal that the app is fully ready and hide the loading gate.
        getUISnapshot().setAppReady(true)
    } catch (error) {
        console.error('Failed to initialize the application:', error)
        const recovered = await triggerSafeRecovery('boot-initialization-failure', error)
        if (recovered) {
            return
        }
        if (error instanceof Error) {
            renderError(error)
        } else {
            renderError(new Error('An unknown error occurred during startup.'))
        }
    }
}

const startApp = async () => {
    await i18nPromise

    if (!consentService.hasConsent()) {
        renderBootstrapConsentGate(async () => {
            consentService.grantConsent()
            registerServiceWorker()
            await mountHydratedApp()
        })
        return
    }

    registerServiceWorker()
    await mountHydratedApp()
}

startApp()
