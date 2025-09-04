import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'base' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', size = 'base', ...props }) => {
    const baseClasses = "rounded-md font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-md";

    const variantClasses = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-primary-500 dark:bg-slate-700 dark:hover:bg-slate-600 dark:focus-visible:ring-slate-500 dark:text-white",
        danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
    };
    
    const sizeClasses = {
        sm: "px-2 py-1 text-sm",
        base: "px-4 py-2",
        lg: "px-6 py-3 text-lg"
    };

    return (
        <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`} {...props}>
            {children}
        </button>
    );
};