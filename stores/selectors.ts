import { createSelector } from 'reselect';
import { AppState } from './useAppStore';
import { Plant } from '@/types';

// Simple direct selectors
export const selectSettings = (state: AppState) => state.settings;
export const selectLanguage = (state: AppState) => state.settings.language;
export const selectActiveView = (state: AppState) => state.activeView;
export const selectIsCommandPaletteOpen = (state: AppState) => state.isCommandPaletteOpen;
export const selectNotifications = (state: AppState) => state.notifications;
export const selectSavedSetups = (state: AppState) => state.savedSetups;
export const selectArchivedMentorResponses = (state: AppState) => state.archivedMentorResponses;
export const selectArchivedAdvisorResponses = (state: AppState) => state.archivedAdvisorResponses;
export const selectKnowledgeProgress = (state: AppState) => state.knowledgeProgress;
export const selectSelectedPlantId = (state: AppState) => state.selectedPlantId;
export const selectPlantSlots = (state: AppState) => state.plantSlots;
export const selectTtsState = (state: AppState) => ({
    isTtsSpeaking: state.isTtsSpeaking,
    isTtsPaused: state.isTtsPaused,
    ttsQueue: state.ttsQueue,
});
export const selectCurrentlySpeakingId = (state: AppState) => state.currentlySpeakingId;

// AI State Selectors
export const selectEquipmentGenerationState = (state: AppState) => state.equipmentGeneration;
export const selectDiagnosticsState = (state: AppState) => state.diagnostics;
export const selectAdvisorStateForPlant = (plantId: string) => (state: AppState) => state.advisorChats[plantId] || { isLoading: false, response: null, error: null };
export const selectStrainTipState = (strainId: string) => (state: AppState) => state.strainTips[strainId] || { isLoading: false, response: null, error: null };
export const selectDeepDiveState = (plantId: string, topic: string) => (state: AppState) => state.deepDives[`${plantId}-${topic}`] || { isLoading: false, response: null, error: null };

// Plant-related memoized selectors
const selectPlants = (state: AppState) => state.plants;
const selectUserStrains = (state: AppState) => state.userStrains;

export const selectActivePlants = createSelector(
    selectPlants,
    (plants) => Object.values(plants).filter((p): p is Plant => !!p).filter(p => p.stage !== 'FINISHED')
);

export const selectPlantById = (id: string | null) => createSelector(
    selectPlants,
    (plants) => (id ? plants[id] : null)
);

export const selectActiveMentorPlant = createSelector(
    selectPlants,
    (state: AppState) => state.activeMentorPlantId,
    (plants, activeMentorPlantId) => (activeMentorPlantId ? plants[activeMentorPlantId] : null)
);

export const selectUserStrainIds = createSelector(
    selectUserStrains,
    (userStrains) => new Set(userStrains.map(s => s.id))
);

export const selectOpenTasksSummary = createSelector(
    selectActivePlants,
    (activePlants) => activePlants.flatMap(plant =>
        plant.tasks
            .filter(task => !task.isCompleted)
            .map(task => ({ ...task, plantId: plant.id, plantName: plant.name }))
    )
);

export const selectActiveProblemsSummary = createSelector(
    selectActivePlants,
    (activePlants) => activePlants.flatMap(plant =>
        plant.problems
            .filter(problem => problem.status === 'active')
            .map(problem => ({ ...problem, plantId: plant.id, plantName: plant.name }))
    )
);

export const selectHasAvailableSlots = createSelector(
    selectPlantSlots,
    (plantSlots) => plantSlots.some(slot => slot === null)
);

export const selectArchivedAdvisorResponsesForPlant = (plantId: string) => createSelector(
    selectArchivedAdvisorResponses,
    (archives) => archives[plantId] || []
);

export const selectGardenHealthMetrics = createSelector(
    selectActivePlants,
    (activePlants) => {
        const activePlantsCount = activePlants.length;
        if (activePlantsCount === 0) {
            return { activePlantsCount: 0, gardenHealth: 100, avgTemp: 0, avgHumidity: 0 };
        }
        
        const totalHealth = activePlants.reduce((sum, p) => sum + p.health, 0);
        const totalTemp = activePlants.reduce((sum, p) => sum + p.environment.internalTemperature, 0);
        const totalHumidity = activePlants.reduce((sum, p) => sum + p.environment.internalHumidity, 0);

        return {
            activePlantsCount,
            gardenHealth: totalHealth / activePlantsCount,
            avgTemp: totalTemp / activePlantsCount,
            avgHumidity: totalHumidity / activePlantsCount,
        };
    }
);