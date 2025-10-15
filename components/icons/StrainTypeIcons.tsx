import React from 'react'

const IconBase: React.FC<{ children: React.ReactNode; className?: string; viewBox?: string }> = ({
    children,
    className,
    viewBox = '0 0 32 32',
}) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        fill="currentColor"
        className={className}
        aria-hidden="true"
    >
        {children}
    </svg>
)

// Gold circle with a triangle pointing up for Sativa
export const SativaIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconBase className={className}>
        <circle cx="16" cy="16" r="16" fill="rgb(var(--color-accent-400))" />
        <path d="M16 9 L10 22 L22 22 Z" fill="rgb(var(--color-bg-primary))" />
    </IconBase>
);

// Purple/blue circle with a horizontal bar for Indica
export const IndicaIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconBase className={className}>
        <circle cx="16" cy="16" r="16" fill="rgb(var(--color-secondary-500))" />
        <rect x="9" y="14.5" width="14" height="3" rx="1.5" fill="rgb(var(--color-bg-primary))" />
    </IconBase>
);


// Green circle with a balanced diamond symbol for Hybrid
export const HybridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconBase className={className}>
       <circle cx="16" cy="16" r="16" fill="rgb(var(--color-primary-500))" />
       <path d="M16 10 L22 16 L16 22 L10 16 Z" fill="rgb(var(--color-bg-primary))" />
    </IconBase>
);