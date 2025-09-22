import { create } from 'zustand';
import { storageService } from '@/services/storageService';
import { AppSettings, View, Plant, Strain, GrowSetup, JournalEntry, Task, Notification, NotificationType, ArchivedMentorResponse, AIResponse, SavedExport, SavedSetup, SavedStrainTip, ArchivedAdvisorResponse, PlantStage, PlantProblem, PlantProblemType } from '@/types';
import { PLANT_STAGE_DETAILS, STAGES_ORDER, PROBLEM_THRESHOLDS, YIELD_FACTORS, SIMULATION_CONSTANTS } from '@/constants';
import { TFunction } from 'i18next'; // Placeholder for translation function type

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

interface SettingsSlice {
    settings: AppSettings;
    setSetting: (path: string, value: any) => void;
}

interface PlantSlice {
    plants: (Plant | null)[];
    startNewPlant: (strain: Strain, setup: GrowSetup) => boolean;
    updatePlantState: (plantIdToUpdate?: string) => void;
    addJournalEntry: (plantId: string, entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
    completeTask: (plantId: string, taskId: string) => void;
    waterAllPlants: () => void;
    advanceDay: () => void;
    resetPlants: () => void;
}

interface UserDataSlice {
    userStrains: Strain[];
    addUserStrain: (strain: Strain) => void;
    updateUserStrain: (strain: Strain) => void;
    deleteUserStrain: (strainId: string) => void;
    isUserStrain: (strainId: string) => boolean;

    favoriteIds: Set<string>;
    toggleFavorite: (strainId: string) => void;

    strainNotes: Record<string, string>;
    updateNoteForStrain: (strainId: string, content: string) => void;
}

interface ArchiveSlice {
    savedExports: SavedExport[];
    addExport: (newExport: Omit<SavedExport, 'id' | 'createdAt' | 'count' | 'strainIds'>, strainIds: string[]) => SavedExport;
    updateExport: (updatedExport: SavedExport) => void;
    deleteExport: (exportId: string) => void;

    savedSetups: SavedSetup[];
    addSetup: (setup: Omit<SavedSetup, 'id' | 'createdAt'>) => void;
    updateSetup: (updatedSetup: SavedSetup) => void;
    deleteSetup: (setupId: string) => void;

    archivedMentorResponses: ArchivedMentorResponse[];
    addArchivedMentorResponse: (response: Omit<ArchivedMentorResponse, 'id' | 'createdAt'>) => void;
    updateArchivedMentorResponse: (updatedResponse: ArchivedMentorResponse) => void;
    deleteArchivedMentorResponse: (responseId: string) => void;

    archivedAdvisorResponses: Record<string, ArchivedAdvisorResponse[]>;
    addArchivedAdvisorResponse: (plantId: string, response: AIResponse, query: string) => void;
    updateArchivedAdvisorResponse: (updatedResponse: ArchivedAdvisorResponse) => void;
    deleteArchivedAdvisorResponse: (plantId: string, responseId: string) => void;
    
    savedStrainTips: SavedStrainTip[];
    addStrainTip: (strain: Strain, tip: AIResponse) => void;
    updateStrainTip: (updatedTip: SavedStrainTip) => void;
    deleteStrainTip: (tipId: string) => void;
}

interface UiSlice {
    activeView: View;
    setActiveView: (view: View) => void;

    isCommandPaletteOpen: boolean;
    setIsCommandPaletteOpen: (isOpen: boolean) => void;
    
    notifications: Notification[];
    addNotification: (message: string, type?: NotificationType) => void;
    removeNotification: (id: number) => void;

    // Strain View UI State
    selectedStrain: Strain | null;
    strainToEdit: Strain | null;
    strainForSetup: Strain | null;
    isAddModalOpen: boolean;
    isExportModalOpen: boolean;
    isSetupModalOpen: boolean;
    selectStrain: (strain: Strain) => void;
    closeDetailModal: () => void;
    openAddModal: (strain?: Strain) => void;
    closeAddModal: () => void;
    openExportModal: () => void;
    closeExportModal: () => void;
    initiateGrow: (strain: Strain) => void;
    closeGrowModal: () => void;
    
