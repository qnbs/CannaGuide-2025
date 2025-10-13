import React, { memo } from 'react'

// Define own props to be used in the component
type ButtonOwnProps<E extends React.ElementType> = {
    children?: React.ReactNode
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'base' | 'lg'
    as?: E
    className?: string
    glow?: boolean
}

// Combine own props with all possible props of the given element type, omitting duplicates
type ButtonProps<E extends React.ElementType> = ButtonOwnProps<E> &
    Omit<React.ComponentProps<E>, keyof ButtonOwnProps<E>>

const defaultElement = 'button'

// Use a generic E that extends React.ElementType, with a default of 'button'
const ButtonComponent = <E extends React.ElementType = typeof defaultElement>({
    children,
    className,
    variant = 'primary',
    size = 'base',
    as,
    glow = false,
    ...props
}: ButtonProps<E>) => {
    // The use of 'any' here is a deliberate and controlled type assertion.
    // This is a widely recognized pattern for creating polymorphic components in React with TypeScript.
    // It allows the 'Button' to be rendered as any valid HTML element (e.g., 'a', 'div')
    // while correctly inheriting and type-checking the props of that element,
    // which would be lost with a more restrictive type.
    const Component: any = as || defaultElement

    const baseClasses =
        'rounded-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--color-bg-primary))] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:saturate-50'

    const variantClasses = {
        primary:
            'bg-gradient-to-br from-primary-500 to-primary-600 text-white font-bold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 border border-primary-500/50 hover:from-primary-400 hover:to-primary-500 focus-visible:ring-primary-400',
        secondary:
            'bg-[rgba(var(--color-bg-component),0.6)] backdrop-blur-sm border border-[rgb(var(--color-border))] text-slate-200 hover:text-white hover:bg-[rgba(var(--color-neutral-700),0.6)] hover:border-slate-600 shadow-inner-glow focus-visible:ring-primary-500',
        danger: 
            'bg-gradient-to-br from-red-500 to-red-600 text-white font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 border border-red-600/50 hover:from-red-600 hover:to-red-700 focus-visible:ring-red-400',
        ghost: 
            'bg-transparent hover:bg-primary-500/10 focus-visible:ring-primary-500 text-slate-300 hover:text-primary-300 border border-transparent',
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
            } ${className}`}
            {...props}
        >
            {children}
        </Component>
    )
}

export const Button = memo(ButtonComponent)