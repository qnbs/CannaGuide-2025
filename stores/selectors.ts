import { AppState } from './useAppStore';
import { createSelector } from 'reselect';
import { Plant, PlantStage } from '@/types';

// Simple direct selectors
export const selectSettings = (state: AppState) => state.settings;
export const selectLanguage = (state: AppState) => state.settings.language;
export const selectActiveView = (state: AppState) => state.activeView;
export const selectIsCommandPaletteOpen = (state: AppState) => state.isCommandPaletteOpen;
export const selectNotifications = (state: AppState) => state.notifications;
export const selectSavedSetups = (state: AppState) => state.savedSetups;
export const selectEquipmentGenerationState = (state: AppState) => state.equipmentGenerationState;
export const selectDiagnosticsState = (state: AppState) => state.diagnosticsState;
export const selectMentorState = (state: AppState) => state.mentorState;
export const selectAdvisorStateForPlant = (plantId: string) => (state: AppState) => state.advisorState[plantId] || { isLoading: false, response: null, error: null };
export const selectStrainTipState = (strainId: string) => (state: AppState) => state.strainTipState[strainId] || { isLoading: false, tip: null, error: null };
export const selectPlantSlots = (state: AppState) => state.plantSlots;
export const selectSelectedPlantId = (state: AppState) => state.selectedPlantId;
export const selectKnowledgeProgress = (state: AppState) => state.knowledgeProgress;
export const selectArchivedMentorResponses = (state: AppState) => state.archivedMentorResponses;
export const selectArchivedAdvisorResponses = (state: AppState) => state.archivedAdvisorResponses;
export const selectTtsState = (state: AppState) => ({ isTtsSpeaking: state.isTtsSpeaking, isTtsPaused: state.isTtsPaused, ttsQueue: state.ttsQueue });
export const selectCurrentlySpeakingId = (state: AppState) => state.currentlySpeakingId;

// Memoized selectors for computed data
const selectPlantsRecord = (state: AppState) => state.plants;

export const selectActivePlants = createSelector(
  [selectPlantsRecord],
  (plants) => Object.values(plants).filter((p): p is Plant => !!p && (p as Plant).stage !== PlantStage.Finished)
);

export const selectHasAvailableSlots = createSelector(
  [selectPlantSlots],
  (plantSlots) => plantSlots.some(slot => slot === null)
);

export const selectOpenTasksSummary = createSelector(
  [selectActivePlants],
  (activePlants) => activePlants.flatMap(plant =>
    plant.tasks
      .filter(task => !task.isCompleted)
      .map(task => ({ ...task, plantId: plant.id, plantName: plant.name }))
  ).sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  })
);

export const selectActiveProblemsSummary = createSelector(
  [selectActivePlants],
  (activePlants) => activePlants.flatMap(plant =>
    plant.problems
      .filter(problem => problem.status === 'active')
      .map(problem => ({ ...problem, plantId: plant.id, plantName: plant.name }))
  )
);

export const selectGardenHealthMetrics = createSelector(
    [selectActivePlants],
    (activePlants) => {
        const activePlantsCount = activePlants.length;
        if (activePlantsCount === 0) {
            return { activePlantsCount, gardenHealth: 100, avgTemp: 0, avgHumidity: 0 };
        }
        
        const totalStress = activePlants.reduce((sum, plant) => sum + plant.stressLevel, 0);
        const gardenHealth = 100 - (totalStress / activePlantsCount);
        
        const totalTemp = activePlants.reduce((sum, plant) => sum + plant.environment.temperature, 0);
        const avgTemp = totalTemp / activePlantsCount;
        
        const totalHumidity = activePlants.reduce((sum, plant) => sum + plant.environment.humidity, 0);
        const avgHumidity = totalHumidity / activePlantsCount;
        
        return { activePlantsCount, gardenHealth, avgTemp, avgHumidity };
    }
);