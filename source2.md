# CannaGuide 2025 - Kompletter Quellcode (Teil 3)

Dieser Teil enthält alle benutzerdefinierten React Hooks und die Web Worker der Anwendung.

---

## 3. Hooks (`hooks/`)

Benutzerdefinierte React-Hooks zur Kapselung und Wiederverwendung von Logik in Komponenten.

---

### `hooks/DeepDiveModalContainer.tsx`

```tsx
import React, { useEffect, useMemo } from 'react';
import { Modal } from '@/components/common/Modal';
import { Plant, Scenario } from '@/types';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { geminiService } from '@/services/geminiService';
import { closeDeepDiveModal } from '@/stores/slices/uiSlice';
import { useGenerateDeepDiveMutation } from '@/stores/api';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { scenarioService } from '@/services/scenarioService';
import { Button } from '@/components/common/Button';
import { selectDeepDiveModalState, selectPlantById } from '@/stores/selectors';
import { runComparisonScenario } from '@/stores/slices/sandboxSlice';

interface DeepDiveModalProps {
  plant: Plant;
  topic: string;
  onClose: () => void;
  onRunScenario: (scenario: Scenario) => void;
}

export const DeepDiveModal: React.FC<DeepDiveModalProps> = ({ plant, topic, onClose, onRunScenario }) => {
    const { t } = useTranslation();
    const [generateDeepDive, { data: response, isLoading, error }] = useGenerateDeepDiveMutation();

    useEffect(() => {
        if (!response && !isLoading && !error) {
            generateDeepDive({ topic, plant });
        }
    }, [plant, topic, response, isLoading, error, generateDeepDive]);

    const loadingMessage = useMemo(() => {
        const messages = geminiService.getDynamicLoadingMessages({
            useCase: 'deepDive',
            data: { topic, plantName: plant.name }
        });
        return messages[Math.floor(Math.random() * messages.length)];
    }, [topic, plant.name]);


    const relevantScenario = useMemo(() => {
        if (topic === 'Topping' || topic === 'LST') {
            return scenarioService.getScenarioById('topping-vs-lst');
        }
        return null;
    }, [topic]);

    return (
        <Modal isOpen={true} onClose={onClose} title={`${t('common.deepDive')}: ${topic}`} size="2xl">
            {isLoading && <AiLoadingIndicator loadingMessage={loadingMessage} />}
            {error && <div className="text-red-400">{'message' in error ? (error as any).message : t('ai.error.unknown')}</div>}
            {response && (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-lg">
                        <PhosphorIcons.Info className="w-6 h-6 text-primary-400 mt-1 flex-shrink-0" />
                        <p className="text-sm text-slate-300">{response.introduction}</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-primary-300 mb-2">Step-by-Step</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                            {response.stepByStep.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-green-400 mb-2">Pros</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                {response.prosAndCons.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-red-400 mb-2">Cons</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                                {response.prosAndCons.cons.map((con, i) => <li key={i}>{con}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="bg-primary-900/30 p-3 rounded-lg">
                        <h3 className="font-bold text-primary-300 flex items-center gap-2 mb-1">
                            <PhosphorIcons.Sparkle /> Pro-Tip
                        </h3>
                        <p className="text-sm text-slate-300">{response.proTip}</p>
                    </div>

                    {relevantScenario && (
                        <div className="text-center pt-4 border-t border-slate-700">
                             <Button onClick={() => onRunScenario(relevantScenario)}>
                                <PhosphorIcons.GameController className="w-5 h-5 mr-2" />
                                {t(relevantScenario.titleKey)}
                            </Button>
                            <p className="text-xs text-slate-500 mt-2">{t(relevantScenario.descriptionKey)}</p>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
};


export const DeepDiveModalContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const { isOpen, plantId, topic } = useAppSelector(selectDeepDiveModalState);
    const plant = useAppSelector(selectPlantById(plantId));
    
    const handleRunScenario = (scenario: Scenario) => {
        if(plantId) {
            dispatch(runComparisonScenario({ plantId, scenario }));
            dispatch(closeDeepDiveModal());
        }
    };

    if (!isOpen || !plant || !topic) return null;

    return (
        <DeepDiveModal
            plant={plant}
            topic={topic}
            onClose={() => dispatch(closeDeepDiveModal())}
            onRunScenario={handleRunScenario}
        />
    );
};
```

### `hooks/useAvailableVoices.ts`

