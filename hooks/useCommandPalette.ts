import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/stores/store';
import { Command, View, StrainType, StrainViewTab } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { 
    setActiveView, 
    openAddModal, 
    setIsCommandPaletteOpen,
    openExportModal,
} from '@/stores/slices/uiSlice';
import { setSetting } from '@/stores/slices/settingsSlice';
import { resetAllFilters, setShowFavoritesOnly, toggleTypeFilter } from '@/stores/slices/filtersSlice';
import { setStrainsViewTab } from '@/stores/slices/strainsViewSlice';
import { waterAllPlants } from '@/stores/slices/simulationSlice';

export const useCommandPalette = (): { allCommands: Command[] } => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const allCommands: Command[] = useMemo(() => [
        // Navigation
        { id: 'nav_plants', title: t('nav.plants'), group: 'Navigation', icon: PhosphorIcons.Plant, action: () => dispatch(setActiveView(View.Plants)), shortcut: ['G', 'P'] },
        { id: 'nav_strains', title: t('nav.strains'), group: 'Navigation', icon: PhosphorIcons.Leafy, action: () => dispatch(setActiveView(View.Strains)), shortcut: ['G', 'S'] },
        { id: 'nav_equipment', title: t('nav.equipment'), group: 'Navigation', icon: PhosphorIcons.Wrench, action: () => dispatch(setActiveView(View.Equipment)), shortcut: ['G', 'E'] },
        { id: 'nav_knowledge', title: t('nav.knowledge'), group: 'Navigation', icon: PhosphorIcons.Brain, action: () => dispatch(setActiveView(View.Knowledge)), shortcut: ['G', 'K'] },
        { id: 'nav_settings', title: t('nav.settings'), group: 'Navigation', icon: PhosphorIcons.Gear, action: () => dispatch(setActiveView(View.Settings)), shortcut: ['G', 'T'] },
        { id: 'nav_help', title: t('nav.help'), group: 'Navigation', icon: PhosphorIcons.Question, action: () => dispatch(setActiveView(View.Help)), shortcut: ['?'] },

        // Strain Actions
        { id: 'strain_add', title: t('strainsView.addStrain'), group: 'Strains', icon: PhosphorIcons.Plus, action: () => { dispatch(setActiveView(View.Strains)); dispatch(openAddModal()); } },
        { id: 'strain_export', title: t('common.export'), group: 'Strains', icon: PhosphorIcons.DownloadSimple, action: () => { dispatch(setActiveView(View.Strains)); dispatch(openExportModal()); } },
        { id: 'strain_reset_filters', title: t('strainsView.resetFilters'), group: 'Strains', icon: PhosphorIcons.FunnelSimple, action: () => dispatch(resetAllFilters()) },
        { id: 'strain_show_favorites', title: t('strainsView.tabs.favorites'), group: 'Strains', icon: PhosphorIcons.Heart, action: () => { dispatch(setActiveView(View.Strains)); dispatch(setStrainsViewTab(StrainViewTab.Favorites)); } },
        { id: 'strain_filter_sativa', title: `Filter: ${t('strainsView.sativa')}`, group: 'Strains', icon: PhosphorIcons.Leafy, action: () => { dispatch(setActiveView(View.Strains)); dispatch(toggleTypeFilter(StrainType.Sativa)); } },
        { id: 'strain_filter_indica', title: `Filter: ${t('strainsView.indica')}`, group: 'Strains', icon: PhosphorIcons.Leafy, action: () => { dispatch(setActiveView(View.Strains)); dispatch(toggleTypeFilter(StrainType.Indica)); } },
        { id: 'strain_filter_hybrid', title: `Filter: ${t('strainsView.hybrid')}`, group: 'Strains', icon: PhosphorIcons.Leafy, action: () => { dispatch(setActiveView(View.Strains)); dispatch(toggleTypeFilter(StrainType.Hybrid)); } },
        
        // Plant Actions
        { id: 'plant_water_all', title: t('plantsView.summary.waterAll'), group: 'Plants', icon: PhosphorIcons.Drop, action: () => dispatch(waterAllPlants()) },

        // General
        { id: 'toggle_palette', title: t('commandPalette.open'), group: 'General', icon: PhosphorIcons.CommandLine, action: () => dispatch(setIsCommandPaletteOpen(true)), shortcut: ['⌘', 'K'] },
        { id: 'lang_en', title: t('commandPalette.toggleLanguage', { lang: 'English' }), group: 'General', icon: PhosphorIcons.Globe, action: () => dispatch(setSetting({path: 'general.language', value: 'en'})) },
        { id: 'lang_de', title: t('commandPalette.toggleLanguage', { lang: 'Deutsch' }), group: 'General', icon: PhosphorIcons.Globe, action: () => dispatch(setSetting({path: 'general.language', value: 'de'})) },
    ], [t, dispatch]);

    return { allCommands };
};
