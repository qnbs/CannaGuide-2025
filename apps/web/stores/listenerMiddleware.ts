import { createListenerMiddleware, isAnyOf, TypedStartListening } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from './store'
import { i18nInstance, getT, loadLocale, SupportedLocale } from '@/i18n'
import { Language, Strain, View } from '@/types'
import type { AiMode, PlantProblem } from '@/types'
import { setSetting, exportAllData, resetAllData } from './slices/settingsSlice'
import { plantStateUpdated, resetPlants, addJournalEntry } from './slices/simulationSlice'
import { getUISnapshot, useUIStore } from './useUIStore'
import { useFiltersStore, getFiltersSnapshot } from './useFiltersStore'
import { urlService } from '@/services/urlService'
import { ttsService } from '@/services/ttsService'
import { buildVoiceCommands, matchVoiceCommand } from '@/services/voiceCommandRegistry'

// Import actions to listen for
import {
    addUserStrain,
    updateUserStrain,
    deleteUserStrain,
    deleteMultipleUserStrains,
} from './slices/userStrainsSlice'
import {
    addStrainTip,
    updateStrainTip,
    deleteStrainTip,
    addSetup,
    updateSetup,
    deleteSetup,
} from './slices/savedItemsSlice'
import { addArchivedMentorResponse, clearArchives } from './slices/archivesSlice'
import { addMultipleToFavorites, removeMultipleFromFavorites } from './slices/favoritesSlice'

export const listenerMiddleware = createListenerMiddleware()

type AppStartListening = TypedStartListening<RootState, AppDispatch>
export const startAppListening = listenerMiddleware.startListening as AppStartListening

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
                getUISnapshot().addNotification({ message, type: 'error' })
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
 * Voice command processing via Zustand subscription.
 * Called once from store.ts after the store is created.
 */
export const initVoiceCommandSubscription = (
    reduxDispatch: AppDispatch,
    reduxGetState: () => RootState,
): void => {
    useUIStore.subscribe(
        (s) => s.voiceControl.lastTranscript,
        async (transcript) => {
            if (!transcript) return
            const lowered = transcript.toLowerCase()
            const t = getT()
            const state = reduxGetState()

            const query = parseAssistantQuery(lowered)
            if (query) {
                const selectedPlantId =
                    state.simulation.selectedPlantId ??
                    state.simulation.plantSlots.find((slot) => slot !== null) ??
                    null
                const plant = selectedPlantId
                    ? state.simulation.plants.entities[selectedPlantId]
                    : null

                if (!plant) {
                    getUISnapshot().setVoiceStatusMessage(t('voiceControl.errors.noPlantContext'))
                    setTimeout(() => getUISnapshot().setVoiceStatusMessage(null), 4000)
                    return
                }

                getUISnapshot().setVoiceStatusMessage(t('voiceControl.assistantThinking'))
                try {
                    const language = state.settings.settings.general.language
                    const aiService = await getAiService()
                    const response = await aiService.getMentorResponse(plant, query, language)
                    const speechText = `${response.title}. ${response.content}`.slice(0, 320)
                    getUISnapshot().addNotification({
                        message: response.title,
                        type: 'info',
                    })
                    ttsService.speak(
                        speechText,
                        language,
                        () => getUISnapshot().setVoiceStatusMessage(null),
                        state.settings.settings.tts,
                    )
                    getUISnapshot().setVoiceStatusMessage(response.content)
                } catch (error) {
                    console.debug('Voice assistant response failed:', error)
                    getUISnapshot().setVoiceStatusMessage(t('voiceControl.errors.assistantFailed'))
                    setTimeout(() => getUISnapshot().setVoiceStatusMessage(null), 5000)
                }

                return
            }

            // --- Route to registry commands (covers all CommandPalette actions) ---
            const commands = buildVoiceCommands(reduxDispatch)
            const matched = matchVoiceCommand(lowered, commands)

            if (matched) {
                matched.action(lowered)
                if (reduxGetState().settings.settings.voiceControl.confirmationSound) {
                    playConfirmationSound()
                }
                getUISnapshot().setVoiceStatusMessage(matched.label)
                setTimeout(() => getUISnapshot().setVoiceStatusMessage(null), 3000)
            } else {
                getUISnapshot().setVoiceStatusMessage(`Unknown command: "${transcript}"`)
                setTimeout(() => getUISnapshot().setVoiceStatusMessage(null), 4000)
            }
        },
    )
}

// --- URL Sync Logic for Strain Filters (via Zustand subscription) ---
let urlSyncTimeout: ReturnType<typeof setTimeout> | undefined

/**
 * Called once from store.ts after the store is created to wire up the
 * active-view check needed by the URL sync subscription.
 * The viewGetter parameter is kept for backward compatibility but now
 * falls back to Zustand if not provided.
 */
export const initFilterUrlSync = (_viewGetter?: () => View): void => {
    // noop - subscription below uses Zustand directly
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
        if (getUISnapshot().activeView !== View.Strains) {
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
    effect: (action) => {
        const t = getT()
        const type = action.type.includes('addUser') ? 'add' : 'update'
        // The payload for userStrainsAdapter actions is the strain object itself.
        const strain = action.payload as Strain
        getUISnapshot().addNotification({
            message: t(`strainsView.addStrainModal.validation.${type}Success`, {
                name: strain.name,
            }),
            type: 'success',
        })
    },
})