```typescript
import { useState, useEffect } from 'react'
import { ttsService } from '@/services/ttsService'
import { selectLanguage } from '@/stores/selectors'
import { useAppSelector } from '@/stores/store'
import { Language } from '@/types'

export const useAvailableVoices = () => {
    const language = useAppSelector(selectLanguage)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

    useEffect(() => {
        const updateVoices = () => {
            setVoices(ttsService.getVoices(language))
        }

        // Initial load
        updateVoices()

        // Update when voices change
        window.speechSynthesis.onvoiceschanged = updateVoices

        return () => {
            window.speechSynthesis.onvoiceschanged = null
        }
    }, [language])

    return voices
}
```

### `hooks/useCommandPalette.ts`

```typescript
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
// FIX: Moved 'startGrowInSlot' to its correct import from uiSlice.
import { setActiveView, openAddModal, startGrowInSlot } from '@/stores/slices/uiSlice';
import { setSetting, exportAllData } from '@/stores/slices/settingsSlice';
import { setStrainsViewMode } from '@/stores/slices/strainsViewSlice';
import { waterAllPlants } from '@/stores/slices/simulationSlice';
import { Command, View, Language, Theme, AppSettings } from '@/types';
import { CommandGroup } from '@/services/commandService';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { i18nInstance } from '@/i18n';
import { selectSettings, selectHasAvailableSlots, selectSimulation } from '@/stores/selectors';

export const useCommandPalette = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const settings = useAppSelector(selectSettings);
    const hasAvailableSlots = useAppSelector(selectHasAvailableSlots);
    const { plantSlots } = useAppSelector(selectSimulation);
    const { language } = settings;

    const allCommands: Command[] = useMemo(() => {
        const navigate = (view: View) => {
            dispatch(setActiveView(view));
        };

        const toggleLanguage = () => {
            const newLang: Language = language === 'en' ? 'de' : 'en';
            dispatch(setSetting({ path: 'language', value: newLang }));
            i18nInstance.changeLanguage(newLang);
        };
        
        const commands: Command[] = [
            // Navigation
            { id: 'nav-plants', title: t('nav.plants'), icon: PhosphorIcons.Plant, group: CommandGroup.Navigation, action: () => navigate(View.Plants), keywords: 'grow room dashboard garden' },
            { id: 'nav-strains', title: t('nav.strains'), icon: PhosphorIcons.Leafy, group: CommandGroup.Navigation, action: () => navigate(View.Strains), keywords: 'encyclopedia library search find' },
            { id: 'nav-equipment', title: t('nav.equipment'), icon: PhosphorIcons.Wrench, group: CommandGroup.Navigation, action: () => navigate(View.Equipment), keywords: 'gear tools configurator calculator' },
            { id: 'nav-knowledge', title: t('nav.knowledge'), icon: PhosphorIcons.BookOpenText, group: CommandGroup.Navigation, action: () => navigate(View.Knowledge), keywords: 'guide mentor learn help' },
            { id: 'nav-settings', title: t('nav.settings'), icon: PhosphorIcons.Gear, group: CommandGroup.Navigation, action: () => navigate(View.Settings), keywords: 'options configuration' },
            { id: 'nav-help', title: t('nav.help'), icon: PhosphorIcons.Question, group: CommandGroup.Navigation, action: () => navigate(View.Help), keywords: 'faq support lexicon' },
            
            // General Actions
            { id: 'action-add-strain', title: t('strainsView.addStrain'), icon: PhosphorIcons.PlusCircle, group: CommandGroup.General, action: () => dispatch(openAddModal(null)) },
            { id: 'action-water-all', title: t('plantsView.summary.waterAll'), icon: PhosphorIcons.Drop, group: CommandGroup.General, action: () => dispatch(waterAllPlants()) },

            // Settings
            { 
                id: 'setting-toggle-language', 
                title: t('commandPalette.toggleLanguage', { lang: language === 'en' ? t('settingsView.languages.de') : t('settingsView.languages.en') }),
                icon: PhosphorIcons.Globe, 
                group: CommandGroup.Settings, 
                action: toggleLanguage 
            },
            { id: 'setting-strains-list', title: t('strainsView.viewModes.list'), subtitle: 'Set Strains View', icon: PhosphorIcons.ListBullets, group: CommandGroup.Settings, action: () => dispatch(setStrainsViewMode('list')) },
            { id: 'setting-strains-grid', title: t('strainsView.viewModes.grid'), subtitle: 'Set Strains View', icon: PhosphorIcons.GridFour, group: CommandGroup.Settings, action: () => dispatch(setStrainsViewMode('grid')) },
            { id: 'setting-toggle-dyslexia-font', title: t('settingsView.accessibility.dyslexiaFont'), icon: PhosphorIcons.TextBolder, group: CommandGroup.Settings, action: () => dispatch(setSetting({ path: 'accessibility.dyslexiaFont', value: !settings.accessibility.dyslexiaFont })) },
            { id: 'setting-toggle-reduced-motion', title: t('settingsView.accessibility.reducedMotion'), icon: PhosphorIcons.Person, group: CommandGroup.Settings, action: () => dispatch(setSetting({ path: 'accessibility.reducedMotion', value: !settings.accessibility.reducedMotion })) },
            
            // Data Management
            { id: 'data-export', title: t('settingsView.data.exportAll'), icon: PhosphorIcons.DownloadSimple, group: CommandGroup.Settings, action: () => dispatch(exportAllData()) },
        ];
        
        if (hasAvailableSlots) {
            commands.push({
                id: 'action-start-grow',
                title: t('plantsView.emptySlot.title'),
                icon: PhosphorIcons.PlusCircle,
                group: CommandGroup.General,
                action: () => {
                    const firstEmptySlot = plantSlots.findIndex(slot => slot === null);
                    if (firstEmptySlot !== -1) {
                        dispatch(setActiveView(View.Plants));
                        dispatch(startGrowInSlot(firstEmptySlot));
                    }
                },
                keywords: 'new plant'
            });
        }

        return commands;
    }, [t, dispatch, language, settings.accessibility, hasAvailableSlots, plantSlots]);

    return { allCommands };
};
```

