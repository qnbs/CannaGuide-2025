import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppSettings, View, Plant, Strain, GrowSetup, JournalEntry, Task, Notification, NotificationType, ArchivedMentorResponse, AIResponse, SavedExport, SavedSetup, SavedStrainTip, ArchivedAdvisorResponse, PlantStage, PlantProblem, PlantProblemType, KnowledgeProgress } from '@/types';
import { PLANT_STAGE_DETAILS, STAGES_ORDER, PROBLEM_THRESHOLDS, YIELD_FACTORS, SIMULATION_CONSTANTS } from '@/constants';
import { storageService } from '@/services/storageService';

// --- TFunction Holder ---
// This is a pragmatic solution to allow store actions (which are defined outside of React components)
// to access the translation function `t` after it's initialized in the main App component.
let t: TFunction = (key: string) => key;

// --- INITIAL STATE & DEFAULTS ---
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

// --- SLICE DEFINITIONS ---
type TFunction = (key: string, params?: Record<string, any>) => string;

// A utility to set nested state immutably
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

type AppState = SettingsSlice & DataSlice & UserSlice & UISlice & AppSlice;
type StoreSet = (partial: AppState | Partial<AppState> | ((state: AppState) => AppState | Partial<AppState>), replace?: boolean | undefined) => void;
type StoreGet = () => AppState;

interface AppSlice {
    init: (t: TFunction) => void;
}

interface SettingsSlice {
    settings: AppSettings;
    setSetting: (path: string, value: any) => void;
}

interface DataSlice {
    plants: (Plant | null)[];
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

interface UserSlice {
    favoriteIds: Set<string>;
    strainNotes: Record<string, string>;
    isUserStrain: (strainId: string) => boolean;
    toggleFavorite: (strainId: string) => void;
    updateNoteForStrain: (strainId: string, content: string) => void;
}

interface UISlice {
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

// --- SLICE IMPLEMENTATIONS ---

const createSettingsSlice = (set: StoreSet): SettingsSlice => ({
    settings: defaultSettings,
    setSetting: (path, value) => set(state => ({ settings: setNestedValue(state.settings, path, value) })),
});

const createUISlice = (set: StoreSet, get: StoreGet): UISlice => ({
    activeView: View.Plants, // Initial value, will be hydrated from settings
    isCommandPaletteOpen: false,
    notifications: [],
    selectedStrain: null,
    strainToEdit: null,
    strainForSetup: null,
    isAddModalOpen: false,
    isExportModalOpen: false,
    isSetupModalOpen: false,
    selectedPlantId: null,
    setActiveView: (view) => set({ activeView: view }),
    setIsCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),
    addNotification: (message, type = 'info') => {
        if (!get().settings.notificationsEnabled) return;
        const newNotification: Notification = { id: Date.now(), message, type };
        set(state => ({ notifications: [...state.notifications, newNotification] }));
    },
    removeNotification: (id) => set(state => ({ notifications: state.notifications.filter(n => n.id !== id) })),
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
            get().addNotification(t('plantsView.notifications.allSlotsFull'), 'error');
        }
    },
    closeGrowModal: () => set({ isSetupModalOpen: false, strainForSetup: null }),
    setSelectedPlantId: (plantId) => set({ selectedPlantId: plantId }),
});

const createUserSlice = (set: StoreSet, get: StoreGet): UserSlice => ({
    favoriteIds: new Set(),
    strainNotes: {},
    isUserStrain: (strainId) => get().userStrains.some(s => s.id === strainId),
    toggleFavorite: (strainId) => set(state => {
        const newSet = new Set(state.favoriteIds);
        newSet.has(strainId) ? newSet.delete(strainId) : newSet.add(strainId);
        return { favoriteIds: newSet };
    }),
    updateNoteForStrain: (strainId, content) => set(state => ({
        strainNotes: { ...state.strainNotes, [strainId]: content }
    })),
});

