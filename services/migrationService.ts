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
