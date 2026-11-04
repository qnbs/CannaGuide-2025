import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HydroGaugeCard } from './HydroGaugeCard'

describe('HydroGaugeCard', () => {
    it.each([0, 168, 169, 500])(
        'shows a count of %i without a range, not as too high (GH #686)',
        (count) => {
            render(<HydroGaugeCard label="Readings" value={count} unit="#" decimals={0} />)

            expect(screen.getByText(String(count)).className).toContain('text-emerald-400')
            expect(screen.getByText('#').textContent).toBe('#')
        },
    )

    it('still marks a value above or below its range', () => {
        render(<HydroGaugeCard label="pH" value={7.2} unit="" min={5.5} max={6.5} />)

        expect(screen.getByText('7.2').className).toContain('text-red-400')
        expect(screen.getByText('(5.5-6.5)', { exact: false })).toBeInTheDocument()
    })
})
