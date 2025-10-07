import React, { forwardRef, useRef, memo, useCallback } from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    className?: string
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

        const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
            if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                (props.onClick as any)(e);
            }
        }, [isInteractive, props.onClick]);

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
                    isInteractive ? 'card-interactive' : ''
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
    })
)
