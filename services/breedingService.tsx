import { Strain, Seed, StrainType, GeneticModifiers } from '@/types';
import { createStrainObject } from './strainFactory';

class BreedingService {
    cross(seedA: Seed, seedB: Seed, allStrains: Strain[]): Omit<Strain, 'id'> | null {
        const parentA = allStrains.find(s => s.id === seedA.strainId);
        const parentB = allStrains.find(s => s.id === seedB.strainId);

        if (!parentA || !parentB) return null;

        const newName = `${parentA.name.split(' ')[0]} x ${parentB.name.split(' ')[0]}`;

        // Simplified breeding logic
        const newStrainData: Partial<Strain> = {
            name: newName,
            type: parentA.type === parentB.type ? parentA.type : StrainType.Hybrid,
            genetics: `${parentA.name} x ${parentB.name}`,
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
            geneticModifiers: this.combineModifiers(parentA.geneticModifiers, parentB.geneticModifiers),
        };
        
        return createStrainObject(newStrainData);
    }

    private combineModifiers(modA: GeneticModifiers, modB: GeneticModifiers): GeneticModifiers {
        const randomFactor = () => 1 + (Math.random() - 0.5) * 0.1; // +/- 5%
        return {
            pestResistance: ((modA.pestResistance + modB.pestResistance) / 2) * randomFactor(),
            nutrientUptakeRate: ((modA.nutrientUptakeRate + modB.nutrientUptakeRate) / 2) * randomFactor(),
            stressTolerance: ((modA.stressTolerance + modB.stressTolerance) / 2) * randomFactor(),
            rue: ((modA.rue + modB.rue) / 2) * randomFactor(),
            vpdTolerance: {
                min: (modA.vpdTolerance.min + modB.vpdTolerance.min) / 2,
                max: (modA.vpdTolerance.max + modB.vpdTolerance.max) / 2,
            },
            transpirationFactor: ((modA.transpirationFactor + modB.transpirationFactor) / 2) * randomFactor(),
        };
    }
}

export const breedingService = new BreedingService();