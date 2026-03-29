import { createListenerMiddleware, isAnyOf, TypedStartListening } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from './store'
import { i18nInstance, getT, loadLocale, SupportedLocale } from '@/i18n'
import { Language, Strain, View } from '@/types'
import type { AiMode, PlantProblem } from '@/types'
import { setSetting, exportAllData, resetAllData } from './slices/settingsSlice'
import {
    plantStateUpdated,
    resetPlants,
    addJournalEntry,
    waterAllPlants,
} from './slices/simulationSlice'
import {
    addNotification,
    setOnboardingStep,
    setActiveView,
    processVoiceCommand,
    setVoiceStatusMessage,
} from './slices/uiSlice'
import { useFiltersStore, getFiltersSnapshot } from './useFiltersStore'
import { urlService } from '@/services/urlService'
import { ttsService } from '@/services/ttsService'

// Import actions to listen for
import { addUserStrain, updateUserStrain, deleteUserStrain } from './slices/userStrainsSlice'
import {
    addStrainTip,
    updateStrainTip,
    deleteStrainTip,
    addSetup,
    updateSetup,
    deleteSetup,
    addExport,
} from './slices/savedItemsSlice'
import { addArchivedMentorResponse, clearArchives } from './slices/archivesSlice'
import { addMultipleToFavorites, removeMultipleFromFavorites } from './slices/favoritesSlice'

export const listenerMiddleware = createListenerMiddleware()

type AppStartListening = TypedStartListening<RootState, AppDispatch>
const startAppListening = listenerMiddleware.startListening as AppStartListening

const getAiService = async () => {
    const module = await import('@/services/aiService')
    return module.aiService
}

const syncAiMode = async (mode: AiMode) => {
    const { setAiMode } = await import('@/services/aiService')
    setAiMode(mode)
}

const syncLocalOnlyMode = async (enabled: boolean) => {
    const { setLocalOnlyMode } = await import('@/services/localOnlyModeService')
    setLocalOnlyMode(enabled)
    if (enabled) {
        const { disableSentry } = await import('@/services/sentryService')
        disableSentry()
    } else {
        const { enableSentry } = await import('@/services/sentryService')
        enableSentry()
    }
}

/**
 * Listener to synchronize the AI execution mode when the setting is updated.
 */
startAppListening({
    actionCreator: setSetting,
    effect: async (action) => {
        if (action.payload.path === 'aiMode') {
            await syncAiMode(action.payload.value as AiMode)
        }
        if (action.payload.path === 'privacy.localOnlyMode') {
            await syncLocalOnlyMode(action.payload.value as boolean)
        }
        if (action.payload.path === 'localAi.ecoMode') {
            const { setEcoModeExplicit } = await import('@/services/aiEcoModeService')
            setEcoModeExplicit(action.payload.value as boolean)
        }
    },
})

/**
 * Listener to automatically change the i18n language when the setting is updated.
 */
startAppListening({
    actionCreator: setSetting,
    effect: async (action) => {
        if (action.payload.path === 'general.language') {
            const newLang = action.payload.value as Language
            if (i18nInstance.language !== newLang) {
                // Load the new language bundle on demand if not already loaded
                if (!i18nInstance.hasResourceBundle(newLang, 'translation')) {
                    const translations = await loadLocale(newLang as SupportedLocale)
                    i18nInstance.addResourceBundle(newLang, 'translation', translations)
                }
                await i18nInstance.changeLanguage(newLang)
            }
        }
    },
})

/**
 * Listener to create notifications when a new plant problem is detected.
 */
startAppListening({
    actionCreator: plantStateUpdated,
    effect: async (action, listenerApi) => {
        const { updatedPlant } = action.payload
        const previousState = listenerApi.getOriginalState() as RootState
        const oldPlant = previousState.simulation.plants.entities[updatedPlant.id]

        if (!oldPlant) return

        const oldProblems = new Set(
            oldPlant.problems
                .filter((p: PlantProblem) => p.status === 'active')
                .map((p: PlantProblem) => p.type),
        )
        const newProblems = updatedPlant.problems.filter((p: PlantProblem) => p.status === 'active')

        newProblems.forEach((problem: PlantProblem) => {
            if (!oldProblems.has(problem.type)) {
                const t = getT()
                const problemKey = problem.type
                    .toLowerCase()
                    .replace(/_(\w)/g, (_: string, c: string) => c.toUpperCase())
                const message = `${updatedPlant.name}: ${t(`problemMessages.${problemKey}.message`)}`
                listenerApi.dispatch(addNotification({ message, type: 'error' }))
            }
        })
    },
})

