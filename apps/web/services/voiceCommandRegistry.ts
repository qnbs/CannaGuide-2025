/**
 * voiceCommandRegistry.ts
 *
 * Centralised voice command definitions for CannaGuide.
 * Used by listenerMiddleware to route spoken transcripts to app actions.
 *
 * Design:
 * - aliases  : exact lowercase phrases (startsWith match, multi-language)
 * - keywords : space-separated EN tokens for fuzzy fallback (2+ tokens = match)
 * - action   : receives the full transcript so search-style commands can extract terms
 */
import { getT } from '@/i18n'
import { View, StrainType, StrainViewTab, EquipmentViewTab, KnowledgeViewTab } from '@/types'
import { getUISnapshot } from '@/stores/useUIStore'
import { useFiltersStore } from '@/stores/useFiltersStore'
import { useStrainsViewStore } from '@/stores/useStrainsViewStore'
import { useTtsStore } from '@/stores/useTtsStore'
import { setSetting, toggleSetting } from '@/stores/slices/settingsSlice'
import { waterAllPlants } from '@/stores/slices/simulationSlice'
import { getReduxSnapshot } from '@/services/uiStateBridge'
import { allStrainsData } from '@/data/strains'
import { secureRandom } from '@/utils/random'
import type { AppDispatch } from '@/stores/store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceCommandDef {
    id: string
    group: string
    /** Human-readable label (EN). Used for display in VoiceSettingsTab. */
    label: string
    /** Lowercase exact-match phrases (startsWith). Include EN + DE variants. */
    aliases: string[]
    /** Space-separated EN tokens for fuzzy matching (2+ = hit). */
    keywords: string
    /** Action to execute. Receives the full lowercased transcript. */
    action: (transcript: string) => void
    /** When true, the orchestrator asks for spoken yes/no confirmation before executing. */
    requiresConfirmation?: boolean | undefined
}

// ---------------------------------------------------------------------------
// Levenshtein Distance
// ---------------------------------------------------------------------------

/** Compute edit distance between two strings (DP, O(n*m)). */
export function levenshtein(a: string, b: string): number {
    const m = a.length
    const n = b.length
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0))
    for (let i = 0; i <= m; i++) dp[i]![0] = i
    for (let j = 0; j <= n; j++) dp[0]![j] = j
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost)
        }
    }
    return dp[m]![n]!
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Three-pass matcher:
 * 1. Alias pass     - transcript.startsWith(alias)          -> immediate match
 * 2. Fuzzy alias    - Levenshtein distance <= 2 on aliases  -> best distance wins
 * 3. Keyword pass   - count 3+-char token hits in transcript -> best score >= 2
 */
export function matchVoiceCommand(
    transcript: string,
    commands: VoiceCommandDef[],
): VoiceCommandDef | null {
    const lower = transcript.trim()

    // Pass 1: exact alias (startsWith)
    for (const cmd of commands) {
        if (cmd.aliases.some((alias) => lower.startsWith(alias))) {
            return cmd
        }
    }

    // Pass 2: fuzzy alias via Levenshtein (distance <= 2)
    let fuzzyCmd: VoiceCommandDef | null = null
    let fuzzyDist = 3 // threshold + 1
    for (const cmd of commands) {
        for (const alias of cmd.aliases) {
            // Compare against the same-length prefix of the transcript
            const candidate = lower.slice(0, alias.length)
            const dist = levenshtein(candidate, alias)
            if (dist > 0 && dist < fuzzyDist) {
                fuzzyDist = dist
                fuzzyCmd = cmd
            }
        }
    }
    if (fuzzyCmd) {
        return fuzzyCmd
    }

    // Pass 3: fuzzy keyword token match
    let bestCmd: VoiceCommandDef | null = null
    let bestScore = 0
    for (const cmd of commands) {
        const tokens = cmd.keywords
            .toLowerCase()
            .split(' ')
            .filter((tok) => tok.length >= 3)
        const score = tokens.filter((tok) => lower.includes(tok)).length
        if (score >= 2 && score > bestScore) {
            bestScore = score
            bestCmd = cmd
        }
    }
    return bestCmd
}

