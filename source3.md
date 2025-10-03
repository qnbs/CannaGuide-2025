# CannaGuide 2025 - Kompletter Quellcode (Teil 4)

Dieser Teil enthält den gesamten Code für das State Management mit Redux Toolkit.

---

## 5. State Management (`stores/`)

Dieser Ordner enthält die gesamte Logik für das globale Zustandsmanagement der Anwendung mithilfe von Redux Toolkit.

---

### `stores/store.ts`

```typescript
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import simulationReducer from './slices/simulationSlice';
import uiReducer from './slices/uiSlice';
import settingsReducer from './slices/settingsSlice';
import strainsViewReducer from './slices/strainsViewSlice';
import userStrainsReducer from './slices/userStrainsSlice';
import favoritesReducer from './slices/favoritesSlice';
import notesReducer from './slices/notesSlice';
import archivesReducer from './slices/archivesSlice';
import savedItemsReducer from './slices/savedItemsSlice';
import knowledgeReducer from './slices/knowledgeSlice';
import breedingReducer from './slices/breedingSlice';
import ttsReducer from './slices/ttsSlice';
import sandboxReducer from './slices/sandboxSlice';
import filtersReducer from './slices/filtersSlice';
import { geminiApi } from './api';
import { listenerMiddleware } from './listenerMiddleware';

const rootReducer = combineReducers({
    simulation: simulationReducer,
    ui: uiReducer,
    settings: settingsReducer,
    strainsView: strainsViewReducer,
    userStrains: userStrainsReducer,
    favorites: favoritesReducer,
    notes: notesReducer,
    archives: archivesReducer,
    savedItems: savedItemsReducer,
    knowledge: knowledgeReducer,
    breeding: breedingReducer,
    tts: ttsReducer,
    sandbox: sandboxReducer,
    filters: filtersReducer,
    [geminiApi.reducerPath]: geminiApi.reducer,
});

const tempStoreForTypes = configureStore({ reducer: rootReducer });
export type RootState = ReturnType<typeof tempStoreForTypes.getState>;
export type AppDispatch = typeof tempStoreForTypes.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const createAppStore = (preloadedState?: Partial<RootState>) => {
    const store = configureStore({
        reducer: rootReducer,
        preloadedState,
        middleware: (getDefaultMiddleware) => getDefaultMiddleware({
            serializableCheck: false,
        }).concat(geminiApi.middleware).prepend(listenerMiddleware.middleware),
    });

    return store;
};
```

### `stores/indexedDBStorage.ts`

```typescript
export interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}

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

### `stores/listenerMiddleware.ts`

```typescript
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import type { RootState } from './store';
import { i18nInstance, getT } from '@/i18n';
import { Language } from '@/types';
import { setSetting, exportAllData, resetAllData } from './slices/settingsSlice';
import { plantStateUpdated, resetPlants, addJournalEntry } from './slices/simulationSlice';
import { addNotification, setOnboardingStep } from './slices/uiSlice';
import { indexedDBStorage } from './indexedDBStorage';

// Import actions to listen for
import { addUserStrain, updateUserStrain, deleteUserStrain } from './slices/userStrainsSlice';
import { addExport, updateExport, deleteExport, addStrainTip, updateStrainTip, deleteStrainTip, addSetup, updateSetup, deleteSetup } from './slices/savedItemsSlice';
import { addArchivedMentorResponse, addArchivedAdvisorResponse, clearArchives } from './slices/archivesSlice';
import { toggleFavorite, addMultipleToFavorites, removeMultipleFromFavorites } from './slices/favoritesSlice';


export const listenerMiddleware = createListenerMiddleware();
const REDUX_STATE_KEY = 'cannaguide-redux-storage';

/**
 * Listener to handle state persistence to IndexedDB.
 * This is a more modern and robust approach than a manual store.subscribe().
 * Debouncing has been removed to ensure immediate saving, preventing data loss on tab close.
 */
listenerMiddleware.startListening({
  // Listen to all actions, but not the ones from RTK Query which are internal
  predicate: (action) => !action.type.startsWith('geminiApi/'),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    try {
        const stateToSave = {
            settings: state.settings,
            simulation: state.simulation,
            strainsView: state.strainsView,
            userStrains: state.userStrains,
            favorites: state.favorites,
            notes: state.notes,
            archives: state.archives,
            savedItems: state.savedItems,
            knowledge: state.knowledge,
            breeding: state.breeding,
            sandbox: state.sandbox,
            filters: state.filters,
        };
        const serializedState = JSON.stringify(stateToSave);
        await indexedDBStorage.setItem(REDUX_STATE_KEY, serializedState);
    } catch (e) {
        console.error("Could not save state", e);
    }
  },
});


/**
 * Listener to automatically change the i18n language when the setting is updated.
 */
listenerMiddleware.startListening({
  matcher: isAnyOf(setSetting),
  effect: async (action, listenerApi) => {
    if (action.payload.path === 'language') {
      const newLang = action.payload.value as Language;
      if (i18nInstance.language !== newLang) {
        await i18nInstance.changeLanguage(newLang);
      }
    }
  },
});

/**
 * Listener to create notifications when a new plant problem is detected.
 */
