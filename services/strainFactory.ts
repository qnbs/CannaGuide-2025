import { Strain, StrainType } from '@/types';

// Diese Funktion nimmt ein beliebiges Sorten-Objekt entgegen
// und garantiert, dass das Ergebnis dem neuesten Schema entspricht.
export const createStrainObject = (data: Partial<Strain>): Strain => {
  // 1. Setze sichere Standardwerte für alle obligatorischen Felder
  const defaults: Strain = {
    id: `unknown-${Date.now()}`,
    name: 'Unknown Strain',
    type: StrainType.Hybrid,
    thc: 0,
    cbd: 0,
    floweringTime: 8,
    agronomic: {
      difficulty: 'Medium',
      yield: 'Medium',
      height: 'Medium',
    },
    // 2. Initialisiere die neuen, für die Simulation kritischen Felder
    floweringType: 'Photoperiod', // Standard-Annahme
    geneticModifiers: {
      pestResistance: 1.0,
      nutrientUptakeRate: 1.0,
      stressTolerance: 1.0,
      rue: 1.0, // Default Radiation Use Efficiency
    },
  };

  // 3. Überschreibe die Standards mit den übergebenen Daten (inkl. verschachtelter Objekte)
  const merged = { 
      ...defaults, 
      ...data, 
      agronomic: { ...defaults.agronomic, ...data.agronomic },
      geneticModifiers: { ...defaults.geneticModifiers, ...data.geneticModifiers },
  };

  // 4. Intelligente Logik: Leite 'floweringType' ab, falls nicht vorhanden
  if (!data.floweringType && data.typeDetails?.toLowerCase().includes('autoflower')) {
    merged.floweringType = 'Autoflower';
  }
  
  // 5. Validierungs-Logik
  if (!data.id || !data.name) {
    console.warn(`[StrainFactory] Strain created with missing id or name.`, data);
  }

  return merged as Strain;
};