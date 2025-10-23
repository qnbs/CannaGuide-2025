import React from 'react'
import ReactDOM from 'react-dom/client'
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
import { REDUX_STATE_KEY } from './constants'

const root = ReactDOM.createRoot(document.getElementById('root')!)

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
        const saveState = () => {
            try {
                const state = store.getState() as RootState;
                // Construct a state object with only the slices we want to persist.
                const stateToSave = {
                    version: state.settings.version,
                    settings: state.settings,
                    simulation: state.simulation,
                    userStrains: state.userStrains,
                    favorites: state.favorites,
                    notes: state.notes,
                    archives: state.archives,
                    savedItems: state.savedItems,
                    knowledge: state.knowledge,
                    breeding: state.breeding,
                    sandbox: state.sandbox,
                    ui: { // Only persist essential, non-transient UI state
                        lastActiveView: state.ui.lastActiveView,
                        onboardingStep: state.ui.onboardingStep,
                        equipmentViewTab: state.ui.equipmentViewTab,
                        knowledgeViewTab: state.ui.knowledgeViewTab,
                    },
                };
                const serializedState = JSON.stringify(stateToSave);
                indexedDBStorage.setItem(REDUX_STATE_KEY, serializedState);
            } catch (e) {
                console.error("[Persistence] Failed to save state:", e);
            }
        };

        let saveTimeout: number;
        store.subscribe(() => {
            // Debounced save for frequent actions
            clearTimeout(saveTimeout);
            saveTimeout = window.setTimeout(saveState, 1000);
        });

        // Save immediately when the page is being closed or hidden
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                clearTimeout(saveTimeout); // Cancel any pending debounced save
                saveState();
            }
        });

        window.addEventListener('pagehide', () => {
            clearTimeout(saveTimeout);
            saveState();
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
        if (error instanceof Error) {
            renderError(error);
        } else {
            renderError(new Error('An unknown error occurred during startup.'));
        }
    }
};

startApp();