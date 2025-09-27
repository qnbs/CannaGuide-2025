import { Plant, Seed, Strain, StrainType, FloweringType, DifficultyLevel, YieldLevel, HeightLevel } from '@/types';
import { StoreSet, StoreGet } from '../useAppStore';
import { i18nInstance } from '@/i18n';

export interface BreedingSlice {
    collectedSeeds: Seed[];
    addSeed: (plant: Plant) => void;
    breedStrains: (seed1Id: string, seed2Id: string, newName: string) => void;
}

// Helper function to blend two numeric values
const blendNumeric = (val1: number, val2: number) => (val1 + val2) / 2;

// Helper function to pick one of two string values
const pickOne = <T>(val1: T, val2: T): T => (Math.random() < 0.5 ? val1 : val2);

export const createBreedingSlice = (set: StoreSet, get: StoreGet): BreedingSlice => ({
    collectedSeeds: [],
    addSeed: (plant) => {
        const newSeed: Seed = {
            id: `seed-${plant.id}-${Date.now()}`,
            name: `${plant.name} Seed`,
            strainId: plant.strain.id,
            genetics: plant.strain.genetics || 'Unknown',
            quality: plant.postHarvest?.finalQuality || 0,
            createdAt: Date.now(),
        };
        set(state => { state.collectedSeeds.push(newSeed) });
    },
    breedStrains: (seed1Id, seed2Id, newName) => {
        const { collectedSeeds } = get();
        const parent1Seed = collectedSeeds.find(s => s.id === seed1Id);
        const parent2Seed = collectedSeeds.find(s => s.id === seed2Id);

        if (!parent1Seed || !parent2Seed) {
            console.error("Parent seeds not found for breeding");
            return;
        }

        const allStrains = [...get().allStrains, ...get().userStrains];
        const parent1Strain = allStrains.find(s => s.id === parent1Seed.strainId);
        const parent2Strain = allStrains.find(s => s.id === parent2Seed.strainId);

        if (!parent1Strain || !parent2Strain) {
            console.error("Parent strains not found for breeding");
            return;
        }
        
        const newStrain: Strain = {
            id: `${newName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
            name: newName,
            type: 'Hybrid', // All bred strains are hybrids
            genetics: `${parent1Strain.name} x ${parent2Strain.name}`,
            floweringType: pickOne<FloweringType>(parent1Strain.floweringType, parent2Strain.floweringType),
            thc: blendNumeric(parent1Strain.thc, parent2Strain.thc) * (1 + (parent1Seed.quality + parent2Seed.quality) / 2000), // Quality bonus
            cbd: blendNumeric(parent1Strain.cbd, parent2Strain.cbd),
            floweringTime: blendNumeric(parent1Strain.floweringTime, parent2Strain.floweringTime),
            agronomic: {
                difficulty: pickOne<DifficultyLevel>(parent1Strain.agronomic.difficulty, parent2Strain.agronomic.difficulty),
                yield: pickOne<YieldLevel>(parent1Strain.agronomic.yield, parent2Strain.agronomic.yield),
                height: pickOne<HeightLevel>(parent1Strain.agronomic.height, parent2Strain.agronomic.height),
            },
            aromas: [...new Set([...(parent1Strain.aromas || []), ...(parent2Strain.aromas || [])])].slice(0, 4),
            dominantTerpenes: [...new Set([...(parent1Strain.dominantTerpenes || []), ...(parent2Strain.dominantTerpenes || [])])].slice(0, 3),
        };

        const success = get().addUserStrain(newStrain);
        if (success) {
            get().addNotification(i18nInstance.t('knowledgeView.breeding.breedSuccess', { name: newName }), 'success');
            // Remove used seeds
            set(state => ({
                collectedSeeds: state.collectedSeeds.filter(s => s.id !== seed1Id && s.id !== seed2Id),
            }));
        } else {
             get().addNotification(i18nInstance.t('strainsView.addStrainModal.validation.duplicate', { name: newName }), 'error');
        }
    },
});
