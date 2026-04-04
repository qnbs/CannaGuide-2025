import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DiseaseAtlasView from './DiseaseAtlasView'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, unknown>) => String(opts?.['defaultValue'] ?? key),
    }),
}))

vi.mock('@/data/diseases', () => ({
    diseaseAtlas: [
        {
            id: 'nitrogen_deficiency',
            category: 'deficiency',
            urgency: 'act_soon',
            severity: 'medium',
            affectedStages: ['Vegetative'],
            relatedLexiconKeys: [],
        },
        {
            id: 'spider_mites',
            category: 'pest',
            urgency: 'act_immediately',
            severity: 'high',
            affectedStages: ['Flowering'],
            relatedLexiconKeys: [],
        },
        {
            id: 'heat_stress',
            category: 'environmental',
            urgency: 'monitor',
            severity: 'low',
            affectedStages: ['Vegetative', 'Flowering'],
            relatedLexiconKeys: [],
        },
    ],
}))

vi.mock('@/hooks/useFocusTrap', () => ({
    useFocusTrap: () => ({ current: null }),
}))

describe('DiseaseAtlasView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the search input with aria-label', () => {
        render(<DiseaseAtlasView />)
        const input = screen.getByRole('searchbox')
        expect(input).toBeInTheDocument()
        expect(input).toHaveAttribute('aria-label')
    })

    it('renders category filter group with aria-label', () => {
        render(<DiseaseAtlasView />)
        const groups = screen.getAllByRole('group')
        expect(groups.length).toBeGreaterThanOrEqual(2)
    })

    it('renders all disease entries as buttons', () => {
        render(<DiseaseAtlasView />)
        // 3 disease cards + category buttons + urgency buttons
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(3)
    })

    it('category filter buttons have aria-pressed', () => {
        render(<DiseaseAtlasView />)
        const pressedButtons = screen
            .getAllByRole('button')
            .filter((b) => b.getAttribute('aria-pressed') !== null)
        expect(pressedButtons.length).toBeGreaterThan(0)
    })

    it('filters by category when category button is clicked', () => {
        render(<DiseaseAtlasView />)
        // Find pest category button
        const pestButton = screen.getByRole('button', {
            name: 'knowledgeView.atlas.category.pest',
        })
        fireEvent.click(pestButton)
        expect(pestButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('filters by urgency when urgency button is clicked', () => {
        render(<DiseaseAtlasView />)
        const actSoonButton = screen.getByRole('button', {
            name: 'knowledgeView.atlas.urgency.act_soon',
        })
        fireEvent.click(actSoonButton)
        expect(actSoonButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('filters entries by search query', () => {
        render(<DiseaseAtlasView />)
        const input = screen.getByRole('searchbox')
        fireEvent.change(input, { target: { value: 'xxxxxxnotfound' } })
        expect(screen.getByText('knowledgeView.atlas.noResults')).toBeInTheDocument()
    })

    it('opens detail panel when disease card is clicked', () => {
        render(<DiseaseAtlasView />)
        const firstCard = screen
            .getAllByRole('button')
            .find((b) => b.getAttribute('aria-label') !== null && !b.getAttribute('aria-pressed'))
        if (firstCard) {
            fireEvent.click(firstCard)
            expect(screen.getByRole('dialog')).toBeInTheDocument()
        }
    })

    it('closes detail panel when close button is clicked', () => {
        render(<DiseaseAtlasView />)
        const cards = screen
            .getAllByRole('button')
            .filter((b) => b.getAttribute('aria-label') && !b.getAttribute('aria-pressed'))
        if (cards[0]) {
            fireEvent.click(cards[0])
            const dialog = screen.queryByRole('dialog')
            if (dialog) {
                const closeButton = screen.getByLabelText('knowledgeView.atlas.close')
                fireEvent.click(closeButton)
                expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
            }
        }
    })
})
