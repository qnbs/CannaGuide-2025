import React, { memo, useState, useEffect, useRef } from 'react'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface AiLoadingIndicatorProps {
    loadingMessage: string
    className?: string
    /** Show elapsed seconds after this threshold (ms). Default: 3000. */
    showElapsedAfterMs?: number
    /** Optional cancel handler — renders an abort button when provided. */
    onCancel?: () => void
}

/** Format elapsed seconds into a compact label (e.g. "5 s", "1:02"). */
const formatElapsed = (seconds: number): string => {
    if (seconds < 60) return `${seconds} s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
}

export const AiLoadingIndicator: React.FC<AiLoadingIndicatorProps> = memo(
    ({ loadingMessage, className = '', showElapsedAfterMs = 3000, onCancel }) => {
        const startRef = useRef(Date.now())
        const [elapsed, setElapsed] = useState(0)

        useEffect(() => {
            startRef.current = Date.now()
            setElapsed(0)
            const id = setInterval(() => {
                setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
            }, 1000)
            return () => clearInterval(id)
        }, [])

        const showTimer = elapsed * 1000 >= showElapsedAfterMs

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
                {showTimer && (
                    <span className="text-xs text-slate-500 tabular-nums">
                        {formatElapsed(elapsed)}
                    </span>
                )}
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-xs text-slate-400 hover:text-red-400 transition-colors underline"
                    >
                        Cancel
                    </button>
                )}
            </div>
        )
    },
)

AiLoadingIndicator.displayName = 'AiLoadingIndicator'
