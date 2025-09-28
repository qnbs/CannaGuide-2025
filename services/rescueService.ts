import { indexedDBStorage } from '@/stores/indexedDBStorage';

const ZUSTAND_KEY = 'cannaguide-2025-storage'; // Der Name deines Persist-Speichers

export const runDatabaseRescue = async () => {
  try {
    console.log('[RescueService] Starting database rescue operation...');

    // 1. Lese den rohen, potenziell fehlerhaften Zustand
    const rawStateString = await indexedDBStorage.getItem(ZUSTAND_KEY);
    if (!rawStateString) {
      console.log('[RescueService] No state found in IndexedDB. No action needed.');
      return;
    }
    
    const state = JSON.parse(rawStateString);
    const mentorResponses = state.state?.archivedMentorResponses;
    const advisorResponses = state.state?.archivedAdvisorResponses;

    let needsUpdate = false;

    // Bereinige Mentor-Antworten
    if (!mentorResponses || !Array.isArray(mentorResponses)) {
        console.log('[RescueService] No archived mentor responses to clean. Skipping.');
    } else {
        const originalCount = mentorResponses.length;
        // 2. Filtere nur die gültigen Einträge
        const cleanedResponses = mentorResponses.filter((res: any) => res && typeof res.title === 'string' && typeof res.content === 'string');
        const removedCount = originalCount - cleanedResponses.length;

        if (removedCount > 0) {
          console.warn(`[RescueService] Found and removed ${removedCount} corrupted mentor responses.`);
          // 3. Setze die bereinigten Daten im Zustandsobjekt
          state.state.archivedMentorResponses = cleanedResponses;
          needsUpdate = true;
        } else {
          console.log('[RescueService] All mentor responses are valid. No cleaning needed.');
        }
    }

    // Bereinige Berater-Antworten
    if (!advisorResponses || typeof advisorResponses !== 'object') {
        console.log('[RescueService] No archived advisor responses to clean. Skipping.');
    } else {
        const cleanedAdvisorResponses: Record<string, any[]> = {};
        let originalCount = 0;
        let cleanedCount = 0;

        for (const plantId in advisorResponses) {
            if (Object.prototype.hasOwnProperty.call(advisorResponses, plantId)) {
                const responses = advisorResponses[plantId];
                if (Array.isArray(responses)) {
                    originalCount += responses.length;
                    const cleaned = responses.filter((res: any) => res && typeof res.title === 'string' && typeof res.content === 'string');
                    cleanedAdvisorResponses[plantId] = cleaned;
                    cleanedCount += cleaned.length;
                }
            }
        }
        
        if (cleanedCount < originalCount) {
            const removedCount = originalCount - cleanedCount;
            console.warn(`[RescueService] Found and removed ${removedCount} corrupted advisor responses.`);
            state.state.archivedAdvisorResponses = cleanedAdvisorResponses;
            needsUpdate = true;
        } else {
             console.log('[RescueService] All advisor responses are valid. No cleaning needed.');
        }
    }
    
    if(needsUpdate) {
        // 4. Schreibe den gesamten, bereinigten Zustand zurück in die DB
        await indexedDBStorage.setItem(ZUSTAND_KEY, JSON.stringify(state));
        console.log('[RescueService] Successfully wrote cleaned state back to IndexedDB.');
    } else {
        console.log('[RescueService] No database updates were necessary.');
    }
    
  } catch (error) {
    console.error('[RescueService] Rescue operation failed:', error);
  }
};