const createDataSlice = (set: StoreSet, get: StoreGet): DataSlice => {
    // --- Plant Simulation Logic ---
    const calculateYield = (plant: Plant): number => { /* ... implementation from original store ... */ return 0; };
    const _simulateDay = (plant: Plant): Plant => { /* ... implementation from original store ... */ return plant; };

    return {
        plants: [null, null, null],
        userStrains: [],
        savedExports: [],
        savedSetups: [],
        archivedMentorResponses: [],
        archivedAdvisorResponses: {},
        savedStrainTips: [],
        knowledgeProgress: {},

        startNewPlant: (strain, setup, slotIndex) => {
            const plants = get().plants;
            const emptySlotIndex = slotIndex !== undefined && plants[slotIndex] === null ? slotIndex : plants.findIndex(p => p === null);

            if (emptySlotIndex === -1) {
                get().addNotification(t('plantsView.notifications.allSlotsFull'), 'error');
                return false;
            }
            
            const now = Date.now();
            const newPlant: Plant = {
                id: `${strain.id.replace(/\s/g, '-')}-${now}`, name: strain.name, strain, stage: PlantStage.Seed, age: 0, height: 0, startedAt: now, lastUpdated: now,
                growSetup: setup, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 }, environment: { temperature: setup.temperature, humidity: setup.humidity, light: 100 },
                stressLevel: 0, problems: [], journal: [], tasks: [], history: [{ day: 0, vitals: { substrateMoisture: 80, ph: 6.5, ec: 0.2 }, stressLevel: 0, height: 0 }],
            };
            
            const newPlants = [...plants];
            newPlants[emptySlotIndex] = newPlant;
            set({ plants: newPlants });

            get().addJournalEntry(newPlant.id, { type: 'SYSTEM', notes: t('plantsView.journal.startGrowing', { name: newPlant.name }) });
            get().addNotification(t('plantsView.notifications.startSuccess', { name: newPlant.name }), 'success');
            return true;
        },
        updatePlantState: () => { /* Logic for background updates if ever implemented */ },
        addJournalEntry: (plantId, entryData) => set(state => ({
            plants: state.plants.map(p => {
                if (p && p.id === plantId) {
                    const newEntry: JournalEntry = { ...entryData, id: `${entryData.type}-${Date.now()}`, timestamp: Date.now() };
                    return { ...p, journal: [...p.journal, newEntry] };
                }
                return p;
            })
        })),
        completeTask: (plantId, taskId) => set(state => ({
            plants: state.plants.map(p => p && p.id === plantId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, isCompleted: true, completedAt: Date.now() } : t) } : p)
        })),
        waterAllPlants: () => {
            let wateredCount = 0;
            const newPlants = get().plants.map(p => {
                if (p && p.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATER_ALL_THRESHOLD) {
                    wateredCount++;
                    get().addJournalEntry(p.id, { type: 'WATERING', notes: t('plantsView.actionModals.defaultNotes.watering'), details: { waterAmount: 500, ph: 6.5 }});
                    return { ...p, vitals: { ...p.vitals, substrateMoisture: 100 } };
                }
                return p;
            });
            if (wateredCount > 0) {
                set({ plants: newPlants });
                get().addNotification(t('plantsView.notifications.waterAllSuccess', { count: wateredCount }), 'success');
            } else {
                get().addNotification(t('plantsView.notifications.waterAllNone'), 'info');
            }
        },
        advanceDay: () => set(state => ({ plants: state.plants.map(p => p ? _simulateDay(p) : null) })),
        resetPlants: () => {
             if (window.confirm(t('settingsView.data.resetPlantsConfirm'))) {
                set(state => {
                    const plantIdsToClear = state.plants.filter((p): p is Plant => p !== null).map(p => p.id);
                    const newAdvisorArchive = { ...state.archivedAdvisorResponses };
                    plantIdsToClear.forEach(id => { delete newAdvisorArchive[id]; });
                    
                    return {
                        plants: [null, null, null],
                        archivedAdvisorResponses: newAdvisorArchive,
                        selectedPlantId: null
                    };
                });
                get().addNotification(t('settingsView.data.resetPlantsSuccess'), 'success');
            }
        },
        addUserStrain: (strain) => {
            if (get().userStrains.some(s => s.name.toLowerCase() === strain.name.toLowerCase())) {
                get().addNotification(t('strainsView.addStrainModal.validation.duplicate', { name: strain.name }), 'error');
                return;
            }
            set(state => ({ userStrains: [...state.userStrains, strain].sort((a, b) => a.name.localeCompare(b.name)) }));
            get().addNotification(t('strainsView.addStrainModal.validation.addSuccess', { name: strain.name }), 'success');
        },
        updateUserStrain: (updatedStrain) => {
            set(state => ({ userStrains: state.userStrains.map(s => s.id === updatedStrain.id ? updatedStrain : s).sort((a,b) => a.name.localeCompare(b.name)) }));
            get().addNotification(t('strainsView.addStrainModal.validation.updateSuccess', { name: updatedStrain.name }), 'success');
        },
        deleteUserStrain: (strainId) => {
            const strainToDelete = get().userStrains.find(s => s.id === strainId);
            if (strainToDelete && window.confirm(t('strainsView.addStrainModal.validation.deleteConfirm', { name: strainToDelete.name }))) {
                set(state => ({ userStrains: state.userStrains.filter(s => s.id !== strainId) }));
                get().addNotification(t('strainsView.addStrainModal.validation.deleteSuccess', { name: strainToDelete.name }), 'info');
            }
        },
        addExport: (newExport, strainIds) => {
            const exportToAdd = { ...newExport, id: Date.now().toString(), createdAt: Date.now(), count: strainIds.length, strainIds };
            set(state => ({ savedExports: [exportToAdd, ...state.savedExports].slice(0, 50) }));
            return exportToAdd;
        },
        updateExport: (updatedExport) => set(state => ({ savedExports: state.savedExports.map(exp => exp.id === updatedExport.id ? updatedExport : exp) })),
        deleteExport: (exportId) => set(state => ({ savedExports: state.savedExports.filter(exp => exp.id !== exportId) })),
        addSetup: (setup) => set(state => ({ savedSetups: [{ ...setup, id: Date.now().toString(), createdAt: Date.now() }, ...state.savedSetups] })),
        updateSetup: (updatedSetup) => set(state => ({ savedSetups: state.savedSetups.map(s => s.id === updatedSetup.id ? updatedSetup : s) })),
        deleteSetup: (setupId) => set(state => ({ savedSetups: state.savedSetups.filter(s => s.id !== setupId) })),
        addArchivedMentorResponse: (response) => set(state => ({ archivedMentorResponses: [{ ...response, id: Date.now().toString(), createdAt: Date.now() }, ...state.archivedMentorResponses] })),
        updateArchivedMentorResponse: (updatedResponse) => set(state => ({ archivedMentorResponses: state.archivedMentorResponses.map(r => r.id === updatedResponse.id ? updatedResponse : r) })),
        deleteArchivedMentorResponse: (responseId) => set(state => ({ archivedMentorResponses: state.archivedMentorResponses.filter(r => r.id !== responseId) })),
        addArchivedAdvisorResponse: (plantId, response, query) => {
            const plant = get().plants.find(p => p?.id === plantId);
            if (!plant) return;
            const newResponse: ArchivedAdvisorResponse = { ...response, id: Date.now().toString(), createdAt: Date.now(), plantId, plantStage: plant.stage, query };
            set(state => {
                const plantArchive = state.archivedAdvisorResponses[plantId] || [];
                return { archivedAdvisorResponses: { ...state.archivedAdvisorResponses, [plantId]: [newResponse, ...plantArchive] } };
            });
        },
        updateArchivedAdvisorResponse: (updatedResponse) => set(state => {
            const { plantId } = updatedResponse;
            const plantArchive = state.archivedAdvisorResponses[plantId] || [];
            const updatedArchive = plantArchive.map(r => r.id === updatedResponse.id ? updatedResponse : r);
            return { archivedAdvisorResponses: { ...state.archivedAdvisorResponses, [plantId]: updatedArchive } };
        }),
        deleteArchivedAdvisorResponse: (plantId, responseId) => set(state => {
            const plantArchive = state.archivedAdvisorResponses[plantId] || [];
            const updatedArchive = plantArchive.filter(r => r.id !== responseId);
            return { archivedAdvisorResponses: { ...state.archivedAdvisorResponses, [plantId]: updatedArchive } };
        }),
        addStrainTip: (strain, tip) => set(state => {
            const newTip = { ...tip, id: Date.now().toString(), createdAt: Date.now(), strainId: strain.id, strainName: strain.name };
            return { savedStrainTips: [newTip, ...state.savedStrainTips] };
        }),
        updateStrainTip: (updatedTip) => set(state => ({ savedStrainTips: state.savedStrainTips.map(t => t.id === updatedTip.id ? updatedTip : t) })),
        deleteStrainTip: (tipId) => set(state => ({ savedStrainTips: state.savedStrainTips.filter(t => t.id !== tipId) })),
        toggleKnowledgeProgressItem: (sectionId, itemId) => set(state => {
            const sectionProgress = state.knowledgeProgress[sectionId] ? [...state.knowledgeProgress[sectionId]] : [];
            const itemIndex = sectionProgress.indexOf(itemId);
            if (itemIndex > -1) sectionProgress.splice(itemIndex, 1);
            else sectionProgress.push(itemId);
            return { knowledgeProgress: { ...state.knowledgeProgress, [sectionId]: sectionProgress } };
        }),
    };
};

