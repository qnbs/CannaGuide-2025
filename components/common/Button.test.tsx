import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';
import { PhosphorIcons } from '../icons/PhosphorIcons';

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        fireEvent.click(screen.getByText('Click me'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies variant classes correctly', () => {
        const { rerender } = render(<Button variant="primary">Primary</Button>);
        expect(screen.getByText('Primary')).toHaveClass('bg-primary-500');

        rerender(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByText('Secondary')).toHaveClass('bg-slate-700');
    });

    it('applies size classes correctly', () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByText('Small')).toHaveClass('text-sm');

        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByText('Large')).toHaveClass('text-lg');
    });

    it('is disabled when the disabled prop is true', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick} disabled>Disabled</Button>);
        const button = screen.getByText('Disabled');
        expect(button).toBeDisabled();
        fireEvent.click(button);
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders as a different element using the "as" prop', () => {
        render(<Button as="a" href="/test">Link</Button>);
        const linkElement = screen.getByRole('link', { name: 'Link' });
        expect(linkElement).toBeInTheDocument();
        expect(linkElement).toHaveAttribute('href', '/test');
    });

    it('renders an icon with text', () => {
        render(<Button><PhosphorIcons.Plus /> Add</Button>);
        expect(screen.getByText('Add')).toBeInTheDocument();
        // Check if SVG is rendered
        expect(screen.getByText('Add').previousSibling).toBeInTheDocument();
        expect(screen.getByText('Add').previousSibling?.nodeName).toBe('svg');
    });
});
