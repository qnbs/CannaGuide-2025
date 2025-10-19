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
                if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    if (props.onClick) {
                        // Create a synthetic mouse event to satisfy the handler's type
                        const mockMouseEvent = {
                            ...e,
                            // Add any necessary properties from MouseEvent
                        } as unknown as React.MouseEvent<HTMLDivElement>
                        props.onClick(mockMouseEvent)
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
