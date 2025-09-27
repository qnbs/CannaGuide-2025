import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@/App';
import { i18nPromise } from '@/i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Wait for translations to load before rendering the app
i18nPromise.then(() => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
});