### `hooks/useDocumentEffects.ts`

```typescript
import { useEffect } from 'react'
import { AppSettings } from '@/types'

/**
 * A custom hook to manage global side effects on the document's root element (<html>).
 * It centralizes logic for applying themes, accessibility settings, and base styles.
 * @param settings - The application's settings object.
 */
export const useDocumentEffects = (settings: AppSettings) => {
    useEffect(() => {
        const root = window.document.documentElement

        // Reset all managed classes to ensure a clean state
        root.className = ''

        // Apply core classes
        root.classList.add('dark', `theme-${settings.theme}`)

        // Apply accessibility settings
        if (settings.accessibility.dyslexiaFont) root.classList.add('dyslexia-font')
        if (settings.accessibility.reducedMotion) root.classList.add('reduced-motion')

        // Apply UI density
        if (settings.uiDensity === 'compact') root.classList.add('ui-density-compact')

        // Apply TTS visibility class
        if (!settings.tts.enabled) root.classList.add('tts-disabled')

        // Apply base font size
        root.style.fontSize =
            settings.fontSize === 'sm' ? '14px' : settings.fontSize === 'lg' ? '18px' : '16px'

        // Set document language for accessibility
        root.lang = settings.language
    }, [
        settings.theme,
        settings.fontSize,
        settings.language,
        settings.accessibility.dyslexiaFont,
        settings.accessibility.reducedMotion,
        settings.uiDensity,
        settings.tts.enabled,
    ])
}
```

### `hooks/useExportsManager.ts`

```typescript
// This file is intentionally empty.
```

### `hooks/useFocusTrap.ts`

```typescript
import { useRef, useEffect } from 'react'

const FOCUSABLE_SELECTORS =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export const useFocusTrap = (isOpen: boolean) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const previouslyFocusedElement = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (isOpen && containerRef.current) {
            previouslyFocusedElement.current = document.activeElement as HTMLElement

            const focusableElements = Array.from(
                containerRef.current.querySelectorAll(FOCUSABLE_SELECTORS)
            ) as HTMLElement[]

            if (focusableElements.length > 0) {
                // Delay focus to allow for modal transitions
                setTimeout(() => {
                    const firstElement = focusableElements[0]
                    firstElement?.focus()
                }, 100)
            }

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key !== 'Tab' || !containerRef.current) return

                const focusableContent = Array.from(
                    containerRef.current.querySelectorAll(FOCUSABLE_SELECTORS)
                ) as HTMLElement[]

                if (focusableContent.length === 0) {
                    e.preventDefault()
                    return
                }

                const firstElement = focusableContent[0]
                const lastElement = focusableContent[focusableContent.length - 1]
                const activeElement = document.activeElement

                if (e.shiftKey) {
                    // Shift + Tab
                    if (activeElement === firstElement) {
                        lastElement.focus()
                        e.preventDefault()
                    }
                } else {
                    // Tab
                    if (activeElement === lastElement) {
                        firstElement.focus()
                        e.preventDefault()
                    }
                }
            }

            document.addEventListener('keydown', handleKeyDown)

            return () => {
                document.removeEventListener('keydown', handleKeyDown)
                previouslyFocusedElement.current?.focus()
            }
        }
    }, [isOpen])

    return containerRef
}
```

