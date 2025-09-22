import { create } from 'zustand';
import { storageService } from '@/services/storageService';
import { AppSettings, View, Plant, Strain, GrowSetup, JournalEntry, Task, Notification, NotificationType, ArchivedMentorResponse, AIResponse, SavedExport, SavedSetup, SavedStrainTip, ArchivedAdvisorResponse, PlantStage, PlantProblem, PlantProblemType, KnowledgeProgress } from '@/types';
import { PLANT_STAGE_DETAILS, STAGES_ORDER, PROBLEM_THRESHOLDS, YIELD_FACTORS, SIMULATION_CONSTANTS } from '@/constants';

// A utility to set nested state immutably without Immer
const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    const newObj = { ...obj };
    let current = newObj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        current[key] = { ...current[key] };
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
    return newObj;
};

// --- STATE & ACTION INTERFACES ---

type TFunction = (key: string, params?: Record<string, any>) => string;

interface AppStore {
    // --- STATE ---
    settings: AppSettings;
    plants: (Plant | null)[];
    userStrains: Strain[];
    favoriteIds: Set<string>;
    strainNotes: Record<string, string>;
    savedExports: SavedExport[];
    savedSetups: SavedSetup[];
    archivedMentorResponses: ArchivedMentorResponse[];
    archivedAdvisorResponses: Record<string, ArchivedAdvisorResponse[]>;
    savedStrainTips: SavedStrainTip[];
    knowledgeProgress: KnowledgeProgress;
    activeView: View;
    isCommandPaletteOpen: boolean;
    notifications: Notification[];
    selectedStrain: Strain | null;
    strainToEdit: Strain | null;
    strainForSetup: Strain | null;
    isAddModalOpen: boolean;
    isExportModalOpen: boolean;
    isSetupModalOpen: boolean;
    selectedPlantId: string | null;

    // --- ACTIONS ---
    init: (t: TFunction) => void;
    setSetting: (path: string, value: any) => void;
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
    isUserStrain: (strainId: string) => boolean;
    toggleFavorite: (strainId: string) => void;
    updateNoteForStrain: (strainId: string, content: string) => void;
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
    setActiveView: (view: View) => void;
    setIsCommandPaletteOpen: (isOpen: boolean) => void;
    addNotification: (message: string, type?: NotificationType) => void;
    removeNotification: (id: number) => void;
    selectStrain: (strain: Strain) => void;
    closeDetailModal: () => void;
    openAddModal: (strain?: Strain) => void;
    closeAddModal: () => void;
    openExportModal: () => void;
    closeExportModal: () => void;
    initiateGrow: (strain: Strain) => void;
    closeGrowModal: () => void;
    setSelectedPlantId: (plantId: string | null) => void;
}

// --- INITIAL STATE ---

const detectedLang = navigator.language.split('-')[0];
const initialLang: 'en' | 'de' = detectedLang === 'de' ? 'de' : 'en';

const defaultSettings: AppSettings = {
  fontSize: 'base', language: initialLang, theme: 'midnight', defaultView: View.Plants,
  strainsViewSettings: { defaultSortKey: 'name', defaultSortDirection: 'asc', defaultViewMode: 'list', visibleColumns: { type: true, thc: true, cbd: true, floweringTime: true, yield: true, difficulty: true }},
  notificationsEnabled: true, notificationSettings: { stageChange: true, problemDetected: true, harvestReady: true, newTask: true }, onboardingCompleted: false,
  simulationSettings: { speed: '1x', difficulty: 'normal', autoAdvance: true, autoJournaling: { stageChanges: true, problems: true, tasks: true }, customDifficultyModifiers: { pestPressure: 1.0, nutrientSensitivity: 1.0, environmentalStability: 1.0 }},
  defaultGrowSetup: { lightType: 'LED', potSize: 10, medium: 'Soil', temperature: 24, humidity: 60, lightHours: 18 },
  defaultJournalNotes: { watering: 'plantsView.actionModals.defaultNotes.watering', feeding: 'plantsView.actionModals.defaultNotes.feeding' },
  defaultExportSettings: { source: 'filtered', format: 'pdf' }, lastBackupTimestamp: undefined,
  accessibility: { reducedMotion: false, dyslexiaFont: false }, uiDensity: 'comfortable',
  quietHours: { enabled: false, start: '22:00', end: '08:00' },
};

