import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SafeHtml } from './SafeHtml'

afterEach(cleanup)

describe('SafeHtml with the real sanitizer', () => {
    it('preserves useful formatted output and safe links', () => {
        const { container } = render(
            <SafeHtml html='<h2>Grow notes</h2><p>Keep <strong>pH 6.2</strong>.</p><ul><li>Water slowly</li></ul><a href="https://example.com/guide">Guide</a>' />,
        )

        expect(screen.getByRole('heading', { name: 'Grow notes' })).toBeInTheDocument()
        expect(container.querySelector('strong')).toHaveTextContent('pH 6.2')
        expect(screen.getByRole('listitem')).toHaveTextContent('Water slowly')
        expect(screen.getByRole('link', { name: 'Guide' })).toHaveAttribute(
            'href',
            'https://example.com/guide',
        )
    })

    it.each([
        '<script>window.compromised = true</script><p>Safe note</p>',
        '<img src="data:," onerror="window.compromised = true"><p>Safe note</p>',
        '<svg onload="window.compromised = true"></svg><p>Safe note</p>',
        '<iframe srcdoc="<script>window.compromised = true</script>"></iframe><p>Safe note</p>',
        '<a href="javascript:alert(1)">Unsafe link</a><p>Safe note</p>',
    ])('removes executable content from rendered HTML: %s', (html) => {
        const { container } = render(<SafeHtml html={html} />)

        expect(screen.getByText('Safe note')).toBeInTheDocument()
        expect(container.querySelector('script, iframe')).toBeNull()
        for (const element of container.querySelectorAll('*')) {
            for (const attribute of element.attributes) {
                expect(attribute.name).not.toMatch(/^on/i)
                if (attribute.name === 'href') {
                    expect(attribute.value).not.toMatch(/^javascript:/i)
                }
            }
        }
    })

    it('sanitizes replacement content when the response changes', () => {
        const { container, rerender } = render(<SafeHtml html="<p>Original</p>" />)

        rerender(<SafeHtml html='<p onclick="alert(1)">Updated</p>' />)

        expect(screen.queryByText('Original')).not.toBeInTheDocument()
        expect(screen.getByText('Updated')).toBeInTheDocument()
        expect(container.querySelector('[onclick]')).toBeNull()
    })
})
