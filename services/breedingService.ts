import { Strain, Seed, StrainType } from '@/types';

class BreedingService {
    cross(seedA: Seed, seedB: Seed, allStrains: Strain[]): Omit<Strain, 'id'> | null {
        const parentA = allStrains.find(s => s.id === seedA.strainId);
        const parentB = allStrains.find(s => s.id === seedB.strainId);

        if (!parentA || !parentB) return null;

        // Simplified breeding logic
        const newStrain: Omit<Strain, 'id'> = {
            name: `${parentA.name.split(' ')[0]} x ${parentB.name.split(' ')[0]}`,
            // FIX: Use StrainType enum member instead of a string literal.
            type: parentA.type === parentB.type ? parentA.type : StrainType.Hybrid,
            floweringType: 'Photoperiod',
            thc: (parentA.thc + parentB.thc) / 2 * (1 + (Math.random() - 0.5) * 0.2), // +/- 10%
            cbd: (parentA.cbd + parentB.cbd) / 2,
            floweringTime: (parentA.floweringTime + parentB.floweringTime) / 2,
            agronomic: {
                difficulty: Math.random() > 0.5 ? parentA.agronomic.difficulty : parentB.agronomic.difficulty,
                yield: Math.random() > 0.5 ? parentA.agronomic.yield : parentB.agronomic.yield,
                height: Math.random() > 0.5 ? parentA.agronomic.height : parentB.agronomic.height,
            },
            aromas: [...new Set([...(parentA.aromas || []), ...(parentB.aromas || [])])].slice(0, 4),
            dominantTerpenes: [...new Set([...(parentA.dominantTerpenes || []), ...(parentB.dominantTerpenes || [])])].slice(0, 3),
        };
        
        return newStrain;
    }
}

export const breedingService = new BreedingService();