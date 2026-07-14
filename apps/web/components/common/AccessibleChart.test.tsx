/**
 * AccessibleChart.test.tsx
 *
 * Covers the accessibility contract of the shared chart wrapper: the figure is
 * named by its caption, described when a description is passed, and always
 * exposes the plotted series as a real table for screen readers.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, within } from '@testing-library/react'
import React from 'react'

// ResponsiveContainer measures its parent, which jsdom never lays out -- it would
// render nothing. Pass the chart through instead so the wrapper stays testable.
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="responsive-container">{children}</div>
    ),
}))

import { AccessibleChart, CHART_MARGIN, type AccessibleChartProps } from './AccessibleChart'

interface Reading {
    hour: number
    vpd: number
    humidity: number
}

const data: Reading[] = [
    { hour: 0, vpd: 0.9, humidity: 65 },
    { hour: 1, vpd: 1.25, humidity: 60 },
]

const renderChart = (props: Partial<AccessibleChartProps<Reading>> = {}) =>
    render(
        <AccessibleChart<Reading>
            label="VPD chart"
            data={data}
            categoryKey="hour"
            categoryLabel="Hour"
            series={[
                { dataKey: 'vpd', label: 'VPD', format: (v) => `${String(v)} kPa` },
                { dataKey: 'humidity', label: 'Humidity' },
            ]}
            {...props}
        >
            <svg data-testid="chart" />
        </AccessibleChart>,
    )

afterEach(() => {
    cleanup()
})

describe('AccessibleChart', () => {
    it('names the figure with its caption', () => {
        renderChart()
        expect(screen.getByRole('figure', { name: 'VPD chart' })).toBeDefined()
    })

    it('does not set aria-describedby when no description is passed', () => {
        renderChart()
        expect(screen.getByRole('figure').getAttribute('aria-describedby')).toBeNull()
    })

    it('describes the figure when a description is passed', () => {
        renderChart({ description: 'Vapor pressure deficit over 24 hours' })
        const figure = screen.getByRole('figure')
        const descId = figure.getAttribute('aria-describedby')
        expect(descId).toBeTruthy()
        expect(document.getElementById(descId ?? '')?.textContent).toBe(
            'Vapor pressure deficit over 24 hours',
        )
    })

    it('exposes every series as a column of the screen-reader table', () => {
        renderChart()
        const table = screen.getByRole('table', { name: 'VPD chart' })
        const headers = within(table)
            .getAllByRole('columnheader')
            .map((th) => th.textContent)
        expect(headers).toEqual(['Hour', 'VPD', 'Humidity'])
    })

    it('renders one table row per data point, applying the series formatter', () => {
        renderChart()
        const table = screen.getByRole('table')
        const rows = within(table).getAllByRole('row')
        // 1 header row + 2 data rows
        expect(rows).toHaveLength(3)

        const [firstDataRow] = within(table).getAllByRole('rowheader')
        expect(firstDataRow?.textContent).toBe('0')

        const firstRow = rows[1]
        if (!firstRow) throw new Error('expected a data row')
        expect(within(firstRow).getAllByRole('cell').map((td) => td.textContent)).toEqual([
            '0.9 kPa',
            '65',
        ])
    })

    it('still renders the chart passed as children', () => {
        renderChart()
        expect(screen.getByTestId('chart')).toBeDefined()
    })

    it('exports a shared chart margin so views stop redeclaring it', () => {
        expect(CHART_MARGIN).toEqual({ top: 12, right: 8, left: 0, bottom: 6 })
    })
})
