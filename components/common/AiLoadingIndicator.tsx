import React from 'react'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface AiLoadingIndicatorProps {
    loadingMessage: string
    className?: string
}

export const AiLoadingIndicator: React.FC<AiLoadingIndicatorProps> = ({
    loadingMessage,
    className = '',
}) => {
    return (
        <div
            className={`text-center p-6 flex flex-col items-center justify-center gap-4 ${className}`}
            role="status"
            aria-live="polite"
        >
            <PhosphorIcons.Brain className="w-12 h-12 text-primary-400 animate-pulse" />
            <p key={loadingMessage} className="text-slate-300 animate-fade-in text-sm">
                {loadingMessage}
            </p>
        </div>
    )
}
