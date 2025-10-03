import type { Strain } from '@/types';
import { strainsA } from './a';
import { strainsB } from './b';
import { strainsC } from './c';
import { strainsD } from './d';
import { strainsE } from './e';
import { strainsF } from './f';
import { strainsG } from './g';
import { strainsH } from './h';
import { strainsI } from './i';
import { strainsJ } from './j';
import { strainsK } from './k';
import { strainsL } from './l';
import { strainsM } from './m';
import { strainsN } from './n';
import { strainsO } from './o';
import { strainsP } from './p';
import { strainsQ } from './q';
import { strainsR } from './r';
import { strainsS } from './s';
import { strainsT } from './t';
import { strainsU } from './u';
import { strainsV } from './v';
import { strainsW } from './w';
import { strainsX } from './x';
import { strainsY } from './y';
import { strainsZ } from './z';
import { strainsNumeric } from './numeric';
import { strains as newAdditions } from './temp-additions-glue-tropicana';
import { strains as newParents1 } from './temp-additions-parents-1';
import { strains as newParents2 } from './temp-additions-parents-2';
import { strains as newParents3 } from './temp-additions-parents-3';
import { strains as newParents4 } from './temp-additions-parents-4';
import { strains as newParents5 } from './temp-additions-parents-5';
import { strains as newParents6 } from './temp-additions-parents-6';
import { strains as newParents7 } from './temp-additions-parents-7';
import { strains as newParents8 } from './temp-additions-parents-8';

// All imported strain arrays now correctly export `Strain[]`, fully validated by the factory.
// The filter provides an extra layer of safety against any malformed or incomplete objects.
const allStrains: Strain[] = [
    ...strainsNumeric,
    ...strainsA,
    ...strainsB,
    ...strainsC,
    ...strainsD,
    ...strainsE,
    ...strainsF,
    ...strainsG,
    ...strainsH,
    ...strainsI,
    ...strainsJ,
    ...strainsK,
    ...strainsL,
    ...strainsM,
    ...strainsN,
    ...strainsO,
    ...strainsP,
    ...strainsQ,
    ...strainsR,
    ...strainsS,
    ...strainsT,
    ...strainsU,
    ...strainsV,
    ...strainsW,
    ...strainsX,
    ...strainsY,
    ...strainsZ,
    ...newAdditions,
    ...newParents1,
    ...newParents2,
    ...newParents3,
    ...newParents4,
    ...newParents5,
    ...newParents6,
    ...newParents7,
    ...newParents8
].filter(s => s && s.id && s.name && s.floweringType); // Filter out potentially incomplete objects

// Overwrite the factory's default genetic modifiers with pseudo-random, deterministic
// values derived from the strain name to add variety to the base simulation data.
export const allStrainsData: Strain[] = allStrains.map(strain => {
    // Simple hash function to get a deterministic "random" value from the strain name
    const nameHash = strain.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return {
        ...strain,
        geneticModifiers: {
            pestResistance: 0.8 + ((nameHash % 40) / 100), // Range 0.8 to 1.2
            nutrientUptakeRate: 0.8 + (((nameHash * 3) % 40) / 100), // Range 0.8 to 1.2
            stressTolerance: 0.8 + (((nameHash * 7) % 40) / 100), // Range 0.8 to 1.2
            rue: 0.8 + (((nameHash * 5) % 40) / 100), // Radiation Use Efficiency, Range 0.8 to 1.2
        }
    };
});
