import { describe, it, expect } from 'vitest'
import { View } from '@/types'
import uiReducer, {
    initialState,
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
} from '@/stores/slices/uiSlice'

describe('uiSlice', () => {
    it('returns initial state', () => {
        const state = uiReducer(undefined, { type: 'unknown' })
        expect(state.activeView).toBe(View.Plants)
        expect(state.isAppReady).toBe(false)
        expect(state.notifications).toEqual([])
    })

    it('setActiveView updates view and lastActiveView for main views', () => {
        const state = uiReducer(initialState, setActiveView(View.Strains))
        expect(state.activeView).toBe(View.Strains)
        expect(state.lastActiveView).toBe(View.Strains)
    })

    it('setOnboardingStep updates step', () => {
        const state = uiReducer(initialState, setOnboardingStep(3))
        expect(state.onboardingStep).toBe(3)
    })

    it('addNotification creates notification with id', () => {
        const state = uiReducer(initialState, addNotification({ message: 'Test', type: 'success' }))
        expect(state.notifications).toHaveLength(1)
        expect(state.notifications[0]!.message).toBe('Test')
        expect(state.notifications[0]!.type).toBe('success')
        expect(state.notifications[0]!.id).toBeDefined()
    })

    it('removeNotification removes by id', () => {
        let state = uiReducer(initialState, addNotification({ message: 'Test', type: 'info' }))
        const id = state.notifications[0]!.id
        state = uiReducer(state, removeNotification(id))
        expect(state.notifications).toHaveLength(0)
    })

    it('setAppReady sets flag', () => {
        const state = uiReducer(initialState, setAppReady(true))
        expect(state.isAppReady).toBe(true)
    })

    it('setIsCommandPaletteOpen toggles palette', () => {
        const state = uiReducer(initialState, setIsCommandPaletteOpen(true))
        expect(state.isCommandPaletteOpen).toBe(true)
    })

    it('openAddModal / closeAddModal toggles modal state', () => {
        const mockStrain = { id: 's1', name: 'Test Strain' } as any
        let state = uiReducer(initialState, openAddModal(mockStrain))
        expect(state.isAddModalOpen).toBe(true)
        expect(state.strainToEdit).toEqual(mockStrain)

        state = uiReducer(state, closeAddModal())
        expect(state.isAddModalOpen).toBe(false)
        expect(state.strainToEdit).toBeNull()
    })

    it('openExportModal / closeExportModal toggles', () => {
        let state = uiReducer(initialState, openExportModal())
        expect(state.isExportModalOpen).toBe(true)

        state = uiReducer(state, closeExportModal())
        expect(state.isExportModalOpen).toBe(false)
    })

    it('openActionModal / closeActionModal toggles with data', () => {
        let state = uiReducer(initialState, openActionModal({ plantId: 'p1', type: 'water' as any }))
        expect(state.actionModal.isOpen).toBe(true)
        expect(state.actionModal.plantId).toBe('p1')

        state = uiReducer(state, closeActionModal())
        expect(state.actionModal.isOpen).toBe(false)
        expect(state.actionModal.plantId).toBeNull()
    })

    it('openDeepDiveModal / closeDeepDiveModal toggles', () => {
        let state = uiReducer(initialState, openDeepDiveModal({ plantId: 'p1', topic: 'nutrition' }))
        expect(state.deepDiveModal.isOpen).toBe(true)
        expect(state.deepDiveModal.topic).toBe('nutrition')

        state = uiReducer(state, closeDeepDiveModal())
        expect(state.deepDiveModal.isOpen).toBe(false)
    })

    it('openDiagnosticsModal / closeDiagnosticsModal toggles', () => {
        let state = uiReducer(initialState, openDiagnosticsModal('p1'))
        expect(state.isDiagnosticsModalOpen).toBe(true)
        expect(state.diagnosticsPlantId).toBe('p1')

        state = uiReducer(state, closeDiagnosticsModal())
        expect(state.isDiagnosticsModalOpen).toBe(false)
    })

    it('startGrowInSlot sets flow to selectingStrain', () => {
        const state = uiReducer(initialState, startGrowInSlot(2))
        expect(state.newGrowFlow.status).toBe('selectingStrain')
        expect(state.newGrowFlow.slotIndex).toBe(2)
    })
})
