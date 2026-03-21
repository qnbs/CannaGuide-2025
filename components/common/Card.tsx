import React, { forwardRef, useRef, memo } from 'react'

type CardClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    children: React.ReactNode
    className?: string
    onClick?: CardClickHandler
}

export const Card = memo(
    forwardRef<HTMLDivElement, CardProps>(
        ({ children, className = '', onClick, ...props }, ref) => {
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
                    className={`glass-pane rounded-[1.35rem] p-4 sm:p-5 ${
                        isInteractive ? 'card-interactive card-interactive-glow' : ''
                    } ${className}`}
                    onMouseMove={isInteractive ? handleMouseMove : undefined}
                    {...props}
                >
                    {isInteractive ? (
                        <button
                            type="button"
                            onClick={onClick}
                            className="w-full rounded-[inherit] bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                            {children}
                        </button>
                    ) : (
                        children
                    )}
                </div>
            )
        },
    ),
)
