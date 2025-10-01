import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../stores/store';
import { setArchivedMentorResponses, setArchivedAdvisorResponses } from '../stores/slices/archivesSlice';
import { runDataMigrationsLogic } from './migrationLogic';

/**
 * Runs data migrations on the application state after it has been hydrated from storage.
 * This function uses pure logic to clean up data and dispatches actions to update the store.
 */
export const runDataMigrations = createAsyncThunk<void, void, { state: RootState }>(
    'data/runMigrations',
    async (_, { getState, dispatch }) => {
        console.log('[MigrationService] Running data migrations...');
        const state = getState();

        const migrationResults = runDataMigrationsLogic(state);

        if (migrationResults.cleanedMentorResponses) {
            dispatch(setArchivedMentorResponses(migrationResults.cleanedMentorResponses));
        }

        if (migrationResults.cleanedAdvisorResponses) {
            dispatch(setArchivedAdvisorResponses(migrationResults.cleanedAdvisorResponses));
        }
        
        console.log('[MigrationService] Data migrations finished.');
    }
);
