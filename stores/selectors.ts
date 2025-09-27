import { createSelector } from 'reselect';
import { AppState } from './useAppStore';
import { Plant, PlantStage, Task, PlantProblem, Strain, ArchivedAdvisorResponse, DeepDiveGuide, Recommendation, PlantDiagnosisResponse, StructuredGrowTips } from '../types';

// Simple direct selectors
export const selectSettings = (state: AppState) => state.settings;
export const selectLanguage = (state: AppState) => state.settings.language;
export const selectActiveView = (state: AppState) => state.activeView;
export const selectIsCommandPaletteOpen = (state: AppState) => state.isCommandPaletteOpen;
export const selectNotifications = (state: AppState) => state.notifications;
export const selectSavedSetups = (state: AppState) => state.savedSetups;
export const selectArchivedMentorResponses = (state: AppState) => state.archivedMentorResponses;
export const selectArchivedAdvisorResponses = (state: AppState) => state.archivedAdvisorResponses;
export const selectSelectedPlantId = (state: AppState) => state.selectedPlantId;
export const selectPlantSlots = (state: AppState) => state.plantSlots;
export const selectAllPlants = (state: AppState) => state.plants;

// Memoized selectors for derived data
export const selectUserStrainIds = createSelector(
    (state: AppState) => state.userStrains,
    (userStrains) => new Set(userStrains.map(s => s.id))
);

export const selectActivePlants = createSelector(
    selectAllPlants,
    // A two-step filter is used here to resolve a type inference issue.
    // The first filter safely narrows the type to `Plant`, allowing the second
    // filter to access properties like `stage` without compiler errors.
    (plants) => Object.values(plants)
        .filter((p): p is Plant => !!p)
        .filter(p => 
            p.stage !== PlantStage.Finished && 
            p.stage !== PlantStage.Curing && 
            p.stage !== PlantStage.Drying
        )
);

export const selectHasAvailableSlots = createSelector(
    selectPlantSlots,
    (slots) => slots.some(slot => slot === null)
);

export const selectOpenTasksSummary = createSelector(
    selectActivePlants,
    (activePlants) => {
        const allTasks: (Task & { plantId: string, plantName: string })[] = [];
        activePlants.forEach(plant => {
            plant.tasks.forEach(task => {
                if (!task.isCompleted) {
                    allTasks.push({ ...task, plantId: plant.id, plantName: plant.name });
                }
            });
        });
        return allTasks.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
);

export const selectActiveProblemsSummary = createSelector(
    selectActivePlants,
    (activePlants) => {
        const allProblems: (PlantProblem & { plantId: string, plantName: string })[] = [];
        activePlants.forEach(plant => {
            plant.problems.forEach(problem => {
                if (problem.status === 'active') {
                    allProblems.push({ ...problem, plantId: plant.id, plantName: plant.name });
                }
            });
        });
        return allProblems;
    }
);

export const selectArchivedAdvisorResponsesForPlant = (plantId: string) => createSelector(
    selectArchivedAdvisorResponses,
    (archives) => archives[plantId] || []
);

export const selectPlantById = (plantId: string | null) => createSelector(
    selectAllPlants,
    (plants) => (plantId ? plants[plantId] : null) as Plant | null
);

export const selectEquipmentGenerationState = (state: AppState) => state.equipmentGeneration;
export const selectDiagnosticsState = (state: AppState) => state.diagnostics;

export const selectAdvisorStateForPlant = (plantId: string) => (state: AppState): AppState['advisorChats'][string] => 
    state.advisorChats[plantId] || { isLoading: false, response: null, error: null };

export const selectStrainTipState = (strainId: string) => (state: AppState): AppState['strainTips'][string] => 
    state.strainTips[strainId] || { isLoading: false, response: null, error: null };

export const selectDeepDiveState = (plantId: string, topic: string) => (state: AppState): AppState['deepDives'][string] =>
    state.deepDives[`${plantId}-${topic}`] || { isLoading: false, response: null, error: null };

export const selectGardenHealthMetrics = createSelector(
    selectActivePlants,
    (activePlants) => {
        if (activePlants.length === 0) {
            return { gardenHealth: 100, activePlantsCount: 0, avgTemp: 24, avgHumidity: 60 };
        }
        const totalHealth = activePlants.reduce((sum, p) => sum + p.health, 0);
        const totalTemp = activePlants.reduce((sum, p) => sum + p.environment.internalTemperature, 0);
        const totalHumidity = activePlants.reduce((sum, p) => sum + p.environment.internalHumidity, 0);
        const count = activePlants.length;

        return {
            gardenHealth: totalHealth / count,
            activePlantsCount: count,
            avgTemp: totalTemp / count,
            avgHumidity: totalHumidity / count,
        };
    }
);

export const selectTtsState = (state: AppState) => ({
    isTtsSpeaking: state.isTtsSpeaking,
    isTtsPaused: state.isTtsPaused,
    ttsQueue: state.ttsQueue,
});

export const selectCurrentlySpeakingId = (state: AppState) => state.currentlySpeakingId;