listenerMiddleware.startListening({
  actionCreator: plantStateUpdated,
  effect: async (action, listenerApi) => {
      const { updatedPlant } = action.payload;
      const previousState = listenerApi.getOriginalState() as RootState;
      const oldPlant = previousState.simulation.plants.entities[updatedPlant.id];
      
      if (!oldPlant) return;

      const oldProblems = new Set(oldPlant.problems.filter(p => p.status === 'active').map(p => p.type));
      const newProblems = updatedPlant.problems.filter(p => p.status === 'active');

      newProblems.forEach(problem => {
          if (!oldProblems.has(problem.type)) {
              const t = getT();
              const message = `${updatedPlant.name}: ${t(`problemMessages.${problem.type.charAt(0).toLowerCase() + problem.type.slice(1)}.message`)}`;
              listenerApi.dispatch(addNotification({ message, type: 'error' }));
          }
      });
  }
});


// --- Centralized Notification Listeners ---
const t = getT();

listenerMiddleware.startListening({
  matcher: isAnyOf(addUserStrain, updateUserStrain),
  effect: (action, { dispatch }) => {
    const type = action.type.includes('addUser') ? 'add' : 'update';
    dispatch(addNotification({ message: t(`strainsView.addStrainModal.validation.${type}Success`, { name: action.payload.name }), type: 'success' }));
  }
});

listenerMiddleware.startListening({
  actionCreator: addSetup.fulfilled,
  effect: (action, { dispatch }) => {
    dispatch(addNotification({ message: t('equipmentView.configurator.setupSaveSuccess', { name: action.payload.name }), type: 'success' }));
  }
});

listenerMiddleware.startListening({
  actionCreator: addExport,
  effect: (action, { dispatch }) => {
      dispatch(addNotification({
          message: t('common.successfullyExported_other', { count: action.payload.strainIds.length, format: action.payload.data.format.toUpperCase() }),
          type: 'success',
      }));
  }
});

listenerMiddleware.startListening({
    matcher: isAnyOf(deleteExport, deleteSetup, deleteStrainTip, deleteUserStrain),
    effect: (action, { dispatch }) => {
        let message = 'Item removed.';
        if (action.type.includes('Export')) message = t('strainsView.exportsManager.exportRemoved');
        // Add more specific messages if needed for other types
        dispatch(addNotification({ message, type: 'info' }));
    }
});

listenerMiddleware.startListening({
    matcher: isAnyOf(updateExport, updateSetup, updateStrainTip),
    effect: (action, { dispatch }) => {
        const payload = (action.payload as any).changes || action.payload;
        const name = payload.name || payload.title;
        let message = `Item "${name}" updated.`;
        if (action.type.includes('Export')) message = t('strainsView.exportsManager.updateExportSuccess', { name });
        dispatch(addNotification({ message, type: 'success' }));
    }
});

listenerMiddleware.startListening({
  actionCreator: addStrainTip,
  effect: (action, { dispatch }) => {
    dispatch(addNotification({ message: t('strainsView.tips.saveSuccess', { name: action.payload.strain.name }), type: 'success' }));
  }
});

listenerMiddleware.startListening({
  actionCreator: addMultipleToFavorites,
  effect: (action, { dispatch }) => {
    dispatch(addNotification({ message: t('strainsView.bulkActions.addedToFavorites', { count: action.payload.length }), type: 'success' }));
  }
});

listenerMiddleware.startListening({
  actionCreator: removeMultipleFromFavorites,
  effect: (action, { dispatch }) => {
    dispatch(addNotification({ message: t('strainsView.bulkActions.removedFromFavorites', { count: action.payload.length }), type: 'info' }));
  }
});

listenerMiddleware.startListening({
  actionCreator: addArchivedMentorResponse,
  effect: (_, { dispatch }) => {
    dispatch(addNotification({ message: t('knowledgeView.archive.saveSuccess'), type: 'success' }));
  }
});

listenerMiddleware.startListening({
  actionCreator: addJournalEntry,
  effect: (action, { dispatch }) => {
    if(action.payload.entry.details && 'diagnosis' in action.payload.entry.details) {
        dispatch(addNotification({ message: t('plantsView.aiDiagnostics.savedToJournal'), type: 'success' }));
    }
  }
});

listenerMiddleware.startListening({
  actionCreator: clearArchives,
  effect: (_, { dispatch }) => {
    dispatch(addNotification({ message: t('settingsView.data.clearArchivesSuccess'), type: 'success' }));
  }
});

listenerMiddleware.startListening({
  actionCreator: resetPlants,
  effect: (_, { dispatch }) => {
    dispatch(addNotification({ message: t('settingsView.data.resetPlantsSuccess'), type: 'success' }));
  }
});

listenerMiddleware.startListening({
  actionCreator: exportAllData.fulfilled,
  effect: (_, { dispatch }) => {
    dispatch(addNotification({ message: t('settingsView.data.exportSuccess'), type: 'success' }));
  }
});

listenerMiddleware.startListening({
  actionCreator: resetAllData.fulfilled,
  effect: (_, { dispatch }) => {
      dispatch(addNotification({ message: t('settingsView.data.resetAllSuccess'), type: 'success' }));
  }
});

listenerMiddleware.startListening({
  matcher: isAnyOf(setOnboardingStep),
  effect: (action, listenerApi) => {
    if (action.payload === 0 && (listenerApi.getOriginalState()