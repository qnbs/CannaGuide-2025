import { Plant, Strain, GrowSetup, JournalEntry, Task, NotificationType, ArchivedMentorResponse, AIResponse, SavedExport, SavedSetup, SavedStrainTip, ArchivedAdvisorResponse, PlantStage, KnowledgeProgress } from '@/types';
import { advancePlantOneDay, SIMULATION_CONSTANTS } from '@/services/plantSimulationService';
import type { AppState, StoreSet, StoreGet, TFunction } from '@/stores/useAppStore';

export interface DataSlice {
    plants: Record<string, Plant>;
    plantSlots: (string | null)[];
    userStrains: Strain[];
    savedExports: SavedExport[];
    savedSetups: SavedSetup[];
    archivedMentorResponses: ArchivedMentorResponse[];
    archivedAdvisorResponses: Record<string, ArchivedAdvisorResponse[]>;
    savedStrainTips: SavedStrainTip[];
    knowledgeProgress: KnowledgeProgress;
    
    startNewPlant: (strain: Strain, setup: GrowSetup, slotIndex?: number) => boolean;
    updatePlantState: () => void;
    addJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
    completeTask: (plantId: string, taskId: string) => void;
    waterAllPlants: () => void;
    advanceDay: () => void;
    resetPlants: () => void;
    
    addUserStrain: (strain: Strain) => void;
    updateUserStrain: (strain: Strain) => void;
    deleteUserStrain: (strainId: string) => void;
    
    addExport: (newExport: Omit<SavedExport, 'id' | 'createdAt' | 'count' | 'strainIds'>, strainIds: string[]) => SavedExport;
    updateExport: (updatedExport: SavedExport) => void;
    deleteExport: (exportId: string) => void;
    
    addSetup: (setup: Omit<SavedSetup, 'id' | 'createdAt'>) => void;
    updateSetup: (updatedSetup: SavedSetup) => void;
    deleteSetup: (setupId: string) => void;
    
    addArchivedMentorResponse: (response: Omit<ArchivedMentorResponse, 'id' | 'createdAt'>) => void;
    updateArchivedMentorResponse: (updatedResponse: ArchivedMentorResponse) => void;
    deleteArchivedMentorResponse: (responseId: string) => void;
    
    addArchivedAdvisorResponse: (plantId: string, response: AIResponse, query: string) => void;
    updateArchivedAdvisorResponse: (updatedResponse: ArchivedAdvisorResponse) => void;
    deleteArchivedAdvisorResponse: (plantId: string, responseId: string) => void;

    addStrainTip: (strain: Strain, tip: AIResponse) => void;
    updateStrainTip: (updatedTip: SavedStrainTip) => void;
    deleteStrainTip: (tipId: string) => void;

    toggleKnowledgeProgressItem: (sectionId: string, itemId: string) => void;
}