### `hooks/useForm.ts`

```typescript
import React, { useState, useCallback } from 'react'

type ValidationErrors<T> = {
    [K in keyof T]?: string
}

type ValidationFunction<T> = (values: T) => ValidationErrors<T>

interface UseFormProps<T> {
    initialValues: T
    validate: ValidationFunction<T>
    onSubmit: (values: T) => void
}

export const useForm = <T extends Record<string, any>>({
    initialValues,
    validate,
    onSubmit,
}: UseFormProps<T>) => {
    const [values, setValues] = useState<T>(initialValues)
    const [errors, setErrors] = useState<ValidationErrors<T>>({})

    const handleChange = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setValues((prev) => ({ ...prev, [field]: value }))
    }, [])

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()
            const validationErrors = validate(values)
            setErrors(validationErrors)

            if (Object.keys(validationErrors).length === 0) {
                onSubmit(values)
            }
        },
        [values, validate, onSubmit]
    )

    return {
        values,
        errors,
        handleChange,
        handleSubmit,
    }
}
```

### `hooks/useGlobalEffects.ts`

```typescript
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatus } from './useOnlineStatus';
import { usePwaInstall } from './usePwaInstall';
import { useAppDispatch } from '@/stores/store';
import { addNotification } from '@/stores/slices/uiSlice';

export const useGlobalEffects = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const isOffline = useOnlineStatus();
    const { deferredPrompt, handleInstallClick, isInstalled } = usePwaInstall();

    useEffect(() => {
        if (isOffline) {
            dispatch(addNotification({ message: t('common.offlineWarning'), type: 'info' }));
        }
    }, [isOffline, dispatch, t]);

    return { deferredPrompt, handleInstallClick, isInstalled, isOffline };
};
```

### `hooks/useKnowledgeProgress.ts`

```typescript
// This file is intentionally empty.
```

### `hooks/useOnlineStatus.ts`

```typescript
import { useState, useEffect } from 'react'

export const useOnlineStatus = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine)

    useEffect(() => {
        const handleOffline = () => setIsOffline(true)
        const handleOnline = () => setIsOffline(false)

        window.addEventListener('offline', handleOffline)
        window.addEventListener('online', handleOnline)

        return () => {
            window.removeEventListener('offline', handleOffline)
            window.removeEventListener('online', handleOnline)
        }
    }, [])

    return isOffline
}
```

### `hooks/useOutsideClick.ts`

```typescript
import { useEffect, useRef, RefObject } from 'react'

type Event = MouseEvent | TouchEvent

/**
 * A custom React hook that triggers a callback when a click occurs outside of the referenced element.
 *
 * @param handler - The function to call when an outside click is detected.
 * @returns A ref object to be attached to the element you want to monitor for outside clicks.
 */
export const useOutsideClick = <T extends HTMLElement = HTMLElement>(
    handler: (event: Event) => void
): RefObject<T> => {
    const ref = useRef<T>(null)

    useEffect(() => {
        const listener = (event: Event) => {
            const el = ref.current
            // Do nothing if clicking ref's element or descendent elements
            if (!el || el.contains(event.target as Node)) {
                return
            }
            handler(event)
        }

        document.addEventListener('mousedown', listener)
        document.addEventListener('touchstart', listener)

        return () => {
            document.removeEventListener('mousedown', listener)
            document.removeEventListener('touchstart', listener)
        }
    }, [ref, handler]) // Reload only if ref or handler changes

    return ref
}
```

### `hooks/usePwaInstall.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useAppDispatch } from '../stores/store'
import { useTranslation } from 'react-i18next'
import { addNotification } from '../stores/slices/uiSlice'
import { BeforeInstallPromptEvent } from '@/types'

