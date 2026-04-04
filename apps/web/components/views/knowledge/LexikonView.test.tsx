import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LexikonView from './LexikonView'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, unknown>) => {
            if (key === 'knowledgeView.lexikon.resultCount') {
                return `${String(opts?.['count'] ?? 0)} / ${String(opts?.['total'] ?? 0)}`
            }
            return key
        },
    }),
}))

vi.mock('@/data/lexicon', () => ({
    lexiconData: [
        { key: 'thc', category: 'Cannabinoid' },
        { key: 'cbg', category: 'Cannabinoid' },
        { key: 'myrcene', category: 'Terpene' },
        { key: 'nitrogen', category: 'Nutrient' },
        { key: 'powdery_mildew', category: 'Disease' },
    ],
}))

describe('LexikonView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the search input with aria-label', () => {
        render(<LexikonView />)
        const input = screen.getByRole('searchbox')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('aria-label')
    })

    it('renders category filter group with aria-label', () => {
        render(<LexikonView />)
        const group = screen.getByRole('group')
        expect(group).toHaveAttribute('aria-label')
    })

    it('renders All + 6 category filter buttons', () => {
        render(<LexikonView />)
        const buttons = screen.getAllByRole('button')
        // All, Cannabinoid, Terpene, Flavonoid, Nutrient, Disease, General
        expect(buttons.length).toBeGreaterThanOrEqual(7)
    })

    it('category filter buttons have aria-pressed attribute', () => {
        render(<LexikonView />)
        const allButton = screen.getByRole('button', {
            name: (_n, el) => el.getAttribute('aria-pressed') === 'true',
        })
        expect(allButton).toBeInTheDocument()
    })

    it('clicking a category filter updates active state', () => {
        render(<LexikonView />)
        const cannabinoidButton = screen.getByRole('button', {
            name: 'knowledgeView.lexikon.categories.cannabinoid',
        })
        expect(cannabinoidButton).toHaveAttribute('aria-pressed', 'false')
        fireEvent.click(cannabinoidButton)
        expect(cannabinoidButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('filters entries by category when filter is selected', () => {
        render(<LexikonView />)
        const cannabinoidButton = screen.getByRole('button', {
            name: 'knowledgeView.lexikon.categories.cannabinoid',
        })
        fireEvent.click(cannabinoidButton)
        // Only Cannabinoid entries match -- thc and cbg
        const articles = screen.getAllByRole('article')
        expect(articles.length).toBe(2)
    })

    it('shows all entries with All filter active', () => {
        render(<LexikonView />)
        const articles = screen.getAllByRole('article')
        expect(articles.length).toBe(5)
    })

    it('filters by search query', () => {
        render(<LexikonView />)
        const input = screen.getByRole('searchbox')
        fireEvent.change(input, { target: { value: 'thc' } })
        // Only thc entry contains "thc" in its key (used as defaultValue)
        const articles = screen.getAllByRole('article')
        expect(articles.length).toBeLessThan(5)
    })

    it('shows no-results message when search has no match', () => {
        render(<LexikonView />)
        const input = screen.getByRole('searchbox')
        fireEvent.change(input, { target: { value: 'xxxxxxxxxnotfound' } })
        expect(screen.getByText('knowledgeView.lexikon.noResults')).toBeInTheDocument()
    })

    it('All filter button is keyboard-activatable', () => {
        render(<LexikonView />)
        const cannabinoidButton = screen.getByRole('button', {
            name: 'knowledgeView.lexikon.categories.cannabinoid',
        })
        fireEvent.click(cannabinoidButton)
        expect(cannabinoidButton).toHaveAttribute('aria-pressed', 'true')

        const allButton = screen.getByRole('button', { name: 'knowledgeView.lexikon.all' })
        fireEvent.click(allButton)
        expect(allButton).toHaveAttribute('aria-pressed', 'true')
        expect(cannabinoidButton).toHaveAttribute('aria-pressed', 'false')
    })
})
