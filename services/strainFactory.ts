import { Strain, GeneticModifiers } from '@/types';

// This factory ensures that every strain object has a consistent shape and default values.
export const createStrainObject = (data: Partial<Strain>): Strain => {
  const nameHash = (data.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Default genetic modifiers, derived deterministically from the strain name for consistency
  const defaultGeneticModifiers: GeneticModifiers = {
      pestResistance: 0.8 + ((nameHash % 40) / 100), // Range 0.8 to 1.2
      nutrientUptakeRate: 0.8 + (((nameHash * 3) % 40) / 100), // Range 0.8 to 1.2
      stressTolerance: 0.8 + (((nameHash * 7) % 40) / 100), // Range 0.8 to 1.2
      rue: 1.4 + (((nameHash * 5) % 20) / 100), // Radiation Use Efficiency (g biomass per MJ of PAR), typical range 1.4-1.6
      vpdTolerance: { 
          min: 0.7 + (((nameHash * 2) % 30) / 100), // e.g., 0.7-1.0 kPa
          max: 1.3 + (((nameHash * 11) % 30) / 100)  // e.g., 1.3-1.6 kPa
      },
      transpirationFactor: 0.9 + (((nameHash * 13) % 20) / 100) // 0.9 to 1.1
  };

  const defaults: Omit<Strain, 'id' | 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime'> = {
    floweringType: 'Photoperiod',
    agronomic: {
      difficulty: 'Medium',
      yield: 'Medium',
      height: 'Medium',
    },
    geneticModifiers: defaultGeneticModifiers,
  };

  if (!data.id || !data.name || !data.type || data.thc === undefined || data.cbd === undefined || data.floweringTime === undefined) {
    console.warn(`[strainFactory] Strain is missing required fields (id, name, type, thc, cbd, floweringTime) for: ${data.name || 'Unknown'}. This may cause issues.`, data);
  }

  const merged = {
      ...defaults,
      ...data,
      agronomic: { ...defaults.agronomic, ...data.agronomic },
      geneticModifiers: { ...defaults.geneticModifiers, ...data.geneticModifiers },
  } as Strain;

  // Infer floweringType if not explicitly provided
  if (!data.floweringType && (data.typeDetails?.toLowerCase().includes('autoflower') || data.floweringTimeRange?.toLowerCase().includes('lifecycle'))) {
    merged.floweringType = 'Autoflower';
  }

  return merged;
};