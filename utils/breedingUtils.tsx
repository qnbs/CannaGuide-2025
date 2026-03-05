import React from 'react';
import { Strain, StrainType } from '@/types';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';
import { createStrainObject } from '@/services/strainFactory';

/**
 * Crosses two parent strains and returns a plausible offspring profile.
 * Pure function — safe to call outside React.
 */
export const crossStrains = (parentA: Strain, parentB: Strain): Omit<Strain, 'id'> => {
    const newName = `${parentA.name.split(' ')[0]} ${parentB.name.split(' ').pop()}`;
    const randomFactor = (magnitude = 0.2) => 1 + (Math.random() - 0.5) * magnitude;

    const newStrainData: Partial<Strain> = {
        name: newName,
        type: parentA.type === parentB.type ? parentA.type : StrainType.Hybrid,
        genetics: `${parentA.name} x ${parentB.name}`,
        floweringType: 'Photoperiod',
        thc: ((parentA.thc + parentB.thc) / 2) * randomFactor(),
        cbd: (parentA.cbd + parentB.cbd) / 2,
        floweringTime: ((parentA.floweringTime + parentB.floweringTime) / 2) * randomFactor(0.1),
        agronomic: {
            difficulty: Math.random() > 0.5 ? parentA.agronomic.difficulty : parentB.agronomic.difficulty,
            yield: Math.random() > 0.5 ? parentA.agronomic.yield : parentB.agronomic.yield,
            height: Math.random() > 0.5 ? parentA.agronomic.height : parentB.agronomic.height,
        },
        aromas: [...new Set([...(parentA.aromas || []), ...(parentB.aromas || [])])].sort(() => 0.5 - Math.random()).slice(0, 4),
        dominantTerpenes: [...new Set([...(parentA.dominantTerpenes || []), ...(parentB.dominantTerpenes || [])])].sort(() => 0.5 - Math.random()).slice(0, 3),
    };

    return createStrainObject(newStrainData);
};

export const strainTypeInfo: Record<StrainType, { icon: React.ReactNode; color: string }> = {
    [StrainType.Sativa]: { icon: <SativaIcon />, color: 'text-amber-400' },
    [StrainType.Indica]: { icon: <IndicaIcon />, color: 'text-indigo-400' },
    [StrainType.Hybrid]: { icon: <HybridIcon />, color: 'text-blue-400' },
};
