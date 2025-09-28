
# CannaGuide 2025 - Source Code Documentation (Part 5: Data)

This document contains the source code for the static data files used in the application, primarily the extensive strain library and the knowledge base articles.

---

## 1. Strain Data

The strain data is modularized into separate files for each letter of the alphabet to improve maintainability. The `index.ts` file consolidates all of them into a single export.

### `/data/strains/index.ts`

**Purpose:** Aggregates all individual strain data files into a single `allStrainsData` array.

```typescript
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

export const allStrainsData: Strain[] = [
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
];
```

### `/data/strains/a.ts`

**Purpose:** Contains the data for all strains starting with the letter 'A'.

```typescript
import type { Strain } from '@/types';

export const strainsA: Strain[] = [
  {
    "id": "acdc",
    "name": "ACDC",
    "type": "Hybrid",
    "typeDetails": "Hybrid - 50% Sativa / 50% Indica (CBD Dominant)",
    "genetics": "Cannatonic Phenotype",
    "floweringType": "Photoperiod",
    "thc": 3.5,
    "cbd": 16,
    "thcRange": "1-6%",
    "cbdRange": "8-24%",
    "floweringTime": 9.5,
    "floweringTimeRange": "9-10",
    "description": "A famous CBD-dominant strain, bred for therapeutic purposes without strong psychoactive effects. The name stands for 'Alternative Cannabinoid Dietary Cannabis'. It has a relaxing and anxiolytic effect, while the mind remains clear. Ideal for pain and anxiety.",
    "agronomic": {
      "difficulty": "Medium",
      "yield": "Medium",
      "height": "Medium",
      "yieldDetails": { "indoor": "400 g/m²", "outdoor": "500 g/plant" },
      "heightDetails": { "indoor": "100-150 cm", "outdoor": "150-200 cm" }
    },
    "aromas": ["Earthy", "Sweet", "Pine", "Woody"],
    "dominantTerpenes": ["Myrcene", "Pinene", "Caryophyllene"]
  },
  // ... more strains
];
```

... (This pattern repeats for all letters and numeric strains) ...

---

## 2. Knowledge Base Data

### `/data/knowledgebase.ts`

**Purpose:** This file contains the content for the interactive Grow Guide. Each object in the `knowledgeBase` array represents an article with its title, content, tags, and triggers that determine when it should be highlighted to the user based on their plant's state.

```typescript
import { KnowledgeArticle, PlantStage, ProblemType } from '../types';

export const knowledgeBase: KnowledgeArticle[] = [
    {
        id: 'phase1-prep',
        titleKey: 'knowledgeView.knowledgebase.phase1-prep.title',
        contentKey: 'knowledgeView.knowledgebase.phase1-prep.content',
        tags: ['preparation', 'setup', 'tent', 'light', 'environment'],
        triggers: {
            ageInDays: { min: 0, max: 1 },
            plantStage: PlantStage.Seed,
        }
    },
    {
        id: 'phase2-seedling',
        titleKey: 'knowledgeView.knowledgebase.phase2-seedling.title',
        contentKey: 'knowledgeView.knowledgebase.phase2-seedling.content',
        tags: ['seedling', 'germination', 'early stage', 'watering', 'humidity'],
        triggers: {
            plantStage: [PlantStage.Germination, PlantStage.Seedling],
        }
    },
    {
        id: 'phase3-vegetative',
        titleKey: 'knowledgeView.knowledgebase.phase3-vegetative.title',
        contentKey: 'knowledgeView.knowledgebase.phase3-vegetative.content',
        tags: ['vegetative', 'growth', 'training', 'nutrients', 'topping', 'lst'],
        triggers: {
            plantStage: PlantStage.Vegetative,
        }
    },
    {
        id: 'phase4-flowering',
        titleKey: 'knowledgeView.knowledgebase.phase4-flowering.title',
        contentKey: 'knowledgeView.knowledgebase.phase4-flowering.content',
        tags: ['flowering', 'stretch', 'nutrients', 'pk boost', 'light cycle', 'humidity'],
        triggers: {
            plantStage: PlantStage.Flowering,
        }
    },
    {
        id: 'phase5-harvest',
        titleKey: 'knowledgeView.knowledgebase.phase5-harvest.title',
        contentKey: 'knowledgeView.knowledgebase.phase5-harvest.content',
        tags: ['harvest', 'drying', 'curing', 'trichomes', 'trimming'],
        triggers: {
            plantStage: [PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing],
        }
    },
    {
        id: 'fix-overwatering',
        titleKey: 'knowledgeView.knowledgebase.fix-overwatering.title',
        contentKey: 'knowledgeView.knowledgebase.fix-overwatering.content',
        tags: ['problem', 'fix', 'overwatering', 'watering', 'roots', 'droopy'],
        triggers: {
            // FIX: Replaced string literal with enum member to match ProblemType.
            activeProblems: [ProblemType.Overwatering]
        }
    },
    {
        id: 'fix-calcium-deficiency',
        titleKey: 'knowledgeView.knowledgebase.fix-calcium-deficiency.title',
        contentKey: 'knowledgeView.knowledgebase.fix-calcium-deficiency.content',
        tags: ['problem', 'fix', 'calcium', 'deficiency', 'calmag', 'nutrients', 'ph'],
        triggers: {
            // FIX: Replaced string literal with enum member to match ProblemType.
            activeProblems: [ProblemType.NutrientDeficiency]
        }
    },
];
```
