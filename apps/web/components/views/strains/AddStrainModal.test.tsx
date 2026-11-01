import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AddStrainModal } from './AddStrainModal'
import { StrainType, type Strain } from '@/types'

vi.mock('@/stores/store', () => ({
    useAppDispatch: () => vi.fn(),
}))

vi.mock('@/components/common/Modal', () => ({
    Modal: ({
        children,
        footer,
        title,
    }: {
        children: React.ReactNode
        footer?: React.ReactNode
        title?: string
    }) => (
        <div>
            <h1>{title}</h1>
            <div>{children}</div>
            <div>{footer}</div>
        </div>
    ),
}))

const baseStrain: Strain = {
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

describe('AddStrainModal', () => {
    it('submits the selected strain type instead of sticking to Hybrid', () => {
        const handleAddStrain = vi.fn()

        render(
            <AddStrainModal
                isOpen
                onClose={vi.fn()}
                onAddStrain={handleAddStrain}
                onUpdateStrain={vi.fn()}
                strainToEdit={null}
            />,
        )

        fireEvent.change(screen.getByLabelText(/strain name/i), {
            target: { value: 'Solar Spear' },
        })
        fireEvent.click(screen.getByRole('button', { name: /sativa/i }))
        fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

        expect(handleAddStrain).toHaveBeenCalledTimes(1)
        expect(handleAddStrain.mock.calls[0]![0].type).toBe(StrainType.Sativa)
    })

    it('saves a name without inventing measurements', () => {
        const handleAddStrain = vi.fn()

        render(
            <AddStrainModal
                isOpen
                onClose={vi.fn()}
                onAddStrain={handleAddStrain}
                onUpdateStrain={vi.fn()}
                strainToEdit={null}
            />,
        )

        fireEvent.change(screen.getByLabelText(/strain name/i), {
            target: { value: 'Bare Name' },
        })
        fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

        const saved = handleAddStrain.mock.calls[0]![0]
        expect(saved.name).toBe('Bare Name')
        expect(saved.type).toBeUndefined()
        expect(saved.thc).toBeUndefined()
        expect(saved.cbd).toBeUndefined()
        expect(saved.floweringTime).toBeUndefined()
        expect(saved.floweringType).toBeUndefined()
        expect(saved.agronomic).toBeUndefined()
    })

    it('reinitializes form values when switching into edit mode', () => {
        const { rerender } = render(
            <AddStrainModal
                isOpen
                onClose={vi.fn()}
                onAddStrain={vi.fn()}
                onUpdateStrain={vi.fn()}
                strainToEdit={null}
            />,
        )

        fireEvent.change(screen.getByLabelText(/strain name/i), {
            target: { value: 'Temporary Name' },
        })
        fireEvent.click(screen.getByRole('button', { name: /indica/i }))

        rerender(
            <AddStrainModal
                isOpen
                onClose={vi.fn()}
                onAddStrain={vi.fn()}
                onUpdateStrain={vi.fn()}
                strainToEdit={baseStrain}
            />,
        )

        expect(screen.getByDisplayValue('Silver Orbit')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sativa/i })).toHaveAttribute(
            'aria-pressed',
            'true',
        )
    })

    it('does not write default measurements when an unmeasured strain is saved unchanged', () => {
        const handleUpdateStrain = vi.fn()
        const unmeasured: Strain = { ...baseStrain }
        for (const key of ['type', 'thc', 'cbd', 'floweringTime', 'floweringType', 'agronomic']) {
            Reflect.deleteProperty(unmeasured, key)
        }

        render(
            <AddStrainModal
                isOpen
                onClose={vi.fn()}
                onAddStrain={vi.fn()}
                onUpdateStrain={handleUpdateStrain}
                strainToEdit={unmeasured}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

        expect(handleUpdateStrain).toHaveBeenCalledTimes(1)
        const saved = handleUpdateStrain.mock.calls[0]![0]
        expect(saved.type).toBeUndefined()
        expect(saved.thc).toBeUndefined()
        expect(saved.cbd).toBeUndefined()
        expect(saved.floweringTime).toBeUndefined()
        expect(saved.floweringType).toBeUndefined()
        expect(saved.agronomic).toBeUndefined()
    })

    it('clears a stored measurement and keeps fields the form does not own', () => {
        const handleUpdateStrain = vi.fn()
        const described: Strain = { ...baseStrain, description: 'Kept note' }

        render(
            <AddStrainModal
                isOpen
                onClose={vi.fn()}
                onAddStrain={vi.fn()}
                onUpdateStrain={handleUpdateStrain}
                strainToEdit={described}
            />,
        )

        fireEvent.change(screen.getByLabelText('THC %'), { target: { value: '' } })
        fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

        const saved = handleUpdateStrain.mock.calls[0]![0]
        expect(saved.thc).toBeUndefined()
        expect(saved.cbd).toBe(1)
        expect(saved.description).toBe('Kept note')
        expect(saved.geneticModifiers.pestResistance).toBe(1)
    })

    it('saves a difficulty without requiring yield and height', () => {
        const handleUpdateStrain = vi.fn()
        const bare: Strain = { ...baseStrain }
        Reflect.deleteProperty(bare, 'agronomic')

        render(
            <AddStrainModal
                isOpen
                onClose={vi.fn()}
                onAddStrain={vi.fn()}
                onUpdateStrain={handleUpdateStrain}
                strainToEdit={bare}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: /^easy$/i }))
        fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

        const saved = handleUpdateStrain.mock.calls[0]![0]
        expect(saved.agronomic.difficulty).toBe('Easy')
        expect(saved.agronomic.yield).toBeUndefined()
        expect(saved.agronomic.height).toBeUndefined()
    })
})
