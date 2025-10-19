import React from 'react'

const IconBase: React.FC<{ children: React.ReactNode; className?: string; viewBox?: string }> = ({
    children,
    className,
    viewBox = '0 0 24 24',
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

// Geometric, outlined icons inside a hexagonal frame for a high-tech feel.
const HexagonFrame: React.FC = () => (
    <path 
        d="M18.75 6.9375L12 3.375L5.25 6.9375V14.0625L12 17.625L18.75 14.0625V6.9375Z" 
        stroke="currentColor" 
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
    />
);

export const SativaIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconBase className={className}>
        <HexagonFrame />
        <path d="M12 7V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 10L12 7L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </IconBase>
);

export const IndicaIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconBase className={className}>
        <HexagonFrame />
        <path d="M12 14V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 11L12 14L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </IconBase>
);

export const HybridIcon: React.FC<{ className?: string }> = ({ className }) => (
    <IconBase className={className}>
        <HexagonFrame />
        <path d="M12 7V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 10L12 7L15 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 11L12 14L15 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    </IconBase>
);