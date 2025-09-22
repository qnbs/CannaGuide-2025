import { useContext, useMemo } from 'react';
import { PlantContext } from '@/context/PlantContext';
import { Plant } from '@/types';

export const usePlants = () => {
    const context = useContext(PlantContext);
    if (context === undefined) {
        throw new Error('usePlants must be used within a PlantProvider');
    }

    const hasAvailableSlots = useMemo(() => context.plants.some(p => p === null), [context.plants]);

    const activePlants = useMemo(() => context.plants.filter((p): p is Plant => p !== null), [context.plants]);

    return { ...context, hasAvailableSlots, activePlants };
};