let audioCtx: AudioContext | null = null
const playConfirmationSound = () => {
    if (!audioCtx) {
        const AudioContextCtor =
            window.AudioContext ||
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AudioContextCtor) return
        audioCtx = new AudioContextCtor()
    }

    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime) // A6
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime)

    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3)
    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 0.3)
}

const ASSISTANT_PREFIXES = [
    'gemini',
    'ask gemini',
    'assistant',
    'ki',
    'frage ki',
    'frage den mentor',
] as const

const parseAssistantQuery = (transcript: string): string | null => {
    for (const prefix of ASSISTANT_PREFIXES) {
        if (!transcript.startsWith(prefix)) continue
        const rawQuery = transcript.slice(prefix.length).trim()
        return rawQuery.length > 0 ? rawQuery : null
    }

    return null
}

/**
 * Listener to process recognized voice commands.
 */
startAppListening({
    actionCreator: processVoiceCommand,
    effect: async (action, { dispatch, getState }) => {
        const transcript = action.payload.toLowerCase()
        const t = getT()
        const state = getState()

        const query = parseAssistantQuery(transcript)
        if (query) {
            const selectedPlantId =
                state.simulation.selectedPlantId ??
                state.simulation.plantSlots.find((slot) => slot !== null) ??
                null
            const plant = selectedPlantId ? state.simulation.plants.entities[selectedPlantId] : null

            if (!plant) {
                dispatch(setVoiceStatusMessage(t('voiceControl.errors.noPlantContext')))
                setTimeout(() => dispatch(setVoiceStatusMessage(null)), 4000)
                return
            }

            dispatch(setVoiceStatusMessage(t('voiceControl.assistantThinking')))
            try {
                const language = state.settings.settings.general.language
                const aiService = await getAiService()
                const response = await aiService.getMentorResponse(plant, query, language)
                const speechText = `${response.title}. ${response.content}`.slice(0, 320)
                dispatch(addNotification({ message: response.title, type: 'info' }))
                ttsService.speak(
                    speechText,
                    language,
                    () => dispatch(setVoiceStatusMessage(null)),
                    state.settings.settings.tts,
                )
                dispatch(setVoiceStatusMessage(response.content))
            } catch (error) {
                console.error('Voice assistant response failed:', error)
                dispatch(setVoiceStatusMessage(t('voiceControl.errors.assistantFailed')))
                setTimeout(() => dispatch(setVoiceStatusMessage(null)), 5000)
            }

            return
        }

        // --- Define Voice Commands ---
        const commands = [
            // Navigation
            {
                match: [t('nav.plants').toLowerCase(), 'show garden', 'gehe zu pflanzen'],
                action: () => dispatch(setActiveView(View.Plants)),
            },
            {
                match: ['open yield predictor', 'yield predictor öffnen', 'yield prognose öffnen'],
                action: () => dispatch(setActiveView(View.Plants)),
            },
            {
                match: ['open ar preview', 'ar vorschau öffnen', 'breeding preview öffnen'],
                action: () => dispatch(setActiveView(View.Knowledge)),
            },
            {
                match: [t('nav.strains').toLowerCase(), 'show strains', 'gehe zu sorten'],
                action: () => dispatch(setActiveView(View.Strains)),
            },
            {
                match: [t('nav.equipment').toLowerCase(), 'gehe zu ausrüstung'],
                action: () => dispatch(setActiveView(View.Equipment)),
            },
            {
                match: [t('nav.knowledge').toLowerCase(), 'show knowledge', 'gehe zu wissen'],
                action: () => dispatch(setActiveView(View.Knowledge)),
            },
            {
                match: [t('nav.settings').toLowerCase(), 'show settings', 'gehe zu einstellungen'],
                action: () => dispatch(setActiveView(View.Settings)),
            },
            {
                match: ['open settings', 'settings öffnen', 'settings offnen'],
                action: () => dispatch(setActiveView(View.Settings)),
            },
            {
                match: [t('nav.help').toLowerCase(), 'show help', 'gehe zu hilfe'],
                action: () => dispatch(setActiveView(View.Help)),
            },
            {
                match: ['open help', 'hilfe öffnen', 'hilfe offnen'],
                action: () => dispatch(setActiveView(View.Help)),
            },
            {
                match: ['read sensors', 'sensoren lesen', 'sensor hub öffnen'],
                action: () => dispatch(setActiveView(View.Plants)),
            },

            // Strain Actions
            {
                match: [
                    `${t('common.search', { lng: 'en' }).toLowerCase()} for`,
                    `${t('common.search', { lng: 'de' }).toLowerCase()} nach`,
                ],
                action: () => {
                    const searchTerm = transcript.split(/search for|suche nach/i)[1]?.trim()
                    if (searchTerm) {
                        dispatch(setActiveView(View.Strains))
                        useFiltersStore.getState().setSearchTerm(searchTerm)
                    }
                },
            },
            {
                match: [t('strainsView.resetFilters').toLowerCase(), 'filter zurücksetzen'],
                action: () => useFiltersStore.getState().resetAllFilters(),
            },
            {
                match: [
                    t('strainsView.tabs.favorites').toLowerCase(),
                    'show favorites',
                    'zeige favoriten',
                ],
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    useFiltersStore.getState().setShowFavoritesOnly(true)
                },
            },

            // Plant Actions
            {
                match: [t('plantsView.summary.waterAll').toLowerCase(), 'alle pflanzen gießen'],
                action: () => dispatch(waterAllPlants()),
            },
            { match: ['water all plants', 'water all'], action: () => dispatch(waterAllPlants()) },

            // UI Control
            {
                match: ['go back', 'zurück'],
                action: () => {
                    const { activeView, lastActiveView } = getState().ui
                    if (activeView !== lastActiveView) {
                        dispatch(setActiveView(lastActiveView))
                    }
                },
            },
        ]

        let commandFound = false
        for (const cmd of commands) {
            if (cmd.match.some((keyword) => transcript.startsWith(keyword))) {
                cmd.action()
                commandFound = true
                if (getState().settings.settings.voiceControl.confirmationSound) {
                    playConfirmationSound()
                }
                break
            }
        }

        if (!commandFound) {
            dispatch(setVoiceStatusMessage(`Unknown command: "${action.payload}"`))
            setTimeout(() => dispatch(setVoiceStatusMessage(null)), 4000)
        }
    },
})

