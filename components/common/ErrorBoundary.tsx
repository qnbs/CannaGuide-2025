import React, { ReactNode, ErrorInfo, Component } from 'react'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from './Button'

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    // FIX: Using public class field for state initialization to resolve type errors.
    public state: ErrorBoundaryState = { hasError: false };

    // This lifecycle method is called to update the state when an error is thrown.
    static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
        return { hasError: true }
    }

    // This lifecycle method is used for logging error information.
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="flex flex-col h-full bg-slate-900 text-slate-300 font-sans items-center justify-center p-4 text-center">
                    <PhosphorIcons.WarningCircle
                        weight="fill"
                        className="w-24 h-24 text-red-400 mb-4"
                    />
                    <h1 className="text-2xl font-bold font-display text-red-400 mb-2">
                        Something went wrong.
                    </h1>
                    <p className="text-slate-400 mb-6 max-w-sm">
                        An unexpected error occurred. Please try reloading the application. If the
                        problem persists, you may need to clear your site data.
                    </p>
                    <Button variant="danger" onClick={() => window.location.reload()}>
                        Reload Application
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
