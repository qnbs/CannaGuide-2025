import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { App } from '@/components/views/plants/App'
import { createAppStore } from '@/stores/store'
import { i18nPromise, i18nInstance } from './i18n'

const root = ReactDOM.createRoot(document.getElementById('root')!)

const initialize = async () => {
    await i18nPromise

    // The store is now initialized without preloadedState.
    // State hydration and migration will be handled by the `runDataMigrations` thunk.
    const store = createAppStore()

    root.render(
        <React.StrictMode>
            <Provider store={store}>
                <I18nextProvider i18n={i18nInstance}>
                    <App />
                </I18nextProvider>
            </Provider>
        </React.StrictMode>
    )
}

initialize()
