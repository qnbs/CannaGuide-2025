
# CannaGuide 2025 - Source Code Documentation (Part 4: Services & Hooks)

This document details the services that contain the application's business logic and the custom React hooks that provide reusable functionality to components.

---

## 1. Services

Services are modules that encapsulate a specific domain of the application's logic, such as interacting with an API, managing a database, or performing complex calculations.

### `/services/commandService.ts`

**Purpose:** Provides utilities for managing and organizing commands for the Command Palette. The `groupAndSortCommands` function takes a flat list of commands and structures it with headers based on a predefined group order, making the palette more user-friendly.

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
                icon: React.Fragment,
            });
            result.push(...grouped[groupName]);
        }
    });

    return result;
};
```

### `/services/dbService.ts`

**Purpose:** A low-level service that provides a clean, promise-based API for interacting with the application's IndexedDB. It manages database opening, versioning, and provides methods for CRUD operations on different object stores (strains, images, metadata, search index).

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

... and so on for all other services ...

---

## 2. Custom Hooks

Custom hooks are functions that start with `use` and allow sharing stateful logic between components.

### `/hooks/useCommandPalette.ts`

**Purpose:** This hook is the brain behind the Command Palette. It gathers all possible actions from the Zustand store (like navigation, settings changes, plant actions), formats them into a `Command` array, and provides them to the `CommandPalette` component for display and execution. This centralizes the command logic and keeps the UI component clean.

```typescript
import React, { useMemo } from 'react';
import { Command, View, Theme, UiDensity, PlantStage, EquipmentViewTab, KnowledgeViewTab, AppSettings } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from './useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { selectActivePlants } from '@/stores/slices/plantSlice';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';

