import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { Input } from './input'

describe('Input', () => {
    it('renders a basic input without error attributes', () => {
        render(<Input data-testid="input" placeholder="Name" />)
        const input = screen.getByTestId('input')
        expect(input).not.toHaveAttribute('aria-invalid')
        expect(input).not.toHaveAttribute('aria-describedby')
    })

    it('sets aria-invalid when error is provided', () => {
        render(<Input data-testid="input" error="Required field" errorId="field-error" />)
        const input = screen.getByTestId('input')
        expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('renders error paragraph with role="alert" and matching id', () => {
        render(<Input error="Invalid value" errorId="my-error" />)
        const errorEl = screen.getByRole('alert')
        expect(errorEl).toHaveAttribute('id', 'my-error')
        expect(errorEl).toHaveTextContent('Invalid value')
    })

    it('sets aria-describedby pointing to error element id', () => {
        render(<Input data-testid="input" error="Too short" errorId="err-1" />)
        const input = screen.getByTestId('input')
        expect(input).toHaveAttribute('aria-describedby', 'err-1')
    })

    it('does not render error paragraph when error is set but errorId is missing', () => {
        render(<Input data-testid="input" error="Something wrong" />)
        const input = screen.getByTestId('input')
        expect(input).toHaveAttribute('aria-invalid', 'true')
        expect(screen.queryByRole('alert')).toBeNull()
    })

    it('preserves existing aria-describedby when no error', () => {
        render(<Input data-testid="input" aria-describedby="help-text" />)
        const input = screen.getByTestId('input')
        expect(input).toHaveAttribute('aria-describedby', 'help-text')
    })

    it('applies error border class when error is set', () => {
        render(<Input data-testid="input" error="Bad" errorId="e" />)
        const input = screen.getByTestId('input')
        expect(input.className).toContain('border-rose-500')
    })

    it('forwards ref correctly', () => {
        const ref = createRef<HTMLInputElement>()
        render(<Input ref={ref} data-testid="input" />)
        expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('renders no error elements when error prop is undefined', () => {
        render(<Input data-testid="input" errorId="unused" />)
        expect(screen.queryByRole('alert')).toBeNull()
        expect(screen.getByTestId('input')).not.toHaveAttribute('aria-invalid')
    })
})
