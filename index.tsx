import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { App } from '@/components/views/plants/App'
import { createAppStore, AppStore, RootState } from '@/stores/store'
import { i18nPromise, i18nInstance } from './i18n'
import { setAppReady } from './stores/slices/uiSlice'
import { strainService } from './services/strainService'
import { initializeSimulation } from './stores/slices/simulationSlice'
import { ttsService } from './services/ttsService'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { indexedDBStorage } from './stores/indexedDBStorage'
import { REDUX_STATE_KEY, SLICE_SCHEMA_VERSIONS } from './constants'
import { dbService } from './services/dbService'
import { growReminderService } from './services/growReminderService'

const root = ReactDOM.createRoot(document.getElementById('root')!)
const SAFE_RECOVERY_ATTEMPT_KEY = 'cannaguide.safeRecoveryAttempted'

const triggerSafeRecovery = async (reason: string, error?: unknown): Promise<boolean> => {
    try {
        const alreadyAttempted = sessionStorage.getItem(SAFE_RECOVERY_ATTEMPT_KEY) === '1'
        if (alreadyAttempted) {
            return false
        }

        sessionStorage.setItem(SAFE_RECOVERY_ATTEMPT_KEY, '1')
        console.warn(`[SafeRecovery] Triggered by: ${reason}`, error)
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
                    console.warn('[SW] Could not register periodic reminder sync:', error)
                })

                navigator.serviceWorker.addEventListener(
                    'controllerchange',
                    () => {
                        window.location.reload()
                    },
                    { once: true },
                )

                const dispatchSwUpdate = () => {
                    const event = new CustomEvent('swUpdate', { detail: registration })
                    window.dispatchEvent(event)
                }

                if (registration.waiting && navigator.serviceWorker.controller) {
                    dispatchSwUpdate()
                }

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
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
                        console.warn('[SW] Update check failed:', error)
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
            <pre style={{ marginTop: '1rem', background: '#1e293b', padding: '1rem', borderRadius: '8px', color: '#cbd5e1' }}>
                {error.message}
            </pre>
        </div>
    );
};


const startApp = async () => {
    try {
        window.addEventListener('cannaguide-runtime-error', () => {
            void triggerSafeRecovery('runtime-error-event')
        })
        window.addEventListener('cannaguide-safe-recovery-request', () => {
            void triggerSafeRecovery('manual-safe-recovery')
        })

        // 1. Wait for i18n to be ready
        await i18nPromise;

        // 2. Create the store, which includes async hydration from IndexedDB
        const store: AppStore = await createAppStore();

        // 3. Render the app with the fully hydrated store
        root.render(
            <React.StrictMode>
                {/* FIX: Wrap the application in an ErrorBoundary to catch runtime errors. */}
                <ErrorBoundary>
                    <Provider store={store}>
                        <I18nextProvider i18n={i18nInstance}>
                            <App />
                        </I18nextProvider>
                    </Provider>
                </ErrorBoundary>
            </React.StrictMode>
        );

        // 4. Setup robust, event-driven persistence
        const saveState = async () => {
            try {
                const state = store.getState() as RootState;
                const optimizedSimulation = await dbService.optimizeSimulationForPersistence(state.simulation);
                // Construct a state object with only the slices we want to persist.
                // TTS and navigation are runtime-only and never persisted.
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
                    sandbox: {
                        savedExperiments: state.sandbox.savedExperiments,
                        // Strip transient runtime status – always starts idle
                        currentExperiment: null,
                        status: 'idle' as const,
                    },
                    ui: { // Only persist essential, non-transient UI state
                        lastActiveView: state.ui.lastActiveView,
                        onboardingStep: state.ui.onboardingStep,
                        equipmentViewTab: state.ui.equipmentViewTab,
                        knowledgeViewTab: state.ui.knowledgeViewTab,
                    },
                };
                const serializedState = JSON.stringify(stateToSave);
                await indexedDBStorage.setItem(REDUX_STATE_KEY, serializedState);
            } catch (e) {
                console.error("[Persistence] Failed to save state:", e);
            }
        };

        let saveTimeout: number;
        store.subscribe(() => {
            // Debounced save for frequent actions
            clearTimeout(saveTimeout);
            saveTimeout = window.setTimeout(() => {
                void saveState();
            }, 1000);
        });

        // Save immediately when the page is being closed or hidden
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                clearTimeout(saveTimeout); // Cancel any pending debounced save
                void saveState();
            }
        });

        window.addEventListener('pagehide', () => {
            clearTimeout(saveTimeout);
            void saveState();
        });
        
        // 5. Now that the store is hydrated and the app is rendered, initialize services
        // and dispatch post-hydration actions.
        await strainService.init();
        store.dispatch(initializeSimulation());
        ttsService.init();

        // 6. Signal that the app is fully ready and hide the loading gate.
        store.dispatch(setAppReady(true));
    } catch (error) {
        console.error("Failed to initialize the application:", error);
        const recovered = await triggerSafeRecovery('boot-initialization-failure', error)
        if (recovered) {
            return
        }
        if (error instanceof Error) {
            renderError(error);
        } else {
            renderError(new Error('An unknown error occurred during startup.'));
        }
    }
};

registerServiceWorker()
startApp();