// Key for storing the installation status in localStorage.
const PWA_INSTALLED_KEY = 'cannaGuidePwaInstalled';

/**
 * A custom hook to manage the PWA installation prompt and status.
 * It reliably tracks whether the app is installed using a combination of
 * browser APIs and a localStorage flag for persistence.
 */
export const usePwaInstall = () => {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    // The initial state checks both the persistent flag and the current display mode.
    const [isInstalled, setIsInstalled] = useState(() =>
        localStorage.getItem(PWA_INSTALLED_KEY) === 'true' ||
        window.matchMedia('(display-mode: standalone)').matches
    );

    useEffect(() => {
        // This event fires if the app is installable but not yet installed.
        const beforeInstallPromptHandler = (e: Event) => {
            e.preventDefault(); // Prevent the mini-infobar from appearing automatically.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            
            // If this event fires, it means the app is not installed,
            // so we ensure our state and flag reflect that. This handles uninstallation cases.
            setIsInstalled(false);
            localStorage.removeItem(PWA_INSTALLED_KEY);
        };
        
        // This event fires after the user has accepted the installation prompt.
        const appInstalledHandler = () => {
            // Clear the prompt and update the state/flag to reflect installation.
            setDeferredPrompt(null);
            setIsInstalled(true);
            localStorage.setItem(PWA_INSTALLED_KEY, 'true');
            dispatch(addNotification({ message: t('common.installPwaSuccess'), type: 'success' }));
        };

        window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);
        window.addEventListener('appinstalled', appInstalledHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
            window.removeEventListener('appinstalled', appInstalledHandler);
        };
    }, [t, dispatch]);

    const handleInstallClick = useCallback(async () => {
        if (!deferredPrompt) {
            return;
        }
        
        // Show the native installation prompt.
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            // The 'appinstalled' event will handle the final state change.
            console.log('PWA installation accepted by user.');
        } else {
            console.log('PWA installation dismissed by user.');
            dispatch(addNotification({ message: t('common.installPwaDismissed'), type: 'info' }));
        }
        
        // The prompt can only be used once.
        setDeferredPrompt(null);

    }, [deferredPrompt, dispatch, t]);

    return { deferredPrompt, handleInstallClick, isInstalled };
};
```

### `hooks/useSimulationBridge.ts`

```typescript
import React, { useMemo } from 'react';
import { useAppSelector } from '@/stores/store';
import {
    selectActivePlants,
    selectGardenHealthMetrics,
    selectOpenTasksSummary,
    selectActiveProblemsSummary,
    selectSelectedPlantId,
    selectPlantById,
    selectHasAvailableSlots,
    selectPlantSlots
} from '@/stores/selectors';
import { Plant, Task, PlantProblem } from '@/types';

/**
 * Custom hook to get the list of currently active plants from the simulation state.
 * @returns An array of active Plant objects.
 */
export const useActivePlants = () => useAppSelector(selectActivePlants);

/**
 * Custom hook for garden health metrics only.
 * @returns An object with garden health metrics.
 */
export const useGardenHealthMetrics = () => useAppSelector(selectGardenHealthMetrics);

/**
 * Custom hook that provides a comprehensive summary of the garden's status.
 * @returns An object containing health metrics, open tasks, and active problems.
 */
export const useGardenSummary = () => {
    const healthMetrics = useAppSelector(selectGardenHealthMetrics);
    const tasks = useAppSelector(selectOpenTasksSummary);
    const problems = useAppSelector(selectActiveProblemsSummary);
    return { ...healthMetrics, tasks, problems };
};

/**
 * Custom hook to retrieve the state of plant slots and their content.
 * @returns An object with an array of plant data for each slot (or null if empty) and a boolean indicating if slots are available.
 */
export const usePlantSlotsData = () => {
    const slots = useAppSelector(selectPlantSlots);
    const plantEntities = useAppSelector(state => state.simulation.plants.entities);
    const hasAvailable = useAppSelector(selectHasAvailableSlots);
    
    const slotsWithData = useMemo(() => slots.map(id => id ? plantEntities[id] || null : null), [slots, plantEntities]);
    
    return { slotsWithData, hasAvailable };
};

/**
 * Custom hook to get the currently selected plant object based on the global selectedPlantId.
 * @returns The selected Plant object or null if none is selected.
 */
