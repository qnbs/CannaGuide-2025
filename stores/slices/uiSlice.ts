import { View, Notification, NotificationType, Strain } from '@/types';
import type { AppState, StoreSet, StoreGet } from '@/stores/useAppStore';

export interface UISlice {
    activeView: View;
    isCommandPaletteOpen: boolean;
    notifications: Notification[];
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
    openAddModal: (strain?: Strain | null) => void;
    closeAddModal: () => void;
    openExportModal: () => void;
    closeExportModal: () => void;
    initiateGrow: (strain: Strain) => void;
    closeGrowModal: () => void;
    setSelectedPlantId: (plantId: string | null) => void;
}

export const createUISlice = (set: StoreSet, get: StoreGet): UISlice => ({
    activeView: View.Plants,
    isCommandPaletteOpen: false,
    notifications: [],
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
        // The check for available slots is now done in the component using a selector.
        // The component is responsible for showing the notification if no slots are available.
        set(state => {
            state.activeView = View.Plants;
            state.strainForSetup = strain;
            state.isSetupModalOpen = true;
        });
    },
    closeGrowModal: () => set(state => {
        state.isSetupModalOpen = false;
        state.strainForSetup = null;
    }),
    
    setSelectedPlantId: (plantId) => set(state => { state.selectedPlantId = plantId; }),
});