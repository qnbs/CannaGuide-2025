import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { App } from '@/components/views/plants/App'
import type { AppStore } from '@/stores/store'
import { getT, i18nInstance } from '@/i18n'
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
    const t = getT()
    const requestSafeRecovery = () => {
        globalThis.dispatchEvent(new Event('cannaguide-safe-recovery-request'))
    }

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
            <p className="text-slate-300">
                {String(t('common.errorBoundary.safeRecoveryDescription'))}
            </p>
            <button
                type="button"
                onClick={requestSafeRecovery}
                className="mt-3 rounded-md bg-amber-500 px-4 py-2.5 font-bold text-slate-900"
            >
                {String(t('common.errorBoundary.safeRecovery'))}
            </button>
        </div>,
    )
}

const renderTabNotice = (
    title: string,
    description: string,
    reloadLabel: string,
    reload: () => void,
): void => {
    getAppRoot().render(
        <main role="alert" style={{ padding: '2rem', textAlign: 'center', color: '#e2e8f0' }}>
            <h1>{title}</h1>
            <p className="text-slate-300">{description}</p>
            <button
                type="button"
                onClick={reload}
                className="mt-3 rounded-md bg-amber-500 px-4 py-2.5 font-bold text-slate-900"
            >
                {reloadLabel}
            </button>
        </main>,
    )
}

/**
 * Shown instead of the app in a tab that is not the writer (GH #669): another
 * tab already owns the saved data, and a second copy would overwrite its edits.
 */
export const renderOtherTabNotice = (reload: () => void): void => {
    const translate = getT()
    renderTabNotice(
        String(translate('common.otherTab.title')),
        String(translate('common.otherTab.description')),
        String(translate('common.otherTab.reload')),
        reload,
    )
}

/**
 * Shown instead of the app when a save was refused because another tab saved
 * newer data since this page loaded (GH #669). Nothing of this page was written.
 */
export const renderStaleTabNotice = (reload: () => void): void => {
    const translate = getT()
    renderTabNotice(
        String(translate('common.staleTab.title')),
        String(translate('common.staleTab.description')),
        String(translate('common.staleTab.reload')),
        reload,
    )
}

/** This page cannot check for other tabs' saves and holds no writer lock (GH #669). */
export const renderUnverifiedTabNotice = (reload: () => void): void => {
    const translate = getT()
    renderTabNotice(
        String(translate('common.unverifiedTab.title')),
        String(translate('common.unverifiedTab.description')),
        String(translate('common.staleTab.reload')),
        reload,
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
