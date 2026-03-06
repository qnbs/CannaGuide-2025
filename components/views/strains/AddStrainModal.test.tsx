import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddStrainModal } from './AddStrainModal';
import { StrainType, type Strain } from '@/types';

vi.mock('@/stores/store', () => ({
    useAppDispatch: () => vi.fn(),
}));

vi.mock('@/components/common/Modal', () => ({
    Modal: ({ children, footer, title }: { children: React.ReactNode; footer?: React.ReactNode; title?: string }) => (
        <div>
            <h1>{title}</h1>
            <div>{children}</div>
            <div>{footer}</div>
        </div>
    ),
}));

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
};

describe('AddStrainModal', () => {
    it('submits the selected strain type instead of sticking to Hybrid', () => {
        const handleAddStrain = vi.fn();

        render(
            <AddStrainModal
                isOpen={true}
                onClose={vi.fn()}
                onAddStrain={handleAddStrain}
                onUpdateStrain={vi.fn()}
                strainToEdit={null}
            />,
        );

        fireEvent.change(screen.getByLabelText(/strain name/i), { target: { value: 'Solar Spear' } });
        fireEvent.click(screen.getByRole('button', { name: /sativa/i }));
        fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

        expect(handleAddStrain).toHaveBeenCalledTimes(1);
        expect(handleAddStrain.mock.calls[0][0].type).toBe(StrainType.Sativa);
    });

    it('reinitializes form values when switching into edit mode', () => {
        const { rerender } = render(
            <AddStrainModal
                isOpen={true}
                onClose={vi.fn()}
                onAddStrain={vi.fn()}
                onUpdateStrain={vi.fn()}
                strainToEdit={null}
            />,
        );

        fireEvent.change(screen.getByLabelText(/strain name/i), { target: { value: 'Temporary Name' } });
        fireEvent.click(screen.getByRole('button', { name: /indica/i }));

        rerender(
            <AddStrainModal
                isOpen={true}
                onClose={vi.fn()}
                onAddStrain={vi.fn()}
                onUpdateStrain={vi.fn()}
                strainToEdit={baseStrain}
            />,
        );

        expect(screen.getByDisplayValue('Silver Orbit')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sativa/i })).toHaveAttribute('aria-pressed', 'true');
    });
});