export const createDataSlice = (set: StoreSet, get: StoreGet, t: () => TFunction): DataSlice => ({
    plants: {},
    plantSlots: [null, null, null],
    userStrains: [],
    savedExports: [],
    savedSetups: [],
    archivedMentorResponses: [],
    archivedAdvisorResponses: {},
    savedStrainTips: [],
    knowledgeProgress: {},

    startNewPlant: (strain, setup, slotIndex) => {
        const { plantSlots, plants } = get();
        const emptySlotIndex = slotIndex !== undefined && plantSlots[slotIndex] === null ? slotIndex : plantSlots.findIndex(p => p === null);

        if (emptySlotIndex === -1) {
            get().addNotification(t()('plantsView.notifications.allSlotsFull'), 'error');
            return false;
        }
        
        const now = Date.now();
        const newPlantId = `${strain.id.replace(/\s/g, '-')}-${now}`;
        const newPlant: Plant = {
            id: newPlantId, name: strain.name, strain, stage: PlantStage.Seed, age: 0, height: 0, startedAt: now, lastUpdated: now,
            growSetup: setup, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 }, environment: { temperature: setup.temperature, humidity: setup.humidity, light: 100 },
            stressLevel: 0, problems: [], journal: [], tasks: [], history: [{ day: 0, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 }, stressLevel: 0, height: 0 }],
        };
        
        const newPlantSlots = [...plantSlots];
        newPlantSlots[emptySlotIndex] = newPlantId;
        const newPlants = { ...plants, [newPlantId]: newPlant };
        
        set({ plants: newPlants, plantSlots: newPlantSlots });

        get().addJournalEntry(newPlant.id, { type: 'SYSTEM', notes: t()('plantsView.journal.startGrowing', { name: newPlant.name }) });
        get().addNotification(t()('plantsView.notifications.startSuccess', { name: newPlant.name }), 'success');
        return true;
    },
    
    updatePlantState: () => {
        // This is called by the simulation interval. It advances one day per tick.
        get().advanceDay();
    },

    addJournalEntry: (plantId, entryData) => set(state => {
        const plant = state.plants[plantId];
        if (!plant) return {};
        const newEntry: JournalEntry = { ...entryData, id: `${entryData.type}-${Date.now()}`, timestamp: Date.now() };
        const updatedPlant = { ...plant, journal: [...plant.journal, newEntry] };
        
        // Update vitals based on action
        if (entryData.type === 'WATERING' && entryData.details?.waterAmount) {
            updatedPlant.vitals.substrateMoisture = Math.min(100, updatedPlant.vitals.substrateMoisture + (entryData.details.waterAmount / (updatedPlant.growSetup.potSize * SIMULATION_CONSTANTS.ML_PER_LITER)) * SIMULATION_CONSTANTS.WATER_REPLENISH_FACTOR);
        }
        if (entryData.type === 'FEEDING' && entryData.details?.ec) {
            updatedPlant.vitals.ec = entryData.details.ec;
        }
        if ((entryData.type === 'WATERING' || entryData.type === 'FEEDING') && entryData.details?.ph) {
            updatedPlant.vitals.ph = entryData.details.ph;
        }
        
        return { plants: { ...state.plants, [plantId]: updatedPlant } };
    }),

    completeTask: (plantId, taskId) => set(state => {
        const plant = state.plants[plantId];
        if (!plant) return {};
        const updatedTasks = plant.tasks.map(t => t.id === taskId ? { ...t, isCompleted: true, completedAt: Date.now() } : t);
        const updatedPlant = { ...plant, tasks: updatedTasks };
        return { plants: { ...state.plants, [plantId]: updatedPlant } };
    }),

    waterAllPlants: () => {
        let wateredCount = 0;
        const newPlants = { ...get().plants };
        for (const plantId in newPlants) {
            const p = newPlants[plantId];
            if (p && p.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATER_ALL_THRESHOLD) {
                wateredCount++;
                get().addJournalEntry(p.id, { type: 'WATERING', notes: t()('plantsView.actionModals.defaultNotes.watering'), details: { waterAmount: 500, ph: 6.5 }});
                newPlants[plantId] = { ...p, vitals: { ...p.vitals, substrateMoisture: 100 } };
            }
        }
        if (wateredCount > 0) {
            set({ plants: newPlants });
            get().addNotification(t()('plantsView.notifications.waterAllSuccess', { count: wateredCount }), 'success');
        } else {
            get().addNotification(t()('plantsView.notifications.waterAllNone'), 'info');
        }
    },

    advanceDay: () => {
        const { plants: currentPlants, settings } = get();
        const newPlantsRecord: Record<string, Plant> = {};
        
        Object.values(currentPlants).forEach(plant => {
            if (!plant) return;

            const { updatedPlant, events } = advancePlantOneDay(plant, settings, t());
            newPlantsRecord[plant.id] = updatedPlant;

            events.forEach(event => {
                if (event.type === 'notification') get().addNotification(event.data.message, event.data.type as NotificationType);
                if (event.type === 'journal') get().addJournalEntry(plant.id, event.data);
                if (event.type === 'task') {
                    const newTask: Task = { ...event.data, id: `${event.data.title}-${Date.now()}`, isCompleted: false, createdAt: Date.now() };
                    newPlantsRecord[plant.id].tasks = [...newPlantsRecord[plant.id].tasks, newTask];
                }
            });
        });

        set({ plants: { ...currentPlants, ...newPlantsRecord } });
    },

    resetPlants: () => {
        if (window.confirm(t()('settingsView.data.resetPlantsConfirm'))) {
            set({ plants: {}, plantSlots: [null, null, null], archivedAdvisorResponses: {}, selectedPlantId: null });
            get().addNotification(t()('settingsView.data.resetPlantsSuccess'), 'success');
        }
    },
    
    addUserStrain: (strain) => set(state => ({ userStrains: [...state.userStrains, strain] })),
    updateUserStrain: (updatedStrain) => set(state => ({ userStrains: state.userStrains.map(s => s.id === updatedStrain.id ? updatedStrain : s) })),
    deleteUserStrain: (strainId) => set(state => ({ userStrains: state.userStrains.filter(s => s.id !== strainId) })),
    
    addExport: (newExport, strainIds) => {
        const savedExport: SavedExport = {
            ...newExport,
            id: `export-${Date.now()}`,
            createdAt: Date.now(),
            count: strainIds.length,
            strainIds,
        };
        set(state => ({ savedExports: [...state.savedExports, savedExport] }));
        return savedExport;
    },
    updateExport: (updatedExport) => set(state => ({ savedExports: state.savedExports.map(e => e.id === updatedExport.id ? updatedExport : e) })),
    deleteExport: (exportId) => set(state => ({ savedExports: state.savedExports.filter(e => e.id !== exportId) })),
    
    addSetup: (setup) => {
        const newSetup: SavedSetup = {
            ...setup,
            id: `setup-${Date.now()}`,
            createdAt: Date.now(),
        };
        set(state => ({ savedSetups: [...state.savedSetups, newSetup] }));
    },
    updateSetup: (updatedSetup) => set(state => ({ savedSetups: state.savedSetups.map(s => s.id === updatedSetup.id ? updatedSetup : s) })),
    deleteSetup: (setupId) => set(state => ({ savedSetups: state.savedSetups.filter(s => s.id !== setupId) })),
    
    addArchivedMentorResponse: (response) => {
        const newResponse: ArchivedMentorResponse = {
            ...response,
            id: `mentor-${Date.now()}`,
            createdAt: Date.now(),
        };
        set(state => ({ archivedMentorResponses: [...state.archivedMentorResponses, newResponse] }));
    },
    updateArchivedMentorResponse: (updatedResponse) => set(state => ({
        archivedMentorResponses: state.archivedMentorResponses.map(r => r.id === updatedResponse.id ? updatedResponse : r)
    })),
    deleteArchivedMentorResponse: (responseId) => set(state => ({
        archivedMentorResponses: state.archivedMentorResponses.filter(r => r.id !== responseId)
    })),
    
    addArchivedAdvisorResponse: (plantId, response, query) => {
        const plant = get().plants[plantId];
        if (!plant) return;
        const newResponse: ArchivedAdvisorResponse = {
            ...response,
            id: `advisor-${plantId}-${Date.now()}`,
            createdAt: Date.now(),
            plantId: plantId,
            plantStage: plant.stage,
            query,
        };
        set(state => ({
            archivedAdvisorResponses: {
                ...state.archivedAdvisorResponses,
                [plantId]: [...(state.archivedAdvisorResponses[plantId] || []), newResponse]
            }
        }));
    },
    updateArchivedAdvisorResponse: (updatedResponse) => set(state => {
        const { plantId } = updatedResponse;
        if (!state.archivedAdvisorResponses[plantId]) return {};
        return {
            archivedAdvisorResponses: {
                ...state.archivedAdvisorResponses,
                [plantId]: state.archivedAdvisorResponses[plantId].map(r => r.id === updatedResponse.id ? updatedResponse : r)
            }
        };
    }),
    deleteArchivedAdvisorResponse: (plantId, responseId) => set(state => {
        if (!state.archivedAdvisorResponses[plantId]) return {};
        return {
            archivedAdvisorResponses: {
                ...state.archivedAdvisorResponses,
                [plantId]: state.archivedAdvisorResponses[plantId].filter(r => r.id !== responseId)
            }
        };
    }),

    addStrainTip: (strain, tip) => {
        const newTip: SavedStrainTip = {
            ...tip,
            id: `tip-${strain.id}-${Date.now()}`,
            createdAt: Date.now(),
            strainId: strain.id,
            strainName: strain.name,
        };
        set(state => ({ savedStrainTips: [...state.savedStrainTips, newTip] }));
    },
    updateStrainTip: (updatedTip) => set(state => ({
        savedStrainTips: state.savedStrainTips.map(t => t.id === updatedTip.id ? updatedTip : t)
    })),
    deleteStrainTip: (tipId) => set(state => ({
        savedStrainTips: state.savedStrainTips.filter(t => t.id !== tipId)
    })),

    toggleKnowledgeProgressItem: (sectionId, itemId) => set(state => {
        const sectionProgress = state.knowledgeProgress[sectionId] || [];
        const newProgress = new Set(sectionProgress);
        newProgress.has(itemId) ? newProgress.delete(itemId) : newProgress.add(itemId);
        return {
            knowledgeProgress: {
                ...state.knowledgeProgress,
                [sectionId]: Array.from(newProgress)
            }
        };
    }),
});
