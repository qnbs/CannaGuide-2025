import React from 'react'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from './Button'

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    // FIX: Reverted to using a constructor for state initialization to resolve a potential environment-specific issue where class properties were not correctly initializing `this.props` and `this.state`.
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col h-screen bg-slate-900 text-slate-300 font-sans items-center justify-center p-4 text-center">
                    <PhosphorIcons.WarningCircle className="w-24 h-24 text-danger mb-4" />
                    <h1 className="text-2xl font-bold font-display text-red-400 mb-2">
                        Something went wrong.
                    </h1>
                    <p className="text-slate-400 mb-6 max-w-sm">
                        An unexpected error occurred. Please try reloading the application. If the problem persists, you may need to clear your site data.
                    </p>
                    <Button
                        variant="danger"
                        onClick={() => window.location.reload()}
                    >
                        Reload Application
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
