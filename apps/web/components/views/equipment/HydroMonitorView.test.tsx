import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/tests/test-utils'
import { HydroMonitorView } from './HydroMonitorView'

// Mock recharts to avoid canvas issues in test environment
vi.mock('recharts', () => ({
    LineChart: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="line-chart">{children}</div>
    ),
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    CartesianGrid: () => null,
}))

// Mock hydroForecastService
vi.mock('@/services/hydroForecastService', () => ({
    forecastNextHour: vi.fn().mockResolvedValue({
        nextHour: { ph: 6.1, ec: 1.5, temp: 21.5 },
        trend: 'stable',
        confidence: 0.3,
        alerts: [],
        modelBased: false,
    }),
    initForecastModel: vi.fn().mockResolvedValue(undefined),
    isModelReady: vi.fn().mockReturnValue(false),
}))

describe('HydroMonitorView', () => {
    it('renders without crash', () => {
        renderWithProviders(<HydroMonitorView />)
        expect(screen.getByText('Hydroponic Monitoring')).toBeInTheDocument()
    })

    it('displays system type selector', () => {
        renderWithProviders(<HydroMonitorView />)
        const select = screen.getByRole('combobox')
        expect(select).toBeInTheDocument()
    })

    it('shows gauge cards', () => {
        renderWithProviders(<HydroMonitorView />)
        expect(screen.getAllByText('pH').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('EC').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Water Temp').length).toBeGreaterThanOrEqual(1)
    })

    it('submits manual reading via form', async () => {
        const user = userEvent.setup()
        renderWithProviders(<HydroMonitorView />)

        const phInput = screen.getByLabelText('pH')
        const ecInput = screen.getByLabelText('EC (mS/cm)')
        const tempInput = screen.getByLabelText('Water Temp (C)')
        const addButton = screen.getByRole('button', { name: 'Add Reading' })

        await user.type(phInput, '6.2')
        await user.type(ecInput, '1.8')
        await user.type(tempInput, '21.5')
        await user.click(addButton)

        // After adding, the gauge should show the value instead of --
        await waitFor(() => {
            expect(screen.getByText('6.20')).toBeInTheDocument()
        })
    })

    it('renders forecast panel without crash', () => {
        renderWithProviders(<HydroMonitorView />)
        expect(screen.getByText('Next Hour (AI Forecast)')).toBeInTheDocument()
    })

    it('shows forecast model status badge', () => {
        renderWithProviders(<HydroMonitorView />)
        const badge = screen.getByTestId('forecast-model-badge')
        expect(badge).toBeInTheDocument()
        // Without model loaded, it should show basic mode
        expect(badge).toHaveTextContent('Basic Mode')
    })
})
