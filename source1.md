# CannaGuide 2025 - Kompletter Quellcode (Teil 2)

Dieser Teil enthält alle Service-Dateien der Anwendung.

---

## 2. Services (`services/`)

Dieser Ordner enthält die Kernlogik der Anwendung, getrennt von den UI-Komponenten.

---

### `services/api.ts`

```typescript
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { geminiService } from '@/services/geminiService';
import { 
    Recommendation, 
    Plant, 
    PlantDiagnosisResponse, 
    AIResponse, 
    MentorMessage, 
    Strain, 
    StructuredGrowTips, 
    DeepDiveGuide,
    Language
} from '@/types';

// Define a minimal state interface to avoid circular dependency with the main store.
interface MinimalRootState {
    settings: {
        settings: {
            language: Language;
        };
    };
}

// Define an explicit error shape for the API calls.
interface ApiError {
  message: string;
}

export const geminiApi = createApi({
  reducerPath: 'geminiApi',
  // Provide the explicit error type to fakeBaseQuery. This is crucial for fixing the
  // type inference issue with the endpoint builder that caused errors on all mutations.
  baseQuery: fakeBaseQuery<ApiError>(),
  endpoints: (builder) => ({
    getEquipmentRecommendation: builder.mutation<Recommendation, { prompt: string }>({
      queryFn: async ({ prompt }, api) => {
        // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
        const state = api.getState() as unknown as MinimalRootState;
        const lang = state.settings.settings.language;
        try {
          const data = await geminiService.getEquipmentRecommendation(prompt, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    diagnosePlant: builder.mutation<PlantDiagnosisResponse, { base64Image: string, mimeType: string, plant: Plant, userNotes: string }>({
      queryFn: async (args, api) => {
        // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
        const state = api.getState() as unknown as MinimalRootState;
        const lang = state.settings.settings.language;
        try {
          const data = await geminiService.diagnosePlant(args.base64Image, args.mimeType, args.plant, args.userNotes, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    getPlantAdvice: builder.mutation<AIResponse, Plant>({
      queryFn: async (plant, api) => {
        // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
        const state = api.getState() as unknown as MinimalRootState;
        const lang = state.settings.settings.language;
        try {
          const data = await geminiService.getPlantAdvice(plant, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    getProactiveDiagnosis: builder.mutation<AIResponse, Plant>({
       queryFn: async (plant, api) => {
        // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
        const state = api.getState() as unknown as MinimalRootState;
        const lang = state.settings.settings.language;
        try {
          const data = await geminiService.getProactiveDiagnosis(plant, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    getMentorResponse: builder.mutation<Omit<MentorMessage, 'role'>, { plant: Plant, query: string }>({
        queryFn: async ({ plant, query }, api) => {
            // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
            const state = api.getState() as unknown as MinimalRootState;
            const lang = state.settings.settings.language;
            try {
                const data = await geminiService.getMentorResponse(plant, query, lang);
                return { data };
            } catch (error) {
                return { error: { message: (error as Error).message } };
            }
        },
    }),
    getStrainTips: builder.mutation<StructuredGrowTips, { strain: Strain, context: { focus: string, stage: string, experience: string } }>({
        queryFn: async ({ strain, context }, api) => {
            // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
            const state = api.getState() as unknown as MinimalRootState;
            const lang = state.settings.settings.language;
            try {
                const data = await geminiService.getStrainTips(strain, context, lang);
                return { data };
            } catch (error) {
                return { error: { message: (error as Error).message } };
            }
        },
    }),
    generateStrainImage: builder.mutation<string, Strain>({
        queryFn: async (strain, api) => {
            // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
            const state = api.getState() as unknown as MinimalRootState;
            const lang = state.settings.settings.language;
            try {
                const data = await geminiService.generateStrainImage(strain.name, lang);
                return { data };
            } catch (error) {
                return { error: { message: (error as Error).message } };
            }
        },
    }),
    generateDeepDive: builder.mutation<DeepDiveGuide, { topic: string, plant: Plant }>({
        queryFn: async ({ topic, plant }, api) => {
            // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
            const state = api.getState() as unknown as MinimalRootState;
            const lang = state.settings.settings.language;
            try {
                const data = await geminiService.generateDeepDive(topic, plant, lang);
                return { data };
            } catch (error) {
                return { error: { message: (error as Error).message } };
            }
        },
    }),
  }),
});

export const {
  useGetEquipmentRecommendationMutation,
  useDiagnosePlantMutation,
  useGetPlantAdviceMutation,
  useGetProactiveDiagnosisMutation,
  useGetMentorResponseMutation,
  useGetStrainTipsMutation,
  useGenerateStrainImageMutation,
  useGenerateDeepDiveMutation,
} = geminiApi;
```

### `services/breedingService.ts`

```typescript
import { Strain, Seed, StrainType } from '@/types';

class BreedingService {
    cross(seedA: Seed, seedB: Seed, allStrains: Strain[]): Omit<Strain, 'id'> | null {
        const parentA = allStrains.find(s => s.id === seedA.strainId);
        const parentB = allStrains.find(s => s.id === seedB.strainId);

        if (!parentA || !parentB) return null;

        // Simplified breeding logic
        const newStrain: Omit<Strain, 'id'> = {
            name: `${parentA.name.split(' ')[0]} x ${parentB.name.split(' ')[0]}`,
            type: parentA.type === parentB.type ? parentA.type : StrainType.Hybrid,
            floweringType: 'Photoperiod',
            thc: (parentA.thc + parentB.thc) / 2 * (1 + (Math.random() - 0.5) * 0.2), // +/- 10%
            cbd: (parentA.cbd + parentB.cbd) / 2,
            floweringTime: (parentA.floweringTime + parentB.floweringTime) / 2,
            agronomic: {
                difficulty: Math.random() > 0.5 ? parentA.agronomic.difficulty : parentB.agronomic.difficulty,
                yield: Math.random() > 0.5 ? parentA.agronomic.yield : parentB.agronomic.yield,
                height: Math.random() > 0.5 ? parentA.agronomic.height : parentB.agronomic.height,
            },
            aromas: [...new Set([...(parentA.aromas || []), ...(parentB.aromas || [])])].slice(0, 4),
            dominantTerpenes: [...new Set([...(parentA.dominantTerpenes || []), ...(parentB.dominantTerpenes || [])])].slice(0, 3),
            geneticModifiers: {
                pestResistance: ((parentA.geneticModifiers.pestResistance + parentB.geneticModifiers.pestResistance) / 2) * (1 + (Math.random() - 0.5) * 0.1),
                nutrientUptakeRate: ((parentA.geneticModifiers.nutrientUptakeRate + parentB.geneticModifiers.nutrientUptakeRate) / 2) * (1 + (Math.random() - 0.5) * 0.1),
                stressTolerance: ((parentA.geneticModifiers.stressTolerance + parentB.geneticModifiers.stressTolerance) / 2) * (1 + (Math.random() - 0.5) * 0.1),
                rue: ((parentA.geneticModifiers.rue + parentB.geneticModifiers.rue) / 2) * (1 + (Math.random() - 0.5) * 0.1),
            },
        };
        
        return newStrain;
    }
}

export const breedingService = new BreedingService();
```

### `services/breedingService.tsx`

```tsx
import { Strain, Seed, StrainType } from '@/types';

class BreedingService {
    cross(seedA: Seed, seedB: Seed, allStrains: Strain[]): Omit<Strain, 'id'> | null {
        const parentA = allStrains.find(s => s.id === seedA.strainId);
        const parentB = allStrains.find(s => s.id === seedB.strainId);

        if (!parentA || !parentB) return null;

        // Simplified breeding logic
        // FIX: Added missing `geneticModifiers` property to conform to the Strain type.
        const newStrain: Omit<Strain, 'id'> = {
            name: `${parentA.name.split(' ')[0]} x ${parentB.name.split(' ')[0]}`,
            // FIX: Use StrainType enum member instead of a string literal.
            type: parentA.type === parentB.type ? parentA.type : StrainType.Hybrid,
            floweringType: 'Photoperiod',
            thc: (parentA.thc + parentB.thc) / 2 * (1 + (Math.random() - 0.5) * 0.2), // +/- 10%
            cbd: (parentA.cbd + parentB.cbd) / 2,
            floweringTime: (parentA.floweringTime + parentB.floweringTime) / 2,
            agronomic: {
                difficulty: Math.random() > 0.5 ? parentA.agronomic.difficulty : parentB.agronomic.difficulty,
                yield: Math.random() > 0.5 ? parentA.agronomic.yield : parentB.agronomic.yield,
                height: Math.random() > 0.5 ? parentA.agronomic.height : parentB.agronomic.height,
            },
            aromas: [...new Set([...(parentA.aromas || []), ...(parentB.aromas || [])])].slice(0, 4),
            dominantTerpenes: [...new Set([...(parentA.dominantTerpenes || []), ...(parentB.dominantTerpenes || [])])].slice(0, 3),
            // FIX: Added missing 'rue' property to the geneticModifiers object.
            geneticModifiers: {
                pestResistance: ((parentA.geneticModifiers.pestResistance + parentB.geneticModifiers.pestResistance) / 2) * (1 + (Math.random() - 0.5) * 0.1),
                nutrientUptakeRate: ((parentA.geneticModifiers.nutrientUptakeRate + parentB.geneticModifiers.nutrientUptakeRate) / 2) * (1 + (Math.random() - 0.5) * 0.1),
                stressTolerance: ((parentA.geneticModifiers.stressTolerance + parentB.geneticModifiers.stressTolerance) / 2) * (1 + (Math.random() - 0.5) * 0.1),
                rue: ((parentA.geneticModifiers.rue + parentB.geneticModifiers.rue) / 2) * (1 + (Math.random() - 0.5) * 0.1),
            },
        };
        
        return newStrain;
    }
}

export const breedingService = new BreedingService();
```

