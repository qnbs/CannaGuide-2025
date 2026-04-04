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
import { setSetting, toggleSetting } from '@/stores/slices/settingsSlice'
import { waterAllPlants } from '@/stores/slices/simulationSlice'
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
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/**
 * Two-pass matcher:
 * 1. Alias pass  - transcript.startsWith(alias)      -> immediate match
 * 2. Keyword pass - count 3+-char token hits in transcript -> best score >= 2
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

    // Pass 2: fuzzy keyword token match
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
    ]
}
