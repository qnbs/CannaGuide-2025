import React from 'react';

// FIX: Refactor to a polymorphic component to support the `as` prop for rendering different elements like `label`.
type ButtonOwnProps<E extends React.ElementType> = {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'base' | 'lg';
    as?: E;
    className?: string;
}

type ButtonProps<E extends React.ElementType> = ButtonOwnProps<E> & Omit<React.ComponentProps<E>, keyof ButtonOwnProps<E>>;

const defaultElement = 'button';

export const Button = <E extends React.ElementType = typeof defaultElement>({
    children,
    className,
    variant = 'primary',
    size = 'base',
    as,
    ...props
}: ButtonProps<E>) => {
    const Component = as || defaultElement;

    const baseClasses = "rounded-lg font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:saturate-50";

    const variantClasses = {
        primary: "bg-primary-500 hover:bg-primary-400 focus-visible:ring-primary-400 text-on-accent font-bold shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30",
        secondary: "bg-slate-700 hover:bg-slate-600 focus-visible:ring-primary-500 text-slate-100 border border-slate-600",
        danger: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white",
    };
    
    const sizeClasses = {
        sm: "px-2 py-1 text-sm",
        base: "px-4 py-2",
        lg: "px-6 py-3 text-lg"
    };

    return (
        <Component className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
            {children}
        </Component>
    );
};