import { store } from '../stores/store';
import { ArchivedMentorResponse, ArchivedAdvisorResponse } from '../types';
import { setArchivedMentorResponses, setArchivedAdvisorResponses } from '../stores/slices/archivesSlice';

/**
 * Runs data migrations on the application state after it has been hydrated from storage.
 * This function cleans up potentially corrupted or outdated data structures to prevent runtime errors.
 */
export const runDataMigrations = (): void => {
    console.log('[MigrationService] Running data migrations...');
    const state = store.getState();

    // --- Migrate Mentor Responses ---
    const mentorResponses = state.archives.archivedMentorResponses;
    if (Array.isArray(mentorResponses)) {
        const cleanedMentorResponses = mentorResponses.filter(
            (res): res is ArchivedMentorResponse => res && typeof res === 'object' && !!res.title && !!res.content
        );

        if (cleanedMentorResponses.length !== mentorResponses.length) {
            console.warn(`[MigrationService] Cleaned ${mentorResponses.length - cleanedMentorResponses.length} invalid mentor responses.`);
            store.dispatch(setArchivedMentorResponses(cleanedMentorResponses));
        }
    }

    // --- Migrate Advisor Responses ---
    const advisorResponses = state.archives.archivedAdvisorResponses;
    if (advisorResponses && typeof advisorResponses === 'object') {
        const cleanedAdvisorResponses: Record<string, ArchivedAdvisorResponse[]> = {};
        let cleanedCount = 0;
        let originalCount = 0;
        let needsUpdate = false;

        for (const plantId in advisorResponses) {
            if (Object.prototype.hasOwnProperty.call(advisorResponses, plantId)) {
                const responses = advisorResponses[plantId];
                if (Array.isArray(responses)) {
                    originalCount += responses.length;
                    const cleaned = responses.filter(
                        (res): res is ArchivedAdvisorResponse => res && typeof res === 'object' && !!res.title && !!res.content
                    );
                    cleanedAdvisorResponses[plantId] = cleaned;
                    cleanedCount += cleaned.length;
                    if (cleaned.length !== responses.length) {
                        needsUpdate = true;
                    }
                }
            }
        }

        if (needsUpdate) {
            console.warn(`[MigrationService] Cleaned ${originalCount - cleanedCount} invalid advisor responses.`);
            store.dispatch(setArchivedAdvisorResponses(cleanedAdvisorResponses));
        }
    }
    
    console.log('[MigrationService] Data migrations finished.');
};