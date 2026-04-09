import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { configureStore, combineReducers } from '@reduxjs/toolkit'
import settingsReducer, { setSetting, defaultSettings } from './slices/settingsSlice'
import simulationReducer, {
    addPlant,
    plantStateUpdated,
    resetPlants,
} from './slices/simulationSlice'
import favoritesReducer, {
    addMultipleToFavorites,
    removeMultipleFromFavorites,
} from './slices/favoritesSlice'
import archivesReducer, { clearArchives } from './slices/archivesSlice'
import userStrainsReducer, {
    addUserStrain,
    deleteUserStrain,
    deleteMultipleUserStrains,
} from './slices/userStrainsSlice'
import savedItemsReducer from './slices/savedItemsSlice'
import nutrientPlannerReducer from './slices/nutrientPlannerSlice'
import growsReducer, { addGrow, removeGrow } from './slices/growsSlice'
import type { AppStore } from './store'
import { PlantStage, StrainType, View } from '@/types'
import type { Plant } from '@/types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const addNotificationMock = vi.fn()
const setVoiceStatusMessageMock = vi.fn()

vi.mock('@/stores/useUIStore', () => ({
    getUISnapshot: () => ({
        addNotification: addNotificationMock,
        setVoiceStatusMessage: setVoiceStatusMessageMock,
        activeView: View.Strains,
    }),
    useUIStore: {
        subscribe: vi.fn(() => vi.fn()),
        getState: () => ({
            activeView: View.Strains,
            voiceControl: { lastTranscript: '' },
            onboardingStep: 0,
        }),
    },
}))

vi.mock('@/stores/useFiltersStore', () => ({
    useFiltersStore: {
        subscribe: vi.fn(() => vi.fn()),
        getState: () => ({
            searchTerm: '',
            typeFilter: null,
            showFavoritesOnly: false,
            advancedFilters: {},
            letterFilter: null,
            sortKey: 'name',
            sortDirection: 'asc',
        }),
    },
    getFiltersSnapshot: () => ({
        searchTerm: '',
        typeFilter: null,
        showFavoritesOnly: false,
        advancedFilters: {},
        letterFilter: null,
        sortKey: 'name',
        sortDirection: 'asc',
    }),
}))

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
    i18nInstance: {
        language: 'en',
        hasResourceBundle: () => true,
        addResourceBundle: vi.fn(),
        changeLanguage: vi.fn(),
    },
    loadLocale: vi.fn(),
}))

vi.mock('@/services/aiService', () => ({
    aiService: { getMentorResponse: vi.fn() },
    setAiMode: vi.fn(),
}))

vi.mock('@/services/localOnlyModeService', () => ({
    setLocalOnlyMode: vi.fn(),
}))

vi.mock('@/services/sentryService', () => ({
    disableSentry: vi.fn(),
    enableSentry: vi.fn(),
}))

vi.mock('@/services/aiEcoModeService', () => ({
    setEcoModeExplicit: vi.fn(),
}))

vi.mock('@/services/urlService', () => ({
    urlService: { serializeFiltersToQueryString: vi.fn(() => '') },
}))

vi.mock('@/services/ttsService', () => ({
    ttsService: { speak: vi.fn() },
}))

vi.mock('@/services/voiceCommandRegistry', () => ({
    buildVoiceCommands: vi.fn(() => []),
    matchVoiceCommand: vi.fn(() => null),
}))

