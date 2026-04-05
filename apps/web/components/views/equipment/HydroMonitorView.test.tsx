import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
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
        expect(screen.getByText('hydroMonitoring.title')).toBeInTheDocument()
    })

    it('displays system type selector', () => {
        renderWithProviders(<HydroMonitorView />)
        const select = screen.getByRole('combobox')
        expect(select).toBeInTheDocument()
    })

    it('shows gauge cards', () => {
        renderWithProviders(<HydroMonitorView />)
        expect(screen.getByText('hydroMonitoring.gauges.ph')).toBeInTheDocument()
        expect(screen.getByText('hydroMonitoring.gauges.ec')).toBeInTheDocument()
        expect(screen.getByText('hydroMonitoring.gauges.waterTemp')).toBeInTheDocument()
    })

    it('submits manual reading via form', async () => {
        const user = userEvent.setup()
        renderWithProviders(<HydroMonitorView />)

        const phInput = screen.getByLabelText('hydroMonitoring.input.ph')
        const ecInput = screen.getByLabelText('hydroMonitoring.input.ec')
        const tempInput = screen.getByLabelText('hydroMonitoring.input.waterTemp')
        const addButton = screen.getByText('hydroMonitoring.input.addReading')

        await user.type(phInput, '6.2')
        await user.type(ecInput, '1.8')
        await user.type(tempInput, '21.5')
        await user.click(addButton)

        // After adding, the gauge should show the value instead of --
        expect(screen.getByText('6.20')).toBeInTheDocument()
    })

    it('renders forecast panel without crash', () => {
        renderWithProviders(<HydroMonitorView />)
        expect(screen.getByText('hydroMonitoring.forecast.title')).toBeInTheDocument()
    })

    it('shows forecast model status badge', () => {
        renderWithProviders(<HydroMonitorView />)
        const badge = screen.getByTestId('forecast-model-badge')
        expect(badge).toBeInTheDocument()
        // Without model loaded, it should show basic mode
        expect(badge).toHaveTextContent('hydroMonitoring.forecast.basicMode')
    })
})
