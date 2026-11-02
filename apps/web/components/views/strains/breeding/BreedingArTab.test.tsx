import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { BreedingLabState } from './useBreedingLab'

vi.mock('../BreedingArPreview', () => ({
    BreedingArPreview: ({
        resin,
        vigor,
    }: {
        resin: number | undefined
        vigor: number
    }) => (
        <div
            data-testid="ar-preview"
            data-resin={resin === undefined ? 'missing' : String(resin)}
            data-vigor={String(vigor)}
        />
    ),
}))

import { BreedingArTab } from './BreedingArTab'

const labState = (stabilityScore: number | null, thc?: number): BreedingLabState =>
    ({
        seedResult: {
            name: 'Cross',
            thc,
            aromas: ['earth'],
            dominantTerpenes: ['myrcene'],
        },
        newStrainName: 'Cross',
        automatedGenetics: {
            thc: thc ?? null,
            cbd: null,
            floweringWeeks: null,
            stabilityScore,
        },
    }) as BreedingLabState

describe('BreedingArTab', () => {
    it('draws the plant without a bloom when THC and stability are missing', async () => {
        render(<BreedingArTab state={labState(null)} />)
        const preview = await screen.findByTestId('ar-preview')
        expect(preview.getAttribute('data-resin')).toBe('missing')
        expect(screen.getByText('Stability Score: Unknown')).toBeTruthy()
    })

    it('draws a zero bloom when THC is a reported zero and stability is known', async () => {
        render(<BreedingArTab state={labState(0, 0)} />)
        const preview = await screen.findByTestId('ar-preview')
        expect(preview.getAttribute('data-resin')).toBe('0')
        expect(preview.getAttribute('data-vigor')).toBe('0')
        expect(screen.queryByText('Stability Score: Unknown')).toBeNull()
    })
})
