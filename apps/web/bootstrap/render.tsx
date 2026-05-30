import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { App } from '@/components/views/plants/App'
import type { AppStore } from '@/stores/store'
import { i18nInstance } from '@/i18n'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

let root: ReactDOM.Root | null = null

export const getAppRoot = (): ReactDOM.Root => {
    if (!root) {
        const element = document.getElementById('root')
        if (!element) {
            throw new Error('Root element #root not found')
        }
        root = ReactDOM.createRoot(element)
    }
    return root
}

export const renderError = (error: Error): void => {
    getAppRoot().render(
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

export const renderAppWithStore = (store: AppStore): void => {
    getAppRoot().render(
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
