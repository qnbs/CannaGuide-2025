import { Strain } from '@/types';
import { strains as strainsA } from '@/data/strains/a';
import { strains as strainsB } from '@/data/strains/b';
import { strains as strainsC } from '@/data/strains/c';
import { strains as strainsD } from '@/data/strains/d';
import { strains as strainsE } from '@/data/strains/e';
import { strains as strainsF } from '@/data/strains/f';
import { strains as strainsG } from '@/data/strains/g';
import { strains as strainsH } from '@/data/strains/h';
import { strains as strainsI } from '@/data/strains/i';
import { strains as strainsJ } from '@/data/strains/j';
import { strains as strainsK } from '@/data/strains/k';
import { strains as strainsL } from '@/data/strains/l';
import { strains as strainsM } from '@/data/strains/m';
import { strains as strainsN } from '@/data/strains/n';
import { strains as strainsO } from '@/data/strains/o';
import { strains as strainsP } from '@/data/strains/p';
import { strains as strainsQ } from '@/data/strains/q';
import { strains as strainsR } from '@/data/strains/r';
import { strains as strainsS } from '@/data/strains/s';
import { strains as strainsT } from '@/data/strains/t';
import { strains as strainsU } from '@/data/strains/u';
import { strains as strainsV } from '@/data/strains/v';
import { strains as strainsW } from '@/data/strains/w';
import { strains as strainsX } from '@/data/strains/x';
import { strains as strainsY } from '@/data/strains/y';
import { strains as strainsZ } from '@/data/strains/z';
import { strains as strainsNumeric } from '@/data/strains/numeric';
import { newStrains } from '@/data/strains/new_strains';


// This file is modified to bundle all strain data.
export const allStrainsData: Strain[] = [
    ...strainsA, ...strainsB, ...strainsC, ...strainsD,
    ...strainsE, ...strainsF, ...strainsG, ...strainsH,
    ...strainsI, ...strainsJ, ...strainsK, ...strainsL,
    ...strainsM, ...strainsN, ...strainsO, ...strainsP,
    ...strainsQ, ...strainsR, ...strainsS, ...strainsT,
    ...strainsU, ...strainsV, ...strainsW, ...strainsX,
    ...strainsY, ...strainsZ, ...strainsNumeric,
    ...newStrains
];