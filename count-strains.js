// This script is designed to run in an environment that can handle ES module imports.
// In a standard Node.js environment, this might require a setup like ts-node or setting "type": "module" in package.json.

import { strainsA } from './data/strains/a.js';
import { strainsB } from './data/strains/b.js';
import { strainsC } from './data/strains/c.js';
import { strainsD } from './data/strains/d.js';
import { strainsE } from './data/strains/e.js';
import { strainsF } from './data/strains/f.js';
import { strainsG } from './data/strains/g.js';
import { strainsH } from './data/strains/h.js';
import { strainsI } from './data/strains/i.js';
import { strainsJ } from './data/strains/j.js';
import { strainsK } from './data/strains/k.js';
import { strainsL } from './data/strains/l.js';
import { strainsM } from './data/strains/m.js';
import { strainsN } from './data/strains/n.js';
import { strainsO } from './data/strains/o.js';
import { strainsP } from './data/strains/p.js';
import { strainsQ } from './data/strains/q.js';
import { strainsR } from './data/strains/r.js';
import { strainsS } from './data/strains/s.js';
import { strainsT } from './data/strains/t.js';
import { strainsU } from './data/strains/u.js';
import { strainsV } from './data/strains/v.js';
import { strainsW } from './data/strains/w.js';
import { strainsX } from './data/strains/x.js';
import { strainsY } from './data/strains/y.js';
import { strainsZ } from './data/strains/z.js';
import { strainsNumeric } from './data/strains/numeric.js';

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