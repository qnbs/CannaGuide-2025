import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { View, Strain, ModalType, GrowSetup, Notification, EquipmentViewTab, KnowledgeViewTab, SavedSetup, StrainViewTab } from '@/types';
import type { RootState } from '../store';
import { getT } from '@/i18n';

export interface UIState {
    activeView: View;
    lastActiveView: View; // To persist the last main view
    onboardingStep: number;
    highlightedElement: string | null;
    isCommandPaletteOpen: boolean;
    isAddModalOpen: boolean;
    isExportModalOpen: boolean;
    strainToEdit: Strain | null;
    actionModal: { isOpen: boolean; plantId: string | null; type: ModalType | null };
    deepDiveModal: { isOpen: boolean; plantId: string | null; topic: string | null };
    isAppReady: boolean;
    notifications: Notification[];
    newGrowFlow: {
        status: 'idle' | 'selectingSlot' | 'selectingStrain' | 'configuringSetup' | 'confirming';
        slotIndex: number | null;
        strain: Strain | null;
        setup: GrowSetup | null;
    },
    equipmentViewTab: EquipmentViewTab;
    knowledgeViewTab: KnowledgeViewTab;
    activeMentorPlantId: string | null;
    isDiagnosticsModalOpen: boolean;
    diagnosticsPlantId: string | null;
    isSaveSetupModalOpen: boolean;
    setupToSave: Omit<SavedSetup, 'id' | 'createdAt' | 'name'> | null;
    voiceControl: {
        isListening: boolean;
        isAvailable: boolean;
        lastTranscript: string | null;
        statusMessage: string | null;
    };
}

// FIX: Export the initialState so it can be imported in the store setup.
export const initialState: UIState = {
    activeView: View.Plants,
    lastActiveView: View.Plants,
    onboardingStep: 0,
    highlightedElement: null,
    isCommandPaletteOpen: false,
    isAddModalOpen: false,
    isExportModalOpen: false,
    strainToEdit: null,
    actionModal: { isOpen: false, plantId: null, type: null },
    deepDiveModal: { isOpen: false, plantId: null, topic: null },
    isAppReady: false,
    notifications: [],
    newGrowFlow: {
        status: 'idle',
        slotIndex: null,
        strain: null,
        setup: null,
    },
    equipmentViewTab: EquipmentViewTab.Configurator,
    knowledgeViewTab: KnowledgeViewTab.Mentor,
    activeMentorPlantId: null,
    isDiagnosticsModalOpen: false,
    diagnosticsPlantId: null,
    isSaveSetupModalOpen: false,
    setupToSave: null,
    voiceControl: {
        isListening: false,
        isAvailable: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
        lastTranscript: null,
        statusMessage: null,
    },
};

// Thunks for complex actions
export const initiateGrowFromStrainList = createAsyncThunk<void, Strain, { state: RootState }>(
    'ui/initiateGrowFromStrainList',
    (strain, { dispatch, getState }) => {
        const { simulation } = getState();
        if (simulation.plantSlots.every(s => s !== null)) {
            dispatch(addNotification({ message: getT()('plantsView.notifications.allSlotsFull'), type: 'error' }));
        } else {
            dispatch(uiSlice.actions.setActiveView(View.Plants));
            dispatch(uiSlice.actions.selectStrainForGrow(strain));
        }
    }
);


