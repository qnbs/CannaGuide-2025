import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/stores/store'
import {
    Command,
    View,
    StrainType,
    StrainViewTab,
    EquipmentViewTab,
    KnowledgeViewTab,
} from '@/types'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import {
    setActiveView,
    openAddModal,
    setIsCommandPaletteOpen,
    openExportModal,
    setEquipmentViewTab,
    setKnowledgeViewTab,
} from '@/stores/slices/uiSlice'
import { setSetting, toggleSetting } from '@/stores/slices/settingsSlice'
import { resetAllFilters, toggleTypeFilter } from '@/stores/slices/filtersSlice'
import {
    setStrainsViewTab,
    setStrainsViewMode,
    clearStrainSelection,
} from '@/stores/slices/strainsViewSlice'
import { waterAllPlants } from '@/stores/slices/simulationSlice'

export const useCommandPalette = (): { allCommands: Command[] } => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    const allCommands: Command[] = useMemo(
        () => [
            // ── Navigation ──────────────────────────────────────────────
            {
                id: 'nav_plants',
                title: t('commandPalette.commands.goTo', { view: t('nav.plants') }),
                subtitle: t('nav.plants'),
                group: 'Navigation',
                icon: PhosphorIcons.Plant,
                action: () => dispatch(setActiveView(View.Plants)),
                shortcut: ['G', 'P'],
                keywords: 'plants garden grow home dashboard',
                priority: 10,
            },
            {
                id: 'nav_strains',
                title: t('commandPalette.commands.goTo', { view: t('nav.strains') }),
                subtitle: t('nav.strains'),
                group: 'Navigation',
                icon: PhosphorIcons.Leafy,
                action: () => dispatch(setActiveView(View.Strains)),
                shortcut: ['G', 'S'],
                keywords: 'strains varieties cultivars database',
                priority: 10,
            },
            {
                id: 'nav_equipment',
                title: t('commandPalette.commands.goTo', { view: t('nav.equipment') }),
                subtitle: t('nav.equipment'),
                group: 'Navigation',
                icon: PhosphorIcons.Wrench,
                action: () => dispatch(setActiveView(View.Equipment)),
                shortcut: ['G', 'E'],
                keywords: 'equipment tools setup configurator hardware',
                priority: 10,
            },
            {
                id: 'nav_knowledge',
                title: t('commandPalette.commands.goTo', { view: t('nav.knowledge') }),
                subtitle: t('nav.knowledge'),
                group: 'Navigation',
                icon: PhosphorIcons.Brain,
                action: () => dispatch(setActiveView(View.Knowledge)),
                shortcut: ['G', 'K'],
                keywords: 'knowledge mentor guide wiki learn ai chat',
                priority: 10,
            },
            {
                id: 'nav_settings',
                title: t('commandPalette.commands.goTo', { view: t('nav.settings') }),
                subtitle: t('nav.settings'),
                group: 'Navigation',
                icon: PhosphorIcons.Gear,
                action: () => dispatch(setActiveView(View.Settings)),
                shortcut: ['G', 'T'],
                keywords: 'settings preferences config options',
                priority: 9,
            },
            {
                id: 'nav_help',
                title: t('commandPalette.commands.goTo', { view: t('nav.help') }),
                subtitle: t('nav.help'),
                group: 'Navigation',
                icon: PhosphorIcons.Question,
                action: () => dispatch(setActiveView(View.Help)),
                shortcut: ['?'],
                keywords: 'help faq support documentation',
                priority: 8,
            },

            // ── Strain Actions ──────────────────────────────────────────
            {
                id: 'strain_add',
                title: t('commandPalette.commands.addStrain'),
                group: 'Strains',
                icon: PhosphorIcons.Plus,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(openAddModal())
                },
                keywords: 'add create new strain custom',
                priority: 8,
            },
            {
                id: 'strain_export',
                title: t('commandPalette.commands.exportData'),
                group: 'Strains',
                icon: PhosphorIcons.DownloadSimple,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(openExportModal())
                },
                keywords: 'export csv pdf download backup',
                priority: 5,
            },
            {
                id: 'strain_reset_filters',
                title: t('commandPalette.commands.resetFilters'),
                group: 'Strains',
                icon: PhosphorIcons.FunnelSimple,
                action: () => dispatch(resetAllFilters()),
                keywords: 'reset clear filters all',
            },
            {
                id: 'strain_show_favorites',
                title: t('commandPalette.commands.showFavorites'),
                group: 'Strains',
                icon: PhosphorIcons.Heart,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(setStrainsViewTab(StrainViewTab.Favorites))
                },
                keywords: 'favorites liked bookmarks hearts',
            },
            {
                id: 'strain_filter_sativa',
                title: t('commandPalette.commands.filterSativa'),
                group: 'Strains',
                icon: PhosphorIcons.Leafy,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(toggleTypeFilter(StrainType.Sativa))
                },
                keywords: 'filter sativa type energetic uplifting',
            },
            {
                id: 'strain_filter_indica',
                title: t('commandPalette.commands.filterIndica'),
                group: 'Strains',
                icon: PhosphorIcons.Leafy,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(toggleTypeFilter(StrainType.Indica))
                },
                keywords: 'filter indica type relaxing sedating',
            },
            {
                id: 'strain_filter_hybrid',
                title: t('commandPalette.commands.filterHybrid'),
                group: 'Strains',
                icon: PhosphorIcons.Leafy,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(toggleTypeFilter(StrainType.Hybrid))
                },
                keywords: 'filter hybrid type balanced',
            },
            {
                id: 'strain_clear_selection',
                title: t('commandPalette.commands.clearSelection'),
                group: 'Strains',
                icon: PhosphorIcons.Broom,
                action: () => dispatch(clearStrainSelection()),
                keywords: 'clear deselect uncheck selection',
            },
            {
                id: 'strain_view_list',
                title: t('strainsView.viewModes.list'),
                subtitle: t('commandPalette.commands.toggleViewMode'),
                group: 'Strains',
                icon: PhosphorIcons.ListBullets,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(setStrainsViewMode('list'))
                },
                keywords: 'list view mode table rows',
            },
            {
                id: 'strain_view_grid',
                title: t('strainsView.viewModes.grid'),
                subtitle: t('commandPalette.commands.toggleViewMode'),
                group: 'Strains',
                icon: PhosphorIcons.GridFour,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(setStrainsViewMode('grid'))
                },
                keywords: 'grid view mode cards tiles',
            },

            // ── Strain Tabs ─────────────────────────────────────────────
            {
                id: 'strain_tab_all',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.strains'),
                    tab: t('strainsView.tabs.allStrains'),
                }),
                group: 'Strains',
                icon: PhosphorIcons.ListChecks,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(setStrainsViewTab(StrainViewTab.All))
                },
                keywords: 'all strains tab browse catalog',
            },
            {
                id: 'strain_tab_my',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.strains'),
                    tab: t('strainsView.tabs.myStrains'),
                }),
                group: 'Strains',
                icon: PhosphorIcons.Person,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(setStrainsViewTab(StrainViewTab.MyStrains))
                },
                keywords: 'my strains custom personal',
            },
            {
                id: 'strain_tab_genealogy',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.strains'),
                    tab: t('strainsView.tabs.genealogy'),
                }),
                group: 'Strains',
                icon: PhosphorIcons.TreeStructure,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(setStrainsViewTab(StrainViewTab.Genealogy))
                },
                keywords: 'genealogy tree lineage family genetics',
            },
            {
                id: 'strain_tab_breeding',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.strains'),
                    tab: t('strainsView.tabs.breedingLab'),
                }),
                group: 'Strains',
                icon: PhosphorIcons.Flask,
                action: () => {
                    dispatch(setActiveView(View.Strains))
                    dispatch(setStrainsViewTab(StrainViewTab.BreedingLab))
                },
                keywords: 'breeding lab cross punnett genetics',
            },

            // ── Plant Actions ───────────────────────────────────────────
            {
                id: 'plant_water_all',
                title: t('commandPalette.commands.waterAll'),
                group: 'Plants',
                icon: PhosphorIcons.Drop,
                action: () => dispatch(waterAllPlants()),
                keywords: 'water irrigate hydrate all plants',
                priority: 7,
            },

            // ── Equipment Tabs ──────────────────────────────────────────
            {
                id: 'equip_tab_configurator',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.equipment'),
                    tab: t('equipmentView.tabs.configurator'),
                }),
                group: 'Equipment',
                icon: PhosphorIcons.GearSix,
                action: () => {
                    dispatch(setActiveView(View.Equipment))
                    dispatch(setEquipmentViewTab(EquipmentViewTab.Configurator))
                },
                keywords: 'configurator setup ai recommendations',
            },
            {
                id: 'equip_tab_setups',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.equipment'),
                    tab: t('equipmentView.tabs.setups'),
                }),
                group: 'Equipment',
                icon: PhosphorIcons.Archive,
                action: () => {
                    dispatch(setActiveView(View.Equipment))
                    dispatch(setEquipmentViewTab(EquipmentViewTab.Setups))
                },
                keywords: 'saved setups configurations presets',
            },
            {
                id: 'equip_tab_calculators',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.equipment'),
                    tab: t('equipmentView.tabs.calculators'),
                }),
                group: 'Equipment',
                icon: PhosphorIcons.Calculator,
                action: () => {
                    dispatch(setActiveView(View.Equipment))
                    dispatch(setEquipmentViewTab(EquipmentViewTab.Calculators))
                },
                keywords: 'calculators vpd cost light wattage',
            },
            {
                id: 'equip_tab_growshops',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.equipment'),
                    tab: t('equipmentView.tabs.growShops'),
                }),
                group: 'Equipment',
                icon: PhosphorIcons.Storefront,
                action: () => {
                    dispatch(setActiveView(View.Equipment))
                    dispatch(setEquipmentViewTab(EquipmentViewTab.GrowShops))
                },
                keywords: 'grow shops stores buy purchase',
            },
            {
                id: 'equip_tab_seedbanks',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.equipment'),
                    tab: t('equipmentView.tabs.seedbanks'),
                }),
                group: 'Equipment',
                icon: PhosphorIcons.Cannabis,
                action: () => {
                    dispatch(setActiveView(View.Equipment))
                    dispatch(setEquipmentViewTab(EquipmentViewTab.Seedbanks))
                },
                keywords: 'seed banks seeds purchase order',
            },

            // ── Knowledge Tabs ──────────────────────────────────────────
            {
                id: 'know_tab_mentor',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.knowledge'),
                    tab: t('knowledgeView.tabs.mentor'),
                }),
                group: 'Knowledge',
                icon: PhosphorIcons.Brain,
                action: () => {
                    dispatch(setActiveView(View.Knowledge))
                    dispatch(setKnowledgeViewTab(KnowledgeViewTab.Mentor))
                },
                keywords: 'ai mentor chat advice assistant',
                priority: 6,
            },
            {
                id: 'know_tab_guide',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.knowledge'),
                    tab: t('knowledgeView.tabs.guide'),
                }),
                group: 'Knowledge',
                icon: PhosphorIcons.BookOpenText,
                action: () => {
                    dispatch(setActiveView(View.Knowledge))
                    dispatch(setKnowledgeViewTab(KnowledgeViewTab.Guide))
                },
                keywords: 'grow guide tutorial howto steps',
            },
            {
                id: 'know_tab_archive',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.knowledge'),
                    tab: t('knowledgeView.tabs.archive'),
                }),
                group: 'Knowledge',
                icon: PhosphorIcons.ArchiveBox,
                action: () => {
                    dispatch(setActiveView(View.Knowledge))
                    dispatch(setKnowledgeViewTab(KnowledgeViewTab.Archive))
                },
                keywords: 'archive history conversations saved',
            },
            {
                id: 'know_tab_breeding',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.knowledge'),
                    tab: t('knowledgeView.tabs.breeding'),
                }),
                group: 'Knowledge',
                icon: PhosphorIcons.Flask,
                action: () => {
                    dispatch(setActiveView(View.Knowledge))
                    dispatch(setKnowledgeViewTab(KnowledgeViewTab.Breeding))
                },
                keywords: 'breeding genetics knowledge',
            },
            {
                id: 'know_tab_sandbox',
                title: t('commandPalette.commands.switchTab', {
                    view: t('nav.knowledge'),
                    tab: t('knowledgeView.tabs.sandbox'),
                }),
                group: 'Knowledge',
                icon: PhosphorIcons.GameController,
                action: () => {
                    dispatch(setActiveView(View.Knowledge))
                    dispatch(setKnowledgeViewTab(KnowledgeViewTab.Sandbox))
                },
                keywords: 'sandbox experiment simulate test playground',
            },

            // ── Appearance ──────────────────────────────────────────────
            {
                id: 'theme_midnight',
                title: t('commandPalette.commands.switchTheme', {
                    theme: t('settingsView.general.themes.midnight'),
                }),
                group: 'Appearance',
                icon: PhosphorIcons.Sun,
                action: () => dispatch(setSetting({ path: 'general.theme', value: 'midnight' })),
                keywords: 'theme dark midnight night',
            },
            {
                id: 'theme_forest',
                title: t('commandPalette.commands.switchTheme', {
                    theme: t('settingsView.general.themes.forest'),
                }),
                group: 'Appearance',
                icon: PhosphorIcons.Plant,
                action: () => dispatch(setSetting({ path: 'general.theme', value: 'forest' })),
                keywords: 'theme green forest nature',
            },
            {
                id: 'theme_purplehaze',
                title: t('commandPalette.commands.switchTheme', {
                    theme: t('settingsView.general.themes.purpleHaze'),
                }),
                group: 'Appearance',
                icon: PhosphorIcons.Sparkle,
                action: () => dispatch(setSetting({ path: 'general.theme', value: 'purpleHaze' })),
                keywords: 'theme purple haze violet',
            },
            {
                id: 'theme_desertsky',
                title: t('commandPalette.commands.switchTheme', {
                    theme: t('settingsView.general.themes.desertSky'),
                }),
                group: 'Appearance',
                icon: PhosphorIcons.Sun,
                action: () => dispatch(setSetting({ path: 'general.theme', value: 'desertSky' })),
                keywords: 'theme desert sky warm orange',
            },
            {
                id: 'theme_rosequartz',
                title: t('commandPalette.commands.switchTheme', {
                    theme: t('settingsView.general.themes.roseQuartz'),
                }),
                group: 'Appearance',
                icon: PhosphorIcons.Heart,
                action: () => dispatch(setSetting({ path: 'general.theme', value: 'roseQuartz' })),
                keywords: 'theme rose pink quartz soft',
            },
            {
                id: 'theme_rainbowkush',
                title: t('commandPalette.commands.switchTheme', {
                    theme: t('settingsView.general.themes.rainbowKush'),
                }),
                group: 'Appearance',
                icon: PhosphorIcons.Sparkle,
                action: () => dispatch(setSetting({ path: 'general.theme', value: 'rainbowKush' })),
                keywords: 'theme rainbow kush colorful vibrant',
            },
            {
                id: 'theme_ogkushgreen',
                title: t('commandPalette.commands.switchTheme', {
                    theme: t('settingsView.general.themes.ogKushGreen'),
                }),
                group: 'Appearance',
                icon: PhosphorIcons.Cannabis,
                action: () => dispatch(setSetting({ path: 'general.theme', value: 'ogKushGreen' })),
                keywords: 'theme og kush green classic',
            },
            {
                id: 'theme_runtzrainbow',
                title: t('commandPalette.commands.switchTheme', {
                    theme: t('settingsView.general.themes.runtzRainbow'),
                }),
                group: 'Appearance',
                icon: PhosphorIcons.Sparkle,
                action: () =>
                    dispatch(setSetting({ path: 'general.theme', value: 'runtzRainbow' })),
                keywords: 'theme runtz rainbow candy',
            },
            {
                id: 'theme_lemonskunk',
                title: t('commandPalette.commands.switchTheme', {
                    theme: t('settingsView.general.themes.lemonSkunk'),
                }),
                group: 'Appearance',
                icon: PhosphorIcons.LightbulbFilament,
                action: () => dispatch(setSetting({ path: 'general.theme', value: 'lemonSkunk' })),
                keywords: 'theme lemon skunk yellow citrus',
            },

            // ── Accessibility ───────────────────────────────────────────
            {
                id: 'a11y_dyslexia',
                title: t('commandPalette.commands.toggleDyslexiaFont'),
                group: 'Accessibility',
                icon: PhosphorIcons.TextBolder,
                action: () => dispatch(toggleSetting({ path: 'general.dyslexiaFont' })),
                keywords: 'dyslexia font readability atkinson accessible',
            },
            {
                id: 'a11y_reduced_motion',
                title: t('commandPalette.commands.toggleReducedMotion'),
                group: 'Accessibility',
                icon: PhosphorIcons.Pause,
                action: () => dispatch(toggleSetting({ path: 'general.reducedMotion' })),
                keywords: 'reduced motion animation disable prefers',
            },
            {
                id: 'a11y_high_contrast',
                title: t('commandPalette.commands.toggleHighContrast'),
                group: 'Accessibility',
                icon: PhosphorIcons.Lightning,
                action: () => dispatch(toggleSetting({ path: 'general.highContrastMode' })),
                keywords: 'high contrast visibility accessibility bold',
            },

            // ── AI Mode ─────────────────────────────────────────────────
            {
                id: 'ai_mode_cloud',
                title: t('commandPalette.commands.aiModeCloud'),
                group: 'AI',
                icon: PhosphorIcons.CloudArrowUp,
                action: () => dispatch(setSetting({ path: 'aiMode', value: 'cloud' })),
                keywords: 'ai mode cloud gemini api online',
            },
            {
                id: 'ai_mode_local',
                title: t('commandPalette.commands.aiModeLocal'),
                group: 'AI',
                icon: PhosphorIcons.Cube,
                action: () => dispatch(setSetting({ path: 'aiMode', value: 'local' })),
                keywords: 'ai mode local on-device offline private wasm webgpu',
            },
            {
                id: 'ai_mode_hybrid',
                title: t('commandPalette.commands.aiModeHybrid'),
                group: 'AI',
                icon: PhosphorIcons.Lightning,
                action: () => dispatch(setSetting({ path: 'aiMode', value: 'hybrid' })),
                keywords: 'ai mode hybrid smart routing auto',
            },

            // ── General ─────────────────────────────────────────────────
            {
                id: 'toggle_palette',
                title: t('commandPalette.close'),
                group: 'General',
                icon: PhosphorIcons.CommandLine,
                action: () => dispatch(setIsCommandPaletteOpen(false)),
                shortcut: ['⌘', 'K'],
                keywords: 'close palette command',
            },
            {
                id: 'lang_en',
                title: t('commandPalette.toggleLanguage', { lang: 'English' }),
                group: 'General',
                icon: PhosphorIcons.Globe,
                action: () => dispatch(setSetting({ path: 'general.language', value: 'en' })),
                keywords: 'language english en switch locale',
            },
            {
                id: 'lang_de',
                title: t('commandPalette.toggleLanguage', { lang: 'Deutsch' }),
                group: 'General',
                icon: PhosphorIcons.Globe,
                action: () => dispatch(setSetting({ path: 'general.language', value: 'de' })),
                keywords: 'language deutsch german de switch locale sprache',
            },
        ],
        [t, dispatch],
    )

    return { allCommands }
}
