
# CannaGuide 2025 - Source Code Documentation (Part 2: Components)

This document contains the source code for all React components used in the CannaGuide 2025 application, organized by their directory structure.

---

## 1. `components/common/`

This directory contains reusable, generic components used throughout the application.

### `components/common/ActionToolbar.tsx`

**Purpose:** Renders a toolbar of buttons for logging various plant actions (watering, feeding, etc.).

```typescript
import React from 'react';
import { Button } from '../../common/Button';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { useTranslations } from '../../../hooks/useTranslations';
import { ModalType } from '@/types';

interface ActionToolbarProps {
    onLogAction: (type: ModalType) => void;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({ onLogAction }) => {
    const { t } = useTranslations();

    const actions = [
        { type: 'watering', icon: <PhosphorIcons.Drop />, label: t('plantsView.detailedView.journalFilters.watering') },
        { type: 'feeding', icon: <PhosphorIcons.TestTube />, label: t('plantsView.detailedView.journalFilters.feeding') },
        { type: 'training', icon: <PhosphorIcons.Scissors />, label: t('plantsView.detailedView.journalFilters.training') },
        { type: 'observation', icon: <PhosphorIcons.MagnifyingGlass />, label: t('plantsView.detailedView.journalFilters.observation') },
        { type: 'photo', icon: <PhosphorIcons.Camera />, label: t('plantsView.detailedView.journalFilters.photo') },
        { type: 'pestControl', icon: <PhosphorIcons.WarningCircle />, label: t('plantsView.detailedView.journalFilters.pestControl') },
        { type: 'amendment', icon: <PhosphorIcons.Flask />, label: t('plantsView.detailedView.journalFilters.amendment') },
    ];

    return (
        <div className="flex flex-wrap items-center justify-center gap-2">
            {actions.map(action => (
                <Button key={action.type} variant="secondary" onClick={() => onLogAction(action.type as ModalType)} className="flex-1 min-w-[120px] hyphens-auto">
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                </Button>
            ))}
        </div>
    );
};
```

### `components/common/AiLoadingIndicator.tsx`

**Purpose:** A standardized loading indicator for AI-powered features, showing an animated icon and a dynamic message.

```typescript
import React from 'react';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface AiLoadingIndicatorProps {
    loadingMessage: string;
    className?: string;
}

export const AiLoadingIndicator: React.FC<AiLoadingIndicatorProps> = ({ loadingMessage, className = '' }) => {
    return (
        <div 
            className={`text-center p-6 flex flex-col items-center justify-center gap-4 ${className}`}
            role="status"
            aria-live="polite"
        >
            <PhosphorIcons.Brain className="w-12 h-12 text-primary-400 animate-pulse" />
            <p key={loadingMessage} className="text-slate-300 animate-fade-in text-sm">
                {loadingMessage}
            </p>
        </div>
    );
};
```

### `components/common/AttributeDisplay.tsx`

**Purpose:** A simple component for displaying a key-value pair, commonly used in detail views.

```typescript
import React from 'react';

interface AttributeDisplayProps {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

export const AttributeDisplay: React.FC<AttributeDisplayProps> = ({ label, value, valueClassName = '' }) => {
  if (value === null || value === undefined || value === '') return null;
  
  return (
    <div className="flex flex-col sm:flex-row justify-between py-2 border-b border-slate-700/50 last:border-b-0">
      <span className="font-semibold text-slate-300">{label}:</span>
      <div className={`text-slate-100 text-left sm:text-right max-w-xs ${valueClassName}`}>{value}</div>
    </div>
  );
};
```

### `components/common/Button.tsx`

**Purpose:** A highly versatile and themeable button component that supports different variants, sizes, and can be rendered as different HTML elements.

