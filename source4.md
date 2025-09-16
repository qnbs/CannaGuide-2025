# Cannabis Grow Guide 2025 - Source Code: Strain Data

This document contains the source code for the strain database used in the application. The data is organized alphabetically for easier management.

---

## 1. Strain Data Index (`data/strains/index.ts`)

This file imports all individual strain data files and exports them as a single array.

```typescript
import { Strain } from '../../types';
import { strains as strainsA } from './a';
import { strains as strainsB } from './b';
import { strains as strainsC } from './c';
import { strains as strainsD } from './d';
import { strains as strainsE } from './e';
import { strains as strainsF } from './f';
import { strains as strainsG } from './g';
import { strains as strainsH } from './h';
import { strains as strainsI } from './i';
import { strains as strainsJ } from './j';
import { strains as strainsK } from './k';
import { strains as strainsL } from './l';
import { strains as strainsM } from './m';
import { strains as strainsN } from './n';
import { strains as strainsO } from './o';
import { strains as strainsP } from './p';
import { strains as strainsQ } from './q';
import { strains as strainsR } from './r';
import { strains as strainsS } from './s';
import { strains as strainsT } from './t';
import { strains as strainsU } from './u';
import { strains as strainsV } from './v';
import { strains as strainsW } from './w';
import { strains as strainsX } from './x';
import { strains as strainsY } from './y';
import { strains as strainsZ } from './z';
import { strains as strainsNumeric } from './numeric';
import { newStrains } from './new_strains';


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
```

---

## 2. Individual Strain Data Files (`data/strains/*.ts`)

### `data/strains/a.ts`
```typescript
import { Strain } from '../../types';

export const strains: Strain[] = [
  {
    id: 'acdc',
    name: 'ACDC',
    type: 'Hybrid',
    // ... rest of the strain object
  },
  // ... more strains starting with 'A'
];
```

### `data/strains/b.ts`
```typescript
import { Strain } from '../../types';

export const strains: Strain[] = [
  {
    id: 'b-52',
    name: 'B-52',
    type: 'Hybrid',
    // ... rest of the strain object
  },
  // ... more strains starting with 'B'
];
```

... (and so on for all alphabetical and numeric strain data files)