export const useSelectedPlant = () => {
    const selectedId = useAppSelector(selectSelectedPlantId);
    const plants = useAppSelector(state => state.simulation.plants.entities);
    return useMemo(() => selectedId ? plants[selectedId] || null : null, [selectedId, plants]);
};

/**
 * Custom hook to retrieve a specific plant by its ID.
 * @param plantId The ID of the plant to retrieve.
 * @returns The Plant object or null if not found.
 */
export const usePlantById = (plantId: string | null) => {
    const plants = useAppSelector(state => state.simulation.plants.entities);
    return useMemo(() => plantId ? plants[plantId] || null : null, [plantId, plants]);
};


/**
 * Custom hook to check if the simulation is currently in a "catch-up" state.
 * @returns A boolean indicating the catch-up status.
 */
// @ts-ignore
export const useIsSimulationCatchingUp = () => useAppSelector(state => state.simulation.isCatchingUp);
```

### `hooks/useStorageEstimate.ts`

```typescript
import { useState, useEffect } from 'react'
import { useAppSelector } from '@/stores/store'
import { dbService } from '@/services/dbService'
import {
    selectSimulation,
    selectArchives,
    selectUserStrains,
    selectSavedItems,
} from '@/stores/selectors'

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const getObjectSize = (obj: any) => {
    try {
        return new TextEncoder().encode(JSON.stringify(obj)).length
    } catch (e) {
        return 0
    }
}

export const useStorageEstimate = () => {
    const [estimates, setEstimates] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(true)

    const simulationState = useAppSelector(selectSimulation)
    const archivesState = useAppSelector(selectArchives)
    const userStrainsState = useAppSelector(selectUserStrains)
    const savedItemsState = useAppSelector(selectSavedItems)

    useEffect(() => {
        const calculateSizes = async () => {
            setIsLoading(true)
            const newEstimates: Record<string, number> = {}

            newEstimates.plants = getObjectSize(simulationState.plants)
            newEstimates.archives = getObjectSize(archivesState)
            newEstimates.customStrains = getObjectSize(userStrainsState)
            newEstimates.savedItems = getObjectSize(savedItemsState)

            try {
                const images = await dbService.getAllImages()
                newEstimates.images = images.reduce((acc, img) => acc + img.data.length * 0.75, 0) // Base64 approx size
            } catch (error) {
                console.error('Could not estimate image size:', error)
                newEstimates.images = 0
            }

            const formattedEstimates = Object.entries(newEstimates).reduce(
                (acc, [key, value]) => {
                    acc[key] = formatBytes(value)
                    return acc
                },
                {} as Record<string, string>
            )

            setEstimates(formattedEstimates)
            setIsLoading(false)
        }

        calculateSizes()
    }, [simulationState, archivesState, userStrainsState, savedItemsState])

    return { estimates, isLoading }
}
```

### `hooks/useStrainFilters.ts`

```typescript
import { useMemo, useTransition, useCallback } from 'react';
import {
    Strain,
    SortKey,
    SortDirection,
    StrainType,
    DifficultyLevel,
    YieldLevel,
    HeightLevel,
    AppSettings,
    AdvancedFilterState,
} from '@/types';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import {
    setSearchTerm,
    toggleTypeFilter,
    setShowFavoritesOnly,
    setAdvancedFilters,
    resetAllFilters as resetFiltersAction,
    setLetterFilter,
} from '@/stores/slices/filtersSlice';
import { selectFavoriteIds } from '@/stores/selectors';
import React from 'react';

