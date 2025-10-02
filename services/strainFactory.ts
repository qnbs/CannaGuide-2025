
import { Strain } from '@/types';

// This factory ensures that every strain object has a consistent shape and default values.
export const createStrainObject = (data: Partial<Strain>): Strain => {
  const nameHash = (data.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const defaults: Omit<Strain, 'id' | 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime'> = {
    floweringType: 'Photoperiod',
    agronomic: {
      difficulty: 'Medium',
      yield: 'Medium',
      height: 'Medium',
      ...data.agronomic,
    },
    geneticModifiers: {
      pestResistance: 0.8 + ((nameHash % 40) / 100), // Range 0.8 to 1.2
      nutrientUptakeRate: 0.8 + (((nameHash * 3) % 40) / 100), // Range 0.8 to 1.2
      stressTolerance: 0.8 + (((nameHash * 7) % 40) / 100), // Range 0.8 to 1.2
      rue: 0.8 + (((nameHash * 5) % 40) / 100), // Radiation Use Efficiency, Range 0.8 to 1.2
    },
  };

  if (!data.id || !data.name || !data.type || data.thc === undefined || data.cbd === undefined || data.floweringTime === undefined) {
    throw new Error(`Strain factory is missing required fields for: ${data.name || 'Unknown'}`);
  }

  return {
    ...defaults,
    ...data,
    id: data.id,
    name: data.name,
    type: data.type,
    thc: data.thc,
    cbd: data.cbd,
    floweringTime: data.floweringTime,
  } as Strain;
};
