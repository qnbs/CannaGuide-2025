import React, { ReactNode, ErrorInfo } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from './Button'
import { Sentry } from '@/services/sentryService'

interface ErrorBoundaryProps {
    children: ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
}

const ErrorFallback: React.FC<{ onSafeRecovery: () => void }> = ({ onSafeRecovery }) => {
    const { t } = useTranslation()
    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-300 font-sans items-center justify-center p-4 text-center">
            <PhosphorIcons.WarningCircle weight="fill" className="w-24 h-24 text-red-400 mb-4" />
            <h1 className="text-2xl font-bold font-display text-red-400 mb-2">
                {t('common.errorBoundary.title')}
            </h1>
            <p className="text-slate-400 mb-6 max-w-sm">{t('common.errorBoundary.description')}</p>
            <Button variant="danger" onClick={() => window.location.reload()}>
                {t('common.errorBoundary.reload')}
            </Button>
            <Button variant="secondary" onClick={onSafeRecovery} className="mt-2">
                {t('common.errorBoundary.safeRecovery')}
            </Button>
        </div>
    )
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    // FIX: Replaced state property initializer with a constructor to resolve a typing issue where `this.props` was not recognized.
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false }
    }

    // This lifecycle method is called to update the state when an error is thrown.
    static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
        return { hasError: true }
    }

    // This lifecycle method is used for logging error information.
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
        Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
        try {
            window.dispatchEvent(
                new CustomEvent('cannaguide-runtime-error', {
                    detail: { message: error.message },
                }),
            )
        } catch {
            // no-op in non-browser contexts
        }
    }

    private readonly requestSafeRecovery = () => {
        try {
            window.dispatchEvent(new Event('cannaguide-safe-recovery-request'))
        } catch {
            // no-op in non-browser contexts
        }
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return <ErrorFallback onSafeRecovery={this.requestSafeRecovery} />
        }

        return this.props.children
    }
}