const mergeSettings = (defaults: any, saved: any): any => {
    const merged = { ...defaults };
    for (const key in saved) {
        if (Object.prototype.hasOwnProperty.call(saved, key)) {
            if (typeof saved[key] === 'object' && saved[key] !== null && !Array.isArray(saved[key]) && typeof defaults[key] === 'object' && defaults[key] !== null) {
                merged[key] = mergeSettings(defaults[key], saved[key]);
            } else if(saved[key] !== undefined) {
                merged[key] = saved[key];
            }
        }
    }
    return merged;
};

// --- STORE CREATION ---

// This variable will hold the translation function, injected via init()
let t: TFunction = (key: string) => key;

export const useAppStore = create<AppStore>((set, get) => {

    const addNotification: AppStore['addNotification'] = (message, type = 'info') => {
        if (!get().settings.notificationsEnabled) return;
        const newNotification: Notification = { id: Date.now(), message, type };
        set(state => ({ notifications: [...state.notifications, newNotification] }));
    };

    const addJournalEntry: AppStore['addJournalEntry'] = (plantId, entryData) => {
        set(state => {
            const newPlants = state.plants.map(p => {
                if (p && p.id === plantId) {
                    const newEntry: JournalEntry = {
                        ...entryData,
                        id: `${entryData.type}-${Date.now()}`,
                        timestamp: Date.now(),
                    };
                    return { ...p, journal: [...p.journal, newEntry] };
                }
                return p;
            });
            storageService.setItem('plants', newPlants);
            return { plants: newPlants };
        });
    };

    const calculateYield = (plant: Plant): number => {
        const baseYield = YIELD_FACTORS.base[plant.strain.agronomic.yield] || YIELD_FACTORS.base.Medium;
        const floweringStartDay = STAGES_ORDER.slice(0, STAGES_ORDER.indexOf(PlantStage.Flowering)).reduce((acc, stage) => acc + PLANT_STAGE_DETAILS[stage].duration, 0);
        
        const flowerHistory = plant.history.filter(h => h.day >= floweringStartDay);
        const avgFlowerStress = flowerHistory.length > 0 ? flowerHistory.reduce((acc, cur) => acc + cur.stressLevel, 0) / flowerHistory.length : 0;
        
        const stressPenalty = (avgFlowerStress / 100) * YIELD_FACTORS.stressModifier;
        const heightBonus = (plant.height / 100) * YIELD_FACTORS.heightModifier;
        
        const setup = plant.growSetup;
        const lightMod = YIELD_FACTORS.setupModifier.light[setup.lightType];
        const potMod = YIELD_FACTORS.setupModifier.potSize[setup.potSize];
        const mediumMod = YIELD_FACTORS.setupModifier.medium[setup.medium];
        const setupMultiplier = lightMod * potMod * mediumMod;
        
        const finalYield = baseYield * (1 + stressPenalty + heightBonus) * setupMultiplier;
        return parseFloat(Math.max(5, finalYield).toFixed(1));
    };

    const _simulateDay = (plant: Plant): Plant => {
        let newPlant = { ...plant };
        let newProblems: PlantProblem[] = [...newPlant.problems];
        let newTasks = [...newPlant.tasks];
        let dailyStress = 0;

        const stageDetails = PLANT_STAGE_DETAILS[newPlant.stage];
        const settings = get().settings.simulationSettings;

        // 1. Age & Stage Progression
        newPlant.age += 1;
        if (newPlant.age > stageDetails.duration && stageDetails.next) {
            newPlant.stage = stageDetails.next;
            if (settings.autoJournaling.stageChanges) {
                addJournalEntry(newPlant.id, { type: 'SYSTEM', notes: t('plantsView.notifications.stageChange', { stage: t(`plantStages.${newPlant.stage}`) }) });
            }
            if (newPlant.stage === PlantStage.Harvest) {
                 addNotification(t('plantsView.notifications.harvestReady', { name: newPlant.name }), 'success');
            }
             if (newPlant.stage === PlantStage.Finished) {
                const finalYield = calculateYield(newPlant);
                newPlant.yield = finalYield;
                addJournalEntry(newPlant.id, { type: 'SYSTEM', notes: t('plantsView.notifications.finalYield', { yield: finalYield }) });
            }
        }
        
        // 2. Vitals Update
        let { substrateMoisture, ph, ec } = newPlant.vitals;
        substrateMoisture = Math.max(0, substrateMoisture - stageDetails.waterConsumption);
        ec = Math.max(0, ec - stageDetails.nutrientConsumption);
        const phDrift = (SIMULATION_CONSTANTS.PH_DRIFT_TARGET - ph) * SIMULATION_CONSTANTS.PH_DRIFT_FACTOR;
        ph += phDrift;

        // 3. Stress Calculation
        const idealEnv = stageDetails.idealEnv;
        const idealVitals = stageDetails.idealVitals;
        
        if (substrateMoisture < PROBLEM_THRESHOLDS.moisture.under) dailyStress += (PROBLEM_THRESHOLDS.moisture.under - substrateMoisture) * SIMULATION_CONSTANTS.STRESS_FACTORS.UNDERWATERING;
        if (substrateMoisture > PROBLEM_THRESHOLDS.moisture.over) dailyStress += (substrateMoisture - PROBLEM_THRESHOLDS.moisture.over) * SIMULATION_CONSTANTS.STRESS_FACTORS.OVERWATERING;
        if (newPlant.environment.temperature > idealEnv.temp.max) dailyStress += (newPlant.environment.temperature - idealEnv.temp.max) * SIMULATION_CONSTANTS.STRESS_FACTORS.TEMP_HIGH;
        if (newPlant.environment.temperature < idealEnv.temp.min) dailyStress += (idealEnv.temp.min - newPlant.environment.temperature) * SIMULATION_CONSTANTS.STRESS_FACTORS.TEMP_LOW;
        if (ph < idealVitals.ph.min) dailyStress += (idealVitals.ph.min - ph) * 10 * SIMULATION_CONSTANTS.STRESS_FACTORS.PH_OFF;
        if (ph > idealVitals.ph.max) dailyStress += (ph - idealVitals.ph.max) * 10 * SIMULATION_CONSTANTS.STRESS_FACTORS.PH_OFF;
        if (ec > idealVitals.ec.max) dailyStress += (ec - idealVitals.ec.max) * 10 * SIMULATION_CONSTANTS.STRESS_FACTORS.EC_HIGH;

        newPlant.stressLevel = Math.min(100, Math.max(0, (newPlant.stressLevel * 0.95) + (dailyStress * 0.05)));

        // 4. Growth
        const stressPenalty = 1 - (newPlant.stressLevel / SIMULATION_CONSTANTS.STRESS_GROWTH_PENALTY_DIVISOR);
        newPlant.height += Math.max(0, stageDetails.growthRate * stressPenalty);

        // 5. Problem Detection
        const checkAndAddProblem = (type: PlantProblemType) => {
            if (!newProblems.some(p => p.type === type)) {
                newProblems.push({ type, detectedAt: Date.now() });
                if(settings.autoJournaling.problems) addJournalEntry(newPlant.id, { type: 'SYSTEM', notes: t('plantsView.journal.problemDetected', { message: t(`problemMessages.${type.charAt(0).toLowerCase() + type.slice(1)}.message`) }) });
            }
        };
        const removeProblem = (type: PlantProblemType) => { newProblems = newProblems.filter(p => p.type !== type); };

        if (substrateMoisture < PROBLEM_THRESHOLDS.moisture.under) checkAndAddProblem('Underwatering'); else removeProblem('Underwatering');
        if (ec > stageDetails.idealVitals.ec.max) checkAndAddProblem('NutrientBurn'); else removeProblem('NutrientBurn');
        
        // 6. Task Generation
        if (substrateMoisture < SIMULATION_CONSTANTS.WATERING_TASK_THRESHOLD && !newTasks.some(t => t.title === 'plantsView.tasks.wateringTask.title' && !t.isCompleted)) {
            const newTask: Task = { id: `task-water-${Date.now()}`, title: 'plantsView.tasks.wateringTask.title', description: 'plantsView.tasks.wateringTask.description', priority: 'high', isCompleted: false, createdAt: Date.now()};
            newTasks.push(newTask);
            if(settings.autoJournaling.tasks) addJournalEntry(newPlant.id, { type: 'SYSTEM', notes: t('plantsView.journal.newTask', { title: t(newTask.title) }) });
        }
        
        newPlant.vitals = { substrateMoisture, ph, ec };
        newPlant.problems = newProblems;
        newPlant.tasks = newTasks;
        newPlant.history.push({ day: newPlant.age, vitals: newPlant.vitals, stressLevel: newPlant.stressLevel, height: newPlant.height });

        return newPlant;
    };

    return {
        // --- INJECT DEPS ---
        init: (newT) => { t = newT; },

        // --- SETTINGS ---
        settings: mergeSettings(defaultSettings, storageService.getItem('settings', {})),
        setSetting: (path, value) => {
            set(state => {
                const newSettings = setNestedValue(state.settings, path, value);
                storageService.setItem('settings', newSettings);
                return { settings: newSettings };
            });
        },

        // --- PLANTS ---
        plants: storageService.getItem('plants', [null, null, null]),
        startNewPlant: (strain, setup, slotIndex) => {
            const plants = get().plants;
            const emptySlotIndex = slotIndex !== undefined && plants[slotIndex] === null ? slotIndex : plants.findIndex(p => p === null);

            if (emptySlotIndex === -1) {
                addNotification(t('plantsView.notifications.allSlotsFull'), 'error');
                return false;
            }
            const now = Date.now();
            const newPlant: Plant = {
                id: `${strain.id.replace(/ /g, '-')}-${now}`, name: strain.name, strain, stage: PlantStage.Seed, age: 0, height: 0, startedAt: now, lastUpdated: now,
                growSetup: setup, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 }, environment: { temperature: setup.temperature, humidity: setup.humidity, light: 100 },
                stressLevel: 0, problems: [], journal: [], tasks: [], history: [{ day: 0, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 }, stressLevel: 0, height: 0 }],
            };
            addJournalEntry(newPlant.id, { type: 'SYSTEM', notes: t('plantsView.journal.startGrowing', { name: newPlant.name }) });
            
            const newPlants = [...plants];
            newPlants[emptySlotIndex] = newPlant;
            set({ plants: newPlants });
            storageService.setItem('plants', newPlants);
            addNotification(t('plantsView.notifications.startSuccess', { name: newPlant.name }), 'success');
            return true;
        },
        updatePlantState: () => {
             // This logic would be for background updates if we were using a real-time clock. 
             // Since we use manual day advancement for simplicity, we keep this empty.
             // For a more advanced simulation, we would calculate time diff since last update and run _simulateDay in a loop.
        },
        addJournalEntry,
        completeTask: (plantId, taskId) => {
            set(state => {
                const newPlants = state.plants.map(p => {
                    if (p && p.id === plantId) {
                        return { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, isCompleted: true, completedAt: Date.now() } : t) };
                    }
                    return p;
                });
                storageService.setItem('plants', newPlants);
                return { plants: newPlants };
            });
        },
        waterAllPlants: () => {
            let wateredCount = 0;
            const newPlants = get().plants.map(p => {
                if (p && p.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATER_ALL_THRESHOLD) {
                    wateredCount++;
                    addJournalEntry(p.id, { type: 'WATERING', notes: t('plantsView.actionModals.defaultNotes.watering'), details: { waterAmount: 500, ph: 6.5 }});
                    return { ...p, vitals: { ...p.vitals, substrateMoisture: 100 } };
                }
                return p;
            });
            if (wateredCount > 0) {
                set({ plants: newPlants });
                storageService.setItem('plants', newPlants);
                addNotification(t('plantsView.notifications.waterAllSuccess', { count: wateredCount }), 'success');
            } else {
                addNotification(t('plantsView.notifications.waterAllNone'), 'info');
            }
        },
        advanceDay: () => {
            set(state => {
                const newPlants = state.plants.map(p => p ? _simulateDay(p) : null);
                storageService.setItem('plants', newPlants);
                return { plants: newPlants };
            });
        },
        resetPlants: () => {
            set({ plants: [null, null, null] });
            storageService.removeItem('plants');
        },

        // --- USER DATA ---
        userStrains: storageService.getItem('user_added_strains', []),
        addUserStrain: (strain) => set(state => {
            if (state.userStrains.some(s => s.name.toLowerCase() === strain.name.toLowerCase())) {
                addNotification(t('strainsView.addStrainModal.validation.duplicate', { name: strain.name }), 'error');
                return state;
            }
            const updatedStrains = [...state.userStrains, strain].sort((a, b) => a.name.localeCompare(b.name));
            storageService.setItem('user_added_strains', updatedStrains);
            addNotification(t('strainsView.addStrainModal.validation.addSuccess', { name: strain.name }), 'success');
            return { userStrains: updatedStrains };
        }),
        updateUserStrain: (updatedStrain) => set(state => {
            const updatedStrains = state.userStrains.map(s => s.id === updatedStrain.id ? updatedStrain : s).sort((a,b) => a.name.localeCompare(b.name));
            storageService.setItem('user_added_strains', updatedStrains);
            addNotification(t('strainsView.addStrainModal.validation.updateSuccess', { name: updatedStrain.name }), 'success');
            return { userStrains: updatedStrains };
        }),
        deleteUserStrain: (strainId) => {
            const strainToDelete = get().userStrains.find(s => s.id === strainId);
            if (strainToDelete && window.confirm(t('strainsView.addStrainModal.validation.deleteConfirm', { name: strainToDelete.name }))) {
                set(state => {
                    const updatedStrains = state.userStrains.filter(s => s.id !== strainId);
                    storageService.setItem('user_added_strains', updatedStrains);
                    addNotification(t('strainsView.addStrainModal.validation.deleteSuccess', { name: strainToDelete.name }), 'info');
                    return { userStrains: updatedStrains };
                });
            }
        },
        isUserStrain: (strainId) => get().userStrains.some(s => s.id === strainId),
        favoriteIds: new Set(storageService.getItem('favorites', [])),
        toggleFavorite: (strainId) => set(state => {
            const newSet = new Set(state.favoriteIds);
            newSet.has(strainId) ? newSet.delete(strainId) : newSet.add(strainId);
            storageService.setItem('favorites', Array.from(newSet));
            return { favoriteIds: newSet };
        }),
        strainNotes: storageService.getItem('strain_notes', {}),
        updateNoteForStrain: (strainId, content) => set(state => {
            const newNotes = { ...state.strainNotes, [strainId]: content };
            storageService.setItem('strain_notes', newNotes);
            return { strainNotes: newNotes };
        }),

        // --- ARCHIVES ---
        savedExports: storageService.getItem('exports', []),
        addExport: (newExport, strainIds) => {
            const exportToAdd = { ...newExport, id: Date.now().toString(), createdAt: Date.now(), count: strainIds.length, strainIds };
            set(state => {
                const updatedExports = [exportToAdd, ...state.savedExports].slice(0, 50);
                storageService.setItem('exports', updatedExports);
                return { savedExports: updatedExports };
            });
            return exportToAdd;
        },
        updateExport: (updatedExport) => set(state => {
            const updatedExports = state.savedExports.map(exp => exp.id === updatedExport.id ? updatedExport : exp);
            storageService.setItem('exports', updatedExports);
            return { savedExports: updatedExports };
        }),
        deleteExport: (exportId) => set(state => {
             const updatedExports = state.savedExports.filter(exp => exp.id !== exportId);
             storageService.setItem('exports', updatedExports);
             return { savedExports: updatedExports };
        }),
        savedSetups: storageService.getItem('setups', []),
        addSetup: (setup) => set(state => {
            const newSetup = { ...setup, id: Date.now().toString(), createdAt: Date.now() };
            const updatedSetups = [newSetup, ...state.savedSetups];
            storageService.setItem('setups', updatedSetups);
            return { savedSetups: updatedSetups };
        }),
        updateSetup: (updatedSetup) => set(state => {
            const updatedSetups = state.savedSetups.map(s => s.id === updatedSetup.id ? updatedSetup : s);
            storageService.setItem('setups', updatedSetups);
            return { savedSetups: updatedSetups };
        }),
        deleteSetup: (setupId) => set(state => {
            const updatedSetups = state.savedSetups.filter(s => s.id !== setupId);
            storageService.setItem('setups', updatedSetups);
            return { savedSetups: updatedSetups };
        }),
        archivedMentorResponses: storageService.getItem('knowledge-archive', []),
        addArchivedMentorResponse: (response) => set(state => {
            const newResponse = { ...response, id: Date.now().toString(), createdAt: Date.now() };
            const updatedResponses = [newResponse, ...state.archivedMentorResponses];
            storageService.setItem('knowledge-archive', updatedResponses);
            return { archivedMentorResponses: updatedResponses };
        }),
        updateArchivedMentorResponse: (updatedResponse) => set(state => {
            const updatedResponses = state.archivedMentorResponses.map(r => r.id === updatedResponse.id ? updatedResponse : r);
            storageService.setItem('knowledge-archive', updatedResponses);
            return { archivedMentorResponses: updatedResponses };
        }),
        deleteArchivedMentorResponse: (responseId) => set(state => {
            const updatedResponses = state.archivedMentorResponses.filter(r => r.id !== responseId);
            storageService.setItem('knowledge-archive', updatedResponses);
            return { archivedMentorResponses: updatedResponses };
        }),
        archivedAdvisorResponses: storageService.getItem('plant-advisor-archive', {}),
        addArchivedAdvisorResponse: (plantId, response, query) => set(state => {
            const plantArchive = state.archivedAdvisorResponses[plantId] || [];
            const plant = get().plants.find(p => p?.id === plantId);
            if (!plant) return state;
            const newResponse: ArchivedAdvisorResponse = { ...response, id: Date.now().toString(), createdAt: Date.now(), plantId, plantStage: plant.stage, query };
            const newArchive = { ...state.archivedAdvisorResponses, [plantId]: [newResponse, ...plantArchive] };
            storageService.setItem('plant-advisor-archive', newArchive);
            return { archivedAdvisorResponses: newArchive };
        }),
        updateArchivedAdvisorResponse: (updatedResponse) => set(state => {
            const { plantId } = updatedResponse;
            const plantArchive = state.archivedAdvisorResponses[plantId] || [];
            const updatedArchive = plantArchive.map(r => r.id === updatedResponse.id ? updatedResponse : r);
            const newArchive = { ...state.archivedAdvisorResponses, [plantId]: updatedArchive };
            storageService.setItem('plant-advisor-archive', newArchive);
            return { archivedAdvisorResponses: newArchive };
        }),
        deleteArchivedAdvisorResponse: (plantId, responseId) => set(state => {
            const plantArchive = state.archivedAdvisorResponses[plantId] || [];
            const updatedArchive = plantArchive.filter(r => r.id !== responseId);
            const newArchive = { ...state.archivedAdvisorResponses, [plantId]: updatedArchive };
            storageService.setItem('plant-advisor-archive', newArchive);
            return { archivedAdvisorResponses: newArchive };
        }),
        savedStrainTips: storageService.getItem('strain_tips', []),
        addStrainTip: (strain, tip) => set(state => {
            const newTip = { ...tip, id: Date.now().toString(), createdAt: Date.now(), strainId: strain.id, strainName: strain.name };
            const updatedTips = [newTip, ...state.savedStrainTips];
            storageService.setItem('strain_tips', updatedTips);
            return { savedStrainTips: updatedTips };
        }),
        updateStrainTip: (updatedTip) => set(state => {
            const updatedTips = state.savedStrainTips.map(t => t.id === updatedTip.id ? updatedTip : t);
            storageService.setItem('strain_tips', updatedTips);
            return { savedStrainTips: updatedTips };
        }),
        deleteStrainTip: (tipId) => set(state => {
            const updatedTips = state.savedStrainTips.filter(t => t.id !== tipId);
            storageService.setItem('strain_tips', updatedTips);
            return { savedStrainTips: updatedTips };
        }),
        
        // --- KNOWLEDGE ---
        knowledgeProgress: storageService.getItem('knowledge-progress', {}),
        toggleKnowledgeProgressItem: (sectionId, itemId) => set(state => {
            const newProgress = { ...state.knowledgeProgress };
            const sectionProgress = newProgress[sectionId] ? [...newProgress[sectionId]] : [];
            const itemIndex = sectionProgress.indexOf(itemId);
            if (itemIndex > -1) sectionProgress.splice(itemIndex, 1);
            else sectionProgress.push(itemId);
            newProgress[sectionId] = sectionProgress;
            storageService.setItem('knowledge-progress', newProgress);
            return { knowledgeProgress: newProgress };
        }),
        
        // --- UI ---
        activeView: storageService.getItem('settings', defaultSettings).defaultView,
        setActiveView: (view) => set({ activeView: view }),

        isCommandPaletteOpen: false,
        setIsCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),

        notifications: [],
        addNotification,
        removeNotification: (id) => set(state => ({ notifications: state.notifications.filter(n => n.id !== id) })),

        selectedStrain: null,
        strainToEdit: null,
        strainForSetup: null,
        isAddModalOpen: false,
        isExportModalOpen: false,
        isSetupModalOpen: false,
        selectStrain: (strain) => set({ selectedStrain: strain }),
        closeDetailModal: () => set({ selectedStrain: null }),
        openAddModal: (strain) => set({ strainToEdit: strain || null, isAddModalOpen: true }),
        closeAddModal: () => set({ isAddModalOpen: false, strainToEdit: null }),
        openExportModal: () => set({ isExportModalOpen: true }),
        closeExportModal: () => set({ isExportModalOpen: false }),
        initiateGrow: (strain) => {
             if (get().plants.some(p => p === null)) {
                set({ strainForSetup: strain, isSetupModalOpen: true });
            } else {
                addNotification(t('plantsView.notifications.allSlotsFull'), 'error');
            }
        },
        closeGrowModal: () => set({ isSetupModalOpen: false, strainForSetup: null }),
        selectedPlantId: null,
        setSelectedPlantId: (plantId) => set({ selectedPlantId: plantId }),
    };
});