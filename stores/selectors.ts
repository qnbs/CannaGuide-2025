import { AppState } from './useAppStore';
import { Plant, Strain, View, Task, PlantProblem, TaskPriority } from '@/types';

// UI Selectors
export const selectActiveView = (state: AppState): View => state.activeView;
export const selectNotifications = (state: AppState) => state.notifications;
export const selectIsCommandPaletteOpen = (state: AppState) => state.isCommandPaletteOpen;
export const selectSelectedPlantId = (state: AppState) => state.selectedPlantId;

// Settings Selectors
export const selectSettings = (state: AppState) => state.settings;
export const selectLanguage = (state: AppState) => state.settings.language;
export const selectStrainsViewSettings = (state: AppState) => state.settings.strainsViewSettings;

// Data Selectors
export const selectPlantsRecord = (state: AppState) => state.plants;
export const selectPlantSlots = (state: AppState) => state.plantSlots;
export const selectUserStrains = (state: AppState) => state.userStrains;
export const selectSavedExports = (state: AppState) => state.savedExports;
export const selectSavedSetups = (state: AppState) => state.savedSetups;
export const selectArchivedMentorResponses = (state: AppState) => state.archivedMentorResponses;
export const selectArchivedAdvisorResponses = (state: AppState) => state.archivedAdvisorResponses;
export const selectSavedStrainTips = (state: AppState) => state.savedStrainTips;
export const selectKnowledgeProgress = (state: AppState) => state.knowledgeProgress;

// User Selectors
export const selectFavoriteIds = (state: AppState) => state.favoriteIds;
export const selectStrainNotes = (state: AppState) => state.strainNotes;

// --- DERIVED / COMPUTED SELECTORS ---

/** Selects all plant objects from the record, ensuring no null/undefined values are returned. */
export const selectActivePlants = (state: AppState): Plant[] => Object.values(state.plants).filter((p): p is Plant => !!p);

/** Checks if there is at least one empty slot to start a new grow. */
export const selectHasAvailableSlots = (state: AppState): boolean => state.plantSlots.some(p => p === null);

/** Returns a specific plant by its ID. */
export const selectPlantById = (id: string | null) => (state: AppState): Plant | null => {
    if (!id) return null;
    return state.plants[id] || null;
};

/**
 * Calculates and returns key metrics for the entire garden's health and environment.
 * This centralizes logic previously found in the DashboardSummary component.
 */
export const selectGardenHealthMetrics = (state: AppState) => {
    const plants = selectActivePlants(state);
    const activePlantsCount = plants.length;

    if (activePlantsCount === 0) {
        return { activePlantsCount: 0, avgStress: 0, gardenHealth: 100, avgTemp: 0, avgHumidity: 0 };
    }

    const totalStress = plants.reduce((sum, p) => sum + p.stressLevel, 0);
    const totalTemp = plants.reduce((sum, p) => sum + p.environment.temperature, 0);
    const totalHumidity = plants.reduce((sum, p) => sum + p.environment.humidity, 0);

    const avgStress = totalStress / activePlantsCount;
    const gardenHealth = Math.max(0, 100 - avgStress);

    return {
        activePlantsCount,
        avgStress,
        gardenHealth,
        avgTemp: totalTemp / activePlantsCount,
        avgHumidity: totalHumidity / activePlantsCount,
    };
};

const taskPriorityOrder: Record<TaskPriority, number> = { high: 1, medium: 2, low: 3 };

/**
 * Aggregates all open tasks from all active plants, sorted by priority.
 * Centralizes logic previously found in the PlantsView component.
 */
export const selectOpenTasksSummary = (state: AppState) => {
    const plants = selectActivePlants(state);
    return plants.flatMap(p => 
        p.tasks.filter(t => !t.isCompleted).map(task => ({ ...task, plantId: p.id, plantName: p.name }))
    ).sort((a, b) => taskPriorityOrder[a.priority] - taskPriorityOrder[b.priority]);
};

/**
 * Aggregates all active problems from all active plants.
 * Centralizes logic previously found in the PlantsView component.
 */
export const selectActiveProblemsSummary = (state: AppState) => {
    const plants = selectActivePlants(state);
    return plants.flatMap(p => 
        p.problems.filter(prob => prob.status === 'active').map(problem => ({...problem, plantId: p.id, plantName: p.name}))
    );
};