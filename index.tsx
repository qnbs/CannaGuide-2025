import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { App } from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
// FIX: Corrected import path for Redux store to use the '@/' alias.
import { store } from '@/stores/store';
import { i18nPromise, i18nInstance } from './i18n';

const root = ReactDOM.createRoot(document.getElementById('root')!);

const initialize = async () => {
  await i18nPromise;
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Provider store={store}>
          <I18nextProvider i18n={i18nInstance}>
            <App />
          </I18nextProvider>
        </Provider>
      </ErrorBoundary>
    </React.StrictMode>
  );
};

initialize();
