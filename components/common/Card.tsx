import React, { forwardRef, useRef, memo } from 'react'

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
                    isInteractive ? 'card-interactive-glow' : ''
                } ${className}`}
                onMouseMove={isInteractive ? handleMouseMove : undefined}
                {...props}
            >
                {children}
            </div>
        )
    })
)