vi.mock('@sentry/react', () => ({
    captureException: vi.fn(),
    addBreadcrumb: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

const { listenerMiddleware } = await import('./listenerMiddleware')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makePlant = (id = 'plant-1'): Plant =>
    ({
        id,
        growId: 'default-grow',
        name: `Test Plant ${id}`,
        strain: {
            id: 's1',
            name: 'Test Strain',
            type: StrainType.Hybrid,
            floweringType: 'Photoperiod',
            thc: 20,
            cbd: 1,
            floweringTime: 60,
            agronomic: { difficulty: 'Easy', yield: 'High', height: 'Medium' },
            geneticModifiers: {
                pestResistance: 1,
                nutrientUptakeRate: 1,
                stressTolerance: 1,
                rue: 1,
                vpdTolerance: { min: 0.4, max: 1.6 },
                transpirationFactor: 1,
                stomataSensitivity: 1,
            },
        },
        mediumType: 'Soil',
        createdAt: 1700000000000,
        lastUpdated: 1700000000000,
        age: 7,
        stage: PlantStage.Vegetative,
        health: 90,
        stressLevel: 5,
        height: 20,
        biomass: { total: 50, stem: 15, leaves: 25, flowers: 10 },
        leafAreaIndex: 2.5,
        isTopped: false,
        lstApplied: 0,
        environment: { internalTemperature: 25, internalHumidity: 60, vpd: 1.2, co2Level: 400 },
        medium: {
            ph: 6.2,
            ec: 1.0,
            moisture: 60,
            microbeHealth: 80,
            substrateWater: 2000,
            nutrientConcentration: { nitrogen: 0.5, phosphorus: 0.3, potassium: 0.4 },
        },
        nutrientPool: { nitrogen: 50, phosphorus: 30, potassium: 40 },
        rootSystem: { health: 85, rootMass: 10 },
        equipment: {
            light: { type: 'LED', wattage: 300, isOn: true, lightHours: 18 },
            exhaustFan: { power: 'medium', isOn: true },
            circulationFan: { isOn: true },
            potSize: 11,
            potType: 'Fabric',
        },
        problems: [],
        journal: [],
        tasks: [],
        harvestData: null,
        structuralModel: { branches: 4, nodes: 8 },
        history: [],
        cannabinoidProfile: { thc: 0.1, cbd: 0.05, cbn: 0 },
        terpeneProfile: { myrcene: 0.3 },
        stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
        simulationClock: { accumulatedDayMs: 0 },
    }) as Plant

const rootReducer = combineReducers({
    simulation: simulationReducer,
    settings: settingsReducer,
    favorites: favoritesReducer,
    archives: archivesReducer,
    userStrains: userStrainsReducer,
    savedItems: savedItemsReducer,
    nutrientPlanner: nutrientPlannerReducer,
    grows: growsReducer,
})

function createTestStore() {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({ serializableCheck: false }).prepend(
                listenerMiddleware.middleware,
            ),
        preloadedState: {
            settings: {
                settings: {
                    ...defaultSettings,
                    notifications: { ...defaultSettings.notifications, enabled: false },
                },
                version: 4,
            },
        },
    }) as unknown as AppStore
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('listenerMiddleware', () => {
    let store: AppStore

    beforeEach(() => {
        store = createTestStore()
        addNotificationMock.mockClear()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    // -- setSetting listeners -------------------------------------------------

    describe('setSetting listeners', () => {
        it('syncs AI mode when aiMode setting changes', async () => {
            const { setAiMode } = await import('@/services/aiService')
            store.dispatch(setSetting({ path: 'aiMode', value: 'local' }))

            // Wait for async effect
            await vi.waitFor(() => {
                expect(setAiMode).toHaveBeenCalledWith('local')
            })
        })

        it('syncs local-only mode and disables sentry when enabled', async () => {
            const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
            const { disableSentry } = await import('@/services/sentryService')

            store.dispatch(setSetting({ path: 'privacy.localOnlyMode', value: true }))

            await vi.waitFor(() => {
                expect(setLocalOnlyMode).toHaveBeenCalledWith(true)
                expect(disableSentry).toHaveBeenCalled()
            })
        })

        it('enables sentry when local-only mode is disabled', async () => {
            const { enableSentry } = await import('@/services/sentryService')

            store.dispatch(setSetting({ path: 'privacy.localOnlyMode', value: false }))

            await vi.waitFor(() => {
                expect(enableSentry).toHaveBeenCalled()
            })
        })

        it('syncs eco mode setting', async () => {
            const { setEcoModeExplicit } = await import('@/services/aiEcoModeService')

            store.dispatch(setSetting({ path: 'localAi.ecoMode', value: true }))

            await vi.waitFor(() => {
                expect(setEcoModeExplicit).toHaveBeenCalledWith(true)
            })
        })
    })

    // -- Notification listeners -----------------------------------------------

    describe('notification listeners', () => {
        it('notifies on addUserStrain', () => {
            store.dispatch(
                addUserStrain({
                    id: 'us1',
                    name: 'My Strain',
                    type: StrainType.Indica,
                    floweringType: 'Photoperiod',
                    thc: 18,
                    cbd: 0.5,
                    floweringTime: 56,
                } as never),
            )

            expect(addNotificationMock).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'success' }),
            )
        })

        it('notifies on deleteUserStrain', () => {
            // Add then remove
            store.dispatch(
                addUserStrain({
                    id: 'us-del',
                    name: 'To Delete',
                    type: StrainType.Sativa,
                    floweringType: 'Autoflower',
                    thc: 15,
                    cbd: 1,
                    floweringTime: 50,
                } as never),
            )
            addNotificationMock.mockClear()

            store.dispatch(deleteUserStrain('us-del'))
            expect(addNotificationMock).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'info' }),
            )
        })

        it('notifies on deleteMultipleUserStrains', () => {
            store.dispatch(deleteMultipleUserStrains(['id1', 'id2', 'id3']))

            expect(addNotificationMock).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'info' }),
            )
        })

        it('notifies on addMultipleToFavorites', () => {
            store.dispatch(addMultipleToFavorites(['s1', 's2']))

            expect(addNotificationMock).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'success' }),
            )
        })

        it('notifies on removeMultipleFromFavorites', () => {
            store.dispatch(addMultipleToFavorites(['s1', 's2']))
            addNotificationMock.mockClear()

            store.dispatch(removeMultipleFromFavorites(['s1', 's2']))
            expect(addNotificationMock).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'info' }),
            )
        })

        it('notifies on clearArchives', () => {
            store.dispatch(clearArchives())

            expect(addNotificationMock).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'success' }),
            )
        })

        it('notifies on resetPlants', () => {
            store.dispatch(resetPlants())

            expect(addNotificationMock).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'success' }),
            )
        })
    })

    // -- plantStateUpdated problem detection ----------------------------------

    describe('plantStateUpdated problem detection', () => {
        it('creates notification when a new problem is detected', async () => {
            const plant = makePlant('plant-prob')
            store.dispatch(addPlant({ plant, slotIndex: 0 }))
            addNotificationMock.mockClear()

            // Dispatch plantStateUpdated with a new active problem
            store.dispatch(
                plantStateUpdated({
                    updatedPlant: {
                        ...plant,
                        problems: [
                            { type: 'high_temperature', status: 'active', timestamp: Date.now() },
                        ],
                    } as never,
                    newJournalEntries: [],
                    newTasks: [],
                }),
            )

            // Wait for async effect
            await vi.waitFor(() => {
                expect(addNotificationMock).toHaveBeenCalledWith(
                    expect.objectContaining({ type: 'error' }),
                )
            })
        })
    })

    // -- addGrow listener ----------------------------------------------------

    describe('addGrow listener', () => {
        it('sets newly added grow as active', () => {
            store.dispatch(
                addGrow({
                    id: 'grow-new',
                    name: 'New Grow',
                    isActive: false,
                }),
            )

            const state = store.getState()
            expect(state.grows.activeGrowId).toBe('grow-new')
        })
    })

    // -- removeGrow listener --------------------------------------------------

    describe('removeGrow listener', () => {
        it('notifies on grow removal', () => {
            store.dispatch(
                addGrow({
                    id: 'grow-rm',
                    name: 'To Remove',
                    isActive: false,
                }),
            )
            addNotificationMock.mockClear()

            store.dispatch(removeGrow('grow-rm'))
            expect(addNotificationMock).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'info' }),
            )
        })
    })
})
