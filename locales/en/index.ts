import { common, nav, plantStages, problemMessages, ai } from './common';
import { commandPalette } from './commandPalette';
import { equipmentView } from './equipment';
import { helpView } from './help';
import { knowledgeView, tipOfTheDay } from './knowledge';
import { onboarding } from './onboarding';
import { plantsView } from './plants';
import { settingsView } from './settings';
import { strainsView } from './strains';
import { strains as strainsA } from './strains/a';
import { strains as strainsB } from './strains/b';
import { strains as strainsC } from './strains/c';
import { strains as strainsD } from './strains/d';
import { strains as strainsE } from './strains/e';
import { strains as strainsF } from './strains/f';
import { strains as strainsG } from './strains/g';
import { strains as strainsH } from './strains/h';
import { strains as strainsI } from './strains/i';
import { strains as strainsJ } from './strains/j';
import { strains as strainsK } from './strains/k';
import { strains as strainsL } from './strains/l';
import { strains as strainsM } from './strains/m';
import { strains as strainsN } from './strains/n';
import { strains as strainsO } from './strains/o';
import { strains as strainsP } from './strains/p';
import { strains as strainsQ } from './strains/q';
import { strains as strainsR } from './strains/r';
import { strains as strainsS } from './strains/s';
import { strains as strainsT } from './strains/t';
import { strains as strainsU } from './strains/u';
import { strains as strainsV } from './strains/v';
import { strains as strainsW } from './strains/w';
import { strains as strainsX } from './strains/x';
import { strains as strainsY } from './strains/y';
import { strains as strainsZ } from './strains/z';
import { strains as strainsNumeric } from './strains/numeric';

const strainsData = {
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
    ...strainsZ
};

export const en = {
  common,
  nav,
  plantStages,
  problemMessages,
  ai,
  commandPalette,
  equipmentView,
  helpView,
  knowledgeView,
  onboarding,
  plantsView,
  settingsView,
  strainsView,
  strainsData,
  tipOfTheDay,
};
