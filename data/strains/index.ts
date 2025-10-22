import { Strain } from '@/types';
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
import { strains as strainsTempGlue } from './temp-additions-glue-tropicana';
import { strains as strainsTempParents1 } from './temp-additions-parents-1';
import { strains as strainsTempParents2 } from './temp-additions-parents-2';
import { strains as strainsTempParents3 } from './temp-additions-parents-3';
import { strains as strainsTempParents4 } from './temp-additions-parents-4';
import { strains as strainsTempParents5 } from './temp-additions-parents-5';
import { strains as strainsTempParents6 } from './temp-additions-parents-6';
import { strains as strainsTempParents7 } from './temp-additions-parents-7';
import { strains as strainsTempParents8 } from './temp-additions-parents-8';
import { strains as strainsTempParents9 } from './temp-additions-parents-9';
import { strains as strainsTempParents10 } from './temp-additions-parents-10';
import { strains as strainsTempParents11 } from './temp-additions-parents-11';
import { strains as strainsTempBParents } from './temp-additions-b-parents';
import { strains as strainsTempTriangleKush } from './temp-additions-trianglekush';
import { strains as strainsTempChocoDiesel } from './temp-additions-chocodiesel';
import { strains as strainsTempU5 } from './temp-additions-u5';
import { strains as strainsTempNew12 } from './temp-additions-new-12';
import { strains as strainsTempNew09 } from './temp-additions-new09';
import { strains as strainsTempParentsM14 } from './temp-additions-parents-m14';
import { strains as strainsTempParents313 } from './temp-additions-parents-313';
import { strains as strainsTempParentsHij12 } from './temp-additions-parents-hij12';
import { strains as strainsTempParents411 } from './temp-additions-parents-411';
import { strains as strainsTempParentsEf10 } from './temp-additions-parents-ef10';
import { strains as strainsTempParentsCc9 } from './temp-additions-parents-cc9';
import { strains as strainsTempParentsJTW } from './temp-additions-parents-jtw';
import { strains as strainsTempParentsL } from './temp-additions-l-parents';
import { strains as strainsTempParentsJ } from './temp-additions-j-parents';
import { strains as strainsTempParentsK } from './temp-additions-k-parents';
import { strains as strainsTempParentsM } from './temp-additions-m-parents';
import { strains as strainsTempParentsN } from './temp-additions-n-parents';
import { strains as strainsTempParentsO } from './temp-additions-o-parents';
import { strains as strainsTempParentsP } from './temp-additions-p-parents';
import { strains as strainsTempParentsQ } from './temp-additions-q-parents';
import { strains as strainsTempParentsR } from './temp-additions-r-parents';
import { strains as strainsTempParentsS } from './temp-additions-s-parents';
import { strains as strainsTempParentsT } from './temp-additions-t-parents';


const combinedStrains: Strain[] = [
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
    ...strainsTempGlue,
    ...strainsTempParents1,
    ...strainsTempParents2,
    ...strainsTempParents3,
    ...strainsTempParents4,
    ...strainsTempParents5,
    ...strainsTempParents6,
    ...strainsTempParents7,
    ...strainsTempParents8,
    ...strainsTempParents9,
    ...strainsTempParents10,
    ...strainsTempParents11,
    ...strainsTempBParents,
    ...strainsTempTriangleKush,
    ...strainsTempChocoDiesel,
    ...strainsTempU5,
    ...strainsTempNew12,
    ...strainsTempNew09,
    ...strainsTempParentsM14,
    ...strainsTempParents313,
    ...strainsTempParentsHij12,
    ...strainsTempParents411,
    ...strainsTempParentsEf10,
    ...strainsTempParentsCc9,
    ...strainsTempParentsJTW,
    ...strainsTempParentsL,
    ...strainsTempParentsJ,
    ...strainsTempParentsK,
    ...strainsTempParentsM,
    ...strainsTempParentsN,
    ...strainsTempParentsO,
    ...strainsTempParentsP,
    ...strainsTempParentsQ,
    ...strainsTempParentsR,
    ...strainsTempParentsS,
    ...strainsTempParentsT,
];

// De-duplicate strains by ID to ensure data integrity from the source.
export const allStrainsData: Strain[] = Array.from(new Map(combinedStrains.map(strain => [strain.id, strain])).values());