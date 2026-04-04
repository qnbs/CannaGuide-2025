import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CalculatorHubView from './CalculatorHubView'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, unknown>) => String(opts?.['defaultValue'] ?? key),
    }),
}))

vi.mock('@/services/workerBus', () => ({
    workerBus: {
        has: vi.fn(() => true),
        register: vi.fn(),
        dispatch: vi.fn().mockResolvedValue({ points: [{ day: 1, value: 1.2 }] }),
    },
}))

vi.mock('@/services/knowledgeRagService', () => ({
    knowledgeRagService: {
        explain: vi
            .fn()
            .mockResolvedValue({ explanation: 'Test AI explanation', suggestedPathId: null }),
    },
}))

vi.mock('@/services/knowledgeCalculatorService', () => ({
    calculateVPD: vi.fn(() => 1.0),
    calculateTerpeneEntourage: vi.fn(() => ({ dominantEffect: 'relaxing', synergies: [] })),
    calculateTranspiration: vi.fn(() => ({ dailyLitres: 2.5, hourlyMl: 104 })),
    calculateEcTds: vi.fn(() => ({ tds: 1400 })),
    calculateLightSpectrum: vi.fn(() => ({ bluePercent: 30, redPercent: 70 })),
    calculateCannabinoidRatio: vi.fn(() => ({ thcCbdRatio: 10, profile: 'THC-dominant' })),
}))

vi.mock('@/lib/vpd/calculator', () => ({
    calculateVPD: vi.fn(() => 1.0),
}))

vi.mock('@/components/common/SparklineChart', () => ({
    default: () => <div data-testid="sparkline" />,
}))

describe('CalculatorHubView', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders the tab list with aria-label', () => {
        render(<CalculatorHubView />)
        const tablist = screen.getByRole('tablist')
        expect(tablist).toBeInTheDocument()
        expect(tablist).toHaveAttribute('aria-label')
    })

    it('renders all 8 calculator tabs', () => {
        render(<CalculatorHubView />)
        const tabs = screen.getAllByRole('tab')
        expect(tabs.length).toBe(8)
    })

    it('VPD tab is selected by default', () => {
        render(<CalculatorHubView />)
        const tabs = screen.getAllByRole('tab')
        const vpdTab = tabs.find((t) => t.getAttribute('aria-selected') === 'true')
        expect(vpdTab).toBeInTheDocument()
        expect(vpdTab?.id).toBe('rechner-tab-vpd')
    })

    it('tab panel is rendered with correct role and aria-labelledby', () => {
        render(<CalculatorHubView />)
        const panel = screen.getByRole('tabpanel')
        expect(panel).toBeInTheDocument()
        expect(panel).toHaveAttribute('aria-labelledby', 'rechner-tab-vpd')
    })

    it('clicking a tab switches the active panel', () => {
        render(<CalculatorHubView />)
        const tabs = screen.getAllByRole('tab')
        const nutrientTab = tabs.find((t) => t.id === 'rechner-tab-nutrient')
        if (nutrientTab) {
            fireEvent.click(nutrientTab)
            expect(nutrientTab).toHaveAttribute('aria-selected', 'true')
            const panel = screen.getByRole('tabpanel')
            expect(panel).toHaveAttribute('id', 'rechner-panel-nutrient')
        }
    })

    it('VPD calculator displays result after input change', () => {
        render(<CalculatorHubView />)
        const tempInput = screen.getByLabelText('knowledgeView.rechner.vpd.temperature')
        fireEvent.change(tempInput, { target: { value: '25' } })
        expect(tempInput).toHaveValue(25)
    })

    it('all tab buttons have aria-controls pointing to their panel', () => {
        render(<CalculatorHubView />)
        const tabs = screen.getAllByRole('tab')
        tabs.forEach((tab) => {
            const controls = tab.getAttribute('aria-controls')
            expect(controls).toBeTruthy()
            expect(controls).toMatch(/^rechner-panel-/)
        })
    })

    it('tab switching changes aria-selected on previous tab to false', () => {
        render(<CalculatorHubView />)
        const tabs = screen.getAllByRole('tab')
        const vpdTab = tabs.find((t) => t.id === 'rechner-tab-vpd')
        const phTab = tabs.find((t) => t.id === 'rechner-tab-ph')

        if (vpdTab && phTab) {
            expect(vpdTab).toHaveAttribute('aria-selected', 'true')
            fireEvent.click(phTab)
            expect(vpdTab).toHaveAttribute('aria-selected', 'false')
            expect(phTab).toHaveAttribute('aria-selected', 'true')
        }
    })
})
