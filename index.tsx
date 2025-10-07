import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { I18nextProvider } from 'react-i18next'
import { App } from '@/components/views/plants/App'
import { createAppStore } from '@/stores/store'
import { i18nPromise, i18nInstance } from './i18n'

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    declare readonly props: ErrorBoundaryProps;
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
        return { hasError: true }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100dvh',
                        backgroundColor: 'rgb(2, 6, 23)',
                        color: '#CBD5E1',
                        fontFamily: 'Inter, sans-serif',
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
                        style={{ color: 'rgb(239, 68, 68)', marginBottom: '1rem' }}
                    >
                        <rect width="256" height="256" fill="none"></rect>
                        <path d="M128,24A104,104,0,1,0,232,128,104.2,104.2,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-88a8,8,0,0,1,16,0v48a8,8,0,0,1-16,0Zm8-32a12,12,0,1,1-12-12A12,12,0,0,1,128,96Z"></path>
                    </svg>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', fontFamily: 'Lexend, sans-serif', color: 'rgb(248, 113, 113)', marginBottom: '0.5rem' }}>
                        Something went wrong.
                    </h1>
                    <p style={{ color: '#94A3B8', marginBottom: '1.5rem', maxWidth: '400px' }}>
                        An unexpected error occurred. Please try reloading the application. If the problem persists, you may need to clear your site data.
                    </p>
                    <button
                        style={{
                            backgroundColor: 'rgb(220, 38, 38)',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                        }}
                        onClick={() => window.location.reload()}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgb(185, 28, 28)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgb(220, 38, 38)'; }}
                    >
                        Reload Application
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

const root = ReactDOM.createRoot(document.getElementById('root')!)

const initialize = async () => {
    await i18nPromise
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