```typescript
import React from 'react';

// Define own props to be used in the component
type ButtonOwnProps<E extends React.ElementType> = {
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'base' | 'lg';
    as?: E;
    className?: string;
}

// Combine own props with all possible props of the given element type, omitting duplicates
type ButtonProps<E extends React.ElementType> = ButtonOwnProps<E> & Omit<React.ComponentProps<E>, keyof ButtonOwnProps<E>>;

const defaultElement = 'button';

// Use a generic E that extends React.ElementType, with a default of 'button'
export const Button = <E extends React.ElementType = typeof defaultElement>({
    children,
    className,
    variant = 'primary',
    size = 'base',
    as,
    ...props
}: ButtonProps<E>) => {
    // The component to render is either the one passed in `as` or the default
    const Component: any = as || defaultElement;

    const baseClasses = "rounded-lg font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:saturate-50";

    const variantClasses = {
        primary: "bg-primary-500 hover:bg-primary-400 focus-visible:ring-primary-400 text-on-accent font-bold shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30",
        secondary: "bg-slate-700 hover:bg-slate-600 focus-visible:ring-primary-500 text-slate-100 border border-slate-600",
        danger: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500 text-white",
        ghost: "bg-transparent hover:bg-slate-700 focus-visible:ring-primary-500 text-slate-300 hover:text-primary-300",
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
```

### `components/common/CameraModal.tsx`

**Purpose:** A modal component that accesses the device's camera to capture a photo, used for the AI Diagnostics feature.

```typescript
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { Modal } from './Modal';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const { t } = useTranslations();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const cleanupStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      const startCamera = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          console.error("Camera access error:", err);
          setError(t('plantsView.aiDiagnostics.cameraError'));
        }
      };
      startCamera();
    } else {
      cleanupStream();
      setCapturedImage(null);
    }
    
    return () => {
      cleanupStream();
    };
  }, [isOpen, cleanupStream, t]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        cleanupStream();
      }
    }
  };

  const handleConfirmCapture = () => {
    if(capturedImage) {
        onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    // Restart camera
    const startCamera = async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } catch (err) {
          setError(t('plantsView.aiDiagnostics.cameraError'));
        }
      };
      startCamera();
  }

  const footerContent = (
    <div className="w-full flex justify-center gap-4">
        {capturedImage ? (
            <>
                <Button onClick={handleRetake} variant="secondary"><PhosphorIcons.ArrowClockwise className="w-5 h-5 mr-2" />{t('plantsView.aiDiagnostics.retake')}</Button>
                <Button onClick={handleConfirmCapture}><PhosphorIcons.CheckCircle className="w-5 h-5 mr-2" />{t('common.confirm')}</Button>
            </>
        ) : (
            <Button onClick={handleCapture} disabled={!stream}><PhosphorIcons.Camera className="w-5 h-5 mr-2" />{t('plantsView.aiDiagnostics.capture')}</Button>
        )}
    </div>
  );

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="lg" 
        footer={footerContent}
        containerClassName="!bg-slate-900"
    >
        {error ? (
          <div className="text-center text-red-400 p-8">{error}</div>
        ) : (
          <div className="relative">
            <video ref={videoRef} autoPlay playsInline className={`w-full h-auto rounded-md ${capturedImage ? 'hidden' : 'block'}`}></video>
            <canvas ref={canvasRef} className="hidden"></canvas>
            {capturedImage && (
                <img src={capturedImage} alt="Captured" className="w-full h-auto rounded-md" />
            )}
          </div>
        )}
    </Modal>
  );
};
```

### `components/common/Card.tsx`

**Purpose:** A base component for all card-like UI elements. It provides the standard "glass pane" styling and an interactive glow effect on hover when an `onClick` handler is present.

```typescript
import React, { forwardRef, useRef, memo } from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card = memo(forwardRef<HTMLDivElement, CardProps>(({ children, className = '', ...props }, ref) => {
  const isInteractive = !!props.onClick;
  const internalRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!internalRef.current) return;
    const rect = internalRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    internalRef.current.style.setProperty('--x', `${x}px`);
    internalRef.current.style.setProperty('--y', `${y}px`);
  };

  return (
    <div
      ref={(node) => {
        internalRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={`glass-pane rounded-xl p-4 ${isInteractive ? 'card-interactive-glow' : ''} ${className}`}
      onMouseMove={isInteractive ? handleMouseMove : undefined}
      {...props}
    >
      {children}
    </div>
  );
}));
```