export const useStrainFilters = (
    allStrains: Strain[],
    strainsViewSettings: AppSettings['strainsViewSettings']
) => {
    const dispatch = useAppDispatch();
    const { searchTerm, typeFilter, showFavoritesOnly, advancedFilters, letterFilter } =
        useAppSelector((state) => state.filters);
    const favorites = useAppSelector(selectFavoriteIds);

    const [sort, setSort] = React.useState<{ key: SortKey; direction: SortDirection }>({
        key: strainsViewSettings.defaultSortKey,
        direction: strainsViewSettings.defaultSortDirection,
    });
    const [isPending, startTransition] = useTransition();

    const handleSort = useCallback((key: SortKey) => {
        startTransition(() => {
            setSort((prev) => ({
                key,
                direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
            }));
        });
    }, []);

    const handleSetSearchTerm = useCallback(
        (term: string) => {
            startTransition(() => {
                dispatch(setSearchTerm(term));
            });
        },
        [dispatch]
    );

    const handleToggleTypeFilter = useCallback(
        (type: StrainType) => {
            dispatch(toggleTypeFilter(type));
        },
        [dispatch]
    );

    const handleSetAdvancedFilters = useCallback(
        (filters: Partial<AdvancedFilterState>) => {
            dispatch(setAdvancedFilters(filters));
        },
        [dispatch]
    );

    const handleSetLetterFilter = useCallback(
        (letter: string | null) => {
            dispatch(setLetterFilter(letter));
        },
        [dispatch]
    );

    const resetAllFilters = useCallback(() => {
        dispatch(resetFiltersAction());
    }, [dispatch]);

    const isAnyFilterActive = useMemo(() => {
        return (
            searchTerm.trim() !== '' ||
            typeFilter.length > 0 ||
            showFavoritesOnly ||
            letterFilter !== null ||
            advancedFilters.thcRange[0] > 0 ||
            advancedFilters.thcRange[1] < 35 ||
            advancedFilters.cbdRange[0] > 0 ||
            advancedFilters.cbdRange[1] < 20 ||
            advancedFilters.floweringRange[0] > 4 ||
            advancedFilters.floweringRange[1] < 20 ||
            advancedFilters.selectedDifficulties.length > 0 ||
            advancedFilters.selectedYields.length > 0 ||
            advancedFilters.selectedHeights.length > 0 ||
            advancedFilters.selectedAromas.length > 0 ||
            advancedFilters.selectedTerpenes.length > 0
        );
    }, [searchTerm, typeFilter, showFavoritesOnly, advancedFilters, letterFilter]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (advancedFilters.selectedAromas.length > 0) count++;
        if (advancedFilters.selectedTerpenes.length > 0) count++;
        if (advancedFilters.selectedDifficulties.length > 0) count++;
        if (advancedFilters.selectedYields.length > 0) count++;
        if (advancedFilters.selectedHeights.length > 0) count++;
        if (advancedFilters.thcRange[0] > 0 || advancedFilters.thcRange[1] < 35) count++;
        if (advancedFilters.cbdRange[0] > 0 || advancedFilters.cbdRange[1] < 20) count++;
        if (advancedFilters.floweringRange[0] > 4 || advancedFilters.floweringRange[1] < 20) count++;
        return count;
    }, [advancedFilters]);

    const filteredStrains = useMemo(() => {
        let strains = [...allStrains];

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            strains = strains.filter(
                (s) =>
                    s.name.toLowerCase().includes(lowerCaseSearch) ||
                    s.type.toLowerCase().includes(lowerCaseSearch) ||
                    (s.aromas || []).some((a) => a.toLowerCase().includes(lowerCaseSearch)) ||
                    (s.dominantTerpenes || []).some((t) =>
                        t.toLowerCase().includes(lowerCaseSearch)
                    ) ||
                    s.genetics?.toLowerCase().includes(lowerCaseSearch)
            );
        }

        if (showFavoritesOnly) strains = strains.filter((s) => favorites.has(s.id));

        const typeFilterSet = new Set(typeFilter);
        if (typeFilterSet.size > 0) {
            strains = strains.filter((s) => typeFilterSet.has(s.type));
        }

        if (letterFilter) {
            if (letterFilter === '#') {
                strains = strains.filter((s) => /^\d/.test(s.name));
            } else {
                strains = strains.filter((s) =>
                    s.name.toLowerCase().startsWith(letterFilter.toLowerCase())
                );
            }
        }

        const selectedDifficultiesSet = new Set(advancedFilters.selectedDifficulties);
        const selectedYieldsSet = new Set(advancedFilters.selectedYields);
        const selectedHeightsSet = new Set(advancedFilters.selectedHeights);
        const selectedAromasSet = new Set(advancedFilters.selectedAromas);
        const selectedTerpenesSet = new Set(advancedFilters.selectedTerpenes);

        strains = strains.filter(
            (s) =>
                s.thc >= advancedFilters.thcRange[0] &&
                s.thc <= advancedFilters.thcRange[1] &&
                s.cbd >= advancedFilters.cbdRange[0] &&
                s.cbd <= advancedFilters.cbdRange[1] &&
                s.floweringTime >= advancedFilters.floweringRange[0] &&
                s.floweringTime <= advancedFilters.floweringRange[1]
        );

        if (selectedDifficultiesSet.size > 0)
            strains = strains.filter((s) => selectedDifficultiesSet.has(s.agronomic.difficulty));
        if (selectedYieldsSet.size > 0)
            strains = strains.filter((s) => selectedYieldsSet.has(s.agronomic.yield));
        if (selectedHeightsSet.size > 0)
            strains = strains.filter((s) => selectedHeightsSet.has(s.agronomic.height));
        if (selectedAromasSet.size > 0)
            strains = strains.filter((s) =>
                (s.aromas || []).some((a) => selectedAromasSet.has(a))
            );
        if (selectedTerpenesSet.size > 0)
            strains = strains.filter((s) =>
                (s.dominantTerpenes || []).some((t) => selectedTerpenesSet.has(t))
            );

        strains.sort((a, b) => {
            const aVal = a[sort.key as keyof Strain] ?? a.agronomic[sort.key as keyof Strain['agronomic']];
            const bVal = b[sort.key as keyof Strain] ?? b.agronomic[sort.key as keyof Strain['agronomic']];

            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }
            return 0;
        });

        return strains;
    }, [allStrains, searchTerm, showFavoritesOnly, typeFilter, advancedFilters, favorites, sort, letterFilter]);

    return {
        filteredStrains,
        isSearching: isPending,
        searchTerm,
        setSearchTerm: handleSetSearchTerm,
        typeFilter,
        handleToggleTypeFilter,
        showFavoritesOnly,
        setShowFavoritesOnly: (value: boolean) => dispatch(setShowFavoritesOnly(value)),
        advancedFilters,
        setAdvancedFilters: handleSetAdvancedFilters,
        letterFilter,
        handleSetLetterFilter,
        resetAllFilters,
        sort,
        handleSort,
        isAnyFilterActive,
        activeFilterCount,
    };
};
```

---

## 4. Web Workers

Hintergrund-Skripte zur Auslagerung rechenintensiver Aufgaben.

---

### `simulation.worker.ts`

```typescript
// This worker is intended for background simulation tasks.
// It receives a plant state and a time delta, runs the simulation logic,
// and posts the updated state back to the main thread.

