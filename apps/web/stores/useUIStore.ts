import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
    View,
    Strain,
    ModalType,
    GrowSetup,
    Notification,
    EquipmentViewTab,
    KnowledgeViewTab,
    SavedSetup,
} from '@/types'
import { getT } from '@/i18n'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface UIState {
    activeView: View
    lastActiveView: View
    onboardingStep: number
    highlightedElement: string | null
    isCommandPaletteOpen: boolean
    isAddModalOpen: boolean
    isExportModalOpen: boolean
    strainToEdit: Strain | null
    actionModal: { isOpen: boolean; plantId: string | null; type: ModalType | null }
    deepDiveModal: { isOpen: boolean; plantId: string | null; topic: string | null }
    isAppReady: boolean
    notifications: Notification[]
    newGrowFlow: {
        status: 'idle' | 'selectingSlot' | 'selectingStrain' | 'configuringSetup' | 'confirming'
        slotIndex: number | null
        strain: Strain | null
        setup: GrowSetup | null
    }
    equipmentViewTab: EquipmentViewTab
    knowledgeViewTab: KnowledgeViewTab
    activeMentorPlantId: string | null
    isDiagnosticsModalOpen: boolean
    diagnosticsPlantId: string | null
    isSaveSetupModalOpen: boolean
    setupToSave: Omit<SavedSetup, 'id' | 'createdAt' | 'name'> | null
    voiceControl: {
        isListening: boolean
        isAvailable: boolean
        lastTranscript: string | null
        statusMessage: string | null
    }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export interface UIActions {
    setActiveView: (view: View) => void
    setOnboardingStep: (step: number) => void
    addNotification: (payload: { message: string; type: Notification['type'] }) => void
    removeNotification: (id: number) => void
    setAppReady: (ready: boolean) => void
    setIsCommandPaletteOpen: (open: boolean) => void
    openAddModal: (strain?: Strain | null) => void
    closeAddModal: () => void
    openExportModal: () => void
    closeExportModal: () => void
    openActionModal: (payload: { plantId: string; type: ModalType }) => void
    closeActionModal: () => void
    openDeepDiveModal: (payload: { plantId: string; topic: string }) => void
    closeDeepDiveModal: () => void
    openDiagnosticsModal: (plantId: string) => void
    closeDiagnosticsModal: () => void
    startGrowInSlot: (slotIndex: number) => void
    initiateGrowFromStrain: (strain: Strain) => void
    selectSlotForGrow: (slotIndex: number) => void
    selectStrainForGrow: (strain: Strain) => void
    confirmSetupAndShowConfirmation: (setup: GrowSetup) => void
    cancelNewGrow: () => void
    setEquipmentViewTab: (tab: EquipmentViewTab) => void
    setKnowledgeViewTab: (tab: KnowledgeViewTab) => void
    setActiveMentorPlantId: (id: string | null) => void
    openSaveSetupModal: (setup: Omit<SavedSetup, 'id' | 'createdAt' | 'name'>) => void
    closeSaveSetupModal: () => void
    setVoiceListening: (listening: boolean) => void
    setVoiceStatusMessage: (message: string | null) => void
    processVoiceCommand: (transcript: string) => void
    _setupConfirmedForSlotSelection: (setup: GrowSetup) => void
    hydrateUI: (partial: Partial<UIState>) => void
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const MAIN_VIEWS: View[] = [View.Plants, View.Strains, View.Equipment, View.Knowledge]

const initialGrowFlow: UIState['newGrowFlow'] = {
    status: 'idle',
    slotIndex: null,
    strain: null,
    setup: null,
}

export const initialUIState: UIState = {
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
    newGrowFlow: { ...initialGrowFlow },
    equipmentViewTab: EquipmentViewTab.Configurator,
    knowledgeViewTab: KnowledgeViewTab.Mentor,
    activeMentorPlantId: null,
    isDiagnosticsModalOpen: false,
    diagnosticsPlantId: null,
    isSaveSetupModalOpen: false,
    setupToSave: null,
    voiceControl: {
        isListening: false,
        isAvailable:
            typeof window !== 'undefined' &&
            (typeof (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition ===
                'function' ||
                typeof (window as Window & { webkitSpeechRecognition?: unknown })
                    .webkitSpeechRecognition === 'function'),
        lastTranscript: null,
        statusMessage: null,
    },
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUIStore = create<UIState & UIActions>()(
    subscribeWithSelector((set) => ({
        ...initialUIState,

        setActiveView: (view) =>
            set((state) => ({
                activeView: view,
                lastActiveView: MAIN_VIEWS.includes(view) ? view : state.lastActiveView,
            })),

        setOnboardingStep: (step) => set({ onboardingStep: step }),

        addNotification: (payload) =>
            set((state) => ({
                notifications: [...state.notifications, { id: Date.now(), ...payload }],
            })),

        removeNotification: (id) =>
            set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id),
            })),

        setAppReady: (ready) => set({ isAppReady: ready }),

        setIsCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

        openAddModal: (strain) => set({ isAddModalOpen: true, strainToEdit: strain ?? null }),

        closeAddModal: () => set({ isAddModalOpen: false, strainToEdit: null }),

        openExportModal: () => set({ isExportModalOpen: true }),
        closeExportModal: () => set({ isExportModalOpen: false }),

        openActionModal: (payload) => set({ actionModal: { isOpen: true, ...payload } }),

        closeActionModal: () => set({ actionModal: { isOpen: false, plantId: null, type: null } }),

        openDeepDiveModal: (payload) => set({ deepDiveModal: { isOpen: true, ...payload } }),

        closeDeepDiveModal: () =>
            set({ deepDiveModal: { isOpen: false, plantId: null, topic: null } }),

        openDiagnosticsModal: (plantId) =>
            set({ isDiagnosticsModalOpen: true, diagnosticsPlantId: plantId }),

        closeDiagnosticsModal: () =>
            set({ isDiagnosticsModalOpen: false, diagnosticsPlantId: null }),

        startGrowInSlot: (slotIndex) =>
            set({
                newGrowFlow: {
                    status: 'selectingStrain',
                    slotIndex,
                    strain: null,
                    setup: null,
                },
            }),

        initiateGrowFromStrain: (strain) =>
            set({
                newGrowFlow: {
                    status: 'configuringSetup',
                    slotIndex: null,
                    strain,
                    setup: null,
                },
            }),

        selectSlotForGrow: (slotIndex) =>
            set((state) => {
                if (state.newGrowFlow.status === 'selectingSlot' && state.newGrowFlow.strain) {
                    return {
                        newGrowFlow: {
                            ...state.newGrowFlow,
                            slotIndex,
                            status: 'configuringSetup' as const,
                        },
                    }
                }
                return {}
            }),

        selectStrainForGrow: (strain) =>
            set((state) => {
                if (state.newGrowFlow.status === 'selectingStrain') {
                    return {
                        newGrowFlow: {
                            ...state.newGrowFlow,
                            strain,
                            status: 'configuringSetup' as const,
                        },
                    }
                }
                return {}
            }),

        confirmSetupAndShowConfirmation: (setup) =>
            set((state) => ({
                newGrowFlow: { ...state.newGrowFlow, setup, status: 'confirming' },
            })),

        cancelNewGrow: () => set({ newGrowFlow: { ...initialGrowFlow } }),

        setEquipmentViewTab: (tab) => set({ equipmentViewTab: tab }),
        setKnowledgeViewTab: (tab) => set({ knowledgeViewTab: tab }),
        setActiveMentorPlantId: (id) => set({ activeMentorPlantId: id }),

        openSaveSetupModal: (setup) => set({ isSaveSetupModalOpen: true, setupToSave: setup }),

        closeSaveSetupModal: () => set({ isSaveSetupModalOpen: false, setupToSave: null }),

        setVoiceListening: (listening) =>
            set((state) => ({
                voiceControl: { ...state.voiceControl, isListening: listening },
            })),

        setVoiceStatusMessage: (message) =>
            set((state) => ({
                voiceControl: { ...state.voiceControl, statusMessage: message },
            })),

        processVoiceCommand: (transcript) =>
            set((state) => ({
                voiceControl: { ...state.voiceControl, lastTranscript: transcript },
            })),

        _setupConfirmedForSlotSelection: (setup) =>
            set((state) => ({
                newGrowFlow: {
                    ...state.newGrowFlow,
                    setup,
                    status: 'selectingSlot' as const,
                },
            })),

        hydrateUI: (partial) => set((state) => ({ ...state, ...partial })),
    })),
)

