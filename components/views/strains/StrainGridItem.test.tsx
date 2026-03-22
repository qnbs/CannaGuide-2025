import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import StrainGridItem from './StrainGridItem'
import { StrainType, type Strain } from '@/types'

const strainFixture: Strain = {
    id: 'strain-grid-1',
    name: 'Aurora Resin',
    type: StrainType.Indica,
    floweringType: 'Photoperiod',
    thc: 22,
    cbd: 1,
    floweringTime: 9,
    agronomic: {
        difficulty: 'Medium',
        yield: 'High',
        height: 'Medium',
    },
    geneticModifiers: {
        pestResistance: 1,
        nutrientUptakeRate: 1,
        stressTolerance: 1,
        rue: 1.4,
        vpdTolerance: { min: 0.8, max: 1.4 },
        transpirationFactor: 1,
        stomataSensitivity: 1,
    },
}

describe('StrainGridItem', () => {
    it('opens detail on card-content click', () => {
        const onSelect = vi.fn()
        const onToggleSelection = vi.fn()

        render(
            <StrainGridItem
                strain={strainFixture}
                onSelect={onSelect}
                isSelected={false}
                onToggleSelection={onToggleSelection}
                isUserStrain={false}
                index={0}
                isFavorite={false}
                onToggleFavorite={vi.fn()}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Aurora Resin' }))

        expect(onSelect).toHaveBeenCalledTimes(1)
        expect(onSelect).toHaveBeenCalledWith(strainFixture)
    })

    it('does not open detail when checkbox is toggled', () => {
        const onSelect = vi.fn()
        const onToggleSelection = vi.fn()

        render(
            <StrainGridItem
                strain={strainFixture}
                onSelect={onSelect}
                isSelected={false}
                onToggleSelection={onToggleSelection}
                isUserStrain={false}
                index={0}
                isFavorite={false}
                onToggleFavorite={vi.fn()}
            />,
        )

        fireEvent.click(screen.getByRole('checkbox'))

        expect(onToggleSelection).toHaveBeenCalledTimes(1)
        expect(onToggleSelection).toHaveBeenCalledWith('strain-grid-1')
        expect(onSelect).not.toHaveBeenCalled()
    })
})
