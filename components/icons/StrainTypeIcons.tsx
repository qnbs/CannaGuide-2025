import React from 'react';

const IconBase: React.FC<{ children: React.ReactNode; className?: string; viewBox?: string }> = ({ children, className, viewBox = "0 0 24 24" }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={viewBox}
        fill="currentColor"
        className={className}
        aria-hidden="true"
    >
        {children}
    </svg>
);

export const SativaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconBase className={className} viewBox="0 0 64 64">
    <path d="M32,2 C15.4,2,2,15.4,2,32s13.4,30,30,30s30-13.4,30-30S48.6,2,32,2z M32,58 C17.7,58,6,46.3,6,32S17.7,6,32,6 s26,11.7,26,26S46.3,58,32,58z" />
    <path d="M48.2,34.4l-14-19c-0.8-1.1-2.5-1.1-3.4,0l-14,19c-1,1.3,0.1,3.3,1.7,3.3h28C48.1,37.7,49.2,35.7,48.2,34.4z M32,32.7 L22.4,19.8h19.2L32,32.7z" />
  </IconBase>
);

export const IndicaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconBase className={className} viewBox="0 0 64 64">
    <path d="M32,2 C15.4,2,2,15.4,2,32s13.4,30,30,30s30-13.4,30-30S48.6,2,32,2z M32,58 C17.7,58,6,46.3,6,32S17.7,6,32,6 s26,11.7,26,26S46.3,58,32,58z" />
    <rect x="18" y="24" width="28" height="16" rx="3" />
  </IconBase>
);

export const HybridIcon: React.FC<{ className?: string }> = ({ className }) => (
  <IconBase className={className} viewBox="0 0 64 64">
    <path d="M32,2c-1.3,0-2.6,0-3.9,0.2c-0.1,0-0.2,0-0.3,0.1l-0.3,0.1c-1.1,0.2-2.2,0.5-3.3,0.8l-0.3,0.1 c-1,0.3-2,0.6-3,0.9l-0.3,0.1c-1,0.3-1.9,0.7-2.8,1.1l-0.2,0.1c-0.9,0.4-1.8,0.8-2.6,1.2l-0.2,0.1c-0.8,0.4-1.6,0.8-2.4,1.3 l-0.1,0.1c-0.8,0.4-1.5,0.9-2.3,1.3l-0.1,0.1C4.3,11,3.1,12.2,2,13.4V32c0,16.6,13.4,30,30,30s30-13.4,30-30S48.6,2,32,2z" />
    <path fill="#FFF" d="M13,51L51,13v38H13z" className="dark:fill-gray-800" />
  </IconBase>
);