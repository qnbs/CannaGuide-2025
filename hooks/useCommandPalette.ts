
import React, { useMemo } from 'react';
import { Command, View, Theme, UiDensity, PlantStage, EquipmentViewTab, KnowledgeViewTab, AppSettings, StrainViewTab } from '@/types';
import { useTranslations } from './useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { selectActivePlants, selectSettings } from '@/stores/selectors';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
import * as uiActions from '@/stores/slices/uiSlice';
import * as settingsActions from '@/stores/slices/settingsSlice';
import * as strainsViewActions from '@/stores/slices/strainsViewSlice';
import * as simulationActions from '@/stores/slices/simulationSlice';

export const useCommandPalette = () => {
    const { t } = useTranslations();
    const dispatch = useAppDispatch();
    
    const activePlants = useAppSelector(selectActivePlants);
    const settings = useAppSelector(selectSettings);

    const allCommands: Command[] = useMemo(() => {
        const createNavCommand = (view: View, icon: React.ElementType, keywords?: string, shortcut?: string[]): Command => ({
            id: `nav-${view}`,
            title: t(`nav.${view.toLowerCase()}`),
            subtitle: t('commandPalette.goToView', { view: t(`nav.${view.toLowerCase()}`) }),
            icon,
            action: () => {
                dispatch(uiActions.setActiveView(view));
                dispatch(uiActions.setIsCommandPaletteOpen(false));
            },
            keywords,
            shortcut,
            group: t('commandPalette.groups.navigation'),
        });

        const plantCommands: Command[] = activePlants.flatMap(plant => {
            const isHarvestReady = plant.stage === PlantStage.Flowering && plant.age >= (PLANT_STAGE_DETAILS[PlantStage.Seedling].duration + PLANT_STAGE_DETAILS[PlantStage.Vegetative].duration + plant.strain.floweringTime * 7);
            
            const commands: Command[] = [
                {
                    id: `plant-inspect-${plant.id}`,
                    title: t('commandPalette.inspectPlant', { plantName: plant.name }),
                    subtitle: t('commandPalette.subtitles.inspectPlant'),
                    icon: PhosphorIcons.MagnifyingGlass,
                    action: () => {
                        dispatch(uiActions.setActiveView(View.Plants));
                        dispatch(simulationActions.setSelectedPlantId(plant.id));
                        dispatch(uiActions.setIsCommandPaletteOpen(false));
                    },
                    keywords: `plant ${plant.name} ${plant.strain.name} details`,
                    group: t('commandPalette.groups.plants'),
                },
                {
                    id: `plant-water-${plant.id}`,
                    title: t('commandPalette.waterPlant', { plantName: plant.name }),
                    subtitle: t('commandPalette.subtitles.waterPlant'),
                    icon: PhosphorIcons.Drop,
                    action: () => {
                        dispatch(uiActions.openActionModal({ plantId: plant.id, type: 'watering' }));
                        dispatch(uiActions.setIsCommandPaletteOpen(false));
                    },
                    keywords: `plant ${plant.name} water log`,
                    group: t('commandPalette.groups.plants'),
                },
                {
                    id: `plant-feed-${plant.id}`,
                    title: t('commandPalette.feedPlant', { plantName: plant.name }),
                    subtitle: t('commandPalette.subtitles.feedPlant'),
                    icon: PhosphorIcons.TestTube,
                    action: () => {
                        dispatch(uiActions.openActionModal({ plantId: plant.id, type: 'feeding' }));
                        dispatch(uiActions.setIsCommandPaletteOpen(false));
                    },
                    keywords: `plant ${plant.name} feed log nutrients`,
                    group: t('commandPalette.groups.plants'),
                }
            ];

            if (isHarvestReady) {
                 commands.push({
                    id: `plant-harvest-${plant.id}`,
                    title: t('commandPalette.harvestPlant', { plantName: plant.name }),
                    subtitle: t('commandPalette.subtitles.harvestPlant'),
                    icon: PhosphorIcons.Scissors,
                    action: () => {
                        dispatch(simulationActions.harvestPlant({ plantId: plant.id }));
                        dispatch(uiActions.setIsCommandPaletteOpen(false));
                    },
                    keywords: `plant ${plant.name} harvest chop`,
                    group: t('commandPalette.groups.plants'),
                });
            }

            return commands;
        });

        const themeCommands: Command[] = (Object.keys(t('settingsView.general.themes', { returnObjects: true })) as Theme[]).map(themeKey => ({
            id: `set-theme-${themeKey}`,
            title: t('commandPalette.setTheme', { themeName: t(`settingsView.general.themes.${themeKey}`) }),
            subtitle: t('commandPalette.subtitles.setTheme'),
            icon: PhosphorIcons.PaintBrush,
            action: () => dispatch(settingsActions.setSetting({ path: 'theme', value: themeKey })),
            group: t('commandPalette.groups.settings')
        }));
        
        const createNotifToggle = (key: keyof AppSettings['notificationSettings'], titleKey: string): Command => ({
            id: `toggle-notif-${String(key)}`,
            title: t(titleKey),
            subtitle: t('commandPalette.subtitles.toggleNotifications', { status: settings.notificationSettings[key] ? 'On' : 'Off' }),
            icon: PhosphorIcons.BellSimple,
            action: () => dispatch(settingsActions.toggleSetting({ path: `notificationSettings.${String(key)}` })),
            group: t('commandPalette.groups.settings'),
        });

        return [
            createNavCommand(View.Strains, PhosphorIcons.Leafy, 'database, library, search'),
            createNavCommand(View.Plants, PhosphorIcons.Plant, 'grow, room, garden'),
            createNavCommand(View.Equipment, PhosphorIcons.Wrench, 'setup, gear, tools, calculator'),
            createNavCommand(View.Knowledge, PhosphorIcons.BookOpenText, 'guide, learn, mentor, help'),
            createNavCommand(View.Settings, PhosphorIcons.Gear, 'options, config, preferences'),
            
            { id: 'nav-my-strains', title: t('commandPalette.goToMyStrains'), subtitle: t('commandPalette.subtitles.goToMyStrains'), icon: PhosphorIcons.Star, action: () => { dispatch(uiActions.setActiveView(View.Strains)); dispatch(strainsViewActions.setStrainsViewTab(StrainViewTab.MyStrains)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'custom strains', group: t('commandPalette.groups.navigation') },
            { id: 'nav-favorites', title: t('commandPalette.goToFavorites'), subtitle: t('commandPalette.subtitles.goToFavorites'), icon: PhosphorIcons.Heart, action: () => { dispatch(uiActions.setActiveView(View.Strains)); dispatch(strainsViewActions.setStrainsViewTab(StrainViewTab.Favorites)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'favorite strains', group: t('commandPalette.groups.navigation') },
            { id: 'add-strain', title: t('strainsView.addStrain'), icon: PhosphorIcons.PlusCircle, action: () => { dispatch(uiActions.openAddModal()); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'new, custom, create', group: t('commandPalette.groups.strains') },
            { id: 'export-strains', title: t('common.export'), subtitle: t('commandPalette.exportStrains'), icon: PhosphorIcons.DownloadSimple, action: () => { dispatch(uiActions.openExportModal()); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'save, download, pdf, csv, json', group: t('commandPalette.groups.strains') },
            
            { id: 'nav-calculators', title: t('commandPalette.goToCalculators'), subtitle: t('commandPalette.subtitles.goToCalculators'), icon: PhosphorIcons.Calculator, action: () => { dispatch(uiActions.setActiveView(View.Equipment)); dispatch(uiActions.setEquipmentViewTab(EquipmentViewTab.Calculators)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'tools ventilation light cost', group: t('commandPalette.groups.navigation') },
            { id: 'nav-setups', title: t('commandPalette.goToSetups'), subtitle: t('commandPalette.subtitles.goToSetups'), icon: PhosphorIcons.Cube, action: () => { dispatch(uiActions.setActiveView(View.Equipment)); dispatch(uiActions.setEquipmentViewTab(EquipmentViewTab.Setups)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'saved setups my setups', group: t('commandPalette.groups.navigation') },

            { id: 'nav-guide', title: t('commandPalette.goToGuide'), subtitle: t('commandPalette.subtitles.goToGuide'), icon: PhosphorIcons.Book, action: () => { dispatch(uiActions.setActiveView(View.Knowledge)); dispatch(uiActions.setKnowledgeViewTab(KnowledgeViewTab.Guide)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'learn tutorial basics', group: t('commandPalette.groups.navigation') },
            { id: 'nav-breeding', title: t('commandPalette.goToBreeding'), subtitle: t('commandPalette.subtitles.goToBreeding'), icon: PhosphorIcons.TestTube, action: () => { dispatch(uiActions.setActiveView(View.Knowledge)); dispatch(uiActions.setKnowledgeViewTab(KnowledgeViewTab.Breeding)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'cross breed seeds', group: t('commandPalette.groups.navigation') },
            
            ...plantCommands,
            { id: 'water-all', title: t('commandPalette.waterAllPlants'), subtitle: t('commandPalette.subtitles.waterAllPlants'), icon: PhosphorIcons.Drop, action: () => { dispatch(simulationActions.waterAllPlants()); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'water all plants', group: t('commandPalette.groups.plants'), },
            ...[0, 1, 2].map(slot => ({
                id: `start-grow-${slot}`, title: t('commandPalette.startGrowSlot', { slot: slot + 1 }), subtitle: t('commandPalette.subtitles.startGrowSlot'), icon: PhosphorIcons.Plant,
                action: () => { dispatch(uiActions.setActiveView(View.Plants)); dispatch(uiActions.startGrowInSlot(slot)); dispatch(uiActions.setIsCommandPaletteOpen(false)); },
                keywords: `new plant grow slot ${slot + 1}`, group: t('commandPalette.groups.plants'),
            })),

            { id: 'set-language-de', title: t('commandPalette.switchToGerman'), subtitle: t('commandPalette.subtitles.switchTo'), icon: PhosphorIcons.Globe, action: () => dispatch(settingsActions.setSetting({ path: 'language', value: 'de' })), group: t('commandPalette.groups.settings'), keywords: 'deutsch german' },
            { id: 'set-language-en', title: t('commandPalette.switchToEnglish'), subtitle: t('commandPalette.subtitles.switchTo'), icon: PhosphorIcons.Globe, action: () => dispatch(settingsActions.setSetting({ path: 'language', value: 'en' })), group: t('commandPalette.groups.settings'), keywords: 'englisch english' },
            ...themeCommands,
            createNotifToggle('stageChange', 'commandPalette.toggleStageChangeNotifs'),
            createNotifToggle('problemDetected', 'commandPalette.toggleProblemNotifs'),
            createNotifToggle('harvestReady', 'commandPalette.toggleHarvestNotifs'),
            createNotifToggle('newTask', 'commandPalette.toggleTaskNotifs'),
            { id: 'toggle-tts', title: t('commandPalette.toggleTts'), subtitle: t('commandPalette.subtitles.toggleTts'), icon: PhosphorIcons.SpeakerHigh, action: () => dispatch(settingsActions.toggleSetting({ path: 'tts.enabled' })), group: t('commandPalette.groups.settings') },
            { id: 'toggle-dyslexia', title: t('commandPalette.toggleDyslexiaFont'), subtitle: t('commandPalette.subtitles.toggleDyslexiaFont'), icon: PhosphorIcons.TextBolder, action: () => dispatch(settingsActions.toggleSetting({ path: 'accessibility.dyslexiaFont' })), group: t('commandPalette.groups.settings') },
            { id: 'toggle-motion', title: t('commandPalette.toggleReducedMotion'), subtitle: t('commandPalette.subtitles.toggleReducedMotion'), icon: PhosphorIcons.GameController, action: () => dispatch(settingsActions.toggleSetting({ path: 'accessibility.reducedMotion' })), group: t('commandPalette.groups.settings') },
            { id: 'set-density-compact', title: t('commandPalette.setUiDensity', { density: t('settingsView.accessibility.uiDensities.compact') }), subtitle: t('commandPalette.subtitles.setUiDensity'), icon: PhosphorIcons.ListBullets, action: () => dispatch(settingsActions.setSetting({ path: 'uiDensity', value: 'compact' as UiDensity })), group: t('commandPalette.groups.settings') },
            { id: 'set-density-comfortable', title: t('commandPalette.setUiDensity', { density: t('settingsView.accessibility.uiDensities.comfortable') }), subtitle: t('commandPalette.subtitles.setUiDensity'), icon: PhosphorIcons.GridFour, action: () => dispatch(settingsActions.setSetting({ path: 'uiDensity', value: 'comfortable' as UiDensity })), group: t('commandPalette.groups.settings') },
            
            { id: 'export-all', title: t('commandPalette.exportAllData'), subtitle: t('commandPalette.subtitles.exportAllData'), icon: PhosphorIcons.Archive, action: () => { dispatch(settingsActions.exportAllData()); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, group: t('commandPalette.groups.data'), },
            { id: 'reset-plants', title: t('commandPalette.resetAllPlants'), subtitle: t('commandPalette.subtitles.resetAllPlants'), icon: PhosphorIcons.WarningCircle, action: () => { dispatch(simulationActions.resetPlants()); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, group: t('commandPalette.groups.data'), }
        ];
    }, [t, settings, activePlants, dispatch]);

    return { allCommands };
};