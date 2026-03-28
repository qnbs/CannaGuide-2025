import React from 'react'

// Non-generic public type — accepts `as`, own styling props, and common HTML attributes
export type ButtonProps = {
    children?: React.ReactNode
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'base' | 'lg' | 'icon'
    as?: React.ElementType
    className?: string
    glow?: boolean
    href?: string
    target?: string
    rel?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'>

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { children, className, variant = 'primary', size = 'base', as, glow = false, ...props },
    ref,
) {
    const Component: React.ElementType = as || 'button'

    const baseClasses =
        'touch-manipulation inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-[0.01em] transition-[transform,filter,box-shadow,background-color,color,border-color,opacity] duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-bg-primary))] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:saturate-50 disabled:hover:translate-y-0 disabled:active:scale-100'

    const variantClasses = {
        primary:
            'border border-primary-400/35 bg-[linear-gradient(135deg,rgba(var(--color-primary-400),0.95),rgba(var(--color-primary-600),0.92))] text-white font-bold shadow-[0_18px_40px_rgba(8,145,178,0.3)] hover:shadow-[0_24px_52px_rgba(8,145,178,0.38)] hover:brightness-110 focus-visible:ring-primary-300',
        secondary:
            'border border-white/12 bg-white/7 text-slate-100 backdrop-blur-sm hover:border-white/18 hover:bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] focus-visible:ring-primary-500',
        danger: 'border border-red-400/30 bg-[linear-gradient(135deg,rgba(248,113,113,0.95),rgba(220,38,38,0.92))] text-white font-bold shadow-[0_18px_40px_rgba(220,38,38,0.24)] hover:shadow-[0_24px_52px_rgba(220,38,38,0.32)] hover:brightness-105 focus-visible:ring-red-300',
        ghost: 'border border-transparent bg-transparent text-slate-300 hover:border-white/8 hover:bg-white/8 hover:text-slate-50 focus-visible:ring-primary-500',
    }

    const sizeClasses = {
        sm: 'min-h-11 px-3 py-1.5 text-sm',
        base: 'min-h-11 px-4 py-2.5',
        lg: 'min-h-12 px-6 py-3 text-lg',
        icon: 'h-11 w-11 p-0 flex items-center justify-center shrink-0',
    }

    return (
        <Component
            ref={ref}
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
                glow ? 'animate-pulse-glow' : ''
            } ${className || ''}`}
            {...props}
        >
            {children}
        </Component>
    )
})