### `components/common/CommandPalette.tsx`

**Purpose:** Implements a `Cmd/Ctrl + K` style command palette for quick navigation and actions, providing a power-user experience.

```typescript
import React, { useMemo, useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Command } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { groupAndSortCommands } from '@/services/commandService';
import { useCommandPalette } from '@/hooks/useCommandPalette';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslations();
  const modalRef = useFocusTrap(isOpen);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const { allCommands } = useCommandPalette();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
    }
  }, [isOpen]);

  const displayedCommands = useMemo(() => {
    if (!query.trim()) return groupAndSortCommands(allCommands);
    
    const lowerCaseQuery = query.toLowerCase();
    const fuzzyRegex = new RegExp(lowerCaseQuery.split('').map(escapeRegExp).join('.*?'), 'i');

    const filtered = allCommands.filter((command) => {
        const commandText = [
            command.title,
            command.group,
            command.keywords || '',
            command.subtitle || ''
        ].join(' ').toLowerCase();
        return fuzzyRegex.test(commandText);
    });
    
    return groupAndSortCommands(filtered);
  }, [query, allCommands]);

  const handleCommandClick = (command: Command) => {
    if (!command.isHeader) {
      command.action();
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-start justify-center p-4 pt-[15vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('commandPalette.title')}
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-slate-800/90 backdrop-blur-lg rounded-lg shadow-2xl border border-slate-700 modal-content-animate"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-slate-700 relative">
            <PhosphorIcons.MagnifyingGlass className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"/>
            <input 
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('commandPalette.placeholder')}
                className="w-full bg-slate-800 pl-10 pr-4 py-2 rounded-md focus:outline-none text-slate-100"
            />
        </div>
        {displayedCommands.length > 0 ? (
          <ul id="command-results-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
            {displayedCommands.map((command) => {
              if (command.isHeader) {
                return (
                  <li key={command.id} role="presentation" className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                      {command.title}
                  </li>
                );
              }
              
              const CommandIcon = command.icon;
              return (
                <li
                  key={command.id}
                  role="option"
                  onClick={() => handleCommandClick(command)}
                  className="flex items-center justify-between gap-4 p-3 rounded-md cursor-pointer transition-colors duration-100 text-slate-300 hover:bg-slate-700/50 hover:text-primary-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 flex-shrink-0">
                      <CommandIcon />
                    </div>
                    <div className="truncate">
                      <p className="font-semibold truncate">{command.title}</p>
                       {command.subtitle && <p className="text-xs text-slate-400 truncate">{command.subtitle}</p>}
                    </div>
                  </div>
                  {command.shortcut && (
                    <div className="flex gap-1 flex-shrink-0">
                      {command.shortcut.map(key => <kbd key={key}>{key}</kbd>)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-3">
            <PhosphorIcons.CommandLine className="w-8 h-8 text-slate-500"/>
            <p>{t('commandPalette.noResults')}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
```

... and so on for all other common components ...

---

## 2. `components/icons/`

This directory contains SVG icon components.

### `components/icons/CannabisLeafIcon.tsx`

**Purpose:** The main brand icon for the application, combining a cannabis leaf with a magnifying glass.