### `services/commandService.ts`

```typescript
import React from 'react';
import { Command } from '@/types';

export enum CommandGroup {
    Navigation = 'Navigation',
    Plants = 'Plants',
    Strains = 'Strains',
    Knowledge = 'Knowledge',
    Settings = 'Settings',
    General = 'General Actions'
}

const groupOrder: CommandGroup[] = [
    CommandGroup.Navigation,
    CommandGroup.General,
    CommandGroup.Plants,
    CommandGroup.Strains,
    CommandGroup.Knowledge,
    CommandGroup.Settings,
];

export const groupAndSortCommands = (commands: Command[]): Command[] => {
    const grouped = commands.reduce((acc, command) => {
        if (!acc[command.group]) {
            acc[command.group] = [];
        }
        acc[command.group].push(command);
        return acc;
    }, {} as Record<string, Command[]>);

    const result: Command[] = [];
    groupOrder.forEach(groupName => {
        if (grouped[groupName] && grouped[groupName].length > 0) {
            result.push({
                id: `header-${groupName.replace(/\s/g, '')}`,
                title: groupName,
                group: groupName,
                isHeader: true,
                action: () => {},
                icon: () => React.createElement('div'),
            });
            result.push(...grouped[groupName]);
        }
    });

    return result;
};
```

### `services/dbService.ts`

```typescript
import { StoredImageData, Strain } from '@/types';

const DB_NAME = 'CannaGuideDB';
const DB_VERSION = 3; // Upgraded version for new indices
const STRAINS_STORE = 'strains';
const IMAGES_STORE = 'images';
const METADATA_STORE = 'metadata';
const STRAIN_SEARCH_INDEX_STORE = 'strain_search_index';

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            const transaction = (event.target as IDBOpenDBRequest).transaction;

            if (event.oldVersion < 1) {
                if (!dbInstance.objectStoreNames.contains(STRAINS_STORE)) {
                    dbInstance.createObjectStore(STRAINS_STORE, { keyPath: 'id' });
                }
                if (!dbInstance.objectStoreNames.contains(IMAGES_STORE)) {
                    dbInstance.createObjectStore(IMAGES_STORE, { keyPath: 'id' });
                }
                if (!dbInstance.objectStoreNames.contains(METADATA_STORE)) {
                    dbInstance.createObjectStore(METADATA_STORE, { keyPath: 'key' });
                }
            }
            
            if (event.oldVersion < 2) {
                if (!dbInstance.objectStoreNames.contains(STRAIN_SEARCH_INDEX_STORE)) {
                    dbInstance.createObjectStore(STRAIN_SEARCH_INDEX_STORE, { keyPath: 'word' });
                }
            }

            if (event.oldVersion < 3) {
                 if (transaction) {
                    const strainStore = transaction.objectStore(STRAINS_STORE);
                    if (!strainStore.indexNames.contains('by_type')) {
                        strainStore.createIndex('by_type', 'type', { unique: false });
                    }
                    if (!strainStore.indexNames.contains('by_thc')) {
                        strainStore.createIndex('by_thc', 'thc', { unique: false });
                    }
                    if (!strainStore.indexNames.contains('by_cbd')) {
                        strainStore.createIndex('by_cbd', 'cbd', { unique: false });
                    }
                    if (!strainStore.indexNames.contains('by_floweringTime')) {
                        strainStore.createIndex('by_floweringTime', 'floweringTime', { unique: false });
                    }
                }
            }
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

const getStore = (storeName: string, mode: IDBTransactionMode): IDBObjectStore => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

export const dbService = {
    async getMetadata(key: string): Promise<any> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(METADATA_STORE, 'readonly');
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async setMetadata(metadata: any): Promise<void> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(METADATA_STORE, 'readwrite');
            const request = store.put(metadata);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async addStrains(strains: Strain[]): Promise<void> {
        await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STRAINS_STORE, 'readwrite');
            const store = transaction.objectStore(STRAINS_STORE);
            store.clear();
            strains.forEach(strain => store.add(strain));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    async getAllStrains(): Promise<Strain[]> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(STRAINS_STORE, 'readonly');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getStrainsCount(): Promise<number> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(STRAINS_STORE, 'readonly');
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async addImage(imageData: StoredImageData): Promise<void> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(IMAGES_STORE, 'readwrite');
            const request = store.put(imageData);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async getImage(id: string): Promise<StoredImageData | null> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(IMAGES_STORE, 'readonly');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    },

    async getAllImages(): Promise<StoredImageData[]> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(IMAGES_STORE, 'readonly');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    async updateSearchIndex(index: Record<string, string[]>): Promise<void> {
        await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STRAIN_SEARCH_INDEX_STORE, 'readwrite');
            const store = transaction.objectStore(STRAIN_SEARCH_INDEX_STORE);
            store.clear();
            Object.entries(index).forEach(([word, ids]) => {
                store.put({ word, ids });
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    async searchIndex(tokens: string[]): Promise<Set<string> | null> {
        if (tokens.length === 0) return null;
        await openDB();

        const transaction = db.transaction(STRAIN_SEARCH_INDEX_STORE, 'readonly');
        const store = transaction.objectStore(STRAIN_SEARCH_INDEX_STORE);
        
        const promises = tokens.map(token => {
            return new Promise<string[] | undefined>((resolve, reject) => {
                const request = store.get(token);
                request.onsuccess = () => resolve(request.result?.ids);
                request.onerror = () => reject(request.error);
            });
        });
        
        try {
            const results = await Promise.all(promises);

            if (results.some(r => r === undefined)) {
                return new Set(); // One token not found, so no intersection possible
            }

            const idSets = results.map(ids => new Set(ids!));
            if (idSets.length === 0) return new Set();

            // Find the intersection of all sets
            const intersection = idSets.reduce((a, b) => new Set([...a].filter(x => b.has(x))));
            return intersection;
        } catch(error) {
            console.error("Search Index error:", error);
            return new Set(); // Return empty set on error
        }
    }
};
```

### `services/exportLogic.ts`

