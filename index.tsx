import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { App } from '@/components/views/plants/App'
import { createAppStore } from '@/stores/store'
import { i18nPromise, i18nInstance } from './i18n'

// A top-level Error Boundary to catch any unexpected rendering errors.
// This prevents the user from seeing a blank screen and provides a graceful recovery path.
// FIX: Extracted props to a dedicated interface for clearer typing.
interface ErrorBoundaryProps {
    children: React.ReactNode;
}
class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    { hasError: boolean }
> {
    // FIX: Replaced constructor with a class property for state initialization to fix typing errors.
    state = { hasError: false };

    static getDerivedStateFromError(error: Error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log the error to the console for debugging purposes.
        console.error('Uncaught error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            // Render a user-friendly fallback UI.
            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100vh',
                        backgroundColor: '#0F172A', // Corresponds to slate-900
                        color: '#CBD5E1', // Corresponds to slate-300
                        fontFamily: 'sans-serif',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                        textAlign: 'center',
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="6rem"
                        height="6rem"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                        style={{ color: '#F87171', marginBottom: '1rem' }}
                    >
                        <rect width="256" height="256" fill="none"></rect>
                        <path d="M128,24A104,104,0,1,0,232,128,104.2,104.2,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-88a8,8,0,0,1,16,0v48a8,8,0,0,1-16,0Zm8-32a12,12,0,1,1-12-12A12,12,0,0,1,128,96Z"></path>
                    </svg>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F87171', marginBottom: '0.5rem' }}>
                        Something went wrong.
                    </h1>
                    <p style={{ color: '#94A3B8', marginBottom: '1.5rem' }}>
                        An unexpected error occurred. Please try reloading the application.
                    </p>
                    <button
                        style={{
                            backgroundColor: '#DC2626',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                        }}
                        onClick={() => window.location.reload()}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#B91C1C'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#DC2626'; }}
                    >
                        Reload Application
                    </button>
                </div>
            )
        }

        // FIX: In a class component, props must be accessed via `this.props`, not as a standalone `props` variable.
        const { children } = this.props
        return children
    }
}

const root = ReactDOM.createRoot(document.getElementById('root')!)

const initialize = async () => {
    await i18nPromise

    // The store is now created asynchronously to allow for pre-hydration
    // and migration of persisted state from IndexedDB before the app mounts.
    const store = await createAppStore()

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
    )
}

initialize()