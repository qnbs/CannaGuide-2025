import React, { useMemo, useState, useEffect } from 'react';
import { View, Command, Strain, SavedStrainTip } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppStore } from '@/stores/useAppStore';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { selectActivePlants, selectSettings, selectSavedStrainTips } from '@/stores/selectors';
import { CommandGroup } from '@/services/commandService';
import { strainService } from '@/services/strainService';

export const useCommandPalette = () => {
    const { t } = useTranslations();
    const { deferredPrompt, handleInstallClick, isInstalled } = usePwaInstall();
    
    const { 
        setActiveView, setIsCommandPaletteOpen, waterAllPlants, advanceDay, setSetting, 
        setSelectedPlantId, addNotification, openAddModal, openExportModal, selectStrain,
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
        selectStrain: state.selectStrain,
    }));
    const activePlants = useAppStore(selectActivePlants);
    const settings = useAppStore(selectSettings);
    const savedStrainTips = useAppStore(selectSavedStrainTips);
    const [allStrains, setAllStrains] = useState<Strain[]>([]);

    useEffect(() => {
        strainService.getAllStrains().then(setAllStrains);
    }, []);

    const allCommands = useMemo(() => {
        const navigationCommands: Command[] = Object.values(View).map(view => ({
            id: `nav-${view}`,
            title: t(`nav.${view.toLowerCase()}`),
            group: CommandGroup.Navigation,
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
                icon: React.createElement(PhosphorIcons.ArrowClockwise),
                action: () => {
                    advanceDay();
                    setIsCommandPaletteOpen(false);
                },
                keywords: 'next day simulate forward time advance'
            }
        ];
        
        const strainCommands: Command[] = [
            ...allStrains.map(strain => ({
                id: `strain-view-${strain.id}`,
                title: strain.name,
                subtitle: strain.type,
                group: CommandGroup.Strains,
                icon: React.createElement(PhosphorIcons.Leafy),
                action: () => { setActiveView(View.Strains); selectStrain(strain); setIsCommandPaletteOpen(false); },
                keywords: `strain ${strain.name} ${strain.type} ${(strain.aromas || []).join(' ')}`
            })),
            {
                id: 'strain-add-new',
                title: t('strainsView.addStrain'),
                group: CommandGroup.Strains,
                icon: React.createElement(PhosphorIcons.PlusCircle),
                action: () => { openAddModal(); setIsCommandPaletteOpen(false); },
                keywords: 'create new custom strain'
            },
            {
                id: 'strain-export',
                title: t('common.export'),
                group: CommandGroup.Strains,
                icon: React.createElement(PhosphorIcons.DownloadSimple),
                action: () => { openExportModal(); setIsCommandPaletteOpen(false); },
                keywords: 'export strains download save pdf csv txt'
            }
        ];
        
        const tipCommands: Command[] = savedStrainTips.map(tip => ({
            id: `tip-view-${tip.id}`,
            title: tip.strainName,
            subtitle: tip.title,
            group: CommandGroup.Knowledge,
            icon: React.createElement(PhosphorIcons.LightbulbFilament),
            action: () => {
                const strain = allStrains.find(s => s.id === tip.strainId);
                if (strain) {
                    setActiveView(View.Strains);
                    selectStrain(strain);
                    setIsCommandPaletteOpen(false);
                }
            },
            keywords: `tip ${tip.strainName} ${tip.title} ${tip.content}`
        }));

        const themes = Object.keys(t('settingsView.general.themes'));
        const currentThemeIndex = themes.indexOf(settings.theme);
        const nextTheme = themes[(currentThemeIndex + 1) % themes.length];
        
        const settingsCommands: Command[] = [
            {
                id: 'settings-toggle-language',
                title: t('commandPalette.toggleLanguage', { lang: settings.language === 'en' ? 'Deutsch' : 'English' }),
                group: CommandGroup.Settings,
                icon: React.createElement(PhosphorIcons.Globe),
                action: () => { setSetting('language', settings.language === 'en' ? 'de' : 'en'); setIsCommandPaletteOpen(false); },
                keywords: 'sprache language deutsch english'
            },
            {
                id: 'settings-toggle-theme',
                title: `${t('settingsView.general.theme')}: ${t(`settingsView.general.themes.${nextTheme}`)}`,
                group: CommandGroup.Settings,
                icon: React.createElement(PhosphorIcons.PaintBrush),
                action: () => { setSetting('theme', nextTheme); setIsCommandPaletteOpen(false); },
                keywords: 'theme design color style midnight forest purplehaze'
            },
             {
                id: 'settings-toggle-dyslexia',
                title: `${settings.accessibility.dyslexiaFont ? 'Disable' : 'Enable'} ${t('settingsView.accessibility.dyslexiaFont')}`,
                group: CommandGroup.Settings,
                icon: React.createElement(PhosphorIcons.TextBolder),
                action: () => { setSetting('accessibility.dyslexiaFont', !settings.accessibility.dyslexiaFont); setIsCommandPaletteOpen(false); },
                keywords: 'accessibility font dyslexia text reading'
            },
             {
                id: 'settings-toggle-motion',
                title: `${settings.accessibility.reducedMotion ? 'Enable' : 'Disable'} ${t('settingsView.accessibility.reducedMotion')}`,
                group: CommandGroup.Settings,
                icon: React.createElement(PhosphorIcons.GameController),
                action: () => { setSetting('accessibility.reducedMotion', !settings.accessibility.reducedMotion); setIsCommandPaletteOpen(false); },
                keywords: 'accessibility animation motion reduce'
            },
            {
                id: 'settings-toggle-density',
                title: `${t('settingsView.accessibility.uiDensity')}: ${settings.uiDensity === 'compact' ? 'Comfortable' : 'Compact'}`,
                group: CommandGroup.Settings,
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
                icon: React.createElement(PhosphorIcons.DownloadSimple),
                action: () => { handleInstallClick(); setIsCommandPaletteOpen(false); },
                keywords: 'install pwa application app homescreen add herunterladen installieren'
            });
        }

        return [...navigationCommands, ...generalActionCommands, ...plantCommands, ...strainCommands, ...tipCommands, ...settingsCommands];
    }, [t, allStrains, savedStrainTips, setActiveView, activePlants, waterAllPlants, advanceDay, settings, setSetting, setIsCommandPaletteOpen, setSelectedPlantId, deferredPrompt, handleInstallClick, isInstalled, addNotification, openAddModal, openExportModal, selectStrain]);

    return { allCommands };
};