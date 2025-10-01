import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { App } from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
// FIX: Corrected import path for Redux store to use the '@/' alias.
import { createAppStore, RootState } from '@/stores/store';
import { i18nPromise, i18nInstance } from './i18n';
import { indexedDBStorage } from './stores/indexedDBStorage';
import { mergeSettings } from './stores/slices/settingsSlice';

const root = ReactDOM.createRoot(document.getElementById('root')!);
const REDUX_STATE_KEY = 'cannaguide-redux-storage';

const initialize = async () => {
  await i18nPromise;

  let preloadedState: Partial<RootState> = {};
  try {
      const persistedString = await indexedDBStorage.getItem(REDUX_STATE_KEY);
      if (persistedString) {
          const persistedState = JSON.parse(persistedString);
          if(persistedState.settings) {
              persistedState.settings = { settings: mergeSettings(persistedState.settings.settings) };
          }
          preloadedState = persistedState;
          console.log('[Persistence] State loaded from IndexedDB.');
      }
  } catch (e) {
      console.error("[Persistence] Failed to load or parse persisted state, starting fresh.", e);
  }

  const store = createAppStore(preloadedState);

  // FIX: Wrapped component tree within ErrorBoundary components to provide the required 'children' prop and fix component hierarchy.
  root.render(
    <React.StrictMode>
      <ErrorBoundary scope="Global App">
        <Provider store={store}>
          <ErrorBoundary scope="Redux Store">
            <I18nextProvider i18n={i18nInstance}>
              <App />
            </I18nextProvider>
          </ErrorBoundary>
        </Provider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

initialize();