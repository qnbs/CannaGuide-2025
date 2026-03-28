import React from 'react'

// German Flag
export const FlagDE: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" className={className} aria-hidden="true">
        <rect width="5" height="3" fill="#FFCE00" />
        <rect width="5" height="2" fill="#D00" />
        <rect width="5" height="1" fill="#000" />
    </svg>
)

// English Flag (Union Jack)
export const FlagEN: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className={className} aria-hidden="true">
        <clipPath id="a">
            <path d="M0 0v30h60V0z" />
        </clipPath>
        <clipPath id="b">
            <path d="M30 0v15h30v-15zm0 15v15H0v-15z" />
        </clipPath>
        <path d="M0 0v30h60V0z" fill="#012169" />
        <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
        <path d="M0 0l60 30m0-30L0 30" clipPath="url(#b)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
)