// --- URL Sync Logic for Strain Filters (via Zustand subscription) ---
let urlSyncTimeout: ReturnType<typeof setTimeout> | undefined
let getActiveView: (() => View) | null = null

/**
 * Called once from store.ts after the store is created to wire up the
 * active-view check needed by the URL sync subscription.
 */
export const initFilterUrlSync = (viewGetter: () => View): void => {
    getActiveView = viewGetter
}

// Subscribe to zustand filter changes and sync URL.
useFiltersStore.subscribe(
    (state) => ({
        searchTerm: state.searchTerm,
        typeFilter: state.typeFilter,
        showFavoritesOnly: state.showFavoritesOnly,
        advancedFilters: state.advancedFilters,
        letterFilter: state.letterFilter,
        sortKey: state.sortKey,
        sortDirection: state.sortDirection,
    }),
    () => {
        if (!getActiveView || getActiveView() !== View.Strains) {
            return
        }

        clearTimeout(urlSyncTimeout)
        urlSyncTimeout = setTimeout(() => {
            const filtersState = getFiltersSnapshot()
            const queryString = urlService.serializeFiltersToQueryString(filtersState)
            const newUrl = queryString
                ? `${window.location.pathname}?${queryString}`
                : window.location.pathname
            window.history.replaceState({}, '', newUrl)
        }, 300)
    },
    { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) },
)

// --- Centralized Notification Listeners ---
// NOTE: getT() is called lazily inside each listener to ensure the current language
// is used, not the language frozen at module-load time.

startAppListening({
    matcher: isAnyOf(addUserStrain, updateUserStrain),
    effect: (action, { dispatch }) => {
        const t = getT()
        const type = action.type.includes('addUser') ? 'add' : 'update'
        // The payload for userStrainsAdapter actions is the strain object itself.
        const strain = action.payload as Strain
        dispatch(
            addNotification({
                message: t(`strainsView.addStrainModal.validation.${type}Success`, {
                    name: strain.name,
                }),
                type: 'success',
            }),
        )
    },
})

startAppListening({
    actionCreator: addSetup.fulfilled,
    effect: (action, { dispatch }) => {
        const t = getT()
        dispatch(
            addNotification({
                message: t('equipmentView.configurator.setupSaveSuccess', {
                    name: action.payload.name,
                }),
                type: 'success',
            }),
        )
    },
})

startAppListening({
    matcher: isAnyOf(deleteSetup, deleteStrainTip, deleteUserStrain),
    effect: (action, { dispatch }) => {
        const t = getT()
        let message = 'Item removed.'
        if (action.type.includes('Export')) message = t('strainsView.exportsManager.exportRemoved')
        // Add more specific messages if needed for other types
        dispatch(addNotification({ message, type: 'info' }))
    },
})

