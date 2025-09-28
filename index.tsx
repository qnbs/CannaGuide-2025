import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './App';
import { store } from './stores/store';
import { i18nPromise } from './i18n';

const root = ReactDOM.createRoot(document.getElementById('root')!);

const initialize = async () => {
  await i18nPromise;
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>
  );
};

initialize();
