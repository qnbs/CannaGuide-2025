import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StrainListItem } from './StrainListItem'
import { StrainType, type Strain } from '@/types'

vi.mock('@/stores/store', () => ({
    useAppDispatch: () => vi.fn(),
}))

const strainFixture: Strain = {
    id: 'strain-1',
    name: 'Silver Orbit',
    type: StrainType.Sativa,
    floweringType: 'Photoperiod',
    thc: 24,
    cbd: 1,
    floweringTime: 10,
    agronomic: {
        difficulty: 'Easy',
        yield: 'High',
        height: 'Tall',
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

describe('StrainListItem', () => {
    it('opens strain detail when clicking on strain content', () => {
        const onSelect = vi.fn()
        const onToggleSelection = vi.fn()

        render(
            <StrainListItem
                strain={strainFixture}
                onSelect={onSelect}
                isSelected={false}
                onToggleSelection={onToggleSelection}
                isUserStrain={false}
                onDelete={vi.fn()}
                isFavorite={false}
                onToggleFavorite={vi.fn()}
            />,
        )

        fireEvent.click(screen.getByText('Silver Orbit'))

        expect(onSelect).toHaveBeenCalledTimes(1)
        expect(onSelect).toHaveBeenCalledWith(strainFixture)
    })

    it('does not open detail when toggling checkbox selection', () => {
        const onSelect = vi.fn()
        const onToggleSelection = vi.fn()

        render(
            <StrainListItem
                strain={strainFixture}
                onSelect={onSelect}
                isSelected={false}
                onToggleSelection={onToggleSelection}
                isUserStrain={false}
                onDelete={vi.fn()}
                isFavorite={false}
                onToggleFavorite={vi.fn()}
            />,
        )

        fireEvent.click(screen.getByRole('checkbox'))

        expect(onToggleSelection).toHaveBeenCalledTimes(1)
        expect(onToggleSelection).toHaveBeenCalledWith('strain-1')
        expect(onSelect).not.toHaveBeenCalled()
    })
})