import { Plant } from '@/types'
import { simulationService } from '@/services/plantSimulationService'

self.onmessage = (e: MessageEvent<{ plant: Plant; deltaTime: number }>) => {
    const { plant, deltaTime } = e.data
    if (plant && deltaTime > 0) {
        // Run the simulation logic from the shared service
        const result = simulationService.calculateStateForTimeDelta(plant, deltaTime)
        // Post the results back to the main thread
        self.postMessage(result)
    }
}
```

### `workers/scenario.worker.ts`

```typescript
import { Plant, Scenario, ScenarioAction } from '@/types'
import { simulationService } from '@/services/plantSimulationService'

// This is a simplified version of the main simulation service for the worker
const applyAction = (plant: Plant, action: ScenarioAction): Plant => {
    switch (action) {
        case 'TOP':
            return simulationService.topPlant(plant).updatedPlant
        case 'LST':
            return simulationService.applyLst(plant).updatedPlant
        case 'NONE':
        default:
            return plant
    }
}

self.onmessage = (e: MessageEvent<{ basePlant: Plant; scenario: Scenario }>) => {
    // Deep copy using structuredClone is implicitly handled by the message passing,
    // but we do it again to ensure no mutation of the initial state.
    let plantA = structuredClone(e.data.basePlant)
    let plantB = structuredClone(e.data.basePlant)
    const { scenario } = e.data

    // Start with fresh history for the simulation branches
    plantA.history = []
    plantB.history = []

    const oneDayInMillis = 24 * 60 * 60 * 1000

    for (let day = 1; day <= scenario.durationDays; day++) {
        if (day === scenario.plantAModifier.day) {
            plantA = applyAction(plantA, scenario.plantAModifier.action)
        }
        if (day === scenario.plantBModifier.day) {
            plantB = applyAction(plantB, scenario.plantBModifier.action)
        }

        plantA = simulationService.calculateStateForTimeDelta(plantA, oneDayInMillis).updatedPlant
        plantB = simulationService.calculateStateForTimeDelta(plantB, oneDayInMillis).updatedPlant
    }

    self.postMessage({
        originalHistory: plantA.history,
        modifiedHistory: plantB.history,
        originalFinalState: plantA,
        modifiedFinalState: plantB,
    })
}
```
