import { describe, expect, it, beforeEach, vi } from 'vitest'
import { useUIStore, initialUIState } from './useUIStore'
import { View, EquipmentViewTab, KnowledgeViewTab } from '@/types'

describe('useUIStore', () => {
    beforeEach(() => {
        useUIStore.setState({ ...initialUIState })
    })

    describe('setActiveView', () => {
        it('sets the active view', () => {
            useUIStore.getState().setActiveView(View.Strains)
            expect(useUIStore.getState().activeView).toBe(View.Strains)
        })

        it('updates lastActiveView for main views', () => {
            useUIStore.getState().setActiveView(View.Equipment)
            expect(useUIStore.getState().lastActiveView).toBe(View.Equipment)
        })

        it('does not update lastActiveView for non-main views', () => {
            useUIStore.getState().setActiveView(View.Plants)
            useUIStore.getState().setActiveView(View.Settings)
            expect(useUIStore.getState().lastActiveView).toBe(View.Plants)
        })
    })

    describe('setOnboardingStep', () => {
        it('sets the onboarding step', () => {
            useUIStore.getState().setOnboardingStep(3)
            expect(useUIStore.getState().onboardingStep).toBe(3)
        })
    })

    describe('notifications', () => {
        it('adds a notification', () => {
            useUIStore.getState().addNotification({ message: 'Test', type: 'success' })
            const notifs = useUIStore.getState().notifications
            expect(notifs).toHaveLength(1)
            expect(notifs[0]?.message).toBe('Test')
            expect(notifs[0]?.type).toBe('success')
        })

        it('removes a notification by id', () => {
            useUIStore.getState().addNotification({ message: 'A', type: 'info' })
            const id = useUIStore.getState().notifications[0]?.id ?? 0
            useUIStore.getState().removeNotification(id)
            expect(useUIStore.getState().notifications).toHaveLength(0)
        })

        it('can add multiple notifications', () => {
            useUIStore.getState().addNotification({ message: 'A', type: 'info' })
            useUIStore.getState().addNotification({ message: 'B', type: 'error' })
            expect(useUIStore.getState().notifications).toHaveLength(2)
        })
    })

    describe('setAppReady', () => {
        it('sets app ready state', () => {
            expect(useUIStore.getState().isAppReady).toBe(false)
            useUIStore.getState().setAppReady(true)
            expect(useUIStore.getState().isAppReady).toBe(true)
        })
    })

    describe('command palette', () => {
        it('opens and closes command palette', () => {
            useUIStore.getState().setIsCommandPaletteOpen(true)
            expect(useUIStore.getState().isCommandPaletteOpen).toBe(true)
            useUIStore.getState().setIsCommandPaletteOpen(false)
            expect(useUIStore.getState().isCommandPaletteOpen).toBe(false)
        })
    })

    describe('add modal', () => {
        it('opens the add modal without strain', () => {
            useUIStore.getState().openAddModal()
            expect(useUIStore.getState().isAddModalOpen).toBe(true)
            expect(useUIStore.getState().strainToEdit).toBeNull()
        })

        it('close modal resets state', () => {
            useUIStore.getState().openAddModal()
            useUIStore.getState().closeAddModal()
            expect(useUIStore.getState().isAddModalOpen).toBe(false)
            expect(useUIStore.getState().strainToEdit).toBeNull()
        })
    })

    describe('export modal', () => {
        it('opens and closes export modal', () => {
            useUIStore.getState().openExportModal()
            expect(useUIStore.getState().isExportModalOpen).toBe(true)
            useUIStore.getState().closeExportModal()
            expect(useUIStore.getState().isExportModalOpen).toBe(false)
        })
    })

    describe('action modal', () => {
        it('opens action modal with plantId and type', () => {
            useUIStore.getState().openActionModal({ plantId: 'p1', type: 'watering' })
            const modal = useUIStore.getState().actionModal
            expect(modal.isOpen).toBe(true)
            expect(modal.plantId).toBe('p1')
            expect(modal.type).toBe('watering')
        })

        it('closes action modal', () => {
            useUIStore.getState().openActionModal({ plantId: 'p1', type: 'watering' })
            useUIStore.getState().closeActionModal()
            const modal = useUIStore.getState().actionModal
            expect(modal.isOpen).toBe(false)
            expect(modal.plantId).toBeNull()
        })
    })

    describe('deep dive modal', () => {
        it('opens deep dive modal', () => {
            useUIStore.getState().openDeepDiveModal({ plantId: 'p2', topic: 'nutrients' })
            const modal = useUIStore.getState().deepDiveModal
            expect(modal.isOpen).toBe(true)
            expect(modal.plantId).toBe('p2')
            expect(modal.topic).toBe('nutrients')
        })

        it('closes deep dive modal', () => {
            useUIStore.getState().openDeepDiveModal({ plantId: 'p2', topic: 'nutrients' })
            useUIStore.getState().closeDeepDiveModal()
            expect(useUIStore.getState().deepDiveModal.isOpen).toBe(false)
        })
    })

    describe('diagnostics modal', () => {
        it('opens diagnostics modal with plant id', () => {
            useUIStore.getState().openDiagnosticsModal('plant-99')
            expect(useUIStore.getState().isDiagnosticsModalOpen).toBe(true)
            expect(useUIStore.getState().diagnosticsPlantId).toBe('plant-99')
        })

        it('closes diagnostics modal', () => {
            useUIStore.getState().openDiagnosticsModal('plant-99')
            useUIStore.getState().closeDiagnosticsModal()
            expect(useUIStore.getState().isDiagnosticsModalOpen).toBe(false)
            expect(useUIStore.getState().diagnosticsPlantId).toBeNull()
        })
    })

    describe('equipment and knowledge tabs', () => {
        it('sets equipment view tab', () => {
            useUIStore.getState().setEquipmentViewTab(EquipmentViewTab.IotDashboard)
            expect(useUIStore.getState().equipmentViewTab).toBe(EquipmentViewTab.IotDashboard)
        })

        it('sets knowledge view tab', () => {
            useUIStore.getState().setKnowledgeViewTab(KnowledgeViewTab.Lexikon)
            expect(useUIStore.getState().knowledgeViewTab).toBe(KnowledgeViewTab.Lexikon)
        })
    })

    describe('mentor plant id', () => {
        it('sets active mentor plant id', () => {
            useUIStore.getState().setActiveMentorPlantId('plant-1')
            expect(useUIStore.getState().activeMentorPlantId).toBe('plant-1')
        })

        it('clears mentor plant id', () => {
            useUIStore.getState().setActiveMentorPlantId('plant-1')
            useUIStore.getState().setActiveMentorPlantId(null)
            expect(useUIStore.getState().activeMentorPlantId).toBeNull()
        })
    })

    describe('grow flow', () => {
        it('starts grow in slot', () => {
            useUIStore.getState().startGrowInSlot(0)
            const flow = useUIStore.getState().newGrowFlow
            expect(flow.status).toBe('selectingStrain')
            expect(flow.slotIndex).toBe(0)
        })

        it('cancels grow flow', () => {
            useUIStore.getState().startGrowInSlot(1)
            useUIStore.getState().cancelNewGrow()
            const flow = useUIStore.getState().newGrowFlow
            expect(flow.status).toBe('idle')
            expect(flow.slotIndex).toBeNull()
        })
    })

    describe('voice control', () => {
        it('sets voice listening state', () => {
            useUIStore.getState().setVoiceListening(true)
            expect(useUIStore.getState().voiceControl.isListening).toBe(true)
            useUIStore.getState().setVoiceListening(false)
            expect(useUIStore.getState().voiceControl.isListening).toBe(false)
        })

        it('sets voice status message', () => {
            useUIStore.getState().setVoiceStatusMessage('Listening...')
            expect(useUIStore.getState().voiceControl.statusMessage).toBe('Listening...')
            useUIStore.getState().setVoiceStatusMessage(null)
            expect(useUIStore.getState().voiceControl.statusMessage).toBeNull()
        })
    })

    describe('sync state', () => {
        it('sets sync status', () => {
            useUIStore.getState().setSyncStatus('syncing')
            expect(useUIStore.getState().syncState.status).toBe('syncing')
        })

        it('sets sync status with error message', () => {
            useUIStore.getState().setSyncStatus('error', 'Network failed')
            expect(useUIStore.getState().syncState.status).toBe('error')
            expect(useUIStore.getState().syncState.errorMessage).toBe('Network failed')
        })

        it('clears sync conflict', () => {
            useUIStore.getState().clearSyncConflict()
            expect(useUIStore.getState().syncState.status).toBe('synced')
            expect(useUIStore.getState().syncState.conflictInfo).toBeNull()
        })

        it('sets last sync timestamp', () => {
            const ts = Date.now()
            useUIStore.getState().setSyncLastSyncAt(ts)
            expect(useUIStore.getState().syncState.lastSyncAt).toBe(ts)
        })

        it('sets pending retries', () => {
            useUIStore.getState().setSyncPendingRetries(3)
            expect(useUIStore.getState().syncState.pendingRetries).toBe(3)
        })
    })

    describe('hydrateUI', () => {
        it('merges partial state', () => {
            useUIStore.getState().hydrateUI({ onboardingStep: 5 })
            expect(useUIStore.getState().onboardingStep).toBe(5)
            // Other state unchanged
            expect(useUIStore.getState().activeView).toBe(View.Plants)
        })
    })
    describe('requestProviderConsent', () => {
        it('joins the open prompt instead of replacing it when two calls race', async () => {
            const store = useUIStore.getState()

            // Two AI calls reach the consent gate before the user has answered.
            const first = store.requestProviderConsent('gemini')
            const second = useUIStore.getState().requestProviderConsent('gemini')

            // The user answers once.
            useUIStore.getState().resolveProviderConsent(true)

            // Both callers must settle. Before the dedupe, the second request
            // overwrote the first one's resolver and `first` hung forever.
            await expect(Promise.all([first, second])).resolves.toEqual([true, true])
            expect(useUIStore.getState().providerConsentRequest).toBeNull()
        })

        it('queues a request for a different provider behind the open prompt', async () => {
            const first = useUIStore.getState().requestProviderConsent('gemini')
            // A second provider cannot be active at the same time today, but the
            // store must not clobber the open prompt if that ever changes.
            const second = useUIStore.getState().requestProviderConsent('openai')

            useUIStore.getState().resolveProviderConsent(true)
            await expect(first).resolves.toBe(true)

            // The queued request opens its own prompt once the first is answered.
            await vi.waitFor(() => {
                expect(useUIStore.getState().providerConsentRequest?.provider).toBe('openai')
            })
            useUIStore.getState().resolveProviderConsent(false)

            await expect(second).resolves.toBe(false)
            expect(useUIStore.getState().providerConsentRequest).toBeNull()
        })

        it('propagates a denial to every waiting caller', async () => {
            const first = useUIStore.getState().requestProviderConsent('gemini')
            const second = useUIStore.getState().requestProviderConsent('gemini')

            useUIStore.getState().resolveProviderConsent(false)

            await expect(Promise.all([first, second])).resolves.toEqual([false, false])
        })
    })
})
