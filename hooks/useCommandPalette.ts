import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
// FIX: Moved 'startGrowInSlot' to its correct import from uiSlice.
import { setActiveView, openAddModal, startGrowInSlot } from '@/stores/slices/uiSlice';
import { setSetting, exportAllData } from '@/stores/slices/settingsSlice';
import { setStrainsViewMode } from '@/stores/slices/strainsViewSlice';
import { waterAllPlants } from '@/stores/slices/simulationSlice';
import { Command, View, Language, Theme } from '@/types';
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
            { id: 'action-add-strain', title: t('strainsView.addStrain'), icon: PhosphorIcons.PlusCircle, group: CommandGroup.General, action: () => dispatch(openAddModal()) },
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