export const useCommandPalette = () => {
    const { t } = useTranslations();
    const {
        setActiveView,
        setIsCommandPaletteOpen,
        setSetting,
        settings,
        openAddModal,
        openExportModal,
        setStrainsViewTab,
        setSelectedPlantId,
        openActionModal,
        harvestPlant,
        exportAllData,
        resetPlants,
        setEquipmentViewTab,
        setKnowledgeViewTab,
        waterAllPlants,
        startGrowInSlot,
    } = useAppStore.getState();

    const activePlants = useAppStore(selectActivePlants);

    const allCommands: Command[] = useMemo(() => {
        const createNavCommand = (view: View, icon: React.ElementType, keywords?: string, shortcut?: string[]): Command => ({
            id: `nav-${view}`,
            title: t(`nav.${view.toLowerCase()}`),
            subtitle: t('commandPalette.goToView', { view: t(`nav.${view.toLowerCase()}`) }),
            icon,
            action: () => {
                setActiveView(view);
                setIsCommandPaletteOpen(false);
            },
            keywords,
            shortcut,
            group: t('commandPalette.groups.navigation'),
        });

        const plantCommands: Command[] = activePlants.flatMap(plant => {
            const isHarvestReady = plant.stage === PlantStage.Flowering && plant.age >= (PLANT_STAGE_DETAILS[PlantStage.Seedling].duration + PLANT_STAGE_DETAILS[PlantStage.Vegetative].duration + plant.strain.floweringTime * 7);
            
            const commands: Command[] = [
                {
                    id: `plant-inspect-${plant.id}`,
                    title: t('commandPalette.inspectPlant', { plantName: plant.name }),
                    subtitle: t('commandPalette.subtitles.inspectPlant'),
                    icon: PhosphorIcons.MagnifyingGlass,
                    action: () => {
                        setActiveView(View.Plants);
                        setSelectedPlantId(plant.id);
                        setIsCommandPaletteOpen(false);
                    },
                    keywords: `plant ${plant.name} ${plant.strain.name} details`,
                    group: t('commandPalette.groups.plants'),
                },
                {
                    id: `plant-water-${plant.id}`,
                    title: t('commandPalette.waterPlant', { plantName: plant.name }),
                    subtitle: t('commandPalette.subtitles.waterPlant'),
                    icon: PhosphorIcons.Drop,
                    action: () => {
                        openActionModal(plant.id, 'watering');
                        setIsCommandPaletteOpen(false);
                    },
                    keywords: `plant ${plant.name} water log`,
                    group: t('commandPalette.groups.plants'),
                },
                {
                    id: `plant-feed-${plant.id}`,
                    title: t('commandPalette.feedPlant', { plantName: plant.name }),
                    subtitle: t('commandPalette.subtitles.feedPlant'),
                    icon: PhosphorIcons.TestTube,
                    action: () => {
                        openActionModal(plant.id, 'feeding');
                        setIsCommandPaletteOpen(false);
                    },
                    keywords: `plant ${plant.name} feed log nutrients`,
                    group: t('commandPalette.groups.plants'),
                }
            ];

            if (isHarvestReady) {
                 commands.push({
                    id: `plant-harvest-${plant.id}`,
                    title: t('commandPalette.harvestPlant', { plantName: plant.name }),
                    subtitle: t('commandPalette.subtitles.harvestPlant'),
                    icon: PhosphorIcons.Scissors,
                    action: () => {
                        harvestPlant(plant.id);
                        setIsCommandPaletteOpen(false);
                    },
                    keywords: `plant ${plant.name} harvest chop`,
                    group: t('commandPalette.groups.plants'),
                });
            }

            return commands;
        });

        const themeCommands: Command[] = (Object.keys(t('settingsView.general.themes', { returnObjects: true })) as Theme[]).map(themeKey => ({
            id: `set-theme-${themeKey}`,
            title: t('commandPalette.setTheme', { themeName: t(`settingsView.general.themes.${themeKey}`) }),
            subtitle: t('commandPalette.subtitles.setTheme'),
            icon: PhosphorIcons.PaintBrush,
            action: () => setSetting('theme', themeKey),
            group: t('commandPalette.groups.settings')
        }));
        
        const createNotifToggle = (key: keyof AppSettings['notificationSettings'], titleKey: string): Command => ({
            id: `toggle-notif-${String(key)}`,
            title: t(titleKey),
            subtitle: t('commandPalette.subtitles.toggleNotifications', { status: settings.notificationSettings[key] ? 'On' : 'Off' }),
            icon: PhosphorIcons.BellSimple,
            action: () => setSetting(`notificationSettings.${String(key)}`, !settings.notificationSettings[key]),
            group: t('commandPalette.groups.settings'),
        });

        return [
            // Navigation
            createNavCommand(View.Strains, PhosphorIcons.Leafy, 'database, library, search'),
            createNavCommand(View.Plants, PhosphorIcons.Plant, 'grow, room, garden'),
            createNavCommand(View.Equipment, PhosphorIcons.Wrench, 'setup, gear, tools, calculator'),
            createNavCommand(View.Knowledge, PhosphorIcons.BookOpenText, 'guide, learn, mentor, help'),
            createNavCommand(View.Settings, PhosphorIcons.Gear, 'options, config, preferences'),
            
             // Strains Sub-Navigation & Actions
            {
                id: 'nav-my-strains', title: t('commandPalette.goToMyStrains'), subtitle: t('commandPalette.subtitles.goToMyStrains'), icon: PhosphorIcons.Star,
                action: () => { setActiveView(View.Strains); setStrainsViewTab('my-strains'); setIsCommandPaletteOpen(false); },
                keywords: 'custom strains', group: t('commandPalette.groups.navigation')
            },
             {
                id: 'nav-favorites', title: t('commandPalette.goToFavorites'), subtitle: t('commandPalette.subtitles.goToFavorites'), icon: PhosphorIcons.Heart,
                action: () => { setActiveView(View.Strains); setStrainsViewTab('favorites'); setIsCommandPaletteOpen(false); },
                keywords: 'favorite strains', group: t('commandPalette.groups.navigation')
            },
            {
                id: 'add-strain', title: t('strainsView.addStrain'), icon: PhosphorIcons.PlusCircle,
                action: () => { openAddModal(); setIsCommandPaletteOpen(false); },
                keywords: 'new, custom, create', group: t('commandPalette.groups.strains')
            },
            {
                id: 'export-strains', title: t('common.export'), subtitle: t('commandPalette.exportStrains'), icon: PhosphorIcons.DownloadSimple,
                action: () => { openExportModal(); setIsCommandPaletteOpen(false); },
                keywords: 'save, download, pdf, csv, json', group: t('commandPalette.groups.strains')
            },
            
            // Equipment Sub-Navigation
            {
                id: 'nav-calculators', title: t('commandPalette.goToCalculators'), subtitle: t('commandPalette.subtitles.goToCalculators'), icon: PhosphorIcons.Calculator,
                action: () => { setActiveView(View.Equipment); setEquipmentViewTab('calculators'); setIsCommandPaletteOpen(false); },
                keywords: 'tools ventilation light cost', group: t('commandPalette.groups.navigation')
            },
            {
                id: 'nav-setups', title: t('commandPalette.goToSetups'), subtitle: t('commandPalette.subtitles.goToSetups'), icon: PhosphorIcons.Cube,
                action: () => { setActiveView(View.Equipment); setEquipmentViewTab('setups'); setIsCommandPaletteOpen(false); },
                keywords: 'saved setups my setups', group: t('commandPalette.groups.navigation')
            },

             // Knowledge Sub-Navigation
            {
                id: 'nav-guide', title: t('commandPalette.goToGuide'), subtitle: t('commandPalette.subtitles.goToGuide'), icon: PhosphorIcons.Book,
                action: () => { setActiveView(View.Knowledge); setKnowledgeViewTab('guide'); setIsCommandPaletteOpen(false); },
                keywords: 'learn tutorial basics', group: t('commandPalette.groups.navigation')
            },
            {
                id: 'nav-breeding', title: t('commandPalette.goToBreeding'), subtitle: t('commandPalette.subtitles.goToBreeding'), icon: PhosphorIcons.TestTube,
                action: () => { setActiveView(View.Knowledge); setKnowledgeViewTab('breeding'); setIsCommandPaletteOpen(false); },
                keywords: 'cross breed seeds', group: t('commandPalette.groups.navigation')
            },
            
            // Plant Actions
            ...plantCommands,
             {
                id: 'water-all', title: t('commandPalette.waterAllPlants'), subtitle: t('commandPalette.subtitles.waterAllPlants'), icon: PhosphorIcons.Drop,
                action: () => { waterAllPlants(); setIsCommandPaletteOpen(false); },
                keywords: 'water all plants', group: t('commandPalette.groups.plants'),
            },
            ...[0, 1, 2].map(slot => ({
                id: `start-grow-${slot}`, title: t('commandPalette.startGrowSlot', { slot: slot + 1 }), subtitle: t('commandPalette.subtitles.startGrowSlot'), icon: PhosphorIcons.Plant,
                action: () => { setActiveView(View.Plants); startGrowInSlot(slot); setIsCommandPaletteOpen(false); },
                keywords: `new plant grow slot ${slot + 1}`, group: t('commandPalette.groups.plants'),
            })),

            // Settings Actions
            {
                id: 'set-language-de', title: t('commandPalette.switchToGerman'), subtitle: t('commandPalette.subtitles.switchTo'), icon: PhosphorIcons.Globe,
                action: () => setSetting('language', 'de'), group: t('commandPalette.groups.settings'), keywords: 'deutsch german',
            },
            {
                id: 'set-language-en', title: t('commandPalette.switchToEnglish'), subtitle: t('commandPalette.subtitles.switchTo'), icon: PhosphorIcons.Globe,
                action: () => setSetting('language', 'en'), group: t('commandPalette.groups.settings'), keywords: 'englisch english',
            },
            ...themeCommands,
            createNotifToggle('stageChange', 'commandPalette.toggleStageChangeNotifs'),
            createNotifToggle('problemDetected', 'commandPalette.toggleProblemNotifs'),
            createNotifToggle('harvestReady', 'commandPalette.toggleHarvestNotifs'),
            createNotifToggle('newTask', 'commandPalette.toggleTaskNotifs'),
            {
                id: 'toggle-tts', title: t('commandPalette.toggleTts'), subtitle: t('commandPalette.subtitles.toggleTts'), icon: PhosphorIcons.SpeakerHigh,
                action: () => setSetting('tts.enabled', !settings.tts.enabled),
                group: t('commandPalette.groups.settings')
            },
            {
                id: 'toggle-dyslexia', title: t('commandPalette.toggleDyslexiaFont'), subtitle: t('commandPalette.subtitles.toggleDyslexiaFont'), icon: PhosphorIcons.TextBolder,
                action: () => setSetting('accessibility.dyslexiaFont', !settings.accessibility.dyslexiaFont),
                group: t('commandPalette.groups.settings')
            },
            {
                id: 'toggle-motion', title: t('commandPalette.toggleReducedMotion'), subtitle: t('commandPalette.subtitles.toggleReducedMotion'), icon: PhosphorIcons.GameController,
                action: () => setSetting('accessibility.reducedMotion', !settings.accessibility.reducedMotion),
                group: t('commandPalette.groups.settings')
            },
             {
                id: 'set-density-compact', title: t('commandPalette.setUiDensity', { density: t('settingsView.accessibility.uiDensities.compact') }), subtitle: t('commandPalette.subtitles.setUiDensity'), icon: PhosphorIcons.ListBullets,
                action: () => setSetting('uiDensity', 'compact' as UiDensity),
                group: t('commandPalette.groups.settings')
            },
             {
                id: 'set-density-comfortable', title: t('commandPalette.setUiDensity', { density: t('settingsView.accessibility.uiDensities.comfortable') }), subtitle: t('commandPalette.subtitles.setUiDensity'), icon: PhosphorIcons.GridFour,
                action: () => setSetting('uiDensity', 'comfortable' as UiDensity),
                group: t('commandPalette.groups.settings')
            },
            // Data Management
            {
                id: 'export-all', title: t('commandPalette.exportAllData'), subtitle: t('commandPalette.subtitles.exportAllData'), icon: PhosphorIcons.Archive,
                action: () => { exportAllData(); setIsCommandPaletteOpen(false); },
                group: t('commandPalette.groups.data'),
            },
            {
                id: 'reset-plants', title: t('commandPalette.resetAllPlants'), subtitle: t('commandPalette.subtitles.resetAllPlants'), icon: PhosphorIcons.WarningCircle,
                action: () => { resetPlants(); setIsCommandPaletteOpen(false); },
                group: t('commandPalette.groups.data'),
            }
        ];
    }, [t, settings, activePlants, setActiveView, setIsCommandPaletteOpen, setSetting, openAddModal, openExportModal, setStrainsViewTab, setSelectedPlantId, openActionModal, harvestPlant, exportAllData, resetPlants, setEquipmentViewTab, setKnowledgeViewTab, waterAllPlants, startGrowInSlot]);

    return { allCommands };
};
```

... and so on for all other hooks ...

