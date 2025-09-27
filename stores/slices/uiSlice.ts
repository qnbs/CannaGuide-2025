// FIX: Changed import paths to be relative
import { View, Notification, Strain, GrowSetup, NotificationType, Language } from '../../types';
import type { StoreSet, StoreGet, AppState } from '../useAppStore';
import { i18nInstance } from '../../i18n';

export interface UISlice {
    activeView: View;
    isCommandPaletteOpen: boolean;
    isAddModalOpen: boolean;
    isExportModalOpen: boolean;
    strainToEdit: Strain | null;
    notifications: Notification[];
    isAppReady: boolean;
    onboardingStep: number;

    // New Grow Flow State
    initiatingGrowForSlot: number | null;
    strainForNewGrow: Strain | null;
    isGrowSetupModalOpen: boolean;
    isConfirmationModalOpen: boolean;
    confirmedGrowSetup: GrowSetup | null;
    
    // Mentor Chat State
    activeMentorPlantId: string | null;

    // Actions
    setActiveView: (view: View) => void;
    setIsCommandPaletteOpen: (isOpen: boolean) => void;
    addNotification: (message: string, type: NotificationType) => void;
    removeNotification: (id: number) => void;
    openAddModal: (strain?: Strain | null) => void;
    closeAddModal: () => void;
    openExportModal: () => void;
    closeExportModal: () => void;
    
    // New Grow Flow Actions
    initiateGrowFromStrainList: (strain: Strain) => void;
    startGrowInSlot: (slotIndex: number) => void;
    selectStrainForGrow: (strain: Strain) => void;
    confirmSetupAndShowConfirmation: (setup: GrowSetup) => void;
    cancelNewGrow: () => void;
    finalizeNewGrow: () => void;
    
    // Mentor Chat Actions
    setActiveMentorPlantId: (plantId: string | null) => void;

    // App ready state
    setAppReady: (isReady: boolean) => void;
    setOnboardingStep: (step: number) => void;
}

export const createUISlice = (set: StoreSet, get: StoreGet): UISlice => ({
    activeView: View.Plants,
    isCommandPaletteOpen: false,
    isAddModalOpen: false,
    isExportModalOpen: false,
    strainToEdit: null,
    notifications: [],
    isAppReady: false,
    onboardingStep: 0,

    // New Grow Flow State
    initiatingGrowForSlot: null,
    strainForNewGrow: null,
    isGrowSetupModalOpen: false,
    isConfirmationModalOpen: false,
    confirmedGrowSetup: null,

    // Mentor Chat State
    activeMentorPlantId: null,

    // Actions
    setActiveView: (view) => set(state => { state.activeView = view; }),
    setIsCommandPaletteOpen: (isOpen) => set(state => { state.isCommandPaletteOpen = isOpen; }),
    addNotification: (message, type) => {
        const newNotification = { id: Date.now(), message, type };
        set(state => ({ notifications: [...state.notifications, newNotification] }));
    },
    removeNotification: (id) => {
        set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
    },
    openAddModal: (strain = null) => set(state => { state.isAddModalOpen = true; state.strainToEdit = strain; }),
    closeAddModal: () => set(state => { state.isAddModalOpen = false; state.strainToEdit = null; }),
    openExportModal: () => set(state => { state.isExportModalOpen = true; }),
    closeExportModal: () => set(state => { state.isExportModalOpen = false; }),

    // New Grow Flow Actions
    initiateGrowFromStrainList: (strain) => {
        set(state => { state.strainForNewGrow = strain; state.activeView = View.Plants; });
        get().addNotification(i18nInstance.t('plantsView.inlineSelector.title'), 'info');
    },
    startGrowInSlot: (slotIndex) => {
        set(state => { state.initiatingGrowForSlot = slotIndex; state.strainForNewGrow = null; });
    },
    selectStrainForGrow: (strain) => {
        set(state => { state.strainForNewGrow = strain; state.isGrowSetupModalOpen = true; });
    },
    confirmSetupAndShowConfirmation: (setup) => {
        set(state => { state.confirmedGrowSetup = setup; state.isGrowSetupModalOpen = false; state.isConfirmationModalOpen = true; });
    },
    cancelNewGrow: () => {
        set(state => {
            state.initiatingGrowForSlot = null;
            state.strainForNewGrow = null;
            state.isGrowSetupModalOpen = false;
            state.isConfirmationModalOpen = false;
            state.confirmedGrowSetup = null;
        });
    },
    finalizeNewGrow: () => {
        const { strainForNewGrow, confirmedGrowSetup, initiatingGrowForSlot } = get();
        if (strainForNewGrow && confirmedGrowSetup && initiatingGrowForSlot !== null) {
            const success = get().startNewPlant(strainForNewGrow, confirmedGrowSetup, initiatingGrowForSlot);
            if (success) {
                get().addNotification(i18nInstance.t('plantsView.notifications.growStarted', { name: strainForNewGrow.name }), 'success');
            }
        }
        get().cancelNewGrow();
    },
    
    // Mentor Chat Actions
    setActiveMentorPlantId: (plantId) => set(state => { state.activeMentorPlantId = plantId; }),

    // App ready state
    setAppReady: (isReady) => set(state => { state.isAppReady = isReady; }),
    setOnboardingStep: (step: number) => set(state => { state.onboardingStep = step; }),
});