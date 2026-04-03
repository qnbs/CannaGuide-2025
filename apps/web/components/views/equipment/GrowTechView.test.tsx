import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GrowTechView } from './GrowTechView'

vi.mock('@/stores/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: () => vi.fn(),
}))

vi.mock('@/stores/selectors', () => ({
    selectSettings: vi.fn(),
    selectLanguage: vi.fn(),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, _opts?: unknown) => key,
    }),
}))

vi.mock('dompurify', () => ({
    default: { sanitize: (s: string) => s },
}))

vi.mock('@/services/trendsEcosystemService', () => ({
    calculateGrowTechMatchScore: vi.fn(() => ({
        category: 'dynamicLighting',
        score: 80,
        reason: 'test',
    })),
    getRelatedGeneticForGrowTech: vi.fn(() => ['ultraPotency']),
}))

vi.mock('@/services/aiFacade', () => ({
    aiService: {
        getGrowTechRecommendation: vi
            .fn()
            .mockResolvedValue({ title: 'Test', content: 'AI content' }),
    },
}))

import { useAppSelector } from '@/stores/store'

const DEFAULT_SETUP = {
    lightType: 'LED',
    lightWattage: 150,
    lightHours: 18,
    dynamicLighting: false,
    ventilation: 'medium',
    hasCirculationFan: true,
    potSize: 15,
    potType: 'Fabric',
    medium: 'Soil',
}

const DEFAULT_SETTINGS = {
    defaults: { growSetup: DEFAULT_SETUP },
    general: { language: 'en' },
}

describe('GrowTechView', () => {
    beforeEach(() => {
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            if (typeof selector === 'function') {
                const key = selector.toString()
                if (key.includes('selectLanguage')) return 'en'
                return DEFAULT_SETTINGS
            }
            return DEFAULT_SETTINGS
        })
    })

    it('renders the search filter input', () => {
        render(<GrowTechView />)
        expect(
            screen.getByPlaceholderText('knowledgeView.growTech.searchPlaceholder'),
        ).toBeInTheDocument()
    })

    it('renders the AI recommendation button', () => {
        render(<GrowTechView />)
        expect(screen.getByText('knowledgeView.growTech.aiAnalyze')).toBeInTheDocument()
    })

    it('renders all 8 technology category accordion items', () => {
        render(<GrowTechView />)
        const items = screen.getAllByRole('listitem')
        expect(items.length).toBeGreaterThanOrEqual(8)
    })

    it('expands a category and shows panel with aria-expanded', () => {
        render(<GrowTechView />)
        const trigger = screen.getByRole('button', {
            name: (name) =>
                name.includes('knowledgeView.growTech.categories.dynamicLighting.title'),
        })
        expect(trigger).toHaveAttribute('aria-expanded', 'false')
        fireEvent.click(trigger)
        expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('shows no-results message when filter has no match', () => {
        render(<GrowTechView />)
        const input = screen.getByPlaceholderText('knowledgeView.growTech.searchPlaceholder')
        fireEvent.change(input, { target: { value: 'zzznomatch' } })
        expect(screen.getByText('knowledgeView.growTech.noMatchResults')).toBeInTheDocument()
    })

    it('clear button restores full list', () => {
        render(<GrowTechView />)
        const input = screen.getByPlaceholderText(
            'knowledgeView.growTech.searchPlaceholder',
        ) as HTMLInputElement
        fireEvent.change(input, { target: { value: 'lighting' } })
        const clearBtn = screen.getByRole('button', { name: 'common.clearSearch' })
        fireEvent.click(clearBtn)
        expect(input.value).toBe('')
    })

    it('renders match score badges from growSetup', () => {
        render(<GrowTechView />)
        const badges = screen.getAllByText('80%')
        expect(badges.length).toBeGreaterThan(0)
    })
})