```typescript
// services/exportLogic.ts
import {
    Strain,
    SavedSetup,
    RecommendationCategory,
    ExportFormat,
    ArchivedMentorResponse,
    SavedStrainTip,
    ArchivedAdvisorResponse,
    Recommendation,
    RecommendationItem,
} from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Private Helper Functions ---

const downloadFile = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const sanitizeForCSV = (value: unknown): string => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
    return `"${str}"`;
};

const escapeXml = (unsafe: string | null | undefined): string => {
    if (unsafe === null || unsafe === undefined) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

const objectToXml = (obj: Record<string, unknown>, indent = '  '): string => {
    return Object.entries(obj)
        .map(([key, value]) => {
            const xmlKey = escapeXml(key.replace(/[^a-zA-Z0-9_]/g, ''));
            if (value === null || value === undefined) {
                return `${indent}<${xmlKey}/>`;
            }
            if (Array.isArray(value)) {
                const itemName = xmlKey.endsWith('s') ? xmlKey.slice(0, -1) : 'item';
                return `${indent}<${xmlKey}>\n${value
                    .map((item) => `${indent}  <${itemName}>${escapeXml(String(item))}</${itemName}>`)
                    .join('\n')}\n${indent}</${xmlKey}>`;
            }
            if (typeof value === 'object' && value !== null) {
                return `${indent}<${xmlKey}>\n${objectToXml(
                    value as Record<string, unknown>,
                    indent + '  '
                )}\n${indent}</${xmlKey}>`;
            }
            return `${indent}<${xmlKey}>${escapeXml(String(value))}</${xmlKey}>`;
        })
        .join('\n');
};

const drawPdfLayout = (
    doc: jsPDF,
    title: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    const pageCount = (doc as any).internal.pages.length;
    const pageWidth = doc.internal.pageSize.width;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(37, 99, 235); // primary-600
        doc.text('CannaGuide 2025', 15, 17);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text(title, pageWidth - 15, 17, { align: 'right' });

        doc.setDrawColor(30, 41, 59); // slate-800
        doc.line(15, 22, pageWidth - 15, 22);

        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105); // slate-600
        const footerStr = `${t('common.page')} ${i} / ${pageCount}`;
        doc.text(footerStr, pageWidth / 2, doc.internal.pageSize.height - 10, {
            align: 'center',
        });
        doc.text(
            `${t('common.generated')}: ${new Date().toLocaleString()}`,
            15,
            doc.internal.pageSize.height - 10
        );
    }
};

const cleanHtml = (html: string | null | undefined) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
};

const exportDataLogic = <T extends { [key: string]: any }>(
    data: T[],
    format: ExportFormat,
    filename: string,
    config: {
        title: string;
        toSerializable: (item: T) => Record<string, unknown>;
        xmlRoot: string;
        xmlItem: string;
        txtFormatter: (item: T) => string;
        pdfHeaders: string[];
        pdfRows: (item: T) => string[];
        t: (key: string, options?: Record<string, unknown>) => string;
    }
) => {
    const { t } = config;
    const serializableData = data.map((item) => config.toSerializable(item));

    switch (format) {
        case 'json':
            downloadFile(
                JSON.stringify(data, null, 2),
                `${filename}.json`,
                'application/json;charset=utf-8;'
            );
            break;
        case 'csv':
            if (serializableData.length === 0) return;
            const headers = Object.keys(serializableData[0]);
            const rows = serializableData.map((obj) =>
                headers.map((header) => sanitizeForCSV(obj[header])).join(',')
            );
            downloadFile(
                '\uFEFF' + [headers.join(','), ...rows].join('\n'),
                `${filename}.csv`,
                'text/csv;charset=utf-8;'
            );
            break;
        case 'xml':
            const items = serializableData
                .map(
                    (item) =>
                        `  <${config.xmlItem}>\n${objectToXml(item, '    ')}\n  </${config.xmlItem}>`
                )
                .join('\n');
            downloadFile(
                `<?xml version="1.0" encoding="UTF-8"?>\n<${config.xmlRoot}>\n${items}\n</${config.xmlRoot}>`,
                `${filename}.xml`,
                'application/xml;charset=utf-8;'
            );
            break;
        case 'txt':
            let txtString = `CannaGuide 2025 - ${config.title} - ${new Date().toLocaleString()}\n\n`;
            data.forEach((item) => {
                txtString += `----------------------------------------\n`;
                txtString += config.txtFormatter(item);
                txtString += `\n`;
            });
            downloadFile(txtString, `${filename}.txt`, 'text/plain;charset=utf-8;');
            break;
        case 'pdf':
            const doc = new jsPDF();
            (doc as any).autoTable({
                head: [config.pdfHeaders],
                body: data.map((item) => config.pdfRows(item)),
                startY: 30,
                didDrawPage: () => drawPdfLayout(doc, config.title, t),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [37, 99, 235] },
            });
            doc.save(`${filename}.pdf`);
            break;
    }
};

export const exportStrainsLogic = (
    strains: Strain[],
    format: ExportFormat,
    filename: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    const strainToSerializableObject = (strain: Strain) => ({
        [t('strainsView.csvHeaders.name')]: strain.name,
        [t('strainsView.csvHeaders.type')]: strain.type,
        [t('strainsView.csvHeaders.thc')]: strain.thc,
        [t('strainsView.csvHeaders.cbd')]: strain.cbd,
        [t('strainsView.csvHeaders.floweringTime')]: strain.floweringTime,
        [t('strainsView.csvHeaders.difficulty')]: t(
            `strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`
        ),
        [t('strainsView.csvHeaders.yield')]: t(
            `strainsView.addStrainModal.yields.${strain.agronomic.yield.toLowerCase()}`
        ),
        [t('strainsView.csvHeaders.height')]: t(
            `strainsView.addStrainModal.heights.${strain.agronomic.height.toLowerCase()}`
        ),
        [t('strainsView.csvHeaders.genetics')]: strain.genetics || '',
        [t('strainsView.csvHeaders.aromas')]: (strain.aromas || []).join('; '),
        [t('strainsView.csvHeaders.terpenes')]: (strain.dominantTerpenes || []).join('; '),
        [t('strainsView.csvHeaders.yieldIndoor')]: strain.agronomic.yieldDetails?.indoor || '',
        [t('strainsView.csvHeaders.yieldOutdoor')]: strain.agronomic.yieldDetails?.outdoor || '',
        [t('strainsView.csvHeaders.heightIndoor')]: strain.agronomic.heightDetails?.indoor || '',
        [t('strainsView.csvHeaders.heightOutdoor')]: strain.agronomic.heightDetails?.outdoor || '',
        [t('strainsView.csvHeaders.description')]: strain.description || '',
    });

    if (format === 'pdf') {
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const contentWidth = pageWidth - margin * 2;
        let y = 30; // Start y position after header

        const checkPageBreak = (neededHeight: number) => {
            if (y + neededHeight > doc.internal.pageSize.getHeight() - 20) { // 20 for footer
                doc.addPage();
                y = 30;
            }
        };

        const addTitle = (text: string) => {
            checkPageBreak(12);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(37, 99, 235); // primary-600 (darker blue for better contrast)
            doc.text(text, margin, y);
            y += 8;
        };
        
        const addSectionTitle = (text: string) => {
            checkPageBreak(10);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42); // slate-900 (almost black)
            doc.text(text, margin, y);
            y += 6;
        };

        const addKeyValue = (key: string, value: string | undefined | null) => {
            if (!value) return;
            const valueLines = doc.splitTextToSize(value, contentWidth - 40); // indent for key
            checkPageBreak(valueLines.length * 5 + 2);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 65, 85); // slate-700
            doc.text(`${key}:`, margin + 2, y);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59); // slate-800
            doc.text(valueLines, margin + 40, y);
            y += valueLines.length * 5;
        };

        strains.forEach((strain, index) => {
            if (index > 0) {
                doc.addPage();
                y = 30; // Reset y-coordinate for the new page
            }

            addTitle(strain.name);

            addKeyValue(t('common.type'), strain.typeDetails || strain.type);
            addKeyValue(t('common.genetics'), strain.genetics);
            y += 4;

            addSectionTitle(t('strainsView.strainDetail.cannabinoidProfile'));
            addKeyValue(t('strainsView.table.thc'), strain.thcRange || `${strain.thc}%`);
            addKeyValue(t('strainsView.table.cbd'), strain.cbdRange || `${strain.cbd}%`);
            y += 4;
            
            addSectionTitle(t('strainsView.strainModal.agronomicData'));
            addKeyValue(t('strainsView.strainModal.difficulty'), t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`));
            addKeyValue(t('strainsView.table.flowering'), `${strain.floweringTimeRange || strain.floweringTime} ${t('common.units.weeks')}`);
            addKeyValue(t('strainsView.strainModal.yieldIndoor'), strain.agronomic.yieldDetails?.indoor);
            addKeyValue(t('strainsView.strainModal.yieldOutdoor'), strain.agronomic.yieldDetails?.outdoor);
            addKeyValue(t('strainsView.strainModal.heightIndoor'), strain.agronomic.heightDetails?.indoor);
            addKeyValue(t('strainsView.strainModal.heightOutdoor'), strain.agronomic.heightDetails?.outdoor);
            y += 4;

            addSectionTitle(t('strainsView.strainDetail.aromaProfile'));
            addKeyValue(t('strainsView.strainModal.aromas'), (strain.aromas || []).map(aroma => t(`common.aromas.${aroma}`, { defaultValue: aroma })).join(', '));
            addKeyValue(t('strainsView.strainModal.dominantTerpenes'), (strain.dominantTerpenes || []).map(terp => t(`common.terpenes.${terp}`, { defaultValue: terp })).join(', '));
            y += 4;
            
            if (strain.description) {
                addSectionTitle(t('common.description'));
                const descLines = doc.splitTextToSize(strain.description, contentWidth);
                checkPageBreak(descLines.length * 5);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(15, 23, 42); // slate-900 (almost black)
                doc.text(descLines, margin, y);
                y += descLines.length * 5;
            }
        });

        drawPdfLayout(doc, t('strainsView.exportModal.title'), t);
        doc.save(`${filename}.pdf`);

    } else {
        exportDataLogic(strains, format, filename, {
            title: t('strainsView.exportModal.title'),
            toSerializable: strainToSerializableObject,
            xmlRoot: 'strains',
            xmlItem: 'strain',
            txtFormatter: (s) => {
                const data = strainToSerializableObject(s);
                let str = `[ ${data[t('strainsView.csvHeaders.name')]} ]\n`;
                for (const [key, value] of Object.entries(data)) {
                    if (value && key !== t('strainsView.csvHeaders.name')) {
                        str += `${key}: ${value}\n`;
                    }
                }
                return str;
            },
            pdfHeaders: [], // Not used for non-pdf formats here
            pdfRows: () => [], // Not used for non-pdf formats here
            t,
        });
    }
};

