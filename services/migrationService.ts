import { store } from '../stores/store';
import { setArchivedMentorResponses, setArchivedAdvisorResponses } from '../stores/slices/archivesSlice';
import { runDataMigrationsLogic } from './migrationLogic';

/**
 * Runs data migrations on the application state after it has been hydrated from storage.
 * This function uses pure logic to clean up data and dispatches actions to update the store.
 */
export const runDataMigrations = (): void => {
    console.log('[MigrationService] Running data migrations...');
    const state = store.getState();

    const migrationResults = runDataMigrationsLogic(state);

    if (migrationResults.cleanedMentorResponses) {
        store.dispatch(setArchivedMentorResponses(migrationResults.cleanedMentorResponses));
    }

    if (migrationResults.cleanedAdvisorResponses) {
        store.dispatch(setArchivedAdvisorResponses(migrationResults.cleanedAdvisorResponses));
    }
    
    console.log('[MigrationService] Data migrations finished.');
};
