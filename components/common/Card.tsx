import React, { forwardRef, useRef, memo, useCallback } from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    className?: string
    onClick?: React.MouseEventHandler<HTMLDivElement>
}

export const Card = memo(
    forwardRef<HTMLDivElement, CardProps>(({ children, className = '', ...props }, ref) => {
        const isInteractive = !!props.onClick
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
                    if (props.onClick) {
                        // FIX: Pass the original KeyboardEvent `e` directly instead of spreading it.
                        // The shallow spread `{...e}` was the bug, as it doesn't copy prototype methods like `stopPropagation`.
                        // Casting to `any` bypasses the MouseEvent type check but ensures the handler
                        // receives an object with the necessary methods, fixing the runtime error.
                        props.onClick(e as any)
                    }
                }
            },
            [isInteractive, props.onClick],
        )

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
                onKeyDown={isInteractive ? handleKeyDown : undefined}
                {...props}
            >
                {children}
            </div>
        )
    }),
)