// --- COMBINED STORE ---
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createSettingsSlice(set),
      ...createUISlice(set, get),
      ...createUserSlice(set, get),
      ...createDataSlice(set, get),
      init: (newT) => { t = newT; },
    }),
    {
      name: 'cannaguide-2025-storage',
      storage: createJSONStorage(() => localStorage),
      // Selectively persist only the necessary data slices
      partialize: (state) => ({
        settings: state.settings,
        plants: state.plants,
        userStrains: state.userStrains,
        favoriteIds: Array.from(state.favoriteIds), // Convert Set to Array for JSON serialization
        strainNotes: state.strainNotes,
        savedExports: state.savedExports,
        savedSetups: state.savedSetups,
        archivedMentorResponses: state.archivedMentorResponses,
        archivedAdvisorResponses: state.archivedAdvisorResponses,
        savedStrainTips: state.savedStrainTips,
        knowledgeProgress: state.knowledgeProgress,
      }),
      // Rehydrate the store from storage
      onRehydrateStorage: () => (state) => {
        if (state) {
            // Restore Set from Array after rehydration
            state.favoriteIds = new Set(state.favoriteIds as unknown as string[]);
            // Ensure activeView is set from persisted settings
            state.activeView = state.settings.defaultView;
        }
      },
    }
  )
);