```typescript
import React from 'react';

// This is a composite icon representing the CannaGuide brand: a magnifying glass over a cannabis leaf.
// It symbolizes the app's core functions: guidance, analysis, and discovery.
export const CannabisLeafIcon: React.FC<{className?: string}> = ({className}) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className={className}
        aria-hidden="true"
    >
        <defs>
            <linearGradient id="cannaGuideLeafGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                {/* --color-primary-400 from forest theme */}
                <stop offset="0%" style={{ stopColor: 'rgb(74, 222, 128)' }} />
                {/* --color-accent-500 from forest theme */}
                <stop offset="100%" style={{ stopColor: 'rgb(16, 185, 129)' }} />
            </linearGradient>
        </defs>
        
        {/* Magnifying glass shape, using currentColor for its stroke to match the text color */}
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        
        {/* Stylized cannabis leaf inside the lens, filled with the defined gradient */}
        <g transform="translate(5.2, 5.2) scale(0.6)">
            <path 
                fill="url(#cannaGuideLeafGradient)" 
                stroke="none" 
                d="M20.21,12.79a.78.78,0,0,0,0-1.11,5.27,5.27,0,0,1-3.79-3.79.78.78,0,0,0-1.11,0L12,11.16,8.69,7.89a.78.78,0,0,0-1.11,0A5.27,5.27,0,0,1,3.79,11.68a.78.78,0,0,0,0,1.11L7.06,16a.79.79,0,0,0,1.11,0,3.15,3.15,0,0,0,4.46,0,.79.79,0,0,0,1.11,0Z" 
            />
            <path 
                fill="url(#cannaGuideLeafGradient)" 
                stroke="none" 
                d="M16.94,16a.79.79,0,0,0,1.11,0L21.42,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L18.05,13.2A5.28,5.28,0,0,1,16.94,16Z" 
            />
            <path 
                fill="url(#cannaGuideLeafGradient)" 
                stroke="none" 
                d="M12,21.9a.79.79,0,0,0,.55-.22l3.27-3.27a.78.78,0,0,0-1.11-1.11L12,20,9.29,17.31a.78.78,0,0,0-1.11,1.11L11.45,21.68A.79.79,0,0,0,12,21.9Z" 
            />
            <path 
                fill="url(#cannaGuideLeafGradient)" 
                stroke="none" 
                d="M2.58,12a.79.79,0,0,0,0-1.12.78.78,0,0,0-1.11,0L.1,12.21a.78.78,0,0,0,0,1.11.77.77,0,0,0,.55.22.79.79,0,0,0,.56-.22l1.37-1.37A5.28,5.28,0,0,1,2.58,12Z" 
            />
        </g>
    </svg>
);
```

... and so on for all other icon components ...

---

## 3. `components/navigation/`

This directory contains components related to app navigation, like the header and bottom bar.

### `components/navigation/BottomNav.tsx`

**Purpose:** Renders the main bottom navigation bar for mobile-first navigation between the primary app views.

```typescript
import React from 'react';
import { View } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { selectActiveView } from '@/stores/slices/uiSlice';

const navIcons: Record<string, React.ReactNode> = {
    [View.Strains]: <PhosphorIcons.Leafy />,
    [View.Plants]: <PhosphorIcons.Plant />,
    [View.Equipment]: <PhosphorIcons.Wrench />,
    [View.Knowledge]: <PhosphorIcons.BookOpenText />,
};

const mainNavViews: View[] = [View.Strains, View.Plants, View.Equipment, View.Knowledge];

export const BottomNav: React.FC = () => {
    const { t } = useTranslations();
    const activeView = useAppStore(selectActiveView);
    const setActiveView = useAppStore(state => state.setActiveView);

    const navLabels: Record<View, string> = {
        [View.Strains]: t('nav.strains'),
        [View.Plants]: t('nav.plants'),
        [View.Equipment]: t('nav.equipment'),
        [View.Knowledge]: t('nav.knowledge'),
        [View.Settings]: t('nav.settings'),
        [View.Help]: t('nav.help'),
    };
    
    return (
        <nav className="glass-pane border-t-0 flex-shrink-0 z-20">
            <div className="flex justify-around max-w-5xl mx-auto">
                {mainNavViews.map((viewValue) => {
                    const isActive = activeView === viewValue;
                    return (
                        <button
                            key={viewValue}
                            onClick={() => setActiveView(viewValue)}
                            className={`relative flex flex-col items-center justify-center w-full py-2 transition-all duration-300 rounded-lg ${
                                isActive ? 'text-primary-300 bg-primary-500/10' : 'text-slate-400 hover:text-primary-300 hover:bg-slate-700/50'
                            }`}
                        >
                            <div className="w-6 h-6">{navIcons[viewValue]}</div>
                            <span className="text-xs font-semibold relative">
                                {navLabels[viewValue]}
                                <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-primary-400 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}></span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
```

... and so on for all other components in all directories ...