export const exportSetupLogic = (
    setup: SavedSetup,
    format: ExportFormat,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    const filename = setup.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const recommendationKeys = Object.keys(setup.recommendation) as (keyof Recommendation)[];

    const setupToSerializableObject = (s: SavedSetup) => ({
        name: s.name,
        createdAt: new Date(s.createdAt).toISOString(),
        totalCost: s.totalCost,
        sourceDetails: s.sourceDetails,
        components: recommendationKeys
            .filter((key): key is RecommendationCategory => key !== 'proTip')
            .map((key) => ({
                category: t(`equipmentView.configurator.categories.${key}`),
                product: s.recommendation[key].name,
                price: s.recommendation[key].price,
                rationale: s.recommendation[key].rationale,
                watts: s.recommendation[key].watts,
            })),
        proTip: s.recommendation.proTip,
    });
    const serializableSetup = setupToSerializableObject(setup);

    switch (format) {
        case 'json':
            downloadFile(
                JSON.stringify(serializableSetup, null, 2),
                `${filename}.json`,
                'application/json;charset=utf-8;'
            );
            break;
        case 'xml':
            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<savedSetup>\n${objectToXml(
                serializableSetup,
                '  '
            )}\n</savedSetup>`;
            downloadFile(xmlContent, `${filename}.xml`, 'application/xml;charset=utf-8;');
            break;
        case 'csv':
            const headers = [
                t('equipmentView.savedSetups.pdfReport.category'),
                t('equipmentView.savedSetups.pdfReport.product'),
                t('equipmentView.savedSetups.pdfReport.price'),
                t('equipmentView.savedSetups.pdfReport.rationale'),
                t('common.units.watt'),
            ];
            const rows = serializableSetup.components.map((c) =>
                [
                    sanitizeForCSV(c.category),
                    sanitizeForCSV(c.product),
                    sanitizeForCSV(c.price),
                    sanitizeForCSV(c.rationale),
                    sanitizeForCSV(c.watts || ''),
                ].join(',')
            );
            downloadFile(
                '\uFEFF' + [headers.join(','), ...rows].join('\n'),
                `${filename}_components.csv`,
                'text/csv;charset=utf-8;'
            );
            break;
        case 'txt':
            let txtString = `CannaGuide 2025 - ${t(
                'equipmentView.savedSetups.pdfReport.setup'
            )}: ${setup.name}\n`;
            txtString += `========================================\n\n`;
            txtString += `${t(
                'equipmentView.savedSetups.pdfReport.createdAt'
            )}: ${new Date(setup.createdAt).toLocaleString()}\n`;
            txtString += `${t('equipmentView.configurator.total')}: ${setup.totalCost.toFixed(
                2
            )} ${t('common.units.currency_eur')}\n\n`;
            txtString += `--- ${t('equipmentView.configurator.costBreakdown')} ---\n\n`;
            recommendationKeys
                .filter((key): key is RecommendationCategory => key !== 'proTip')
                .forEach((key) => {
                    const item = setup.recommendation[key];
                    txtString += `${t(`equipmentView.configurator.categories.${key}`)}:\n`;
                    txtString += `  - ${t('equipmentView.savedSetups.pdfReport.product')}: ${
                        item.name
                    } ${item.watts ? `(${item.watts}W)` : ''}\n`;
                    txtString += `  - ${t('equipmentView.savedSetups.pdfReport.price')}: ${item.price.toFixed(
                        2
                    )} ${t('common.units.currency_eur')}\n`;
                    txtString += `  - ${t('equipmentView.savedSetups.pdfReport.rationale')}: ${
                        item.rationale
                    }\n\n`;
                });
            if (setup.recommendation.proTip) {
                txtString += `--- Profi-Tipp ---\n${setup.recommendation.proTip}\n`;
            }
            downloadFile(txtString, `${filename}.txt`, 'text/plain;charset=utf-8;');
            break;
        case 'pdf':
            const doc = new jsPDF();
            const reportTitle = t('equipmentView.savedSetups.pdfReport.setup');

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 23, 42);
            doc.text(setup.name || '', 15, 35);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            doc.text(
                `${t('equipmentView.savedSetups.pdfReport.createdAt')}: ${new Date(
                    setup.createdAt
                ).toLocaleString()}`,
                15,
                42
            );
            doc.text(
                `${t('equipmentView.configurator.total')}: ${setup.totalCost.toFixed(2)} ${t(
                    'common.units.currency_eur'
                )}`,
                doc.internal.pageSize.width - 15,
                42,
                { align: 'right' }
            );

            (doc as any).autoTable({
                head: [
                    [
                        t('equipmentView.savedSetups.pdfReport.item'),
                        t('equipmentView.savedSetups.pdfReport.product'),
                        t('equipmentView.savedSetups.pdfReport.rationale'),
                        t('equipmentView.savedSetups.pdfReport.price'),
                    ],
                ],
                body: recommendationKeys
                    .filter((key): key is RecommendationCategory => key !== 'proTip')
                    .map((key) => {
                        const item = setup.recommendation[key];
                        return [
                            t(`equipmentView.configurator.categories.${key}`),
                            `${item.name || ''} ${item.watts ? `(${item.watts}W)` : ''}`,
                            item.rationale || '',
                            item.price?.toFixed(2) || '0.00',
                        ];
                    }),
                startY: 50,
                headStyles: { fillColor: [37, 99, 235] },
                didDrawPage: (data: any) => {
                    drawPdfLayout(doc, reportTitle, t);
                    if (data.pageNumber === (doc as any).internal.pages.length - 1) {
                        if (setup.recommendation.proTip) {
                            let finalY = (data.doc as any).lastAutoTable.finalY;
                            if (finalY + 30 > doc.internal.pageSize.height) {
                                doc.addPage();
                                finalY = 25;
                            }
                            doc.setFontSize(12);
                            doc.setFont('helvetica', 'bold');
                            doc.setTextColor(15, 23, 42);
                            doc.text(t('strainsView.tips.form.categories.proTip'), 15, finalY + 15);
                            doc.setFontSize(10);
                            doc.setFont('helvetica', 'normal');
                            doc.setTextColor(30, 41, 59);
                            const proTipLines = doc.splitTextToSize(
                                setup.recommendation.proTip || '',
                                doc.internal.pageSize.width - 30
                            );
                            doc.text(proTipLines, 15, finalY + 22);
                        }
                    }
                },
            });
            doc.save(`${filename}.pdf`);
            break;
    }
};

export const exportSetupsLogic = (
    setups: SavedSetup[],
    format: ExportFormat,
    filename: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    exportDataLogic(setups, format, filename, {
        title: t('equipmentView.savedSetups.exportTitle'),
        toSerializable: (item) => ({
            name: item.name,
            createdAt: new Date(item.createdAt).toLocaleDateString(),
            totalCost: item.totalCost,
            area: item.sourceDetails.area,
            budget: item.sourceDetails.budget,
            growStyle: item.sourceDetails.growStyle,
        }),
        xmlRoot: 'savedSetups',
        xmlItem: 'setup',
        txtFormatter: (s) => {
            let str = `[ ${s.name} ]\n`;
            str += `Created: ${new Date(s.createdAt).toLocaleString()}\n`;
            str += `Total Cost: ${s.totalCost.toFixed(2)} ${t('common.units.currency_eur')}\n`;
            str += `Source Details: Area ${s.sourceDetails.area}, Budget ${s.sourceDetails.budget}, Style ${s.sourceDetails.growStyle}\n\n`;
            str += `--- Components ---\n`;
            (Object.keys(s.recommendation) as (keyof Recommendation)[]).forEach((key) => {
                if (key === 'proTip') return;
                const item = s.recommendation[key as RecommendationCategory];
                str += `- ${t(`equipmentView.configurator.categories.${key}`)}: ${
                    item.name
                } (${item.price.toFixed(2)} ${t('common.units.currency_eur')})\n`;
            });
            return str;
        },
        pdfHeaders: [
            t('common.name'),
            t('equipmentView.savedSetups.pdfReport.createdAt'),
            `${t('equipmentView.configurator.total')} (${t('common.units.currency_eur')})`,
            'Area',
            'Style',
            'Budget',
        ],
        pdfRows: (s) => [
            s.name,
            new Date(s.createdAt).toLocaleDateString(),
            s.totalCost.toFixed(2),
            s.sourceDetails.area,
            s.sourceDetails.growStyle,
            s.sourceDetails.budget,
        ],
        t,
    });
};

export const exportStrainTipsLogic = (
    tips: SavedStrainTip[],
    format: ExportFormat,
    filename: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    exportDataLogic(tips, format, filename, {
        title: t('strainsView.tips.title'),
        toSerializable: (item) => ({
            Strain: item.strainName,
            Created: new Date(item.createdAt).toLocaleString(),
            Title: item.title,
            Content: cleanHtml(item.content),
        }),
        xmlRoot: 'strain_tips',
        xmlItem: 'tip',
        txtFormatter: (item) =>
            `Strain: ${item.strainName}\nDate: ${new Date(
                item.createdAt
            ).toLocaleString()}\nTitle: ${item.title}\n---\n${cleanHtml(item.content)}\n`,
        pdfHeaders: [t('strainsView.table.strain'), 'Title', 'Date', 'Content'],
        pdfRows: (item) => [
            item.strainName,
            item.title,
            new Date(item.createdAt).toLocaleDateString(),
            cleanHtml(item.content),
        ],
        t,
    });
};

export const exportMentorArchiveLogic = (
    responses: ArchivedMentorResponse[],
    format: ExportFormat,
    filename: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    exportDataLogic(responses, format, filename, {
        title: t('knowledgeView.archive.title'),
        toSerializable: (item) => ({
            Query: item.query,
            Created: new Date(item.createdAt).toLocaleString(),
            Title: item.title,
            Content: cleanHtml(item.content),
        }),
        xmlRoot: 'mentor_responses',
        xmlItem: 'response',
        txtFormatter: (item) =>
            `Query: ${item.query}\nDate: ${new Date(
                item.createdAt
            ).toLocaleString()}\nTitle: ${item.title}\n---\n${cleanHtml(item.content)}\n`,
        pdfHeaders: ['Query', 'Title', 'Date', 'Content'],
        pdfRows: (item) => [
            item.query,
            item.title,
            new Date(item.createdAt).toLocaleDateString(),
            cleanHtml(item.content),
        ],
        t,
    });
};

export const exportAdvisorArchiveLogic = (
    responses: (ArchivedAdvisorResponse & { plantName: string })[],
    format: ExportFormat,
    filename: string,
    t: (key: string, options?: Record<string, unknown>) => string
) => {
    exportDataLogic(responses, format, filename, {
        title: t('plantsView.aiAdvisor.archiveTitle'),
        toSerializable: (item) => ({
            Plant: item.plantName,
            Stage: t(`plantStages.${item.plantStage}`),
            Created: new Date(item.createdAt).toLocaleString(),
            Title: item.title,
            Content: cleanHtml(item.content),
        }),
        xmlRoot: 'advisor_responses',
        xmlItem: 'response',
        txtFormatter: (item) =>
            `Plant: ${item.plantName}\nStage: ${t(
                `plantStages.${item.plantStage}`
            )}\nDate: ${new Date(item.createdAt).toLocaleString()}\nTitle: ${
                item.title
            }\n---\n${cleanHtml(item.content)}\n`,
        pdfHeaders: ['Plant', 'Stage', 'Title', 'Date', 'Content'],
        pdfRows: (item) => [
            item.plantName,
            t(`plantStages.${item.plantStage}`),
            item.title,
            new Date(item.createdAt).toLocaleDateString(),
            cleanHtml(item.content),
        ],
        t,
    });
};
```

### `services/exportService.ts`

```typescript
// services/exportService.ts
// FIX: Corrected import path for types to use the '@/' alias.
import { Strain, SavedSetup, ExportFormat, ArchivedMentorResponse, SavedStrainTip, ArchivedAdvisorResponse } from '@/types';
import { getT } from '@/i18n';
import {
    exportStrainsLogic,
    exportSetupLogic,
    exportSetupsLogic,
    exportStrainTipsLogic,
    exportMentorArchiveLogic,
    exportAdvisorArchiveLogic,
} from './exportLogic';

const exportStrains = (strains: Strain[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportStrainsLogic(strains, format, filename, t);
};

const exportSetup = (setup: SavedSetup, format: ExportFormat) => {
    const t = getT();
    exportSetupLogic(setup, format, t);
};

const exportSetups = (setups: SavedSetup[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportSetupsLogic(setups, format, filename, t);
};

const exportStrainTips = (tips: SavedStrainTip[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportStrainTipsLogic(tips, format, filename, t);
};

const exportMentorArchive = (responses: ArchivedMentorResponse[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportMentorArchiveLogic(responses, format, filename, t);
};

const exportAdvisorArchive = (responses: (ArchivedAdvisorResponse & {plantName: string})[], format: ExportFormat, filename: string) => {
    const t = getT();
    exportAdvisorArchiveLogic(responses, format, filename, t);
};

export const exportService = {
    exportStrains,
    exportSetup,
    exportSetups,
    exportStrainTips,
    exportMentorArchive,
    exportAdvisorArchive
};
```

### `services/geminiService.ts`

```typescript
import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from '@google/genai'
import {
    Plant,
    Recommendation,
    Strain,
    PlantDiagnosisResponse,
    AIResponse,
    StructuredGrowTips,
    DeepDiveGuide,
    MentorMessage,
    Language,
} from '@/types'
import { getT } from '@/i18n'

const formatPlantContextForPrompt = (
    plant: Plant,
    t: (key: string, options?: Record<string, any>) => string
): string => {
    const stageDetails = t(`plantStages.${plant.stage}`)
    const problems =
        plant.problems.length > 0
            ? plant.problems
                  .map((p) =>
                      t(
                          `problemMessages.${
                              p.type.charAt(0).toLowerCase() + p.type.slice(1)
                          }.message`
                      )
                  )
                  .join(', ')
            : t('common.none')

    return `
PLANT CONTEXT REPORT
====================
Name: ${plant.name} (${plant.strain.name})
Age: ${plant.age} days
Stage: ${stageDetails}
Health: ${plant.health.toFixed(1)}%
Stress Level: ${plant.stressLevel.toFixed(1)}%

ENVIRONMENT
-----------
Temperature: ${plant.environment.internalTemperature.toFixed(1)}°C
Humidity: ${plant.environment.internalHumidity.toFixed(1)}%
VPD: ${plant.environment.vpd.toFixed(2)} kPa
CO2 Level: ${plant.environment.co2Level.toFixed(0)} ppm

MEDIUM & ROOTS
-----------------
pH: ${plant.medium.ph.toFixed(2)}
EC: ${plant.medium.ec.toFixed(2)}
Moisture: ${plant.medium.moisture.toFixed(1)}%
Root Health: ${plant.rootSystem.health.toFixed(1)}%

ACTIVE ISSUES
-------------
${problems}
    `.trim()
}

const createLocalizedPrompt = (basePrompt: string, lang: Language): string => {
    const languageInstruction =
        lang === 'de'
            ? 'WICHTIG: Deine gesamte Antwort muss ausschließlich auf Deutsch (de-DE) sein.'
            : 'IMPORTANT: Your entire response must be exclusively in English (en-US).'

    return `${languageInstruction}\n\n${basePrompt}`
}

class GeminiService {
    private ai: GoogleGenAI

    constructor() {
        if (!process.env.API_KEY) {
            throw new Error('API_KEY environment variable not set')
        }
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY })
    }

    private async generateText(prompt: string, lang: Language): Promise<string> {
        try {
            const localizedPrompt = createLocalizedPrompt(prompt, lang)
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: localizedPrompt,
            })
            return response.text
        } catch (error) {
            console.error('Gemini API Error:', error)
            throw new Error('ai.error.generic')
        }
    }

    async getEquipmentRecommendation(prompt: string, lang: Language): Promise<Recommendation> {
        const t = getT()
        try {
            const systemInstruction = t('ai.prompts.equipmentSystemInstruction')
            const localizedSystemInstruction = createLocalizedPrompt(systemInstruction, lang)

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: localizedSystemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            tent: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    rationale: { type: Type.STRING },
                                },
                                required: ['name', 'price', 'rationale'],
                            },
                            light: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    rationale: { type: Type.STRING },
                                    watts: { type: Type.NUMBER },
                                },
                                required: ['name', 'price', 'rationale', 'watts'],
                            },
                            ventilation: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    rationale: { type: Type.STRING },
                                },
                                required: ['name', 'price', 'rationale'],
                            },
                            circulationFan: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    rationale: { type: Type.STRING },
                                },
                                required: ['name', 'price', 'rationale'],
                            },
                            pots: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    rationale: { type: Type.STRING },
                                },
                                required: ['name', 'price', 'rationale'],
                            },
                            soil: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    rationale: { type: Type.STRING },
                                },
                                required: ['name', 'price', 'rationale'],
                            },
                            nutrients: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    rationale: { type: Type.STRING },
                                },
                                required: ['name', 'price', 'rationale'],
                            },
                            extra: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    rationale: { type: Type.STRING },
                                },
                                required: ['name', 'price', 'rationale'],
                            },
                            proTip: { type: Type.STRING },
                        },
                        required: [
                            'tent',
                            'light',
                            'ventilation',
                            'circulationFan',
                            'pots',
                            'soil',
                            'nutrients',
                            'extra',
                            'proTip',
                        ],
                    },
                },
            })

            return JSON.parse(response.text.trim()) as Recommendation
        } catch (error) {
            console.error('Gemini getEquipmentRecommendation Error:', error)
            throw new Error('ai.error.equipment')
        }
    }

    async diagnosePlant(
        base64Image: string,
        mimeType: string,
        plant: Plant,
        userNotes: string,
        lang: Language
    ): Promise<PlantDiagnosisResponse> {
        const t = getT()
        const problems =
            plant.problems.length > 0
                ? plant.problems
                      .map((p) =>
                          t(
                              `problemMessages.${
                                  p.type.charAt(0).toLowerCase() + p.type.slice(1)
                              }.message`,
                              p.type
                          )
                      )
                      .join(', ')
                : t('common.none')

        const contextString = `
PLANT CONTEXT:
- Strain: ${plant.strain.name} (${plant.strain.type})
- Age: ${plant.age} days (Stage: ${t(`plantStages.${plant.stage}`)})
- Active Issues: ${problems}
- Medium Vitals: pH ${plant.medium.ph.toFixed(2)}, EC ${plant.medium.ec.toFixed(2)}
- Environment Vitals: Temp ${plant.environment.internalTemperature.toFixed(
            1
        )}°C, Humidity ${plant.environment.internalHumidity.toFixed(1)}%
- USER NOTES: "${userNotes || 'None provided'}"
        `.trim()

        const prompt = `
            Analyze the following image of a cannabis plant.
            ${contextString}
            Based on the image and the detailed context, provide a comprehensive diagnosis.
            Respond in JSON format only, adhering strictly to the provided schema. The schema is: { "title": "string", "confidence": "number (0.0-1.0)", "diagnosis": "string", "immediateActions": "string (markdown)", "longTermSolution": "string (markdown)", "prevention": "string (markdown)" }.
        `

        const localizedPrompt = createLocalizedPrompt(prompt, lang)

        try {
            const imagePart = { inlineData: { data: base64Image, mimeType } }
            const textPart = { text: localizedPrompt }

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            })

            return JSON.parse(response.text.trim()) as PlantDiagnosisResponse
        } catch (error) {
            console.error('Gemini diagnosePlant Error:', error)
            throw new Error('ai.error.diagnostics')
        }
    }

    async getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse> {
        const t = getT()
        const plantContext = formatPlantContextForPrompt(plant, t)
        const prompt = t('ai.prompts.advisor', { plant: plantContext })
        const responseText = await this.generateText(prompt, lang)
        return { title: t('ai.advisor'), content: responseText }
    }

    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        const t = getT()
        const plantContext = formatPlantContextForPrompt(plant, t)
        const prompt = t('ai.prompts.proactiveDiagnosis', { plant: plantContext })
        const responseText = await this.generateText(prompt, lang)
        return { title: t('ai.proactiveDiagnosis'), content: responseText }
    }

    async getMentorResponse(
        plant: Plant,
        query: string,
        lang: Language
    ): Promise<Omit<MentorMessage, 'role'>> {
        const t = getT()
        const plantContext = formatPlantContextForPrompt(plant, t)
        const prompt = t('ai.prompts.mentor.main', {
            context: plantContext,
            query: query,
        })

        try {
            const systemInstruction = t('ai.prompts.mentor.systemInstruction')
            const localizedSystemInstruction = createLocalizedPrompt(systemInstruction, lang)
            const localizedPrompt = createLocalizedPrompt(prompt, lang)
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: localizedPrompt,
                config: {
                    systemInstruction: localizedSystemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            uiHighlights: {
                                type: Type.ARRAY,
                                nullable: true,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        elementId: { type: Type.STRING },
                                        plantId: { type: Type.STRING, nullable: true },
                                    },
                                    required: ['elementId'],
                                },
                            },
                        },
                        required: ['title', 'content'],
                    },
                },
            })

            return JSON.parse(response.text.trim()) as Omit<MentorMessage, 'role'>
        } catch (error) {
            console.error('Gemini getMentorResponse Error:', error)
            throw new Error('ai.error.generic')
        }
    }

    async getStrainTips(
        strain: Strain,
        context: { focus: string; stage: string; experience: string },
        lang: Language
    ): Promise<StructuredGrowTips> {
        const t = getT()
        const prompt = t('ai.prompts.strainTips', {
            strain: JSON.stringify(strain),
            focus: context.focus,
            stage: context.stage,
            experience: context.experience,
        })
        const localizedPrompt = createLocalizedPrompt(prompt, lang)
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: localizedPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            nutrientTip: { type: Type.STRING },
                            trainingTip: { type: Type.STRING },
                            environmentalTip: { type: Type.STRING },
                            proTip: { type: Type.STRING },
                        },
                        required: ['nutrientTip', 'trainingTip', 'environmentalTip', 'proTip'],
                    },
                },
            })

            return JSON.parse(response.text.trim()) as StructuredGrowTips
        } catch (e) {
            console.error('Gemini getStrainTips Error:', e)
            throw new Error('ai.error.tips')
        }
    }

    async generateStrainImage(strainName: string, lang: Language): Promise<string> {
        const t = getT()
        const prompt = t('ai.prompts.strainImage', { strainName })
        // Images don't need language instruction
        // const localizedPrompt = createLocalizedPrompt(prompt, lang);

        try {
            const response = await this.ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            })

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes
                return base64ImageBytes
            } else {
                throw new Error('No image was generated by the API.')
            }
        } catch (error) {
            console.error('Gemini generateStrainImage Error:', error)
            throw new Error('ai.error.generic')
        }
    }

    async generateDeepDive(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> {
        const t = getT()
        const prompt = t('ai.prompts.deepDive', {
            topic,
            plant: JSON.stringify(plant),
        })
        const localizedPrompt = createLocalizedPrompt(prompt, lang)
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: localizedPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            introduction: { type: Type.STRING },
                            stepByStep: { type: Type.ARRAY, items: { type: Type.STRING } },
                            prosAndCons: {
                                type: Type.OBJECT,
                                properties: {
                                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                                },
                                required: ['pros', 'cons'],
                            },
                            proTip: { type: Type.STRING },
                        },
                        required: ['introduction', 'stepByStep', 'prosAndCons', 'proTip'],
                    },
                },
            })

            return JSON.parse(response.text.trim()) as DeepDiveGuide
        } catch (e) {
            console.error('Gemini generateDeepDive Error:', e)
            throw new Error('ai.error.deepDive')
        }
    }

    getDynamicLoadingMessages({
        useCase,
        data,
    }: {
        useCase: string
        data?: Record<string, any>
    }): string[] {
        const t = getT()
        const messagesResult = t(`ai.loading.${useCase}`, {
            ...data,
            returnObjects: true,
        })

        if (
            typeof messagesResult === 'object' &&
            messagesResult !== null &&
            !Array.isArray(messagesResult)
        ) {
            return Object.values(messagesResult).map(String)
        }
        if (Array.isArray(messagesResult)) {
            return messagesResult.map(String)
        }

        return [String(messagesResult)]
    }
}

export const geminiService = new GeminiService()
```

### `services/geneticsService.ts`

```typescript
import { Strain, GenealogyNode } from '@/types';

class GeneticsService {

    private findAndBuildNode(
        strainName: string,
        allStrains: Strain[],
        visited: Set<string>
    ): GenealogyNode {
        // Find the strain in the master list, case-insensitive
        const strain = allStrains.find(s => s.name.toLowerCase() === strainName.toLowerCase());

        // Base case 1: Strain not found in the database (e.g., landrace or unlisted parent)
        if (!strain) {
            return {
                name: strainName,
                id: strainName.toLowerCase().replace(/[^a-z0-9]/g, '-')
            };
        }

        // Base case 2: Circular dependency detected
        if (visited.has(strain.id)) {
            return {
                name: `${strain.name} (Circular)`,
                id: strain.id,
            };
        }

        // Create the node for the current strain
        const node: GenealogyNode = {
            name: strain.name,
            id: strain.id,
        };

        // Add current strain to the visited set for this path
        const newVisited = new Set(visited);
        newVisited.add(strain.id);

        // Recursive step: Parse genetics and find children
        const genetics = strain.genetics;
        if (genetics && genetics.toLowerCase().includes(' x ')) {
            const parentNames = genetics
                .replace(/[()]/g, '') // Remove parentheses
                .split(/\s*x\s*/i)     // Split by 'x'
                .map(p => p.trim())
                .filter(p => p.length > 0 && p.toLowerCase() !== 'unknown' && p.toLowerCase() !== 'clone-only');

            if (parentNames.length > 0) {
                node.children = parentNames
                    .map(parentName => this.findAndBuildNode(parentName, allStrains, newVisited))
                    .filter((childNode): childNode is GenealogyNode => !!childNode);
                
                if(node.children.length === 0) {
                    delete node.children;
                }
            }
        }
        
        return node;
    }

    /**
     * Builds a hierarchical genealogy tree for a given strain.
     * @param strainId The ID of the strain to start the tree from.
     * @param allStrains The complete list of all available strains.
     * @returns A root GenealogyNode or null if the initial strain is not found.
     */
    public buildGenealogyTree(
        strainId: string,
        allStrains: Strain[]
    ): GenealogyNode | null {
        const rootStrain = allStrains.find(s => s.id === strainId);
        if (!rootStrain) {
            return null;
        }

        return this.findAndBuildNode(rootStrain.name, allStrains, new Set<string>());
    }
}

export const geneticsService = new GeneticsService();
```

### `services/migrationLogic.ts`

```typescript
import { AppSettings } from '@/types';
import { defaultSettings } from '@/stores/slices/settingsSlice';
import { RootState } from '@/stores/store';

export const APP_VERSION = 2;

// This represents the shape of the persisted state object.
export type PersistedState = Partial<RootState> & { version?: number };


/**
 * Merges persisted settings with default settings to ensure new properties are added.
 * This is a recursive deep merge.
 */
const deepMergeSettings = (persisted: Partial<AppSettings>): AppSettings => {
    const isObject = (item: unknown): item is Record<string, unknown> => {
        return !!item && typeof item === 'object' && !Array.isArray(item);
    };

    const output = JSON.parse(JSON.stringify(defaultSettings)); // Deep clone defaults

    function merge(target: Record<string, any>, source: Record<string, any>) {
        for (const key of Object.keys(source)) {
            const sourceValue = source[key];
            if (isObject(sourceValue)) {
                if (!target[key] || !isObject(target[key])) {
                    target[key] = {};
                }
                merge(target[key], sourceValue);
            } else if (sourceValue !== undefined) {
                target[key] = sourceValue;
            }
        }
    }
    if (isObject(persisted)) {
        merge(output, persisted);
    }
    return output;
};


/**
 * Migration from V1 to V2.
 * - Merges new default settings into persisted settings to prevent crashes on new features.
 * - Adds a new setting property `showArchivedInPlantsView`.
 * - Adds `lastUpdated` property to plant objects if missing.
 */
const migrateV1ToV2 = (state: PersistedState): PersistedState => {
    console.log('[MigrationLogic] Migrating state from v1 to v2...');
    
    // Note: 'state' is a plain JS object here, it's safe to mutate before it's loaded into Redux.
    const migratedState: PersistedState = state;
    
    if (migratedState.settings?.settings) {
        migratedState.settings.settings = deepMergeSettings(migratedState.settings.settings);
    } else {
        migratedState.settings = { settings: defaultSettings, version: 1 };
    }

    if (typeof migratedState.settings.settings.showArchivedInPlantsView === 'undefined') {
         migratedState.settings.settings.showArchivedInPlantsView = true;
    }
    
    if (migratedState.simulation?.plants?.entities) {
        for (const id in migratedState.simulation.plants.entities) {
            const plant = migratedState.simulation.plants.entities[id];
            if (plant && !plant.lastUpdated) {
                // Use createdAt as a sensible default for the first lastUpdated value
                plant.lastUpdated = plant.createdAt || Date.now();
            }
        }
    }

    return migratedState;
};

/**
 * Orchestrates the migration of a persisted state object to the current app version.
 * @param persistedState The raw state object loaded from storage.
 * @returns The migrated state object, ready to be hydrated into the store.
 */
export const migrateState = (persistedState: any): PersistedState => {
    const stateVersion = persistedState.version || 1;

    if (stateVersion >= APP_VERSION) {
        console.log('[MigrationLogic] Persisted state is up to date.');
        // Even if up to date, merge settings to catch any new properties added in minor versions
        if (persistedState.settings?.settings) {
            persistedState.settings.settings = deepMergeSettings(persistedState.settings.settings);
        }
        return persistedState;
    }
    
    let migratedState: PersistedState = persistedState;
    console.log(`[MigrationLogic] Migrating from version ${stateVersion} to ${APP_VERSION}...`);

    if (stateVersion < 2) {
        migratedState = migrateV1ToV2(migratedState);
    }
    // Future migrations would be chained here, e.g.:
    // if (stateVersion < 3) { migratedState = migrateV2ToV3(migratedState); }

    migratedState.version = APP_VERSION;
    
    // Also update the version inside the settings slice for consistency
    if (migratedState.settings) {
        migratedState.settings.version = APP_VERSION;
    }
    
    return migratedState;
};
```

### `services/migrationService.ts`

```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../stores/store';
import { indexedDBStorage } from '../stores/indexedDBStorage';
import { migrateState, APP_VERSION, PersistedState } from './migrationLogic';
import { setSettingsState } from '../stores/slices/settingsSlice';
import { setSimulationState } from '../stores/slices/simulationSlice';
import { setStrainsViewState } from '../stores/slices/strainsViewSlice';
import { setUserStrains } from '../stores/slices/userStrainsSlice';
import { setFavorites } from '../stores/slices/favoritesSlice';
import { setStrainNotes } from '../stores/slices/notesSlice';
import { setArchivedMentorResponses, setArchivedAdvisorResponses } from '../stores/slices/archivesSlice';
import { setSavedExports, setSavedSetups, setSavedStrainTips } from '../stores/slices/savedItemsSlice';
import { setKnowledgeProgress } from '../stores/slices/knowledgeSlice';
import { setCollectedSeeds } from '../stores/slices/breedingSlice';
import { setSandboxState } from '../stores/slices/sandboxSlice';
import { setFiltersState } from '../stores/slices/filtersSlice';

const REDUX_STATE_KEY = 'cannaguide-redux-storage';

export const runDataMigrations = createAsyncThunk<void, void, { state: RootState }>(
    'data/runMigrations',
    async (_, { dispatch, getState }) => {
        console.log('[MigrationService] Checking for persisted state...');
        
        const persistedString = await indexedDBStorage.getItem(REDUX_STATE_KEY);
        if (!persistedString) {
            console.log('[MigrationService] No persisted state found. Skipping migration.');
            return;
        }

        let persistedState: any;
        try {
            persistedState = JSON.parse(persistedString);
        } catch (e) {
            console.error('[MigrationService] Failed to parse persisted state. Resetting state.', e);
            await indexedDBStorage.removeItem(REDUX_STATE_KEY);
            return;
        }
        
        const migratedState: PersistedState = migrateState(persistedState);

        // Dispatch actions to hydrate each slice with the migrated data
        if (migratedState.settings) dispatch(setSettingsState(migratedState.settings));
        if (migratedState.simulation) dispatch(setSimulationState(migratedState.simulation));
        if (migratedState.strainsView) dispatch(setStrainsViewState(migratedState.strainsView));
        if (migratedState.userStrains) dispatch(setUserStrains(migratedState.userStrains));
        if (migratedState.favorites) dispatch(setFavorites(migratedState.favorites.favoriteIds));
        if (migratedState.notes) dispatch(setStrainNotes(migratedState.notes.strainNotes));
        if (migratedState.archives) {
            dispatch(setArchivedMentorResponses(migratedState.archives.archivedMentorResponses || []));
            dispatch(setArchivedAdvisorResponses(migratedState.archives.archivedAdvisorResponses || {}));
        }
        if (migratedState.savedItems) {
            dispatch(setSavedExports(migratedState.savedItems.savedExports));
            dispatch(setSavedSetups(migratedState.savedItems.savedSetups));
            dispatch(setSavedStrainTips(migratedState.savedItems.savedStrainTips));
        }
        if (migratedState.knowledge) dispatch(setKnowledgeProgress(migratedState.knowledge.knowledgeProgress));
        if (migratedState.breeding) dispatch(setCollectedSeeds(migratedState.breeding.collectedSeeds));
        if (migratedState.sandbox) dispatch(setSandboxState(migratedState.sandbox));
        if (migratedState.filters) dispatch(setFiltersState(migratedState.filters));
        
        // After hydration, persist the fully migrated state.
        const currentState = getState();
        
        // Create a serializable state object without RTK Query state
        const stateToPersist = {
            settings: currentState.settings,
            simulation: currentState.simulation,
            strainsView: currentState.strainsView,
            userStrains: currentState.userStrains,
            favorites: currentState.favorites,
            notes: currentState.notes,
            archives: currentState.archives,
            savedItems: currentState.savedItems,
            knowledge: currentState.knowledge,
            breeding: currentState.breeding,
            sandbox: currentState.sandbox,
            filters: currentState.filters,
            version: APP_VERSION,
        };
        
        await indexedDBStorage.setItem(REDUX_STATE_KEY, JSON.stringify(stateToPersist));
        console.log(`[MigrationService] State hydrated and migrated to v${APP_VERSION}.`);
    }
);
```

### `services/plantSimulationService.ts`

```typescript
import { Plant, PlantStage, GrowSetup, Strain, ProblemType, TaskPriority, JournalEntryType, HarvestData } from '@/types';

// Constants for simulation
export const PLANT_STAGE_DETAILS: Record<PlantStage, { duration: number; idealVitals: any }> = {
    [PlantStage.Seed]: { duration: 2, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.6 } } },
    [PlantStage.Germination]: { duration: 5, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.6 } } },
    [PlantStage.Seedling]: { duration: 14, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 0.5, max: 1.0 } } },
    [PlantStage.Vegetative]: { duration: 28, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 1.0, max: 1.8 } } },
    [PlantStage.Flowering]: { duration: 56, idealVitals: { ph: { min: 6.0, max: 6.8 }, ec: { min: 1.2, max: 2.2 } } },
    [PlantStage.Harvest]: { duration: 1, idealVitals: {} },
    [PlantStage.Drying]: { duration: 10, idealVitals: {} },
    [PlantStage.Curing]: { duration: 21, idealVitals: {} },
    [PlantStage.Finished]: { duration: Infinity, idealVitals: {} },
};

class SimulationService {
    createPlant(strain: Strain, setup: GrowSetup, light: { type: string, wattage: number }, name: string): Plant {
        const now = Date.now();
        return {
            id: `plant-${now}`,
            name,
            strain,
            createdAt: now,
            lastUpdated: now,
            age: 0,
            stage: PlantStage.Seed,
            height: 0,
            biomass: 0.1,
            health: 100,
            stressLevel: 0,
            nutrientPool: 100,
            problems: [],
            tasks: [],
            journal: [{
                id: `journal-${now}`,
                createdAt: now,
                type: JournalEntryType.System,
                notes: `Grow started for ${name} (${strain.name}).`
            }],
            history: [],
            isTopped: false,
            lstApplied: 0,
            environment: {
                internalTemperature: 24,
                internalHumidity: 70,
                vpd: 0.8,
                co2Level: 400,
            },
            medium: {
                ph: 6.5,
                ec: 0.4,
                moisture: 100,
                microbeHealth: 100,
            },
            rootSystem: {
                health: 100,
                microbeActivity: 100,
                rootMass: 0.1,
            },
            structuralModel: {
                branches: 1,
                nodes: 0,
                leafCount: 0,
            },
            equipment: {
                light: { wattage: light.wattage, isOn: true, lightHours: setup.lightHours },
                fan: { isOn: true, speed: 50 },
            }
        };
    }

    clonePlant(plant: Plant): Plant {
        // Simple deep clone for simulation purposes
        return JSON.parse(JSON.stringify(plant));
    }

    topPlant(plant: Plant): { updatedPlant: Plant } {
        const newPlant = this.clonePlant(plant);
        newPlant.isTopped = true;
        newPlant.structuralModel.branches *= 2;
        newPlant.stressLevel = Math.min(100, newPlant.stressLevel + 15); // Topping is stressful
        return { updatedPlant: newPlant };
    }

    applyLst(plant: Plant): { updatedPlant: Plant } {
        const newPlant = this.clonePlant(plant);
        newPlant.lstApplied += 1;
        newPlant.stressLevel = Math.min(100, newPlant.stressLevel + 5); // LST is less stressful
        return { updatedPlant: newPlant };
    }
    
    calculateStateForTimeDelta(plant: Plant, deltaTime: number): { updatedPlant: Plant, newJournalEntries: any[], newTasks: any[] } {
        // This is a simplified placeholder. A real implementation would have complex logic.
        const updatedPlant = this.clonePlant(plant);
        const hoursPassed = deltaTime / (1000 * 60 * 60);

        // Age and Stage
        const daysPassed = hoursPassed / 24;
        updatedPlant.age += daysPassed;
        
        const stageDetails = PLANT_STAGE_DETAILS[plant.stage];
        if (plant.age > stageDetails.duration) {
            const stages = Object.values(PlantStage);
            const currentIndex = stages.indexOf(plant.stage);
            if (currentIndex < stages.length - 1) {
                updatedPlant.stage = stages[currentIndex + 1];
            }
        }

        // Basic growth
        updatedPlant.height += 0.1 * daysPassed;
        updatedPlant.biomass += 0.2 * daysPassed;

        // Vitals drift
        updatedPlant.medium.moisture = Math.max(0, plant.medium.moisture - (2 * hoursPassed));
        updatedPlant.medium.ph += (Math.random() - 0.5) * 0.1 * hoursPassed;

        // Health & Stress
        if (updatedPlant.medium.moisture < 20) {
            updatedPlant.stressLevel = Math.min(100, plant.stressLevel + (1 * hoursPassed));
        } else {
            updatedPlant.stressLevel = Math.max(0, plant.stressLevel - (0.5 * hoursPassed));
        }
        if(updatedPlant.stressLevel > 50) {
            updatedPlant.health = Math.max(0, plant.health - (0.5 * hoursPassed));
        } else {
            updatedPlant.health = Math.min(100, plant.health + (0.2 * hoursPassed));
        }
        
        // This timestamp is now correctly handled in the thunk that calls this service.
        

        return { updatedPlant, newJournalEntries: [], newTasks: [] };
    }
}

export const simulationService = new SimulationService();
```

### `services/scenarioService.ts`

```typescript
import { Plant, Scenario, ScenarioAction } from '@/types';
import { simulationService } from '@/services/plantSimulationService';

const scenarios: Record<string, Scenario> = {
    'topping-vs-lst': {
        id: 'topping-vs-lst',
        titleKey: 'scenarios.toppingVsLst.title',
        descriptionKey: 'scenarios.toppingVsLst.description',
        durationDays: 14,
        plantAModifier: { action: 'LST', day: 1 },
        plantBModifier: { action: 'TOP', day: 1 },
    },
    // Add more scenarios here
};

class ScenarioService {
    
    getScenarioById(id: string): Scenario | undefined {
        return scenarios[id];
    }

    applyAction(plant: Plant, action: ScenarioAction): Plant {
        switch (action) {
            case 'TOP':
                return simulationService.topPlant(plant).updatedPlant;
            case 'LST':
                return simulationService.applyLst(plant).updatedPlant;
            case 'NONE':
            default:
                return plant;
        }
    }

    async runComparisonScenario(basePlant: Plant, scenario: Scenario): Promise<{ plantA: Plant, plantB: Plant }> {
        return new Promise(resolve => {
            // Use setTimeout to make it non-blocking, simulating a background process
            setTimeout(() => {
                let plantA = simulationService.clonePlant(basePlant);
                let plantB = simulationService.clonePlant(basePlant);
                
                plantA.name = `${basePlant.name} (A)`;
                plantB.name = `${basePlant.name} (B)`;
                
                const oneDayInMillis = 24 * 60 * 60 * 1000;

                for (let day = 1; day <= scenario.durationDays; day++) {
                    if (day === scenario.plantAModifier.day) {
                        plantA = this.applyAction(plantA, scenario.plantAModifier.action);
                    }
                     if (day === scenario.plantBModifier.day) {
                        plantB = this.applyAction(plantB, scenario.plantBModifier.action);
                    }
                    
                    plantA = simulationService.calculateStateForTimeDelta(plantA, oneDayInMillis).updatedPlant;
                    plantB = simulationService.calculateStateForTimeDelta(plantB, oneDayInMillis).updatedPlant;
                }
                
                resolve({ plantA, plantB });
            }, 500); // Simulate some processing time
        });
    }
}

export const scenarioService = new ScenarioService();
```

### `services/SimulationManager.tsx`

```tsx
import React, { useEffect } from 'react';
import { useAppDispatch } from '@/stores/store';
import { setAppReady } from '@/stores/slices/uiSlice';
import { initializeSimulation } from '@/stores/slices/simulationSlice';
import { runDataMigrations } from './migrationService';
import { strainService } from './strainService';
import { ttsService } from './ttsService';

export const SimulationManager: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const initializeApp = async () => {
            dispatch(setAppReady(false));
            await strainService.init();
            
            dispatch(initializeSimulation());
            
            dispatch(runDataMigrations());
            ttsService.init();
            dispatch(setAppReady(true));
        };
        initializeApp();
    }, [dispatch]);

    return null;
};
```

### `services/storageService.ts`

```typescript
const STORAGE_PREFIX = 'cannaguide-2025-';

/**
 * A centralized service for interacting with localStorage.
 * Handles serialization, deserialization, and error catching.
 */
export const storageService = {
    /**
     * Retrieves an item from localStorage.
     * @param key The key to retrieve (without prefix).
     * @param defaultValue The default value to return if the key doesn't exist or an error occurs.
     * @returns The parsed value or the default value.
     */
    getItem<T>(key: string, defaultValue: T): T {
        try {
            const item = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage key “${key}”:`, error);
            return defaultValue;
        }
    },

    /**
     * Stores an item in localStorage.
     * @param key The key to store under (without prefix).
     * @param value The value to store.
     */
    setItem<T>(key: string, value: T): void {
        try {
            const serializedValue = JSON.stringify(value);
            window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedValue);
        } catch (error) {
            console.error(`Error writing to localStorage key “${key}”:`, error);
        }
    },

    /**
     * Removes an item from localStorage.
     * @param key The key to remove (without prefix).
     */
    removeItem(key: string): void {
        try {
            window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        } catch (error) {
            console.error(`Error removing from localStorage key “${key}”:`, error);
        }
    },
    
    /**
     * Clears all application data from localStorage.
     * A more robust implementation might iterate over keys with the prefix,
     * but for this app's purpose, clear() is sufficient.
     */
    clearAll(): void {
         try {
            window.localStorage.clear();
         } catch (error) {
             console.error('Error clearing localStorage:', error);
         }
    }
};
```

### `services/strainFactory.ts`

```typescript
import { Strain } from '@/types';