/**
 * Snapshot accessor for non-React code (Redux thunks, listener middleware, etc.)
 */
export const getUISnapshot = (): UIState & UIActions => useUIStore.getState()

// ---------------------------------------------------------------------------
// Redux bridge -- wired once from store.ts via initUIStoreReduxBridge()
// ---------------------------------------------------------------------------

interface ReduxBridgeState {
    simulation: { plantSlots: (string | null)[] }
}

let _getReduxState: (() => ReduxBridgeState) | null = null

export const initUIStoreReduxBridge = (getter: () => ReduxBridgeState): void => {
    _getReduxState = getter
}

// ---------------------------------------------------------------------------
// Standalone thunk replacements (use both Zustand + Redux state)
// ---------------------------------------------------------------------------

/**
 * Replaces the former Redux async thunk of the same name.
 * Checks Redux simulation.plantSlots, then triggers Zustand UI actions.
 */
export function initiateGrowFromStrainList(strain: Strain): void {
    const ui = useUIStore.getState()
    const reduxState = _getReduxState?.()
    if (reduxState?.simulation.plantSlots.every((s) => s !== null)) {
        ui.addNotification({
            message: getT()('plantsView.notifications.allSlotsFull'),
            type: 'error',
        })
    } else {
        ui.setActiveView(View.Plants)
        ui.initiateGrowFromStrain(strain)
    }
}

/**
 * Replaces the former Redux async thunk of the same name.
 */
export function confirmSetupAndGoToSlotSelection(setup: GrowSetup): void {
    const ui = useUIStore.getState()
    ui._setupConfirmedForSlotSelection(setup)
    ui.setActiveView(View.Plants)
}
