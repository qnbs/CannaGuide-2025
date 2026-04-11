import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { Textarea } from './textarea'

describe('Textarea', () => {
    it('renders a basic textarea without error attributes', () => {
        render(<Textarea data-testid="ta" placeholder="Notes" />)
        const ta = screen.getByTestId('ta')
        expect(ta).not.toHaveAttribute('aria-invalid')
        expect(ta).not.toHaveAttribute('aria-describedby')
    })

    it('sets aria-invalid when error is provided', () => {
        render(<Textarea data-testid="ta" error="Required" errorId="ta-error" />)
        const ta = screen.getByTestId('ta')
        expect(ta).toHaveAttribute('aria-invalid', 'true')
    })

    it('renders error paragraph with role="alert" and matching id', () => {
        render(<Textarea error="Too long" errorId="ta-err" />)
        const errorEl = screen.getByRole('alert')
        expect(errorEl).toHaveAttribute('id', 'ta-err')
        expect(errorEl).toHaveTextContent('Too long')
    })

    it('sets aria-describedby pointing to error element id', () => {
        render(<Textarea data-testid="ta" error="Bad input" errorId="err-ta" />)
        const ta = screen.getByTestId('ta')
        expect(ta).toHaveAttribute('aria-describedby', 'err-ta')
    })

    it('preserves existing aria-describedby when no error', () => {
        render(<Textarea data-testid="ta" aria-describedby="hint" />)
        const ta = screen.getByTestId('ta')
        expect(ta).toHaveAttribute('aria-describedby', 'hint')
    })

    it('applies error border class when error is set', () => {
        render(<Textarea data-testid="ta" error="Err" errorId="e" />)
        const ta = screen.getByTestId('ta')
        expect(ta.className).toContain('border-rose-500')
    })

    it('forwards ref correctly', () => {
        const ref = createRef<HTMLTextAreaElement>()
        render(<Textarea ref={ref} data-testid="ta" />)
        expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    })
})
