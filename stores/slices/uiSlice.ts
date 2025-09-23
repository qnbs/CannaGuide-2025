import { View, Notification, NotificationType, Strain } from '@/types';
import type { AppState, StoreSet, StoreGet, TFunction } from '@/stores/useAppStore';

export interface UISlice {
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

export const createUISlice = (set: StoreSet, get: StoreGet, t: () => TFunction): UISlice => ({
    activeView: View.Plants,
    isCommandPaletteOpen: false,
    notifications: [],
    selectedStrain: null,
    strainToEdit: null,
    strainForSetup: null,
    isAddModalOpen: false,
    isExportModalOpen: false,
    isSetupModalOpen: false,
    selectedPlantId: null,

    setActiveView: (view) => set(state => { state.activeView = view; }),
    setIsCommandPaletteOpen: (isOpen) => set(state => { state.isCommandPaletteOpen = isOpen; }),
    
    addNotification: (message, type = 'info') => {
        if (!get().settings.notificationsEnabled) return;
        const newNotification: Notification = { id: Date.now(), message, type };
        set(state => { state.notifications.push(newNotification); });
    },
    removeNotification: (id) => set(state => {
        state.notifications = state.notifications.filter(n => n.id !== id);
    }),
    
    selectStrain: (strain) => set(state => { state.selectedStrain = strain; }),
    closeDetailModal: () => set(state => { state.selectedStrain = null; }),
    
    openAddModal: (strain) => set(state => {
        state.strainToEdit = strain || null;
        state.isAddModalOpen = true;
    }),
    closeAddModal: () => set(state => {
        state.isAddModalOpen = false;
        state.strainToEdit = null;
    }),
    
    openExportModal: () => set(state => { state.isExportModalOpen = true; }),
    closeExportModal: () => set(state => { state.isExportModalOpen = false; }),
    
    initiateGrow: (strain) => {
        if (get().plantSlots.some(p => p === null)) {
            set(state => {
                state.strainForSetup = strain;
                state.isSetupModalOpen = true;
            });
        } else {
            get().addNotification(t()('plantsView.notifications.allSlotsFull'), 'error');
        }
    },
    closeGrowModal: () => set(state => {
        state.isSetupModalOpen = false;
        state.strainForSetup = null;
    }),
    
    setSelectedPlantId: (plantId) => set(state => { state.selectedPlantId = plantId; }),
});
