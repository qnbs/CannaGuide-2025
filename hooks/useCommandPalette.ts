import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setActiveView, openAddModal } from '@/stores/slices/uiSlice';
import { setSetting, exportAllData, resetAllData } from '@/stores/slices/settingsSlice';
import { Command, View, Language } from '@/types';
import { CommandGroup } from '@/services/commandService';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { i18nInstance } from '@/i18n';
import { selectSettings } from '@/stores/selectors';

export const useCommandPalette = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { language } = useAppSelector(selectSettings);

    const allCommands: Command[] = useMemo(() => {
        const navigate = (view: View) => {
            dispatch(setActiveView(view));
        };

        const toggleLanguage = () => {
            const newLang: Language = language === 'en' ? 'de' : 'en';
            dispatch(setSetting({ path: 'language', value: newLang }));
            i18nInstance.changeLanguage(newLang);
        };

        return [
            // Navigation
            { id: 'nav-plants', title: t('nav.plants'), icon: PhosphorIcons.Plant, group: CommandGroup.Navigation, action: () => navigate(View.Plants), keywords: 'grow room dashboard garden' },
            { id: 'nav-strains', title: t('nav.strains'), icon: PhosphorIcons.Leafy, group: CommandGroup.Navigation, action: () => navigate(View.Strains), keywords: 'encyclopedia library search find' },
            { id: 'nav-equipment', title: t('nav.equipment'), icon: PhosphorIcons.Wrench, group: CommandGroup.Navigation, action: () => navigate(View.Equipment), keywords: 'gear tools configurator calculator' },
            { id: 'nav-knowledge', title: t('nav.knowledge'), icon: PhosphorIcons.BookOpenText, group: CommandGroup.Navigation, action: () => navigate(View.Knowledge), keywords: 'guide mentor learn help' },
            { id: 'nav-settings', title: t('nav.settings'), icon: PhosphorIcons.Gear, group: CommandGroup.Navigation, action: () => navigate(View.Settings), keywords: 'options configuration' },
            { id: 'nav-help', title: t('nav.help'), icon: PhosphorIcons.Question, group: CommandGroup.Navigation, action: () => navigate(View.Help), keywords: 'faq support lexicon' },
            
            // General Actions
            { id: 'action-add-strain', title: t('strainsView.addStrain'), icon: PhosphorIcons.PlusCircle, group: CommandGroup.General, action: () => dispatch(openAddModal()) },
            
            // Settings
            { 
                id: 'setting-toggle-language', 
                title: t('commandPalette.toggleLanguage', { lang: language === 'en' ? t('settingsView.languages.de') : t('settingsView.languages.en') }),
                icon: PhosphorIcons.Globe, 
                group: CommandGroup.Settings, 
                action: toggleLanguage 
            },

            // Data Management
            { id: 'data-export', title: t('settingsView.data.exportAll'), icon: PhosphorIcons.DownloadSimple, group: CommandGroup.Settings, action: () => dispatch(exportAllData()) },
            { id: 'data-reset', title: t('settingsView.data.resetAll'), icon: PhosphorIcons.WarningCircle, group: CommandGroup.Settings, action: () => dispatch(resetAllData()) },
        ];
    }, [t, dispatch, language]);

    return { allCommands };
};