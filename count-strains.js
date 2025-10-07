// This script is designed to run in an environment that can handle ES module imports.
// In a standard Node.js environment, this might require a setup like ts-node or setting "type": "module" in package.json.

import { strainsA } from '@/data/strains/a';
import { strainsB } from '@/data/strains/b';
import { strainsC } from '@/data/strains/c';
import { strainsD } from '@/data/strains/d';
import { strainsE } from '@/data/strains/e';
import { strainsF } from '@/data/strains/f';
import { strainsG } from '@/data/strains/g';
import { strainsH } from '@/data/strains/h';
import { strainsI } from '@/data/strains/i';
import { strainsJ } from '@/data/strains/j';
import { strainsK } from '@/data/strains/k';
import { strainsL } from '@/data/strains/l';
import { strainsM } from '@/data/strains/m';
import { strainsN } from '@/data/strains/n';
import { strainsO } from '@/data/strains/o';
import { strainsP } from '@/data/strains/p';
import { strainsQ } from '@/data/strains/q';
import { strainsR } from '@/data/strains/r';
import { strainsS } from '@/data/strains/s';
import { strainsT } from '@/data/strains/t';
import { strainsU } from '@/data/strains/u';
import { strainsV } from '@/data/strains/v';
import { strainsW } from '@/data/strains/w';
import { strainsX } from '@/data/strains/x';
import { strainsY } from '@/data/strains/y';
import { strainsZ } from '@/data/strains/z';
import { strainsNumeric } from '@/data/strains/numeric';

const allStrainArrays = {
  strainsNumeric,
  strainsA,
  strainsB,
  strainsC,
  strainsD,
  strainsE,
  strainsF,
  strainsG,
  strainsH,
  strainsI,
  strainsJ,
  strainsK,
  strainsL,
  strainsM,
  strainsN,
  strainsO,
  strainsP,
  strainsQ,
  strainsR,
  strainsS,
  strainsT,
  strainsU,
  strainsV,
  strainsW,
  strainsX,
  strainsY,
  strainsZ,
};

let totalCount = 0;
console.log('--- Start Strain Count Audit ---');
for (const [fileName, strainsArray] of Object.entries(allStrainArrays)) {
  const count = strainsArray.length;
  console.log(`${fileName.replace('strains', '')}.ts: ${count} entries`);
  totalCount += count;
}
console.log('---------------------------------');
console.log(`TOTAL COUNT: ${totalCount}`);
console.log('--- End Strain Count Audit ---');

// Note: To run this file, you might need a setup like ts-node: `npx ts-node count-strains.js`