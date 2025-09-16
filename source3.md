# Cannabis Grow Guide 2025 - Source Code: Localization

This document contains all the translation strings for the application, supporting both English and German.

---

## 1. Locales Index (`locales/index.ts`)

This file imports and exports the translation objects for all supported languages.

```typescript
import { de } from './de/index';
import { en } from './en/index';

export { de, en };

export type Locale = 'en' | 'de';

export const locales: Record<Locale, any> = {
  en,
  de,
};
```

---

## 2. English Translations (`locales/en/`)

### `locales/en/index.ts`
```typescript
import { common, nav, plantStages, problemMessages, ai } from './common';
import { commandPalette } from './commandPalette';
import { equipmentView } from './equipment';
import { helpView } from './help';
import { knowledgeView, tipOfTheDay } from './knowledge';
import { onboarding } from './onboarding';
import { plantsView } from './plants';
import { settingsView } from './settings';
import { strainsView } from './strains';

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
  tipOfTheDay,
};
```

### `locales/en/common.ts`
```typescript
export const common = {
  add: 'Add',
  apply: 'Apply',
  back: 'Back',
  cancel: 'Cancel',
  close: 'Close',
  confirm: 'Confirm',
  delete: 'Delete',
  details: 'Details',
  downloadAgain: 'Download Again',
  edit: 'Edit',
  export: 'Export',
  genetics: 'Genetics',
  name: 'Name',
  next: 'Next',
  noDataToExport: 'No data available to export.',
  notes: 'Notes',
  save: 'Save',
  start: 'Start',
  successfullyExported: 'Successfully exported {count} items as {format}.',
  type: 'Type',
  typeDetails: 'Type Details',
  why: 'Why?',
  days: 'Days',
  description: 'Description',
  actions: 'Actions',
  error: 'Error',
};
// ... (rest of the file)
```

... (and so on for all English locale files)

---

## 3. German Translations (`locales/de/`)

### `locales/de/index.ts`
```typescript
import { common, nav, plantStages, problemMessages, ai } from './common';
import { commandPalette } from './commandPalette';
import { equipmentView } from './equipment';
import { helpView } from './help';
import { knowledgeView, tipOfTheDay } from './knowledge';
import { onboarding } from './onboarding';
import { plantsView } from './plants';
import { settingsView } from './settings';
import { strainsView } from './strains';

export const de = {
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
  tipOfTheDay,
};
```

### `locales/de/common.ts`
```typescript
export const common = {
  add: 'Hinzufügen',
  apply: 'Anwenden',
  back: 'Zurück',
  cancel: 'Abbrechen',
  close: 'Schließen',
  confirm: 'Bestätigen',
  delete: 'Löschen',
  details: 'Details',
  downloadAgain: 'Erneut herunterladen',
  edit: 'Bearbeiten',
  export: 'Exportieren',
  genetics: 'Genetik',
  name: 'Name',
  next: 'Weiter',
  noDataToExport: 'Keine Daten zum Exportieren vorhanden.',
  notes: 'Notizen',
  save: 'Speichern',
  start: 'Starten',
  successfullyExported: '{count} Einträge erfolgreich als {format} exportiert.',
  type: 'Typ',
  typeDetails: 'Typ-Details',
  why: 'Warum?',
  days: 'Tage',
  description: 'Beschreibung',
  actions: 'Aktionen',
  error: 'Fehler',
};
// ... (rest of the file)
```

... (and so on for all German locale files)
