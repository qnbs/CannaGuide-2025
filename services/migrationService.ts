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

/**
 * @deprecated The `runDataMigrations` thunk is now obsolete. State hydration and migration
 * are handled centrally and asynchronously within the `createAppStore` function in `stores/store.ts`.
 * This new approach ensures the store is fully hydrated and migrated before the application renders,
 * providing a more robust and streamlined initialization process.
 */
export const runDataMigrations = createAsyncThunk<void, void, { state: RootState }>(
    'data/runMigrations',
    async (_, { dispatch }) => {
        console.warn('runDataMigrations thunk is deprecated and should not be used.');
        // This thunk is now empty as its logic has been moved to the store creation process.
        // It's kept for now to avoid breaking imports but should be removed in the future.
    }
);
