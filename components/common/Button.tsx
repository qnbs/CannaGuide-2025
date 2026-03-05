import React from 'react'

// Non-generic public type — accepts `as`, own styling props, and common HTML attributes
export type ButtonProps = {
    children?: React.ReactNode
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'base' | 'lg'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    as?: any
    className?: string
    glow?: boolean
    href?: string
    target?: string
    rel?: string
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'>

export const Button = ({
    children,
    className,
    variant = 'primary',
    size = 'base',
    as,
    glow = false,
    ...props
}: ButtonProps) => {
    const Component: React.ElementType = as || 'button'

    const baseClasses =
        'touch-manipulation rounded-lg font-semibold transition-[transform,filter,box-shadow,background-color,color,border-color] duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-bg-primary))] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:saturate-50 disabled:active:scale-100'

    const variantClasses = {
        primary:
            'bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 border border-primary-500/50 hover:from-primary-400 hover:to-primary-500 focus-visible:ring-primary-400',
        secondary:
            'bg-[rgba(var(--color-bg-component),0.6)] backdrop-blur-sm border border-white/20 text-slate-200 hover:text-white hover:bg-[rgba(var(--color-neutral-700),0.6)] hover:border-white/40 shadow-inner-glow focus-visible:ring-primary-500',
        danger: 'bg-gradient-to-br from-red-500 to-red-600 text-white font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 border border-red-600/50 hover:from-red-600 hover:to-red-700 focus-visible:ring-red-400',
        ghost: 'bg-transparent hover:bg-primary-500/10 focus-visible:ring-primary-500 text-slate-300 hover:text-primary-300 border border-transparent',
    }

    const sizeClasses = {
        sm: 'px-2 py-1 text-sm',
        base: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
    }

    return (
        <Component
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
                glow ? 'animate-pulse-glow' : ''
            } ${className || ''}`}
            {...props}
        >
            {children}
        </Component>
    )
}
