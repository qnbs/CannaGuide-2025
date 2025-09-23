import React, { useMemo } from 'react';
import { View, Command } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
// FIX: Use the correct path alias for PhosphorIcons to resolve the module.
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppStore } from '@/stores/useAppStore';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { selectActivePlants, selectSettings } from '@/stores/selectors';
import { CommandGroup, groupAndSortCommands } from '@/services/commandService';

// State-of-the-art utility to escape strings for regex construction, preventing injection.
const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

export const useCommandPalette = () => {
    const { t } = useTranslations();
    const { deferredPrompt, handleInstallClick, isInstalled } = usePwaInstall();
    
    const { 
        setActiveView, setIsCommandPaletteOpen, waterAllPlants, advanceDay, setSetting, 
        setSelectedPlantId, addNotification, openAddModal, openExportModal
    } = useAppStore(state => ({
        setActiveView: state.setActiveView,
        setIsCommandPaletteOpen: state.setIsCommandPaletteOpen,
        waterAllPlants: state.waterAllPlants,
        advanceDay: state.advanceDay,
        setSetting: state.setSetting,
        setSelectedPlantId: state.setSelectedPlantId,
        addNotification: state.addNotification,
        openAddModal: state.openAddModal,
        openExportModal: state.openExportModal,
    }));
    const activePlants = useAppStore(selectActivePlants);
    const settings = useAppStore(selectSettings);

    const allCommands = useMemo(() => {
        const navigationCommands: Command[] = Object.values(View).map(view => ({
            id: `nav-${view}`,
            title: t(`nav.${view.toLowerCase()}`),
            group: CommandGroup.Navigation,
            // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
            icon: React.createElement(PhosphorIcons.ArrowSquareOut),
            action: () => {
                setActiveView(view);
                setIsCommandPaletteOpen(false);
            },
            keywords: `go to navigate view ${view.toLowerCase()} ${t(`nav.${view.toLowerCase()}`)}`
        }));

        const plantCommands: Command[] = [
            ...activePlants.map((plant) => ({
                id: `plant-inspect-${plant.id}`,
                title: `${t('commandPalette.inspect')} ${plant.name}`,
                group: CommandGroup.Plants,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.Plant),
                action: () => {
                    setActiveView(View.Plants);
                    setSelectedPlantId(plant.id);
                    setIsCommandPaletteOpen(false);
                },
                keywords: `view details ${plant.name} grow room track`
            })),
            {
                id: 'plant-water-all',
                title: t('plantsView.summary.waterAll'),
                group: CommandGroup.Plants,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.Drop),
                action: () => {
                    waterAllPlants();
                    setIsCommandPaletteOpen(false);
                },
                keywords: 'give water irrigate all plants'
            },
            {
                id: 'plant-advance-day',
                title: t('plantsView.summary.simulateNextDay'),
                group: CommandGroup.Plants,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.ArrowClockwise),
                action: () => {
                    advanceDay();
                    setIsCommandPaletteOpen(false);
                },
                keywords: 'next day simulate forward time advance'
            }
        ];
        
        const strainCommands: Command[] = [
            {
                id: 'strain-add-new',
                title: t('strainsView.addStrain'),
                group: CommandGroup.Strains,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.PlusCircle),
                action: () => { openAddModal(); setIsCommandPaletteOpen(false); },
                keywords: 'create new custom strain'
            },
            {
                id: 'strain-export',
                title: t('common.export'),
                group: CommandGroup.Strains,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.DownloadSimple),
                action: () => { openExportModal(); setIsCommandPaletteOpen(false); },
                keywords: 'export strains download save pdf csv txt'
            }
        ];

        const knowledgeCommands: Command[] = [
             {
                id: 'knowledge-diagnostics',
                title: t('ai.diagnostics'),
                group: CommandGroup.Knowledge,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.Sparkle),
                action: () => { setActiveView(View.Knowledge); useAppStore.getState().setSetting('knowledgeView.activeTab', 'diagnostics'); setIsCommandPaletteOpen(false); },
                keywords: 'diagnose plant problem photo issue doctor analysis'
            },
             {
                id: 'knowledge-mentor',
                title: t('ai.mentor'),
                group: CommandGroup.Knowledge,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.Brain),
                action: () => { setActiveView(View.Knowledge); useAppStore.getState().setSetting('knowledgeView.activeTab', 'mentor'); setIsCommandPaletteOpen(false); },
                keywords: 'ask question help guide mentor'
            }
        ];

        const themes = Object.keys(t('settingsView.general.themes'));
        const currentThemeIndex = themes.indexOf(settings.theme);
        const nextTheme = themes[(currentThemeIndex + 1) % themes.length];
        
        const settingsCommands: Command[] = [
            {
                id: 'settings-toggle-language',
                title: t('commandPalette.toggleLanguage', { lang: settings.language === 'en' ? 'Deutsch' : 'English' }),
                group: CommandGroup.Settings,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.Globe),
                action: () => { setSetting('language', settings.language === 'en' ? 'de' : 'en'); setIsCommandPaletteOpen(false); },
                keywords: 'sprache language deutsch english'
            },
            {
                id: 'settings-toggle-theme',
                title: `${t('settingsView.general.theme')}: ${t(`settingsView.general.themes.${nextTheme}`)}`,
                group: CommandGroup.Settings,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.PaintBrush),
                action: () => { setSetting('theme', nextTheme); setIsCommandPaletteOpen(false); },
                keywords: 'theme design color style midnight forest purplehaze'
            },
             {
                id: 'settings-toggle-dyslexia',
                title: `${settings.accessibility.dyslexiaFont ? 'Disable' : 'Enable'} ${t('settingsView.accessibility.dyslexiaFont')}`,
                group: CommandGroup.Settings,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.TextBolder),
                action: () => { setSetting('accessibility.dyslexiaFont', !settings.accessibility.dyslexiaFont); setIsCommandPaletteOpen(false); },
                keywords: 'accessibility font dyslexia text reading'
            },
             {
                id: 'settings-toggle-motion',
                title: `${settings.accessibility.reducedMotion ? 'Enable' : 'Disable'} ${t('settingsView.accessibility.reducedMotion')}`,
                group: CommandGroup.Settings,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.GameController),
                action: () => { setSetting('accessibility.reducedMotion', !settings.accessibility.reducedMotion); setIsCommandPaletteOpen(false); },
                keywords: 'accessibility animation motion reduce'
            },
            {
                id: 'settings-toggle-density',
                title: `${t('settingsView.accessibility.uiDensity')}: ${settings.uiDensity === 'compact' ? 'Comfortable' : 'Compact'}`,
                group: CommandGroup.Settings,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.Ruler),
                action: () => { setSetting('uiDensity', settings.uiDensity === 'compact' ? 'comfortable' : 'compact'); setIsCommandPaletteOpen(false); },
                keywords: 'ui density compact comfortable layout'
            }
        ];
        
        const generalActionCommands: Command[] = [];
        if (deferredPrompt && !isInstalled) {
            generalActionCommands.push({
                id: 'pwa-install',
                title: t('common.installPwa'),
                group: CommandGroup.General,
                // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
                icon: React.createElement(PhosphorIcons.DownloadSimple),
                action: () => { handleInstallClick(); setIsCommandPaletteOpen(false); },
                keywords: 'install pwa application app homescreen add herunterladen installieren'
            });
        }
        generalActionCommands.push({
            id: 'data-backup',
            title: t('settingsView.data.exportAll'),
            group: CommandGroup.General,
            // FIX: Replaced JSX syntax with React.createElement to be valid in a .ts file.
            icon: React.createElement(PhosphorIcons.ArchiveBox),
            action: () => {
                 if(window.confirm(t('settingsView.data.exportConfirm'))) {
                    try {
                        const appDataString = localStorage.getItem('cannaguide-2025-storage');
                        if (!appDataString) throw new Error("No data in storage");
                        const appData = JSON.parse(appDataString);
                        const jsonString = JSON.stringify(appData.state, null, 2);
                        const blob = new Blob([jsonString], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `CannaGuide_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        setSetting('lastBackupTimestamp', Date.now());
                        addNotification(t('settingsView.data.exportSuccess'), 'success');
                    } catch (error) {
                         addNotification(t('settingsView.data.exportError'), 'error');
                    }
                }
                setIsCommandPaletteOpen(false);
            },
            keywords: 'backup export save data settings plants strains json'
        });

        return [...navigationCommands, ...generalActionCommands, ...plantCommands, ...strainCommands, ...knowledgeCommands, ...settingsCommands];
    }, [t, setActiveView, activePlants, waterAllPlants, advanceDay, settings, setSetting, setIsCommandPaletteOpen, setSelectedPlantId, deferredPrompt, handleInstallClick, isInstalled, addNotification, openAddModal, openExportModal]);

    // Full-fledged sophisticated fuzzy search implementation
    const filterAndGroupCommands = (query: string): Command[] => {
        if (!query.trim()) return groupAndSortCommands(allCommands);
        
        const lowerCaseQuery = query.toLowerCase();
        
        // This state-of-the-art regex matches characters in order, allowing for a fast and intuitive fuzzy search.
        const fuzzyRegex = new RegExp(
            lowerCaseQuery.split('').map(escapeRegExp).join('.*?'), // Use non-greedy match for performance
            'i'
        );

        const filtered = allCommands.filter((command) => {
            const commandText = [
                command.title,
                command.group,
                command.keywords || '',
                command.subtitle || ''
            ].join(' ').toLowerCase();

            return fuzzyRegex.test(commandText);
        });
        
        return groupAndSortCommands(filtered);
    };

    return { allCommands, filterAndGroupCommands };
};
