import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HydroGaugeCard } from './HydroGaugeCard'

describe('HydroGaugeCard', () => {
    it('shows a count without a range as a plain value, not as too high (GH #686)', () => {
        render(<HydroGaugeCard label="Readings" value={200} unit="#" decimals={0} />)

        const value = screen.getByText('200')
        expect(value.className).toContain('text-emerald-400')
        expect(screen.getByText('#').textContent).toBe('#')
    })

    it('still marks a value above or below its range', () => {
        render(<HydroGaugeCard label="pH" value={7.2} unit="" min={5.5} max={6.5} />)

        expect(screen.getByText('7.2').className).toContain('text-red-400')
        expect(screen.getByText('(5.5-6.5)', { exact: false })).toBeInTheDocument()
    })
})
