import { View, Strain, Notification, NotificationType, GrowSetup } from '@/types';
import { StoreSet, StoreGet, TFunction } from '../useAppStore';

export interface UISlice {
    activeView: View;
    isCommandPaletteOpen: boolean;
    isAddModalOpen: boolean;
    isExportModalOpen: boolean;
    strainToEdit: Strain | null;
    notifications: Notification[];
    
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
    
    openAddModal: (strain?: Strain | null) => void;
    closeAddModal: () => void;
    
    openExportModal: () => void;
    closeExportModal: () => void;
    
    addNotification: (message: string, type: NotificationType) => void;
    removeNotification: (id: number) => void;
    
    // New Grow Flow Actions
    startGrowInSlot: (slotIndex: number) => void;
    initiateGrowFromStrainList: (strain: Strain) => void;
    selectStrainForGrow: (strain: Strain) => void;
    confirmSetupAndShowConfirmation: (setup: GrowSetup) => void;
    finalizeNewGrow: () => void;
    cancelNewGrow: () => void;
    startFirstGrow: () => void;
    
    setActiveMentorPlantId: (plantId: string | null) => void;
}

export const createUISlice = (set: StoreSet, get: StoreGet, t: () => TFunction): UISlice => ({
    activeView: View.Plants,
    isCommandPaletteOpen: false,
    isAddModalOpen: false,
    isExportModalOpen: false,
    strainToEdit: null,
    notifications: [],
    
    initiatingGrowForSlot: null,
    strainForNewGrow: null,
    isGrowSetupModalOpen: false,
    isConfirmationModalOpen: false,
    confirmedGrowSetup: null,
    
    activeMentorPlantId: null,

    setActiveView: (view) => set({ activeView: view }),
    setIsCommandPaletteOpen: (isOpen) => set({ isCommandPaletteOpen: isOpen }),

    openAddModal: (strain = null) => set({ isAddModalOpen: true, strainToEdit: strain }),
    closeAddModal: () => set({ isAddModalOpen: false, strainToEdit: null }),

    openExportModal: () => set({ isExportModalOpen: true }),
    closeExportModal: () => set({ isExportModalOpen: false }),

    addNotification: (message, type) => {
        const newNotification: Notification = { id: Date.now(), message, type };
        set(state => ({ notifications: [...state.notifications, newNotification] }));
    },
    removeNotification: (id) => set(state => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),
    
    startGrowInSlot: (slotIndex) => {
        set({ initiatingGrowForSlot: slotIndex, strainForNewGrow: null });
    },
    
    initiateGrowFromStrainList: (strain) => {
        const hasSlots = get().plantSlots.some(slot => slot === null);
        if (!hasSlots) {
            get().addNotification(t()('plantsView.notifications.allSlotsFull'), 'error');
            return;
        }
        set({ strainForNewGrow: strain, initiatingGrowForSlot: null, activeView: View.Plants });
    },

    selectStrainForGrow: (strain) => {
        set({ strainForNewGrow: strain, isGrowSetupModalOpen: true });
    },

    confirmSetupAndShowConfirmation: (setup) => {
        set({
            isGrowSetupModalOpen: false,
            confirmedGrowSetup: setup,
            isConfirmationModalOpen: true,
        });
    },

    finalizeNewGrow: () => {
        const { strainForNewGrow, initiatingGrowForSlot, confirmedGrowSetup } = get();
        if (strainForNewGrow && initiatingGrowForSlot !== null && confirmedGrowSetup) {
            const success = get().startNewPlant(strainForNewGrow, confirmedGrowSetup, initiatingGrowForSlot);
            if (success) {
                get().addNotification(t()('plantsView.notifications.growStarted', { name: strainForNewGrow.name }), 'success');
            }
        }
        // Reset the entire flow state
        set({ 
            initiatingGrowForSlot: null, 
            strainForNewGrow: null, 
            isGrowSetupModalOpen: false,
            isConfirmationModalOpen: false,
            confirmedGrowSetup: null,
        });
    },
    
    cancelNewGrow: () => {
        set({ 
            initiatingGrowForSlot: null, 
            strainForNewGrow: null, 
            isGrowSetupModalOpen: false,
            isConfirmationModalOpen: false,
            confirmedGrowSetup: null,
        });
    },
    
    startFirstGrow: () => {
        set({ activeView: View.Plants });
        get().startGrowInSlot(0);
    },
    
    setActiveMentorPlantId: (plantId) => set({ activeMentorPlantId: plantId }),
});
