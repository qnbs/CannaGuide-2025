import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import {
    OFFLINE_ACTION_TYPES,
    SW_MESSAGE_REPLAY_OFFLINE_ACTION,
    SW_MESSAGE_REPLAY_OFFLINE_ACTION_ACK,
} from '@/constants/offlineActions'
import { JournalEntryType } from '@/types'
import { plantSimulationService } from '@/services/plantSimulationService'
import simulationReducer, {
    addPlant,
    applyQueuedJournalEntry,
} from '@/stores/slices/simulationSlice'
import settingsReducer, { defaultSettings } from '@/stores/slices/settingsSlice'
import type { AppStore } from '@/stores/store'
import { StrainType, type Strain } from '@/types'

const testStrain: Strain = {
    id: 'strain-replay-test',
    name: 'Replay Strain',
    type: StrainType.Hybrid,
    thc: 20,
    cbd: 1,
    floweringTime: 60,
    floweringType: 'Photoperiod',
    agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
    geneticModifiers: {
        pestResistance: 1,
        nutrientUptakeRate: 1,
        stressTolerance: 1,
        rue: 1,
        vpdTolerance: { min: 0.8, max: 1.4 },
        transpirationFactor: 1,
        stomataSensitivity: 1,
    },
}

const testSetup = {
    lightType: 'LED' as const,
    lightWattage: 300,
    lightHours: 18,
    ventilation: 'medium' as const,
    hasCirculationFan: true,
    potSize: 10,
    potType: 'Fabric' as const,
    medium: 'Soil' as const,
    dynamicLighting: false,
}

const createTestStore = (): AppStore =>
    configureStore({
        reducer: combineReducers({ simulation: simulationReducer, settings: settingsReducer }),
        preloadedState: { settings: { settings: defaultSettings, version: 4 } },
    }) as unknown as AppStore

const makeEntry = (id: string) => ({
    id,
    createdAt: 1_700_000_000_000,
    type: JournalEntryType.Observation,
    notes: 'Offline note',
})

describe('offlineActionReplayService', () => {
    beforeEach(() => {
        vi.stubGlobal('navigator', {
            serviceWorker: {
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            },
        })
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('replays journal entries idempotently', async () => {
        const { replayOfflineAction } = await import('./offlineActionReplayService')
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Replay Plant')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))

        const entry = makeEntry('journal-p1-offline')
        const replayed = replayOfflineAction(store, {
            type: OFFLINE_ACTION_TYPES.ADD_JOURNAL_ENTRY,
            plantId: plant.id,
            entry,
            idempotencyKey: `journal-entry-${plant.id}-${entry.id}`,
        })

        expect(replayed).toBe(true)
        expect(store.getState().simulation.plants.entities[plant.id]?.journal).toHaveLength(1)

        replayOfflineAction(store, {
            type: OFFLINE_ACTION_TYPES.ADD_JOURNAL_ENTRY,
            plantId: plant.id,
            entry,
            idempotencyKey: `journal-entry-${plant.id}-${entry.id}`,
        })
        expect(store.getState().simulation.plants.entities[plant.id]?.journal).toHaveLength(1)
    })

    it('applyQueuedJournalEntry merges without duplicate ids', () => {
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Merge Plant')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        const entry = makeEntry('journal-merge-1')
        store.dispatch(applyQueuedJournalEntry({ plantId: plant.id, entry }))
        store.dispatch(applyQueuedJournalEntry({ plantId: plant.id, entry }))
        expect(store.getState().simulation.plants.entities[plant.id]?.journal).toHaveLength(1)
    })

    it('registers a service worker message listener', async () => {
        const { registerOfflineActionReplayListener } = await import('./offlineActionReplayService')
        const store = createTestStore()
        const unregister = registerOfflineActionReplayListener(store)
        expect(navigator.serviceWorker.addEventListener).toHaveBeenCalled()
        unregister()
        expect(navigator.serviceWorker.removeEventListener).toHaveBeenCalled()
    })

    it('acknowledges a replay only after persisted state flush succeeds', async () => {
        const { registerOfflineActionReplayListener } = await import('./offlineActionReplayService')
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Ack Plant')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        const entry = makeEntry('journal-ack-1')
        const addEventListener = vi.mocked(navigator.serviceWorker.addEventListener)
        const flushPersistedState = vi.fn<() => Promise<boolean>>()
        let resolveFlush: ((persisted: boolean) => void) | undefined
        flushPersistedState.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveFlush = resolve
                }),
        )
        const replyPort = { postMessage: vi.fn(), close: vi.fn() }
        const unregister = registerOfflineActionReplayListener(store, flushPersistedState)
        const listener = addEventListener.mock.calls.at(-1)?.[1] as unknown as (
            event: MessageEvent,
        ) => Promise<void>

        const handling = listener({
            data: {
                type: SW_MESSAGE_REPLAY_OFFLINE_ACTION,
                queueId: 42,
                payload: {
                    type: OFFLINE_ACTION_TYPES.ADD_JOURNAL_ENTRY,
                    plantId: plant.id,
                    entry,
                },
            },
            ports: [replyPort],
        } as unknown as MessageEvent)

        expect(store.getState().simulation.plants.entities[plant.id]?.journal).toHaveLength(1)
        expect(flushPersistedState).toHaveBeenCalledOnce()
        expect(replyPort.postMessage).not.toHaveBeenCalled()

        resolveFlush?.(true)
        await handling

        expect(replyPort.postMessage).toHaveBeenCalledWith({
            type: SW_MESSAGE_REPLAY_OFFLINE_ACTION_ACK,
            queueId: 42,
            persisted: true,
        })
        expect(replyPort.close).toHaveBeenCalledOnce()
        unregister()
    })

    it('sends a negative acknowledgement when persistence fails', async () => {
        const { registerOfflineActionReplayListener } = await import('./offlineActionReplayService')
        const store = createTestStore()
        const plant = plantSimulationService.createPlant(testStrain, testSetup, 'Failed Ack Plant')
        store.dispatch(addPlant({ plant, slotIndex: 0 }))
        const entry = makeEntry('journal-ack-fail')
        const addEventListener = vi.mocked(navigator.serviceWorker.addEventListener)
        const flushPersistedState = vi.fn().mockResolvedValue(false)
        const replyPort = { postMessage: vi.fn(), close: vi.fn() }
        const unregister = registerOfflineActionReplayListener(store, flushPersistedState)
        const listener = addEventListener.mock.calls.at(-1)?.[1] as unknown as (
            event: MessageEvent,
        ) => Promise<void>

        await listener({
            data: {
                type: SW_MESSAGE_REPLAY_OFFLINE_ACTION,
                queueId: 43,
                payload: {
                    type: OFFLINE_ACTION_TYPES.ADD_JOURNAL_ENTRY,
                    plantId: plant.id,
                    entry,
                },
            },
            ports: [replyPort],
        } as unknown as MessageEvent)

        expect(replyPort.postMessage).toHaveBeenCalledWith({
            type: SW_MESSAGE_REPLAY_OFFLINE_ACTION_ACK,
            queueId: 43,
            persisted: false,
        })
        expect(replyPort.close).toHaveBeenCalledOnce()
        unregister()
    })
})
