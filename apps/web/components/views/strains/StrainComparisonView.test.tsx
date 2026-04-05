import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { StrainType, type Strain } from '@/types'
import {
    StrainComparisonView,
    normalizeTHC,
    normalizeCBD,
    normalizeFloweringTime,
    yieldLevelToScore,
} from './StrainComparisonView'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/stores/store', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: vi.fn(),
}))

vi.mock('@/stores/selectors', () => ({
    selectFavoriteIds: vi.fn(),
}))

vi.mock('@/stores/slices/favoritesSlice', () => ({
    toggleFavorite: vi.fn((id: string) => ({ type: 'favorites/toggleFavorite', payload: id })),
}))

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en' },
    }),
}))

vi.mock('recharts', () => ({
    RadarChart: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="radar-chart">{children}</div>
    ),
    Radar: () => <div data-testid="radar" />,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="responsive-container">{children}</div>
    ),
    Legend: () => null,
    Tooltip: () => null,
}))

vi.mock('@/components/icons/PhosphorIcons', () => ({
    PhosphorIcons: {
        Columns: () => <div data-testid="icon-columns" />,
        MagnifyingGlass: () => <div data-testid="icon-search" />,
        Heart: () => <div data-testid="icon-heart" />,
        X: () => <div data-testid="icon-x" />,
    },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeStrain = (id: string, name: string, thc = 20, cbd = 1): Strain => ({
    id,
    name,
    type: StrainType.Hybrid,
    floweringType: 'Photoperiod',
    thc,
    cbd,
    floweringTime: 63,
    agronomic: {
        difficulty: 'Medium',
        yield: 'High',
        height: 'Medium',
    },
    dominantTerpenes: ['Myrcene', 'Limonene', 'Caryophyllene'],
    geneticModifiers: {
        pestResistance: 1,
        nutrientUptakeRate: 1,
        stressTolerance: 1,
        rue: 1.4,
        vpdTolerance: { min: 0.8, max: 1.4 },
        transpirationFactor: 1,
        stomataSensitivity: 1,
    },
})

const STRAINS: Strain[] = [
    makeStrain('s1', 'Blue Dream', 21, 1),
    makeStrain('s2', 'OG Kush', 25, 0.5),
    makeStrain('s3', 'CBD Harlequin', 6, 12),
    makeStrain('s4', 'Jack Herer', 18, 1),
]

// ---------------------------------------------------------------------------
// Test setup helper
// ---------------------------------------------------------------------------

import React from 'react'
import { useAppSelector } from '@/stores/store'

const mockedUseAppSelector = vi.mocked(useAppSelector)

beforeEach(() => {
    mockedUseAppSelector.mockReturnValue(new Set<string>())
})

function renderView(strains: Strain[] = STRAINS) {
    return render(<StrainComparisonView allStrains={strains} />)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StrainComparisonView', () => {
    it('shows empty hint when no strains are selected', () => {
        renderView()
        expect(screen.getByText('strainsView.comparison.emptyHint')).toBeDefined()
    })

    it('shows a search input', () => {
        renderView()
        const input = screen.getByRole('textbox')
        expect(input).toBeDefined()
    })

    it('adds a strain when selected from suggestions', () => {
        renderView()
        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: 'Blue' } })
        const suggestion = screen.getByText('Blue Dream')
        fireEvent.click(suggestion)
        // Table row with strain name should appear
        expect(screen.getByText('Blue Dream')).toBeDefined()
    })

    it('removes a strain when remove button clicked', () => {
        renderView()
        // Add strain first
        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: 'OG' } })
        fireEvent.click(screen.getByText('OG Kush'))
        // Remove it
        const removeBtn = screen.getByLabelText('strainsView.comparison.removeStrain')
        fireEvent.click(removeBtn)
        expect(screen.queryByText('OG Kush')).toBeNull()
    })

    it('shows maxReached message when 3 strains are selected', () => {
        renderView()
        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: 'Blue' } })
        fireEvent.click(screen.getByText('Blue Dream'))
        fireEvent.change(input, { target: { value: 'OG' } })
        fireEvent.click(screen.getByText('OG Kush'))
        fireEvent.change(input, { target: { value: 'CBD' } })
        fireEvent.click(screen.getByText('CBD Harlequin'))
        expect(screen.getByText('strainsView.comparison.maxReached')).toBeDefined()
    })

    it('does not add a 4th strain when max is reached', () => {
        renderView()
        const input = screen.getByRole('textbox')
        // Add 3 strains
        fireEvent.change(input, { target: { value: 'Blue' } })
        fireEvent.click(screen.getByText('Blue Dream'))
        fireEvent.change(input, { target: { value: 'OG' } })
        fireEvent.click(screen.getByText('OG Kush'))
        fireEvent.change(input, { target: { value: 'CBD' } })
        fireEvent.click(screen.getByText('CBD Harlequin'))
        // Jack Herer should not appear in suggestions (input disabled)
        expect(screen.queryByText('Jack Herer')).toBeNull()
    })

    it('renders RadarChart when at least one strain is selected', () => {
        renderView()
        const input = screen.getByRole('textbox')
        fireEvent.change(input, { target: { value: 'Blue' } })
        fireEvent.click(screen.getByText('Blue Dream'))
        expect(screen.getByTestId('radar-chart')).toBeDefined()
        expect(screen.getByTestId('responsive-container')).toBeDefined()
    })

    it('shows favorites quick-add list when favorites exist and max not reached', () => {
        mockedUseAppSelector.mockReturnValue(new Set(['s2']))
        renderView()
        expect(screen.getByText('OG Kush')).toBeDefined()
    })
})

// ---------------------------------------------------------------------------
// Normalization utility tests
// ---------------------------------------------------------------------------

describe('normalizeTHC', () => {
    it('normalizes 35% THC to 100', () => {
        expect(normalizeTHC(35)).toBe(100)
    })

    it('normalizes 0% THC to 0', () => {
        expect(normalizeTHC(0)).toBe(0)
    })

    it('normalizes 30% THC correctly (30/35 * 100 rounded)', () => {
        expect(normalizeTHC(30)).toBe(86)
    })

    it('caps values above 35% at 100', () => {
        expect(normalizeTHC(50)).toBe(100)
    })
})

describe('normalizeCBD', () => {
    it('normalizes 20% CBD to 100', () => {
        expect(normalizeCBD(20)).toBe(100)
    })

    it('normalizes 10% CBD to 50', () => {
        expect(normalizeCBD(10)).toBe(50)
    })
})

describe('normalizeFloweringTime', () => {
    it('normalizes 56 days (fastest) to 100', () => {
        expect(normalizeFloweringTime(56)).toBe(100)
    })

    it('normalizes 112 days (slowest) to 0', () => {
        expect(normalizeFloweringTime(112)).toBe(0)
    })
})

describe('yieldLevelToScore', () => {
    it('Low yields 30', () => {
        expect(yieldLevelToScore('Low')).toBe(30)
    })

    it('Medium yields 60', () => {
        expect(yieldLevelToScore('Medium')).toBe(60)
    })

    it('High yields 90', () => {
        expect(yieldLevelToScore('High')).toBe(90)
    })
})
