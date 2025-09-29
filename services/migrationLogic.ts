import { RootState } from '@/stores/store';
import { ArchivedMentorResponse, ArchivedAdvisorResponse } from '@/types';

/**
 * A pure function that takes the application state and returns a cleaned version
 * of the archives. It is decoupled from the store and has no side effects.
 * @param state The entire application root state.
 * @returns An object containing arrays of cleaned responses if changes were made.
 */
export const runDataMigrationsLogic = (state: RootState): {
    cleanedMentorResponses?: ArchivedMentorResponse[];
    cleanedAdvisorResponses?: Record<string, ArchivedAdvisorResponse[]>;
} => {
    const results: {
        cleanedMentorResponses?: ArchivedMentorResponse[];
        cleanedAdvisorResponses?: Record<string, ArchivedAdvisorResponse[]>;
    } = {};

    // --- Migrate Mentor Responses ---
    const mentorResponses = state.archives.archivedMentorResponses;
    if (Array.isArray(mentorResponses)) {
        const cleaned = mentorResponses.filter(
            (res): res is ArchivedMentorResponse => res && typeof res === 'object' && !!res.title && !!res.content
        );

        if (cleaned.length !== mentorResponses.length) {
            console.warn(`[MigrationLogic] Found ${mentorResponses.length - cleaned.length} invalid mentor responses to clean.`);
            results.cleanedMentorResponses = cleaned;
        }
    }

    // --- Migrate Advisor Responses ---
    const advisorResponses = state.archives.archivedAdvisorResponses;
    if (advisorResponses && typeof advisorResponses === 'object') {
        const cleanedAdvisorResponses: Record<string, ArchivedAdvisorResponse[]> = {};
        let originalCount = 0;
        let cleanedCount = 0;
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
            console.warn(`[MigrationLogic] Found ${originalCount - cleanedCount} invalid advisor responses to clean.`);
            results.cleanedAdvisorResponses = cleanedAdvisorResponses;
        }
    }

    return results;
};