// This factory ensures that every strain object has a consistent shape and default values.
export const createStrainObject = (data: Partial<Strain>): Strain => {
  const nameHash = (data.name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const defaults: Omit<Strain, 'id' | 'name' | 'type' | 'thc' | 'cbd' | 'floweringTime'> = {
    floweringType: 'Photoperiod',
    agronomic: {
      difficulty: 'Medium',
      yield: 'Medium',
      height: 'Medium',
      ...data.agronomic,
    },
    geneticModifiers: {
      pestResistance: 0.8 + ((nameHash % 40) / 100), // Range 0.8 to 1.2
      nutrientUptakeRate: 0.8 + (((nameHash * 3) % 40) / 100), // Range 0.8 to 1.2
      stressTolerance: 0.8 + (((nameHash * 7) % 40) / 100), // Range 0.8 to 1.2
      rue: 0.8 + (((nameHash * 5) % 40) / 100), // Radiation Use Efficiency, Range 0.8 to 1.2
    },
  };

  if (!data.id || !data.name || !data.type || data.thc === undefined || data.cbd === undefined || data.floweringTime === undefined) {
    throw new Error(`Strain factory is missing required fields for: ${data.name || 'Unknown'}`);
  }

  return {
    ...defaults,
    ...data,
    id: data.id,
    name: data.name,
    type: data.type,
    thc: data.thc,
    cbd: data.cbd,
    floweringTime: data.floweringTime,
  } as Strain;
};
```

### `services/strainService.ts`

```typescript
import { Strain } from '@/types';
import { dbService } from './dbService';
import { allStrainsData } from '@/data/strains';

const STRAIN_DATA_VERSION_KEY = 'strainDataVersion';
const CURRENT_STRAIN_DATA_VERSION = 2; // Increment this when strain data changes significantly

class StrainService {
    private allStrains: Strain[] = [];
    private isInitialized = false;

    async init(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            const storedVersion = await dbService.getMetadata(STRAIN_DATA_VERSION_KEY);
            const dbCount = await dbService.getStrainsCount();

            if (dbCount > 0 && storedVersion === CURRENT_STRAIN_DATA_VERSION) {
                console.log('[StrainService] Loading strains from IndexedDB.');
                this.allStrains = await dbService.getAllStrains();
            } else {
                console.log('[StrainService] Populating IndexedDB with fresh strain data.');
                await dbService.addStrains(allStrainsData);
                await dbService.setMetadata({ key: STRAIN_DATA_VERSION_KEY, value: CURRENT_STRAIN_DATA_VERSION });
                this.allStrains = allStrainsData;
            }
            this.isInitialized = true;
        } catch (error) {
            console.error('[StrainService] Failed to initialize. Falling back to in-memory data.', error);
            // Fallback to in-memory data if IndexedDB fails
            this.allStrains = allStrainsData;
            this.isInitialized = true;
        }
    }

    async getAllStrains(): Promise<Strain[]> {
        if (!this.isInitialized) {
            await this.init();
        }
        return this.allStrains;
    }
    
    async getSimilarStrains(currentStrain: Strain, count: number): Promise<Strain[]> {
        if (!this.isInitialized) {
            await this.init();
        }

        const calculateSimilarity = (s1: Strain, s2: Strain): number => {
            let score = 0;
            if (s1.id === s2.id) return -1; // Exclude self

            // Type
            if (s1.type === s2.type) score += 20;

            // THC/CBD closeness
            score += 15 - Math.abs(s1.thc - s2.thc);
            score += 10 - Math.abs(s1.cbd - s2.cbd);

            // Aroma/Terpene overlap
            const aromaIntersection = (s1.aromas || []).filter(a => (s2.aromas || []).includes(a));
            score += aromaIntersection.length * 5;
            
            const terpeneIntersection = (s1.dominantTerpenes || []).filter(t => (s2.dominantTerpenes || []).includes(t));
            score += terpeneIntersection.length * 10;
            
            // Agronomics
            if (s1.agronomic.difficulty === s2.agronomic.difficulty) score += 5;
            if (s1.agronomic.yield === s2.agronomic.yield) score += 3;
            if (s1.agronomic.height === s2.agronomic.height) score += 2;

            return score;
        };

        return this.allStrains
            .map(strain => ({
                strain,
                score: calculateSimilarity(currentStrain, strain),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, count)
            .map(item => item.strain);
    }
}

export const strainService = new StrainService();
```

### `services/ttsService.ts`

```typescript
import { TTSSettings, Language } from '@/types';

class TTSService {
    private synth: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    private onEndCallback: (() => void) | null = null;
    private isInitialized: boolean = false;

    constructor() {
        this.synth = window.speechSynthesis;
    }
    
    public init() {
        if (this.isInitialized) return;
        this.synth.onvoiceschanged = this.loadVoices.bind(this);
        this.loadVoices(); // Initial attempt
        this.isInitialized = true;
    }

    private loadVoices() {
        this.voices = this.synth.getVoices();
    }

    public getVoices(lang: Language): SpeechSynthesisVoice[] {
        const langCode = lang === 'de' ? 'de-DE' : 'en-US';
        return this.voices.filter(voice => voice.lang.startsWith(lang));
    }

    speak(text: string, lang: Language, onEnd: () => void, settings: TTSSettings) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        this.onEndCallback = onEnd;

        utterance.onend = () => {
            if (this.onEndCallback) {
                this.onEndCallback();
            }
        };
        
        utterance.onerror = (event) => {
            console.error('SpeechSynthesisUtterance.onerror', event);
            if (this.onEndCallback) {
                this.onEndCallback(); // Also advance queue on error
            }
        };

        const langCode = lang === 'de' ? 'de-DE' : 'en-US';
        let selectedVoice = this.voices.find(voice => voice.name === settings.voiceName);
        if (!selectedVoice) {
            selectedVoice = this.voices.find(voice => voice.lang === langCode && voice.default);
        }
        if (!selectedVoice) {
            selectedVoice = this.voices.find(voice => voice.lang.startsWith(lang));
        }

        utterance.voice = selectedVoice || null;
        utterance.lang = selectedVoice?.lang || langCode;
        utterance.pitch = settings.pitch;
        utterance.rate = settings.rate;

        this.synth.speak(utterance);
    }
    
    cancel() {
        this.onEndCallback = null;
        this.synth.cancel();
    }

    pause() {
        this.synth.pause();
    }

    resume() {
        this.synth.resume();
    }
}

export const ttsService = new TTSService();
```