startAppListening({
    matcher: isAnyOf(updateSetup, updateStrainTip),
    effect: (action, { dispatch }) => {
        const t = getT()
        const p = action.payload as {
            id?: string
            changes?: { name?: string; title?: string }
            name?: string
            title?: string
        }
        const payload = p.changes ?? p
        const name = payload.name || payload.title
        let message = `Item "${name}" updated.`
        if (action.type.includes('Export'))
            message = t('strainsView.exportsManager.updateExportSuccess', { name })
        dispatch(addNotification({ message, type: 'success' }))
    },
})

startAppListening({
    actionCreator: addStrainTip,
    effect: (action, { dispatch }) => {
        const t = getT()
        dispatch(
            addNotification({
                message: t('strainsView.tips.saveSuccess', { name: action.payload.strain.name }),
                type: 'success',
            }),
        )
    },
})

startAppListening({
    actionCreator: addMultipleToFavorites,
    effect: (action, { dispatch }) => {
        const t = getT()
        dispatch(
            addNotification({
                message: t('strainsView.bulkActions.addedToFavorites_other', {
                    count: action.payload.length,
                }),
                type: 'success',
            }),
        )
    },
})

startAppListening({
    actionCreator: removeMultipleFromFavorites,
    effect: (action, { dispatch }) => {
        const t = getT()
        dispatch(
            addNotification({
                message: t('strainsView.bulkActions.removedFromFavorites_other', {
                    count: action.payload.length,
                }),
                type: 'info',
            }),
        )
    },
})

startAppListening({
    actionCreator: addArchivedMentorResponse,
    effect: (_, { dispatch }) => {
        const t = getT()
        dispatch(
            addNotification({ message: t('knowledgeView.archive.saveSuccess'), type: 'success' }),
        )
    },
})

startAppListening({
    actionCreator: addExport,
    effect: (action, { dispatch }) => {
        const t = getT()
        dispatch(
            addNotification({
                message: t('common.successfullyExported_other', {
                    count: action.payload.strainIds.length,
                    format: action.payload.format.toUpperCase(),
                }),
                type: 'success',
            }),
        )
    },
})

startAppListening({
    actionCreator: addJournalEntry,
    effect: async (action, { dispatch }) => {
        const t = getT()
        if (action.payload.entry.details && 'diagnosis' in action.payload.entry.details) {
            dispatch(
                addNotification({
                    message: t('plantsView.aiDiagnostics.savedToJournal'),
                    type: 'success',
                }),
            )
        }

        // Background Sync demonstration
        if (!navigator.onLine) {
            try {
                const registration = await navigator.serviceWorker.ready
                if ('sync' in registration) {
                    await (
                        registration.sync as { register: (tag: string) => Promise<void> }
                    ).register('data-sync')
                    dispatch(
                        addNotification({ message: getT()('common.offlineQueued'), type: 'info' }),
                    )
                }
            } catch (err) {
                console.error('Background sync registration failed:', err)
            }
        }
    },
})

startAppListening({
    actionCreator: clearArchives,
    effect: (_, { dispatch }) => {
        const t = getT()
        dispatch(
            addNotification({
                message: t('settingsView.data.clearArchivesSuccess'),
                type: 'success',
            }),
        )
    },
})

startAppListening({
    actionCreator: resetPlants,
    effect: (_, { dispatch }) => {
        const t = getT()
        dispatch(
            addNotification({
                message: t('settingsView.data.resetPlantsSuccess'),
                type: 'success',
            }),
        )
    },
})

startAppListening({
    actionCreator: exportAllData.fulfilled,
    effect: (_, { dispatch }) => {
        const t = getT()
        dispatch(
            addNotification({ message: t('settingsView.data.exportSuccess'), type: 'success' }),
        )
    },
})

startAppListening({
    actionCreator: resetAllData.fulfilled,
    effect: (_, { dispatch }) => {
        const t = getT()
        dispatch(
            addNotification({ message: t('settingsView.data.resetAllSuccess'), type: 'success' }),
        )
    },
})

startAppListening({
    matcher: isAnyOf(setOnboardingStep),
    effect: (action, listenerApi) => {
        if (
            action.payload === 0 &&
            (listenerApi.getOriginalState() as RootState).settings.settings.onboardingCompleted
        ) {
            const t = getT()
            listenerApi.dispatch(
                addNotification({
                    message: t('settingsView.data.replayOnboardingSuccess'),
                    type: 'success',
                }),
            )
        }
    },
})
