import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GeneticTrendsView } from './GeneticTrendsView'

vi.mock('@/stores/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => vi.fn(),
}))

vi.mock('@/stores/selectors', () => ({
    selectSelectedPlantId: vi.fn(),
    selectPlantById: () => vi.fn(),
    selectLanguage: vi.fn(),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, _opts?: unknown) => key,
    }),
}))

vi.mock('@/services/trendsEcosystemService', () => ({
    calculateGeneticTrendMatchScore: vi.fn(() => ({
        category: 'terpeneDiversity',
        score: 80,
        reason: 'test',
    })),
    getRelatedGrowTechForGenetic: vi.fn(() => ['sensorsIoT']),
}))

vi.mock('@/services/aiFacade', () => ({
    aiService: {
        getGeneticTrendAnalysis: vi
            .fn()
            .mockResolvedValue({ title: 'Test', content: 'AI content' }),
    },
}))

import { useAppSelector } from '@/stores/store'

const CATEGORY_IDS = [
    'terpeneDiversity',
    'ultraPotency',
    'balancedHybrids',
    'autofloweringRevolution',
    'advancedBreeding',
    'landraceRevival',
]

describe('GeneticTrendsView', () => {
    beforeEach(() => {
        vi.mocked(useAppSelector).mockReturnValue(null)
    })

    it('renders the search filter input', () => {
        render(<GeneticTrendsView />)
        expect(
            screen.getByPlaceholderText('strainsView.geneticTrends.searchPlaceholder'),
        ).toBeInTheDocument()
    })

    it('renders all 6 category accordion items', () => {
        render(<GeneticTrendsView />)
        const items = screen.getAllByRole('listitem')
        expect(items.length).toBeGreaterThanOrEqual(CATEGORY_IDS.length)
    })

    it('shows noPlantSelected message when no plant is active', () => {
        render(<GeneticTrendsView />)
        expect(screen.getByText('strainsView.geneticTrends.noPlantSelected')).toBeInTheDocument()
    })

    it('expands a category on button click and sets aria-expanded', () => {
        render(<GeneticTrendsView />)
        const trigger = screen.getByRole('button', {
            name: (name) =>
                name.includes('strainsView.geneticTrends.categories.terpeneDiversity.title'),
        })
        expect(trigger).toHaveAttribute('aria-expanded', 'false')
        fireEvent.click(trigger)
        expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('collapses a category when clicked again', () => {
        render(<GeneticTrendsView />)
        const trigger = screen.getByRole('button', {
            name: (name) =>
                name.includes('strainsView.geneticTrends.categories.terpeneDiversity.title'),
        })
        fireEvent.click(trigger)
        expect(trigger).toHaveAttribute('aria-expanded', 'true')
        fireEvent.click(trigger)
        expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('shows no-results message when filter has no match', () => {
        render(<GeneticTrendsView />)
        const input = screen.getByPlaceholderText('strainsView.geneticTrends.searchPlaceholder')
        fireEvent.change(input, { target: { value: 'zzznomatch' } })
        expect(screen.getByText('strainsView.geneticTrends.noMatchResults')).toBeInTheDocument()
    })

    it('clear button removes filter text', () => {
        render(<GeneticTrendsView />)
        const input = screen.getByPlaceholderText(
            'strainsView.geneticTrends.searchPlaceholder',
        ) as HTMLInputElement
        fireEvent.change(input, { target: { value: 'terpene' } })
        expect(input.value).toBe('terpene')
        const clearBtn = screen.getByRole('button', { name: 'common.clearSearch' })
        fireEvent.click(clearBtn)
        expect(input.value).toBe('')
    })

    it('shows match score badge when active plant is set', () => {
        const mockPlant = {
            id: 'p1',
            stage: 'VEGETATIVE',
            mediumType: 'Soil',
            strain: { floweringType: 'Autoflower' },
        }
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            if (typeof selector === 'function') return mockPlant
            return null
        })
        render(<GeneticTrendsView />)
        const badges = screen.getAllByText('80%')
        expect(badges.length).toBeGreaterThan(0)
    })
})
