import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Inline error message. When set, renders aria-invalid and an error paragraph. */
    error?: string | undefined
    /** Explicit id for the error element (used for aria-describedby). */
    errorId?: string | undefined
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = 'text', error, errorId, ...props }, ref) => {
        const describedBy = error && errorId ? errorId : props['aria-describedby']

        return (
            <>
                <input
                    type={type}
                    className={cn(
                        'flex h-10 w-full rounded-md border border-white/20 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 ring-offset-[rgb(var(--color-bg-primary))] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-rose-500/60',
                        className,
                    )}
                    ref={ref}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy}
                    {...props}
                />
                {error && errorId && (
                    <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-rose-300">
                        {error}
                    </p>
                )}
            </>
        )
    },
)
Input.displayName = 'Input'

export { Input }