// ---------------------------------------------------------------------------
// Registry builder  (call at runtime to get fresh translations)
// ---------------------------------------------------------------------------

/**
 * Builds the full command list. Must be called inside an async callback
 * where i18n is already initialised (e.g. within initVoiceCommandSubscription).
 */
export function buildVoiceCommands(dispatch: AppDispatch): VoiceCommandDef[] {
    const t = getT()

    // Helper: lowercase nav-name aliases
    const nav = (key: string) => t(key).toLowerCase()

    return [
        // ── Navigation ────────────────────────────────────────────────────
        {
            id: 'nav_plants',
            group: 'Navigation',
            label: t('commandPalette.commands.goTo', { view: t('nav.plants') }),
            aliases: [
                'go to plants',
                nav('nav.plants'),
                'show garden',
                'gehe zu pflanzen',
                'pflanzen öffnen',
            ],
            keywords: 'plants garden grow home dashboard',
            action: () => getUISnapshot().setActiveView(View.Plants),
        },
        {
            id: 'nav_strains',
            group: 'Navigation',
            label: t('commandPalette.commands.goTo', { view: t('nav.strains') }),
            aliases: [
                'go to strains',
                nav('nav.strains'),
                'show strains',
                'gehe zu sorten',
                'sorten öffnen',
            ],
            keywords: 'strains varieties cultivars database catalog',
            action: () => getUISnapshot().setActiveView(View.Strains),
        },
        {
            id: 'nav_equipment',
            group: 'Navigation',
            label: t('commandPalette.commands.goTo', { view: t('nav.equipment') }),
            aliases: [
                'go to equipment',
                nav('nav.equipment'),
                'show equipment',
                'gehe zu ausrüstung',
                'ausrüstung öffnen',
            ],
            keywords: 'equipment tools setup configurator hardware',
            action: () => getUISnapshot().setActiveView(View.Equipment),
        },
        {
            id: 'nav_knowledge',
            group: 'Navigation',
            label: t('commandPalette.commands.goTo', { view: t('nav.knowledge') }),
            aliases: [
                'go to knowledge',
                nav('nav.knowledge'),
                'show knowledge',
                'gehe zu wissen',
                'wissen öffnen',
            ],
            keywords: 'knowledge mentor guide wiki learn ai chat',
            action: () => getUISnapshot().setActiveView(View.Knowledge),
        },
        {
            id: 'nav_settings',
            group: 'Navigation',
            label: t('commandPalette.commands.goTo', { view: t('nav.settings') }),
            aliases: [
                'go to settings',
                nav('nav.settings'),
                'open settings',
                'gehe zu einstellungen',
                'einstellungen öffnen',
            ],
            keywords: 'settings preferences config options',
            action: () => getUISnapshot().setActiveView(View.Settings),
        },
        {
            id: 'nav_help',
            group: 'Navigation',
            label: t('commandPalette.commands.goTo', { view: t('nav.help') }),
            aliases: ['go to help', nav('nav.help'), 'show help', 'gehe zu hilfe', 'hilfe öffnen'],
            keywords: 'help faq support documentation',
            action: () => getUISnapshot().setActiveView(View.Help),
        },
        {
            id: 'nav_back',
            group: 'Navigation',
            label: t('common.back'),
            aliases: ['go back', 'back', 'zurück', 'zuruck'],
            keywords: 'back navigate previous return',
            action: () => {
                const { activeView, lastActiveView } = getUISnapshot()
                if (activeView !== lastActiveView) {
                    getUISnapshot().setActiveView(lastActiveView)
                }
            },
        },

        // ── Strain Actions ────────────────────────────────────────────────
        {
            id: 'strain_search',
            group: 'Strains',
            label: t('settingsView.tts.commands.searchFor'),
            aliases: ['search for', 'suche nach', 'find strain'],
            keywords: 'search find strain filter lookup',
            action: (transcript) => {
                const term = transcript.split(/search for|suche nach|find strain/i)[1]?.trim()
                if (term) {
                    getUISnapshot().setActiveView(View.Strains)
                    useFiltersStore.getState().setSearchTerm(term)
                }
            },
        },
        {
            id: 'strain_reset_filters',
            group: 'Strains',
            label: t('commandPalette.commands.resetFilters'),
            aliases: ['reset filters', 'clear filters', 'filter zurücksetzen', 'filter löschen'],
            keywords: 'reset clear filters all strains',
            action: () => useFiltersStore.getState().resetAllFilters(),
        },
        {
            id: 'strain_show_favorites',
            group: 'Strains',
            label: t('commandPalette.commands.showFavorites'),
            aliases: ['show favorites', 'zeige favoriten', 'favorites', 'favoriten'],
            keywords: 'favorites liked bookmarks hearts show',
            action: () => {
                getUISnapshot().setActiveView(View.Strains)
                useStrainsViewStore.getState().setStrainsViewTab(StrainViewTab.Favorites)
            },
        },
        {
            id: 'strain_filter_sativa',
            group: 'Strains',
            label: t('commandPalette.commands.filterSativa'),
            aliases: ['filter sativa', 'show sativa', 'sativa filter'],
            keywords: 'filter sativa type energetic uplifting',
            action: () => {
                getUISnapshot().setActiveView(View.Strains)
                useFiltersStore.getState().toggleTypeFilter(StrainType.Sativa)
            },
        },
        {
            id: 'strain_filter_indica',
            group: 'Strains',
            label: t('commandPalette.commands.filterIndica'),
            aliases: ['filter indica', 'show indica', 'indica filter'],
            keywords: 'filter indica type relaxing sedating',
            action: () => {
                getUISnapshot().setActiveView(View.Strains)
                useFiltersStore.getState().toggleTypeFilter(StrainType.Indica)
            },
        },
        {
            id: 'strain_filter_hybrid',
            group: 'Strains',
            label: t('commandPalette.commands.filterHybrid'),
            aliases: ['filter hybrid', 'show hybrid', 'hybrid filter'],
            keywords: 'filter hybrid type balanced',
            action: () => {
                getUISnapshot().setActiveView(View.Strains)
                useFiltersStore.getState().toggleTypeFilter(StrainType.Hybrid)
            },
        },

        // ── Plant Actions ─────────────────────────────────────────────────
        {
            id: 'plant_water_all',
            group: 'Plants',
            label: t('commandPalette.commands.waterAll'),
            aliases: ['water all plants', 'water all', 'alle pflanzen gießen', 'alles gießen'],
            keywords: 'water irrigate hydrate all plants',
            action: () => dispatch(waterAllPlants()),
            requiresConfirmation: true,
        },

        // ── Equipment Tabs ────────────────────────────────────────────────
        {
            id: 'equip_tab_calculators',
            group: 'Equipment',
            label: t('commandPalette.commands.switchTab', {
                view: t('nav.equipment'),
                tab: t('equipmentView.tabs.calculators'),
            }),
            aliases: ['open calculators', 'show calculators', 'rechner öffnen'],
            keywords: 'calculators vpd cost light wattage equipment',
            action: () => {
                getUISnapshot().setActiveView(View.Equipment)
                getUISnapshot().setEquipmentViewTab(EquipmentViewTab.Calculators)
            },
        },
        {
            id: 'equip_tab_seedbanks',
            group: 'Equipment',
            label: t('commandPalette.commands.switchTab', {
                view: t('nav.equipment'),
                tab: t('equipmentView.tabs.seedbanks'),
            }),
            aliases: ['open seedbanks', 'show seed banks', 'seedbanks öffnen'],
            keywords: 'seed banks seeds purchase order buy',
            action: () => {
                getUISnapshot().setActiveView(View.Equipment)
                getUISnapshot().setEquipmentViewTab(EquipmentViewTab.Seedbanks)
            },
        },

        // ── Knowledge Tabs ────────────────────────────────────────────────
        {
            id: 'know_tab_mentor',
            group: 'Knowledge',
            label: t('commandPalette.commands.switchTab', {
                view: t('nav.knowledge'),
                tab: t('knowledgeView.tabs.mentor'),
            }),
            aliases: ['open mentor', 'open ai chat', 'mentor öffnen', 'ki mentor öffnen'],
            keywords: 'ai mentor chat advice assistant knowledge',
            action: () => {
                getUISnapshot().setActiveView(View.Knowledge)
                getUISnapshot().setKnowledgeViewTab(KnowledgeViewTab.Mentor)
            },
        },
        {
            id: 'know_tab_guide',
            group: 'Knowledge',
            label: t('commandPalette.commands.switchTab', {
                view: t('nav.knowledge'),
                tab: t('knowledgeView.tabs.guide'),
            }),
            aliases: ['open guide', 'show guide', 'guide öffnen'],
            keywords: 'grow guide tutorial howto steps knowledge',
            action: () => {
                getUISnapshot().setActiveView(View.Knowledge)
                getUISnapshot().setKnowledgeViewTab(KnowledgeViewTab.Guide)
            },
        },

        // ── AI Mode ───────────────────────────────────────────────────────
        {
            id: 'ai_mode_cloud',
            group: 'AI',
            label: t('commandPalette.commands.aiModeCloud'),
            aliases: ['ai cloud mode', 'switch to cloud', 'cloud modus'],
            keywords: 'ai mode cloud gemini api online',
            action: () => dispatch(setSetting({ path: 'aiMode', value: 'cloud' })),
        },
        {
            id: 'ai_mode_local',
            group: 'AI',
            label: t('commandPalette.commands.aiModeLocal'),
            aliases: ['ai local mode', 'switch to local', 'offline modus', 'lokaler modus'],
            keywords: 'ai mode local device offline private',
            action: () => dispatch(setSetting({ path: 'aiMode', value: 'local' })),
        },
        {
            id: 'ai_mode_hybrid',
            group: 'AI',
            label: t('commandPalette.commands.aiModeHybrid'),
            aliases: ['ai hybrid mode', 'switch to hybrid', 'hybrid modus'],
            keywords: 'ai mode hybrid smart routing auto',
            action: () => dispatch(setSetting({ path: 'aiMode', value: 'hybrid' })),
        },

        // ── Accessibility ─────────────────────────────────────────────────
        {
            id: 'a11y_dyslexia',
            group: 'Accessibility',
            label: t('commandPalette.commands.toggleDyslexiaFont'),
            aliases: ['toggle dyslexia font', 'dyslexia font', 'leseschrift'],
            keywords: 'dyslexia font readability atkinson accessible toggle',
            action: () => dispatch(toggleSetting({ path: 'general.dyslexiaFont' })),
        },
        {
            id: 'a11y_high_contrast',
            group: 'Accessibility',
            label: t('commandPalette.commands.toggleHighContrast'),
            aliases: ['toggle high contrast', 'high contrast', 'hoher kontrast'],
            keywords: 'high contrast visibility accessibility bold toggle',
            action: () => dispatch(toggleSetting({ path: 'general.highContrastMode' })),
        },
        // ── Diagnosis ─────────────────────────────────────────────────────
        {
            id: 'diag_show',
            group: 'Knowledge',
            label: 'Show Diagnosis',
            aliases: [
                'show diagnosis',
                'zeige diagnose',
                'plant diagnosis',
                'pflanzendiagnose',
                'leaf diagnosis',
                'blattdiagnose',
            ],
            keywords: 'diagnosis health leaf disease check scan',
            action: () => {
                getUISnapshot().setActiveView(View.Knowledge)
                getUISnapshot().setKnowledgeViewTab(KnowledgeViewTab.Mentor)
            },
        },

        // ── Strain Compare & Random ───────────────────────────────────────
        {
            id: 'strain_compare',
            group: 'Strains',
            label: 'Compare Strains',
            aliases: [
                'compare strains',
                'vergleiche sorten',
                'strain comparison',
                'sortenvergleich',
            ],
            keywords: 'compare comparison side strains versus',
            action: () => {
                getUISnapshot().setActiveView(View.Strains)
                useStrainsViewStore.getState().setStrainsViewTab(StrainViewTab.Comparison)
            },
        },
        {
            id: 'strain_random',
            group: 'Strains',
            label: 'Random Strain',
            aliases: ['random strain', 'zufaellige sorte', 'surprise me', 'ueberrasche mich'],
            keywords: 'random surprise strain discover pick',
            action: () => {
                const strains = allStrainsData
                if (strains.length > 0) {
                    const pick = strains[Math.floor(secureRandom() * strains.length)]
                    if (pick) {
                        getUISnapshot().setActiveView(View.Strains)
                        useFiltersStore.getState().setSearchTerm(pick.name)
                    }
                }
            },
        },

        // ── AI Status & Model Change ──────────────────────────────────────
        {
            id: 'ai_status',
            group: 'AI',
            label: 'AI Status',
            aliases: ['ai status', 'ki status', 'model status', 'modell status'],
            keywords: 'status model loaded info check',
            action: () => {
                const aiMode = getReduxSnapshot((s) => s.settings.settings.aiMode)
                getUISnapshot().addNotification({
                    message: `AI mode: ${aiMode ?? 'hybrid'}`,
                    type: 'info',
                })
            },
        },
        {
            id: 'ai_change_model',
            group: 'AI',
            label: 'Change AI Model',
            aliases: ['change model', 'modell wechseln', 'switch model', 'modell aendern'],
            keywords: 'change switch model select llm webllm',
            action: () => getUISnapshot().setActiveView(View.Settings),
        },

        // ── Hydro Monitor ─────────────────────────────────────────────────
        {
            id: 'equip_tab_hydro',
            group: 'Equipment',
            label: 'Show Hydro Monitor',
            aliases: ['show hydro', 'show ph', 'zeige ph', 'zeige hydro', 'hydro monitor'],
            keywords: 'hydro ph ec monitor water nutrient',
            action: () => {
                getUISnapshot().setActiveView(View.Equipment)
                getUISnapshot().setEquipmentViewTab(EquipmentViewTab.HydroMonitoring)
            },
        },

        // ── Calculator Commands ───────────────────────────────────────────
        {
            id: 'calc_vpd',
            group: 'Equipment',
            label: 'Calculate VPD',
            aliases: [
                'calculate vpd',
                'berechne vpd',
                'vpd calculator',
                'vpd rechner',
                'check vpd',
            ],
            keywords: 'calculate vpd vapor pressure deficit rechner',
            action: () => {
                getUISnapshot().setActiveView(View.Knowledge)
                getUISnapshot().setKnowledgeViewTab(KnowledgeViewTab.Rechner)
            },
        },
        {
            id: 'calc_humidity',
            group: 'Equipment',
            label: 'Check Humidity Deficit',
            aliases: [
                'humidity deficit',
                'check humidity',
                'feuchtigkeitsdefizit',
                'luftfeuchtigkeit pruefen',
            ],
            keywords: 'humidity deficit moisture check feuchte',
            action: () => {
                getUISnapshot().setActiveView(View.Knowledge)
                getUISnapshot().setKnowledgeViewTab(KnowledgeViewTab.Rechner)
            },
        },
        {
            id: 'calc_ph',
            group: 'Equipment',
            label: 'pH Check',
            aliases: ['ph check', 'ph pruefen', 'check ph level', 'ph wert', 'ph wert pruefen'],
            keywords: 'ph check level value wert pruefen',
            action: () => {
                getUISnapshot().setActiveView(View.Equipment)
                getUISnapshot().setEquipmentViewTab(EquipmentViewTab.HydroMonitoring)
            },
        },

        // ── Hydro Commands ────────────────────────────────────────────────
        {
            id: 'hydro_ec',
            group: 'Equipment',
            label: 'EC Reading',
            aliases: ['ec reading', 'ec wert', 'show ec', 'zeige ec', 'check ec'],
            keywords: 'ec reading conductivity nutrient strength',
            action: () => {
                getUISnapshot().setActiveView(View.Equipment)
                getUISnapshot().setEquipmentViewTab(EquipmentViewTab.HydroMonitoring)
            },
        },

        // ── Grow Planner Commands ─────────────────────────────────────────
        {
            id: 'planner_next_task',
            group: 'Plants',
            label: 'Next Task',
            aliases: [
                'next task',
                'naechste aufgabe',
                'show tasks',
                'aufgaben zeigen',
                'what should i do',
            ],
            keywords: 'next task aufgabe todo planner schedule',
            action: () => {
                getUISnapshot().setActiveView(View.Plants)
            },
        },
        {
            id: 'planner_add_task',
            group: 'Plants',
            label: 'Add Task',
            aliases: ['add task', 'aufgabe hinzufuegen', 'new task', 'neue aufgabe'],
            keywords: 'add new task aufgabe create planner',
            action: () => {
                getUISnapshot().setActiveView(View.Plants)
            },
        },

        // ── Plant CRUD Commands ───────────────────────────────────────────
        {
            id: 'plant_add',
            group: 'Plants',
            label: 'Add Plant',
            aliases: [
                'add plant',
                'pflanze hinzufuegen',
                'new plant',
                'neue pflanze',
                'add a plant',
            ],
            keywords: 'add new plant pflanze create grow',
            action: () => {
                getUISnapshot().setActiveView(View.Plants)
            },
        },
        {
            id: 'plant_status',
            group: 'Plants',
            label: 'Plant Status',
            aliases: [
                'plant status',
                'pflanzenstatus',
                'how are my plants',
                'wie geht es meinen pflanzen',
            ],
            keywords: 'plant status health condition check pflanzen',
            action: () => {
                getUISnapshot().setActiveView(View.Plants)
            },
        },

        // ── Export Command ────────────────────────────────────────────────
        {
            id: 'export_grow_log',
            group: 'Plants',
            label: 'Export Grow Log',
            aliases: [
                'export grow log',
                'grow log exportieren',
                'export data',
                'daten exportieren',
            ],
            keywords: 'export data grow log download backup',
            action: () => {
                getUISnapshot().setActiveView(View.Settings)
            },
        },

        // ── Knowledge Tabs ────────────────────────────────────────────────
        {
            id: 'know_tab_lexikon',
            group: 'Knowledge',
            label: 'Open Lexikon',
            aliases: ['open lexikon', 'show lexikon', 'lexikon oeffnen', 'glossary', 'glossar'],
            keywords: 'lexikon glossary terms definitions wiki',
            action: () => {
                getUISnapshot().setActiveView(View.Knowledge)
                getUISnapshot().setKnowledgeViewTab(KnowledgeViewTab.Lexikon)
            },
        },
        {
            id: 'know_tab_atlas',
            group: 'Knowledge',
            label: 'Disease Atlas',
            aliases: [
                'disease atlas',
                'krankheitsatlas',
                'show diseases',
                'zeige krankheiten',
                'plant diseases',
            ],
            keywords: 'disease atlas diagnosis illness pest deficiency',
            action: () => {
                getUISnapshot().setActiveView(View.Knowledge)
                getUISnapshot().setKnowledgeViewTab(KnowledgeViewTab.Atlas)
            },
        },

        // ── Read Aloud / Stop Reading ─────────────────────────────────────
        {
            id: 'tts_read_aloud',
            group: 'Accessibility',
            label: 'Read Aloud',
            aliases: ['read aloud', 'vorlesen', 'read this', 'lies vor'],
            keywords: 'read aloud speak text voice output vorlesen',
            action: () => {
                // Trigger TTS for currently visible content (handled by ReadAloudButton in views)
                getUISnapshot().addNotification({
                    message: 'Use the read-aloud button on any content card.',
                    type: 'info',
                })
            },
        },
        {
            id: 'tts_stop_reading',
            group: 'Accessibility',
            label: 'Stop Reading',
            aliases: ['stop reading', 'aufhoeren', 'stop vorlesen', 'be quiet', 'sei still'],
            keywords: 'stop reading silence quiet mute aufhoeren',
            action: () => {
                useTtsStore.getState().stop()
            },
        },
    ]
}
