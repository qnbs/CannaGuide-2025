import { z } from 'zod';
import { Strain, StrainType } from '../types';

// RING 1: DER "BAUPLAN" - Definiere ein striktes Schema mit Zod
// FIX: Enforce the structure of GeneticModifiers to align with the `Strain` type.
const GeneticModifiersSchema = z.object({
  pestResistance: z.number(),
  nutrientUptakeRate: z.number(),
  stressTolerance: z.number(),
  rue: z.number(),
});

const StrainSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.nativeEnum(StrainType),
  thc: z.number().min(0).max(50),
  cbd: z.number().min(0).max(50),
  floweringTime: z.number().min(4).max(20),
  agronomic: z.object({
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    yield: z.enum(['Low', 'Medium', 'High']),
    height: z.enum(['Short', 'Medium', 'Tall']),
    yieldDetails: z.object({ indoor: z.string().optional(), outdoor: z.string().optional() }).optional(),
    heightDetails: z.object({ indoor: z.string().optional(), outdoor: z.string().optional() }).optional(),
  }),
  floweringType: z.enum(['Autoflower', 'Photoperiod']),
  geneticModifiers: GeneticModifiersSchema,
  typeDetails: z.string().optional(),
  genetics: z.string().optional(),
  aromas: z.array(z.string()).optional(),
  dominantTerpenes: z.array(z.string()).optional(),
  thcRange: z.string().optional(),
  cbdRange: z.string().optional(),
  floweringTimeRange: z.string().optional(),
  description: z.string().optional(),
});

// DIE PERFEKTIONIERTE FABRIK
export const createStrainObject = (data: Partial<Strain>): Strain => {
  // 1. DATEN-NORMALISIERUNG: Bereinige die Eingabedaten
  const cleanedData = { ...data };
  if (cleanedData.name) cleanedData.name = cleanedData.name.trim();
  if (typeof cleanedData.aromas === 'string') {
    cleanedData.aromas = (cleanedData.aromas as unknown as string).split(',').map(s => s.trim());
  }
  if (typeof cleanedData.dominantTerpenes === 'string') {
    cleanedData.dominantTerpenes = (cleanedData.dominantTerpenes as unknown as string).split(',').map(s => s.trim());
  }

  // 2. Setze sichere Standardwerte
  // FIX: Provide default values for all required genetic modifiers to prevent type errors. This ensures the default object satisfies the GeneticModifiers type.
  const defaults: Omit<Strain, 'id' | 'name'> & { name?: string, id?: string } = {
    type: StrainType.Hybrid,
    thc: 0,
    cbd: 0,
    floweringTime: 8,
    agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
    floweringType: 'Photoperiod',
    geneticModifiers: {
      pestResistance: 1.0,
      nutrientUptakeRate: 1.0,
      stressTolerance: 1.0,
      rue: 1.0,
    },
  };

  // 3. Führe Daten zusammen
  const merged = { 
      ...defaults, 
      ...cleanedData, 
      agronomic: { ...defaults.agronomic, ...cleanedData.agronomic },
      geneticModifiers: { ...defaults.geneticModifiers, ...cleanedData.geneticModifiers },
  };

  // 4. ERWEITERTE DATEN-ABLEITUNG
  // Generiere eine stabile ID aus dem Namen, falls keine vorhanden ist
  if (!merged.id && merged.name) {
    merged.id = merged.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  // Leite 'floweringType' ab
  if (merged.typeDetails?.toLowerCase().includes('autoflower')) {
    merged.floweringType = 'Autoflower';
  }
  // Strikte Kuratierung: Alles mit Prozentangaben ist ein Hybrid
  if (merged.typeDetails?.includes('%')) {
    merged.type = StrainType.Hybrid;
  }

  // 5. FINALE VALIDIERUNG: Prüfe das finale Objekt gegen den "Bauplan"
  const validationResult = StrainSchema.safeParse(merged);
  if (!validationResult.success) {
    console.error("Fehler bei der Erstellung des Strain-Objekts:", validationResult.error.flatten().fieldErrors);
    throw new Error(`Ungültige Sorten-Daten für: ${merged.name || 'Unbekannt'}`);
  }

  return validationResult.data as Strain;
};
