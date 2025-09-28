
# CannaGuide 2025 - Source Code Documentation (Part 3: State Management)

This document covers the state management architecture of the application, which is built using Zustand. It includes the main store setup, the IndexedDB persistence layer, and all the individual state slices.

---

## 1. Main Store Setup

### `/stores/useAppStore.ts`

**Purpose:** This is the central file for the Zustand store. It creates the store by combining all the individual state slices (`aiSlice`, `plantSlice`, etc.) into a single `AppState`. It also configures the persistence middleware to save a partialized version of the state to IndexedDB, ensuring a seamless offline experience.

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AppState } from '../types';
import { indexedDBStorage } from './indexedDBStorage';

import { createAiSlice } from './slices/aiSlice';
import { createArchivesSlice } from './slices/archivesSlice';
import { createBreedingSlice } from './slices/breedingSlice';
import { createFavoritesSlice } from './slices/favoritesSlice';
import { createKnowledgeSlice } from './slices/knowledgeSlice';
import { createNotesSlice } from './slices/notesSlice';
import { createPlantSlice } from './slices/plantSlice';
import { createSavedItemsSlice } from './slices/savedItemsSlice';
import { createSettingsSlice } from './slices/settingsSlice';
import { createSimulationSlice } from './slices/simulationSlice';
import { createStrainsViewSlice } from './slices/strainsViewSlice';
import { createTtsSlice } from './slices/ttsSlice';
import { createUISlice } from './slices/uiSlice';
import { createUserStrainsSlice } from './slices/userStrainsSlice';

export const useAppStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      ...createAiSlice(set, get),
      ...createArchivesSlice(set, get),
      ...createBreedingSlice(set, get),
      ...createFavoritesSlice(set, get),
      ...createKnowledgeSlice(set, get),
      ...createNotesSlice(set, get),
      ...createPlantSlice(set, get),
      ...createSavedItemsSlice(set, get),
      ...createSettingsSlice(set, get),
      ...createSimulationSlice(set, get),
      ...createStrainsViewSlice(set, get),
      ...createTtsSlice(set, get),
      ...createUISlice(set, get),
      ...createUserStrainsSlice(set, get),
    })),
    {
      name: 'cannaguide-2025-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      // This partialize function is crucial for performance.
      // It ensures that only necessary, non-transient state is persisted to IndexedDB.
      partialize: (state) => ({
        // Persisted State
        settings: state.settings,
        plants: state.plants,
        plantSlots: state.plantSlots,
        userStrains: state.userStrains,
        favoriteIds: state.favoriteIds,
        strainNotes: state.strainNotes,
        savedExports: state.savedExports,
        savedSetups: state.savedSetups,
        archivedMentorResponses: state.archivedMentorResponses,
        archivedAdvisorResponses: state.archivedAdvisorResponses,
        savedStrainTips: state.savedStrainTips,
        knowledgeProgress: state.knowledgeProgress,
        collectedSeeds: state.collectedSeeds,
        
        // Transient state (not persisted)
        // - activeView is part of uiSlice, which is excluded
        // - isCommandPaletteOpen is part of uiSlice
        // - AI loading/response states are in aiSlice, which is excluded
        // - etc.
      }),
      onRehydrateStorage: () => (state) => {
        // Handle Set rehydration manually
        if (state) {
            state.favoriteIds = new Set(state.favoriteIds);
            state.selectedStrainIds = new Set(); // Always start with no selection
        }
      }
    }
  )
);
```

### `/stores/indexedDBStorage.ts`

**Purpose:** This file implements the `StateStorage` interface required by Zustand's `persist` middleware. It provides an asynchronous key-value store using the browser's IndexedDB API, which is more robust and suitable for larger data than `localStorage`.

```typescript
import { PersistStorage, StateStorage } from 'zustand/middleware';

const DB_NAME = 'CannaGuideStateDB';
const DB_VERSION = 1;
const STORE_NAME = 'zustand_state';

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
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

const getStore = (mode: IDBTransactionMode): IDBObjectStore => {
  const transaction = db.transaction(STORE_NAME, mode);
  return transaction.objectStore(STORE_NAME);
};

