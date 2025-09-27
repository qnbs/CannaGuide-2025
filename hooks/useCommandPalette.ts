import React, { useMemo } from 'react';
import { Command, View } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { CommandGroup } from '@/services/commandService';

export const useCommandPalette = () => {
    const { t, locale } = useTranslations();
    const {
        setActiveView,
        setIsCommandPaletteOpen,
        setSetting,
        settings,
        openAddModal,
        openExportModal,
    } = useAppStore(state => ({
        setActiveView: state.setActiveView,
        setIsCommandPaletteOpen: state.setIsCommandPaletteOpen,
        setSetting: state.setSetting,
        settings: state.settings,
        openAddModal: state.openAddModal,
        openExportModal: state.openExportModal,
    }));

    const allCommands: Command[] = useMemo(() => {
        const createNavCommand = (view: View, icon: React.ElementType, keywords?: string, shortcut?: string[]): Command => ({
            id: `nav-${view}`,
            title: t(`nav.${view.toLowerCase()}`),
            subtitle: t('commandPalette.goToView', { view: view.toLowerCase() }),
            icon,
            action: () => {
                setActiveView(view);
                setIsCommandPaletteOpen(false);
            },
            keywords,
            shortcut,
            group: t('commandPalette.groups.navigation'),
        });

        return [
            // Navigation
            createNavCommand(View.Strains, PhosphorIcons.Leafy, 'database, library, search'),
            createNavCommand(View.Plants, PhosphorIcons.Plant, 'grow, room, garden'),
            createNavCommand(View.Equipment, PhosphorIcons.Wrench, 'setup, gear, tools, calculator'),
            createNavCommand(View.Knowledge, PhosphorIcons.BookOpenText, 'guide, learn, mentor, help'),
            createNavCommand(View.Settings, PhosphorIcons.Gear, 'options, config, preferences'),
            
            // General Actions
            {
                id: 'add-strain',
                title: t('strainsView.addStrain'),
                icon: PhosphorIcons.PlusCircle,
                action: () => {
                    openAddModal();
                    setIsCommandPaletteOpen(false);
                },
                keywords: 'new, custom, create',
                group: t('commandPalette.groups.strains')
            },
            {
                id: 'export-strains',
                title: t('common.export'),
                subtitle: t('commandPalette.exportStrains'),
                icon: PhosphorIcons.DownloadSimple,
                action: () => {
                    openExportModal();
                    setIsCommandPaletteOpen(false);
                },
                keywords: 'save, download, pdf, csv, json',
                group: t('commandPalette.groups.strains')
            },
            
            // Settings
            {
                id: 'toggle-language',
                title: t('commandPalette.toggleLanguage', { lang: locale === 'en' ? 'Deutsch' : 'English' }),
                icon: PhosphorIcons.Globe,
                action: () => setSetting('language', locale === 'en' ? 'de' : 'en'),
                group: t('commandPalette.groups.settings')
            },
            {
                id: 'toggle-theme',
                title: t('commandPalette.toggleTheme'),
                icon: PhosphorIcons.PaintBrush,
                action: () => {
                    const themes = ['midnight', 'forest', 'purpleHaze', 'desertSky', 'roseQuartz'];
                    const currentIndex = themes.indexOf(settings.theme);
                    const nextIndex = (currentIndex + 1) % themes.length;
                    setSetting('theme', themes[nextIndex]);
                },
                group: t('commandPalette.groups.settings')
            }
        ];
    }, [t, locale, setActiveView, setIsCommandPaletteOpen, setSetting, settings.theme, openAddModal, openExportModal]);

    return { allCommands };
};