const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setActiveView: (state, action: PayloadAction<View>) => {
            state.activeView = action.payload;
            state.lastActiveView = action.payload;
        },
        setOnboardingStep: (state, action: PayloadAction<number>) => {
            state.onboardingStep = action.payload;
        },
        addNotification: (state, action: PayloadAction<{ message: string; type: Notification['type'] }>) => {
            const newNotification: Notification = {
                id: Date.now(),
                ...action.payload,
            };
            state.notifications.push(newNotification);
        },
        removeNotification: (state, action: PayloadAction<number>) => {
            state.notifications = state.notifications.filter(n => n.id !== action.payload);
        },
        setAppReady: (state, action: PayloadAction<boolean>) => {
            state.isAppReady = action.payload;
        },
        setIsCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
            state.isCommandPaletteOpen = action.payload;
        },
        openAddModal: (state, action: PayloadAction<Strain | null | undefined>) => {
            state.isAddModalOpen = true;
            state.strainToEdit = action.payload || null;
        },
        closeAddModal: (state) => {
            state.isAddModalOpen = false;
            state.strainToEdit = null;
        },
        openExportModal: (state) => {
            state.isExportModalOpen = true;
        },
        closeExportModal: (state) => {
            state.isExportModalOpen = false;
        },
        openActionModal: (state, action: PayloadAction<{ plantId: string; type: ModalType }>) => {
            state.actionModal = { isOpen: true, ...action.payload };
        },
        closeActionModal: (state) => {
            state.actionModal = { isOpen: false, plantId: null, type: null };
        },
        openDeepDiveModal: (state, action: PayloadAction<{ plantId: string, topic: string }>) => {
            state.deepDiveModal = { isOpen: true, ...action.payload };
        },
        closeDeepDiveModal: (state) => {
            state.deepDiveModal = { isOpen: false, plantId: null, topic: null };
        },
        openDiagnosticsModal: (state, action: PayloadAction<string>) => {
            state.isDiagnosticsModalOpen = true;
            state.diagnosticsPlantId = action.payload;
        },
        closeDiagnosticsModal: (state) => {
            state.isDiagnosticsModalOpen = false;
            state.diagnosticsPlantId = null;
        },
        startGrowInSlot: (state, action: PayloadAction<number>) => {
            state.newGrowFlow.status = 'selectingStrain';
            state.newGrowFlow.slotIndex = action.payload;
        },
        selectStrainForGrow: (state, action: PayloadAction<Strain>) => {
            state.newGrowFlow.strain = action.payload;
            state.newGrowFlow.status = 'configuringSetup';
        },
        confirmSetupAndShowConfirmation: (state, action: PayloadAction<GrowSetup>) => {
            state.newGrowFlow.setup = action.payload;
            state.newGrowFlow.status = 'confirming';
        },
        cancelNewGrow: (state) => {
            state.newGrowFlow = initialState.newGrowFlow;
        },
        setEquipmentViewTab: (state, action: PayloadAction<EquipmentViewTab>) => {
            state.equipmentViewTab = action.payload;
        },
        setKnowledgeViewTab: (state, action: PayloadAction<KnowledgeViewTab>) => {
            state.knowledgeViewTab = action.payload;
        },
        setActiveMentorPlantId: (state, action: PayloadAction<string | null>) => {
            state.activeMentorPlantId = action.payload;
        },
        openSaveSetupModal: (state, action: PayloadAction<Omit<SavedSetup, 'id' | 'createdAt' | 'name'>>) => {
            state.isSaveSetupModalOpen = true;
            state.setupToSave = action.payload;
        },
        closeSaveSetupModal: (state) => {
            state.isSaveSetupModalOpen = false;
            state.setupToSave = null;
        },
        // Voice Control Actions
        setVoiceListening: (state, action: PayloadAction<boolean>) => {
            state.voiceControl.isListening = action.payload;
        },
        setVoiceStatusMessage: (state, action: PayloadAction<string | null>) => {
            state.voiceControl.statusMessage = action.payload;
        },
        processVoiceCommand: (state, action: PayloadAction<string>) => {
            // This is a trigger for the listener middleware.
            state.voiceControl.lastTranscript = action.payload;
        },
    },
});

export const {
    setActiveView,
    setOnboardingStep,
    addNotification,
    removeNotification,
    setAppReady,
    setIsCommandPaletteOpen,
    openAddModal,
    closeAddModal,
    openExportModal,
    closeExportModal,
    openActionModal,
    closeActionModal,
    openDeepDiveModal,
    closeDeepDiveModal,
    openDiagnosticsModal,
    closeDiagnosticsModal,
    startGrowInSlot,
    selectStrainForGrow,
    confirmSetupAndShowConfirmation,
    cancelNewGrow,
    setEquipmentViewTab,
    setKnowledgeViewTab,
    setActiveMentorPlantId,
    openSaveSetupModal,
    closeSaveSetupModal,
    setVoiceListening,
    setVoiceStatusMessage,
    processVoiceCommand,
} = uiSlice.actions;

export default uiSlice.reducer;