export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    await openDB();
    return new Promise((resolve, reject) => {
      const store = getStore('readonly');
      const request = store.get(name);
      request.onsuccess = () => {
        resolve((request.result as string) || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await openDB();
    return new Promise((resolve, reject) => {
      const store = getStore('readwrite');
      const request = store.put(value, name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  removeItem: async (name: string): Promise<void> => {
    await openDB();
    return new Promise((resolve, reject) => {
      const store = getStore('readwrite');
      const request = store.delete(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
```

---

## 2. State Slices

The application state is broken down into logical domains called "slices". Each slice is a function that returns a piece of the state and the actions that modify it.

### `/stores/slices/aiSlice.ts`

**Purpose:** Manages the state for all interactions with the Gemini AI, including loading states, responses, and errors for different features like the equipment configurator, plant diagnostics, and mentor chats.

```typescript
import { AIResponse, Plant, Recommendation, PlantDiagnosisResponse, MentorMessage, Strain, StructuredGrowTips, DeepDiveGuide, MyStateCreator, AppState } from '../../types';
import { geminiService } from '../../services/geminiService';
import { i18nInstance } from '../../i18n';

export interface AiState<T> {
    isLoading: boolean;
    response: T | null;
    error: string | null;
    sourceDetails?: any;
}

export interface AiSlice {
    equipmentGeneration: AiState<Recommendation>;
    diagnostics: AiState<PlantDiagnosisResponse>;
    proactiveDiagnosis: AiState<AIResponse>;
    advisorChats: Record<string, AiState<AIResponse>>;
    mentorChats: Record<string, { history: MentorMessage[], isLoading: boolean, error: string | null }>;
    strainTips: Record<string, AiState<StructuredGrowTips>>;
    deepDives: Record<string, AiState<DeepDiveGuide>>;

    startEquipmentGeneration: (prompt: string, details: any) => Promise<void>;
    resetEquipmentGenerationState: () => void;
    
    startDiagnostics: (base64Image: string, mimeType: string, context: any) => Promise<void>;
    
    startAdvisorGeneration: (plant: Plant) => Promise<void>;
    
    startProactiveDiagnosis: (plant: Plant) => Promise<void>;

    startPlantMentorChat: (plant: Plant, query: string) => Promise<void>;
    clearMentorChat: (plantId: string) => void;

    startStrainTipGeneration: (strain: Strain, context: { focus: string, stage: string, experience: string }) => Promise<void>;
    
    startDeepDiveGeneration: (topic: string, plant: Plant) => Promise<void>;
}

// FIX: Changed function signature to use MyStateCreator for proper type inference.
export const createAiSlice: MyStateCreator<AiSlice> = (set, get) => ({
    equipmentGeneration: { isLoading: false, response: null, error: null },
    diagnostics: { isLoading: false, response: null, error: null },
    proactiveDiagnosis: { isLoading: false, response: null, error: null },
    advisorChats: {},
    mentorChats: {},
    strainTips: {},
    deepDives: {},

    startEquipmentGeneration: async (prompt, details) => {
        set(state => {
            state.equipmentGeneration = { isLoading: true, response: null, error: null, sourceDetails: details };
        });
        try {
            const recommendation = await geminiService.getEquipmentRecommendation(prompt, i18nInstance.t);
            set(state => {
                state.equipmentGeneration.isLoading = false;
                state.equipmentGeneration.response = recommendation;
            });
        } catch (e: any) {
            set(state => {
                state.equipmentGeneration.isLoading = false;
                state.equipmentGeneration.error = i18nInstance.t(e.message || 'ai.error.unknown');
            });
        }
    },
    resetEquipmentGenerationState: () => {
        set(state => {
            state.equipmentGeneration = { isLoading: false, response: null, error: null };
        });
    },

    startDiagnostics: async (base64Image, mimeType, context) => {
        set(state => {
            state.diagnostics = { isLoading: true, response: null, error: null };
        });
        try {
            const diagnosis = await geminiService.diagnosePlant(base64Image, mimeType, context, i18nInstance.t);
            set(state => {
                state.diagnostics.isLoading = false;
                state.diagnostics.response = diagnosis;
            });
        } catch (e: any) {
            set(state => {
                state.diagnostics.isLoading = false;
                state.diagnostics.error = i18nInstance.t(e.message || 'ai.error.unknown');
            });
        }
    },
    
    startAdvisorGeneration: async (plant) => {
        set(state => {
            state.advisorChats[plant.id] = { isLoading: true, response: null, error: null };
        });
        try {
            const advice = await geminiService.getPlantAdvice(plant, i18nInstance.t);
            set(state => {
                state.advisorChats[plant.id].isLoading = false;
                state.advisorChats[plant.id].response = advice;
            });
        } catch (e: any) {
            set(state => {
                state.advisorChats[plant.id].isLoading = false;
                state.advisorChats[plant.id].error = i18nInstance.t(e.message || 'ai.error.unknown');
            });
        }
    },

    startProactiveDiagnosis: async (plant) => {
        set(state => {
            state.proactiveDiagnosis = { isLoading: true, response: null, error: null };
        });
        try {
            const diagnosis = await geminiService.getProactiveDiagnosis(plant, i18nInstance.t);
            set(state => {
                state.proactiveDiagnosis.isLoading = false;
                state.proactiveDiagnosis.response = diagnosis;
            });
        } catch (e: any) {
            set(state => {
                state.proactiveDiagnosis.isLoading = false;
                state.proactiveDiagnosis.error = i18nInstance.t(e.message || 'ai.error.unknown');
            });
        }
    },

    startPlantMentorChat: async (plant, query) => {
        set(state => {
            if (!state.mentorChats[plant.id]) {
                state.mentorChats[plant.id] = { history: [], isLoading: false, error: null };
            }
            state.mentorChats[plant.id].history.push({ role: 'user', content: query });
            state.mentorChats[plant.id].isLoading = true;
            state.mentorChats[plant.id].error = null;
        });
        try {
            const response = await geminiService.getMentorResponse(plant, query, i18nInstance.t);
            set(state => {
                state.mentorChats[plant.id].history.push({ role: 'model', ...response });
                state.mentorChats[plant.id].isLoading = false;
            });
        } catch (e: any) {
             set(state => {
                const errorMessage = i18nInstance.t(e.message || 'ai.error.unknown');
                state.mentorChats[plant.id].history.push({ role: 'model', title: i18nInstance.t('common.error'), content: errorMessage });
                state.mentorChats[plant.id].isLoading = false;
                state.mentorChats[plant.id].error = errorMessage;
            });
        }
    },
    clearMentorChat: (plantId) => {
        set(state => {
            if (state.mentorChats[plantId]) {
                state.mentorChats[plantId].history = [];
            }
        });
    },
    
    startStrainTipGeneration: async (strain, context) => {
        set(state => {
            state.strainTips[strain.id] = { isLoading: true, response: null, error: null };
        });
        try {
            const tips = await geminiService.getStrainTips(strain, context, i18nInstance.t);
            set(state => {
                state.strainTips[strain.id].isLoading = false;
                state.strainTips[strain.id].response = tips;
            });
        } catch (e: any) {
            set(state => {
                state.strainTips[strain.id].isLoading = false;
                state.strainTips[strain.id].error = i18nInstance.t(e.message || 'ai.error.unknown');
            });
        }
    },

    startDeepDiveGeneration: async (topic, plant) => {
        const key = `${plant.id}-${topic}`;
        set(state => {
            state.deepDives[key] = { isLoading: true, response: null, error: null };
        });
        try {
            const guide = await geminiService.generateDeepDive(topic, plant, i18nInstance.t);
            set(state => {
                state.deepDives[key].isLoading = false;
                state.deepDives[key].response = guide;
            });
        } catch (e: any) {
            set(state => {
                state.deepDives[key].isLoading = false;
                state.deepDives[key].error = i18nInstance.t(e.message || 'ai.error.unknown');
            });
        }
    },
});

// FIX: Added and exported selector functions to access state.
export const selectEquipmentGenerationState = (state: AppState) => state.equipmentGeneration;
export const selectDiagnosticsState = (state: AppState) => state.diagnostics;
export const selectAdvisorStateForPlant = (plantId: string) => (state: AppState) => {
    return state.advisorChats[plantId] || { isLoading: false, response: null, error: null };
};
export const selectStrainTipState = (strainId: string) => (state: AppState) => {
    return state.strainTips[strainId] || { isLoading: false, response: null, error: null };
};
export const selectDeepDiveState = (plantId: string, topic: string) => (state: AppState) => {
    const key = `${plantId}-${topic}`;
    return state.deepDives[key] || { isLoading: false, response: null, error: null };
};
```

... and so on for all other state slices ...