    // Plant View UI State
    selectedPlantId: string | null;
    setSelectedPlantId: (plantId: string | null) => void;
}

type AppState = SettingsSlice & PlantSlice & UserDataSlice & ArchiveSlice & UiSlice;

// --- INITIAL STATE ---

const detectedLang = navigator.language.split('-')[0];
const initialLang: 'en' | 'de' = detectedLang === 'de' ? 'de' : 'en';

const defaultSettings: AppSettings = {
  fontSize: 'base', language: initialLang, theme: 'midnight', defaultView: View.Plants,
  strainsViewSettings: { defaultSortKey: 'name', defaultSortDirection: 'asc', defaultViewMode: 'list', visibleColumns: { type: true, thc: true, cbd: true, floweringTime: true, yield: true, difficulty: true }},
  notificationsEnabled: true, notificationSettings: { stageChange: true, problemDetected: true, harvestReady: true, newTask: true }, onboardingCompleted: false,
  simulationSettings: { speed: '1x', difficulty: 'normal', autoAdvance: false, autoJournaling: { stageChanges: true, problems: true, tasks: true }, customDifficultyModifiers: { pestPressure: 1.0, nutrientSensitivity: 1.0, environmentalStability: 1.0 }},
  defaultGrowSetup: { lightType: 'LED', potSize: 10, medium: 'Soil', temperature: 24, humidity: 60, lightHours: 18 },
  defaultJournalNotes: { watering: 'plantsView.actionModals.defaultNotes.watering', feeding: 'plantsView.actionModals.defaultNotes.feeding' },
  defaultExportSettings: { source: 'filtered', format: 'pdf' }, lastBackupTimestamp: undefined,
  accessibility: { highContrast: true, reducedMotion: false, dyslexiaFont: false }, uiDensity: 'comfortable',
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

export const useAppStore = create<AppState>((set, get) => {

    const addNotification: UiSlice['addNotification'] = (message, type = 'info') => {
        if (!get().settings.notificationsEnabled) return;
        const newNotification: Notification = { id: Date.now(), message, type };
        set(state => ({ notifications: [...state.notifications, newNotification] }));
    };

    // Helper to get translation function (will be provided externally)
    let t: TFunction = (key: string) => key;
    const setT = (newT: TFunction) => { t = newT; };

    const getProblemDetails = (type: PlantProblemType) => ({
        message: t(`problemMessages.${type.charAt(0).toLowerCase() + type.slice(1)}.message`),
        solution: t(`problemMessages.${type.charAt(0).toLowerCase() + type.slice(1)}.solution`)
    });

    const calculateYield = (plant: Plant): number => {
        const baseYield = YIELD_FACTORS.base[plant.strain.agronomic.yield] || YIELD_FACTORS.base.Medium;
        const floweringStartDay = STAGES_ORDER.slice(0, STAGES_ORDER.indexOf(PlantStage.Flowering)).reduce((acc, stage) => acc + PLANT_STAGE_DETAILS[stage].duration, 0);
        const vegHistory = plant.history.filter(h => h.day < floweringStartDay);
        const flowerHistory = plant.history.filter(h => h.day >= floweringStartDay);
        const avgVegStress = vegHistory.length > 0 ? vegHistory.reduce((acc, cur) => acc + cur.stressLevel, 0) / vegHistory.length : 0;
        const avgFlowerStress = flowerHistory.length > 0 ? flowerHistory.reduce((acc, cur) => acc + cur.stressLevel, 0) / flowerHistory.length : 0;
        const weightedAvgStress = (avgVegStress * 0.3) + (avgFlowerStress * 0.7);
        const avgStress = weightedAvgStress > 0 ? weightedAvgStress : (plant.history.reduce((acc, cur) => acc + cur.stressLevel, 0) / plant.history.length || 0);
        const stressPenalty = (avgStress / 100) * YIELD_FACTORS.stressModifier;
        const heightBonus = (plant.height / 100) * YIELD_FACTORS.heightModifier;
        const setup = plant.growSetup;
        const lightMod = YIELD_FACTORS.setupModifier.light[setup.lightType];
        const potMod = YIELD_FACTORS.setupModifier.potSize[setup.potSize];
        const mediumMod = YIELD_FACTORS.setupModifier.medium[setup.medium];
        const setupMultiplier = lightMod * potMod * mediumMod;
        const finalYield = baseYield * (1 + stressPenalty + heightBonus) * setupMultiplier;
        return Math.max(5, finalYield);
    };

    const simulatePlant = (plant: Plant, targetTimestamp: number): Plant => {
        // ... (The entire complex simulation logic from usePlantManager)
        return plant; // This is a placeholder for the large simulation logic. The full logic will be pasted here.
    };

    return {
        // --- SETTINGS SLICE ---
        settings: mergeSettings(defaultSettings, storageService.getItem('settings', {})),
        setSetting: (path, value) => {
            set(state => ({ settings: setNestedValue(state.settings, path, value) }));
            storageService.setItem('settings', get().settings);
        },

        // --- PLANT SLICE ---
        plants: storageService.getItem('plants', [null, null, null]),
        startNewPlant: (strain, setup) => {
            const plants = get().plants;
            const emptySlotIndex = plants.findIndex(p => p === null);
            if (emptySlotIndex === -1) {
                addNotification(t('plantsView.notifications.allSlotsFull'), 'error');
                return false;
            }
            const now = Date.now();
            const newPlant: Plant = {
                id: `${strain.id}-${now}`, name: strain.name, strain, stage: PlantStage.Seed, age: 0, height: 0, startedAt: now, lastUpdated: now,
                growSetup: setup, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 }, environment: { temperature: setup.temperature, humidity: setup.humidity, light: 100 },
                stressLevel: 0, problems: [], journal: [{ id: `start-${now}`, timestamp: now, type: 'SYSTEM', notes: t('plantsView.journal.startGrowing', { name: strain.name }) }],
                tasks: [], history: [{ day: 0, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 }, stressLevel: 0, height: 0 }],
            };
            const newPlants = [...plants];
            newPlants[emptySlotIndex] = newPlant;
            set({ plants: newPlants });
            storageService.setItem('plants', newPlants);
            addNotification(t('plantsView.notifications.startSuccess', { name: newPlant.name }), 'success');
            return true;
        },
        updatePlantState: () => {}, // Placeholder for the complex logic
        addJournalEntry: () => {}, // Placeholder
        completeTask: () => {}, // Placeholder
        waterAllPlants: () => {}, // Placeholder
        advanceDay: () => {}, // Placeholder
        resetPlants: () => {
            set({ plants: [null, null, null] });
            storageService.removeItem('plants');
        },

        // --- USER DATA SLICE ---
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
        deleteUserStrain: (strainId) => set(state => {
            const strainToDelete = state.userStrains.find(s => s.id === strainId);
            if (strainToDelete && window.confirm(t('strainsView.addStrainModal.validation.deleteConfirm', { name: strainToDelete.name }))) {
                const updatedStrains = state.userStrains.filter(s => s.id !== strainId);
                storageService.setItem('user_added_strains', updatedStrains);
                addNotification(t('strainsView.addStrainModal.validation.deleteSuccess', { name: strainToDelete.name }), 'info');
                return { userStrains: updatedStrains };
            }
            return state;
        }),
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

        // --- ARCHIVE SLICE --- (Simplified for brevity)
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
        
        // ... (other archive slices would follow the same pattern)
        savedSetups: [], addSetup: () => {}, updateSetup: () => {}, deleteSetup: () => {},
        archivedMentorResponses: [], addArchivedMentorResponse: () => {}, updateArchivedMentorResponse: () => {}, deleteArchivedMentorResponse: () => {},
        archivedAdvisorResponses: {}, addArchivedAdvisorResponse: () => {}, updateArchivedAdvisorResponse: () => {}, deleteArchivedAdvisorResponse: () => {},
        savedStrainTips: [], addStrainTip: () => {}, updateStrainTip: () => {}, deleteStrainTip: () => {},


        // --- UI SLICE ---
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