startAppListening({
    actionCreator: addSetup.fulfilled,
    effect: (action) => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('equipmentView.configurator.setupSaveSuccess', {
                name: action.payload.name,
            }),
            type: 'success',
        })
    },
})

startAppListening({
    matcher: isAnyOf(deleteSetup, deleteStrainTip, deleteUserStrain),
    effect: () => {
        const t = getT()
        getUISnapshot().addNotification({ message: t('common.itemRemoved'), type: 'info' })
    },
})

startAppListening({
    actionCreator: deleteMultipleUserStrains,
    effect: (action) => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('strainsView.addStrainModal.validation.deletedCount', {
                count: action.payload.length,
            }),
            type: 'info',
        })
    },
})

startAppListening({
    matcher: isAnyOf(updateSetup, updateStrainTip),
    effect: (action) => {
        const t = getT()
        const p = action.payload as {
            id?: string
            changes?: { name?: string; title?: string }
            name?: string
            title?: string
        }
        const payload = p.changes ?? p
        const name = payload.name ?? payload.title
        getUISnapshot().addNotification({
            message: t('common.itemUpdated', { name }),
            type: 'success',
        })
    },
})

startAppListening({
    actionCreator: addStrainTip,
    effect: (action) => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('strainsView.tips.saveSuccess', { name: action.payload.strain.name }),
            type: 'success',
        })
    },
})

startAppListening({
    actionCreator: addMultipleToFavorites,
    effect: (action) => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('strainsView.bulkActions.addedToFavorites_other', {
                count: action.payload.length,
            }),
            type: 'success',
        })
    },
})

startAppListening({
    actionCreator: removeMultipleFromFavorites,
    effect: (action) => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('strainsView.bulkActions.removedFromFavorites_other', {
                count: action.payload.length,
            }),
            type: 'info',
        })
    },
})

startAppListening({
    actionCreator: addArchivedMentorResponse,
    effect: () => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('knowledgeView.archive.saveSuccess'),
            type: 'success',
        })
    },
})

startAppListening({
    actionCreator: addJournalEntry,
    effect: async (action) => {
        const t = getT()
        if (action.payload.entry.details && 'diagnosis' in action.payload.entry.details) {
            getUISnapshot().addNotification({
                message: t('plantsView.aiDiagnostics.savedToJournal'),
                type: 'success',
            })
        }

        // Background Sync demonstration
        if (!navigator.onLine) {
            try {
                const registration = await navigator.serviceWorker.ready
                if ('sync' in registration) {
                    await (
                        registration.sync as { register: (tag: string) => Promise<void> }
                    ).register('data-sync')
                    getUISnapshot().addNotification({
                        message: getT()('common.offlineQueued'),
                        type: 'info',
                    })
                }
            } catch (err) {
                console.debug('Background sync registration failed:', err)
            }
        }
    },
})

startAppListening({
    actionCreator: clearArchives,
    effect: () => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('settingsView.data.clearArchivesSuccess'),
            type: 'success',
        })
    },
})

startAppListening({
    actionCreator: resetPlants,
    effect: () => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('settingsView.data.resetPlantsSuccess'),
            type: 'success',
        })
    },
})

startAppListening({
    actionCreator: exportAllData.fulfilled,
    effect: () => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('settingsView.data.exportSuccess'),
            type: 'success',
        })
    },
})

startAppListening({
    actionCreator: resetAllData.fulfilled,
    effect: () => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('settingsView.data.resetAllSuccess'),
            type: 'success',
        })
    },
})

import { addGrow, removeGrow, setActiveGrowId } from './slices/growsSlice'

/**
 * When a new grow is added, automatically set it as the active grow.
 */
startAppListening({
    actionCreator: addGrow,
    effect: (action, listenerApi) => {
        listenerApi.dispatch(setActiveGrowId(action.payload.id))
    },
})

/**
 * When the active grow is deleted, the slice already handles fallback.
 * This listener notifies the user.
 */
startAppListening({
    actionCreator: removeGrow,
    effect: () => {
        const t = getT()
        getUISnapshot().addNotification({
            message: t('common.growDeleted'),
            type: 'info',
        })
    },
})

/**
 * Onboarding step subscription via Zustand.
 * Called once from store.ts after the store is created.
 */
export const initOnboardingSubscription = (reduxGetState: () => RootState): void => {
    let prevStep = getUISnapshot().onboardingStep
    useUIStore.subscribe(
        (s) => s.onboardingStep,
        (step) => {
            if (
                step === 0 &&
                prevStep !== 0 &&
                reduxGetState().settings.settings.onboardingCompleted
            ) {
                const t = getT()
                getUISnapshot().addNotification({
                    message: t('settingsView.data.replayOnboardingSuccess'),
                    type: 'success',
                })
            }
            prevStep = step
        },
    )
}
