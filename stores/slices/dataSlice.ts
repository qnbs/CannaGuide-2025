import { Plant, Strain, GrowSetup, JournalEntry, Task, NotificationType, ArchivedMentorResponse, AIResponse, SavedExport, SavedSetup, SavedStrainTip, ArchivedAdvisorResponse, PlantStage, KnowledgeProgress } from '@/types';
import { runSimulationInWorker, SIMULATION_CONSTANTS, PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
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
    advanceSimulation: () => Promise<void>;
    addJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
    completeTask: (plantId: string, taskId: string) => void;
    waterAllPlants: () => void;
    advanceDay: () => Promise<void>;
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
        const { plantSlots } = get();
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
        
        set(state => {
            state.plantSlots[emptySlotIndex] = newPlantId;
            state.plants[newPlantId] = newPlant;
        });

        get().addJournalEntry(newPlant.id, { type: 'SYSTEM', notes: t()('plantsView.journal.startGrowing', { name: newPlant.name }) });
        get().addNotification(t()('plantsView.notifications.startSuccess', { name: newPlant.name }), 'success');
        return true;
    },
    
    advanceSimulation: async () => {
        const { settings, plants } = get();
        const activePlants = Object.values(plants).filter((p): p is Plant => !!p && p.stage !== PlantStage.Finished);
        if (activePlants.length === 0) return;

        const now = Date.now();
        const speedInMinutes = { '1x': 5, '2x': 2.5, '5x': 1, '10x': 0.5, '20x': 0.25 }[settings.simulationSettings.speed] || 5;
        const simulationDayDuration = speedInMinutes * 60 * 1000;

        for (const plant of activePlants) {
            const timeElapsed = now - plant.lastUpdated;
            const daysToSimulate = Math.floor(timeElapsed / simulationDayDuration);

            if (daysToSimulate > 0) {
                let currentPlantState = plant;
                for (let i = 0; i < daysToSimulate; i++) {
                    const { updatedPlant, events } = await runSimulationInWorker(currentPlantState, settings);
                    currentPlantState = updatedPlant;
                    
                    // Process events immediately after each day simulation
                     events.forEach((event: any) => {
                        if (event.type === 'notification') get().addNotification(t()(event.data.messageKey, event.data.params), event.data.type as NotificationType);
                        if (event.type === 'journal') get().addJournalEntry(updatedPlant.id, { type: event.data.type, notes: t()(event.data.notesKey, event.data.params) });
                        if (event.type === 'task') {
                            const newTask: Task = { ...event.data, id: `${event.data.title}-${Date.now()}`, isCompleted: false, createdAt: Date.now() };
                            set(state => { state.plants[updatedPlant.id]?.tasks.push(newTask); });
                        }
                    });
                }
                
                // Final state update in the store
                set(state => {
                    state.plants[currentPlantState.id] = { ...currentPlantState, lastUpdated: now };
                });
            }
        }
    },

    advanceDay: async () => {
        const { settings, plants } = get();
        const activePlants = Object.values(plants).filter((p): p is Plant => !!p && p.stage !== PlantStage.Finished);
        if (activePlants.length === 0) return;

        for (const plant of activePlants) {
            const { updatedPlant, events } = await runSimulationInWorker(plant, settings);
            set(state => {
                state.plants[updatedPlant.id] = updatedPlant;
            });
            events.forEach((event: any) => {
                if (event.type === 'notification') get().addNotification(t()(event.data.messageKey, event.data.params), event.data.type as NotificationType);
                if (event.type === 'journal') get().addJournalEntry(updatedPlant.id, { type: event.data.type, notes: t()(event.data.notesKey, event.data.params) });
                if (event.type === 'task') {
                    const newTask: Task = { ...event.data, id: `${event.data.title}-${Date.now()}`, isCompleted: false, createdAt: Date.now() };
                    set(state => { state.plants[updatedPlant.id]?.tasks.push(newTask); });
                }
            });
        }
    },

    addJournalEntry: (plantId, entryData) => set(state => {
        const plant = state.plants[plantId];
        if (!plant) return;
        
        const newEntry: JournalEntry = { ...entryData, id: `${entryData.type}-${Date.now()}`, timestamp: Date.now() };
        plant.journal.push(newEntry);
        
        // Apply immediate vital changes from actions
        if (entryData.type === 'WATERING') {
            if (entryData.details?.waterAmount) {
                 plant.vitals.substrateMoisture = Math.min(100, plant.vitals.substrateMoisture + (entryData.details.waterAmount / (plant.growSetup.potSize * SIMULATION_CONSTANTS.ML_PER_LITER)) * SIMULATION_CONSTANTS.WATER_REPLENISH_FACTOR);
            }
            if(entryData.details?.ph) plant.vitals.ph = entryData.details.ph;
        }
        if (entryData.type === 'FEEDING') {
            if(entryData.details?.ec) plant.vitals.ec = entryData.details.ec;
            if(entryData.details?.ph) plant.vitals.ph = entryData.details.ph;
        }
    }),

    completeTask: (plantId, taskId) => set(state => {
        const task = state.plants[plantId]?.tasks.find(t => t.id === taskId);
        if (task) {
            task.isCompleted = true;
            task.completedAt = Date.now();
        }
    }),

    waterAllPlants: () => {
        let wateredCount = 0;
        
        for (const plantId in get().plants) {
            const p = get().plants[plantId];
            if (p && p.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATER_ALL_THRESHOLD) {
                wateredCount++;
                const potSizeL = p.growSetup.potSize;
                const waterAmount = Math.max(500, potSizeL * 100); // Heuristic: 10% of pot volume
                get().addJournalEntry(p.id, { type: 'WATERING', notes: t()('plantsView.actionModals.defaultNotes.watering'), details: { waterAmount, ph: 6.5 }});
            }
        }
        
        if (wateredCount > 0) {
            get().addNotification(t()('plantsView.notifications.waterAllSuccess', { count: wateredCount }), 'success');
        } else {
            get().addNotification(t()('plantsView.notifications.waterAllNone'), 'info');
        }
    },

    resetPlants: () => {
        if (window.confirm(t()('settingsView.data.resetPlantsConfirm'))) {
            set({ plants: {}, plantSlots: [null, null, null], archivedAdvisorResponses: {}, selectedPlantId: null });
            get().addNotification(t()('settingsView.data.resetPlantsSuccess'), 'success');
        }
    },
    
    addUserStrain: (strain) => set(state => { state.userStrains.push(strain) }),
    updateUserStrain: (updatedStrain) => set(state => {
        const index = state.userStrains.findIndex(s => s.id === updatedStrain.id);
        if (index !== -1) state.userStrains[index] = updatedStrain;
    }),
    deleteUserStrain: (strainId) => set(state => ({ userStrains: state.userStrains.filter(s => s.id !== strainId) })),
    
    addExport: (newExport, strainIds) => {
        const savedExport: SavedExport = { ...newExport, id: `export-${Date.now()}`, createdAt: Date.now(), count: strainIds.length, strainIds };
        set(state => { state.savedExports.push(savedExport) });
        return savedExport;
    },
    updateExport: (updatedExport) => set(state => {
        const index = state.savedExports.findIndex(e => e.id === updatedExport.id);
        if (index !== -1) state.savedExports[index] = updatedExport;
    }),
    deleteExport: (exportId) => set(state => ({ savedExports: state.savedExports.filter(e => e.id !== exportId) })),
    
    addSetup: (setup) => {
        const newSetup: SavedSetup = { ...setup, id: `setup-${Date.now()}`, createdAt: Date.now() };
        set(state => { state.savedSetups.push(newSetup) });
    },
    updateSetup: (updatedSetup) => set(state => {
        const index = state.savedSetups.findIndex(s => s.id === updatedSetup.id);
        if (index !== -1) state.savedSetups[index] = updatedSetup;
    }),
    deleteSetup: (setupId) => set(state => ({ savedSetups: state.savedSetups.filter(s => s.id !== setupId) })),
    
    addArchivedMentorResponse: (response) => {
        const newResponse: ArchivedMentorResponse = { ...response, id: `mentor-${Date.now()}`, createdAt: Date.now() };
        set(state => { state.archivedMentorResponses.push(newResponse) });
    },
    updateArchivedMentorResponse: (updatedResponse) => set(state => {
        const index = state.archivedMentorResponses.findIndex(r => r.id === updatedResponse.id);
        if (index !== -1) state.archivedMentorResponses[index] = updatedResponse;
    }),
    deleteArchivedMentorResponse: (responseId) => set(state => ({ archivedMentorResponses: state.archivedMentorResponses.filter(r => r.id !== responseId) })),
    
    addArchivedAdvisorResponse: (plantId, response, query) => {
        const plant = get().plants[plantId];
        if (!plant) return;
        const newResponse: ArchivedAdvisorResponse = { ...response, id: `advisor-${plantId}-${Date.now()}`, createdAt: Date.now(), plantId, plantStage: plant.stage, query };
        set(state => {
            if (!state.archivedAdvisorResponses[plantId]) state.archivedAdvisorResponses[plantId] = [];
            state.archivedAdvisorResponses[plantId].push(newResponse);
        });
    },
    updateArchivedAdvisorResponse: (updatedResponse) => set(state => {
        const { plantId } = updatedResponse;
        const archive = state.archivedAdvisorResponses[plantId];
        if (!archive) return;
        const index = archive.findIndex(r => r.id === updatedResponse.id);
        if (index !== -1) archive[index] = updatedResponse;
    }),
    deleteArchivedAdvisorResponse: (plantId, responseId) => set(state => {
        const archive = state.archivedAdvisorResponses[plantId];
        if (archive) state.archivedAdvisorResponses[plantId] = archive.filter(r => r.id !== responseId);
    }),

    addStrainTip: (strain, tip) => {
        const newTip: SavedStrainTip = { ...tip, id: `tip-${strain.id}-${Date.now()}`, createdAt: Date.now(), strainId: strain.id, strainName: strain.name };
        set(state => { state.savedStrainTips.push(newTip) });
    },
    updateStrainTip: (updatedTip) => set(state => {
        const index = state.savedStrainTips.findIndex(t => t.id === updatedTip.id);
        if (index !== -1) state.savedStrainTips[index] = updatedTip;
    }),
    deleteStrainTip: (tipId) => set(state => ({ savedStrainTips: state.savedStrainTips.filter(t => t.id !== tipId) })),

    toggleKnowledgeProgressItem: (sectionId, itemId) => set(state => {
        const progress = state.knowledgeProgress[sectionId] || [];
        const index = progress.indexOf(itemId);
        if (index > -1) progress.splice(index, 1);
        else progress.push(itemId);
        state.knowledgeProgress[sectionId] = progress;
    }),
});