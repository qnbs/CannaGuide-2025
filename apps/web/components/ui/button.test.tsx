import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
    it('renders with default variant', () => {
        render(<Button>Click me</Button>)
        expect(screen.getByRole('button', { name: 'Click me' })).toBeDefined()
    })

    it('renders with secondary variant', () => {
        render(<Button variant="secondary">Secondary</Button>)
        const btn = screen.getByRole('button', { name: 'Secondary' })
        expect(btn.className).toContain('backdrop-blur')
    })

    it('renders with destructive variant', () => {
        render(<Button variant="destructive">Delete</Button>)
        const btn = screen.getByRole('button', { name: 'Delete' })
        expect(btn.className).toContain('red')
    })

    it('renders with ghost variant', () => {
        render(<Button variant="ghost">Ghost</Button>)
        const btn = screen.getByRole('button', { name: 'Ghost' })
        expect(btn.className).toContain('transparent')
    })

    it('applies sm size', () => {
        render(<Button size="sm">Small</Button>)
        const btn = screen.getByRole('button', { name: 'Small' })
        expect(btn.className).toContain('text-xs')
    })

    it('applies lg size', () => {
        render(<Button size="lg">Large</Button>)
        const btn = screen.getByRole('button', { name: 'Large' })
        expect(btn.className).toContain('text-base')
    })

    it('applies icon size', () => {
        render(<Button size="icon">I</Button>)
        const btn = screen.getByRole('button', { name: 'I' })
        expect(btn.className).toContain('w-11')
    })

    it('is disabled when disabled prop set', () => {
        render(<Button disabled>Disabled</Button>)
        const btn = screen.getByRole('button', { name: 'Disabled' })
        expect(btn).toHaveProperty('disabled', true)
    })

    it('merges custom className', () => {
        render(<Button className="custom-test-class">Custom</Button>)
        const btn = screen.getByRole('button', { name: 'Custom' })
        expect(btn.className).toContain('custom-test-class')
    })
})
