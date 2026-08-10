import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

// Suppress console.error from componentDidCatch to keep test output clean
beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
})

const ThrowingComponent = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error')
    }
    return <div>Child content</div>
}

describe('ErrorBoundary', () => {
    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <div>Normal content</div>
            </ErrorBoundary>,
        )
        expect(screen.getByText('Normal content')).toBeInTheDocument()
    })

    it('renders fallback UI when child throws', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent />
            </ErrorBoundary>,
        )
        // The fallback uses i18n keys, check for buttons
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThanOrEqual(1)
    })

    it('does not request destructive recovery when a child throws', () => {
        const recoveryHandler = vi.fn()
        window.addEventListener('cannaguide-safe-recovery-request', recoveryHandler)

        render(
            <ErrorBoundary>
                <ThrowingComponent />
            </ErrorBoundary>,
        )

        expect(recoveryHandler).not.toHaveBeenCalled()
        window.removeEventListener('cannaguide-safe-recovery-request', recoveryHandler)
    })

    it('dispatches safe recovery event when recovery button clicked', () => {
        const handler = vi.fn()
        window.addEventListener('cannaguide-safe-recovery-request', handler)

        render(
            <ErrorBoundary>
                <ThrowingComponent />
            </ErrorBoundary>,
        )

        // Click the second button (safe recovery)
        const buttons = screen.getAllByRole('button')
        const safeRecoveryBtn = buttons[buttons.length - 1]!
        fireEvent.click(safeRecoveryBtn)

        expect(handler).toHaveBeenCalledTimes(1)
        window.removeEventListener('cannaguide-safe-recovery-request', handler)
    })

    it('logs error to console.error', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent />
            </ErrorBoundary>,
        )
        expect(console.error).toHaveBeenCalled()
    })
})
