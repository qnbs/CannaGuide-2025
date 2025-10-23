import React, { forwardRef, useRef, memo, useCallback } from 'react'

// Define a union type for the event handler to accept both mouse and keyboard events.
type CardClickEvent = React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>;
type CardClickHandler = (event: CardClickEvent) => void;

// Omit the original 'onClick' from HTMLAttributes and define our own with the broader type.
interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    children: React.ReactNode
    className?: string
    onClick?: CardClickHandler
}

export const Card = memo(
    forwardRef<HTMLDivElement, CardProps>(({ children, className = '', onClick, ...props }, ref) => {
        const isInteractive = !!onClick
        const internalRef = useRef<HTMLDivElement | null>(null)

        const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
            if (!internalRef.current) return
            const rect = internalRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            internalRef.current.style.setProperty('--x', `${x}px`)
            internalRef.current.style.setProperty('--y', `${y}px`)
        }

        const handleKeyDown = useCallback(
            (e: React.KeyboardEvent<HTMLDivElement>) => {
                const target = e.target as HTMLElement;
                const isFormElement = 
                    target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.tagName === 'SELECT' || 
                    target.isContentEditable;

                if (isInteractive && !isFormElement && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    if (onClick) {
                        // This is now type-safe, as the onClick prop accepts KeyboardEvent.
                        onClick(e)
                    }
                }
            },
            [isInteractive, onClick],
        )

        // Wrapper for the native div onClick, which only accepts MouseEvents.
        const handleMouseClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
            if (onClick) {
                onClick(e);
            }
        }, [onClick]);

        return (
            <div
                ref={(node) => {
                    internalRef.current = node
                    if (typeof ref === 'function') {
                        ref(node)
                    } else if (ref) {
                        ref.current = node
                    }
                }}
                className={`glass-pane rounded-xl p-4 ${
                    isInteractive ? 'card-interactive card-interactive-glow' : ''
                } ${className}`}
                onMouseMove={isInteractive ? handleMouseMove : undefined}
                role={isInteractive ? 'button' : undefined}
                tabIndex={isInteractive ? 0 : undefined}
                // Use the type-safe handlers
                onClick={isInteractive ? handleMouseClick : undefined}
                onKeyDown={isInteractive ? handleKeyDown : undefined}
                {...props}
            >
                {children}
            </div>
        )
    }),
)
