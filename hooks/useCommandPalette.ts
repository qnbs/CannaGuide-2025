import React, { useMemo } from 'react';
import { Command, View, Theme, UiDensity, PlantStage, EquipmentViewTab, KnowledgeViewTab, AppSettings, StrainViewTab } from '@/types';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppSelector, useAppDispatch } from '@/stores/store';
import { selectActivePlants, selectSettings } from '@/stores/selectors';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
import * as uiActions from '@/stores/slices/uiSlice';
import * as settingsActions from '@/stores/slices/settingsSlice';
import * as strainsViewActions from '@/stores/slices/strainsViewSlice';
import * as simulationActions from '@/stores/slices/simulationSlice';

export const useCommandPalette = () => {
    const { t } = useTranslation();
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
                },
                {
                    id: `plant-observe-${plant.id}`,
                    title: t('commandPalette.logObservation', { plantName: plant.name }),
                    subtitle: t('commandPalette.subtitles.logObservation'),
                    icon: PhosphorIcons.MagnifyingGlass,
                    action: () => {
                        dispatch(uiActions.openActionModal({ plantId: plant.id, type: 'observation' }));
                        dispatch(uiActions.setIsCommandPaletteOpen(false));
                    },
                    keywords: `plant ${plant.name} observe note log`,
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
        
        const themes: Theme[] = ['midnight', 'forest', 'purpleHaze', 'desertSky', 'roseQuartz'];
        const currentThemeIndex = themes.indexOf(settings.theme);
        const nextThemeIndex = (currentThemeIndex + 1) % themes.length;
        const nextTheme = themes[nextThemeIndex];

        const newLang = settings.language === 'en' ? 'de' : 'en';
        const newDensity: UiDensity = settings.uiDensity === 'comfortable' ? 'compact' : 'comfortable';

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
            { id: 'nav-calculators', title: t('commandPalette.goToCalculators'), subtitle: t('commandPalette.subtitles.goToCalculators'), icon: PhosphorIcons.Calculator, action: () => { dispatch(uiActions.setActiveView(View.Equipment)); dispatch(uiActions.setEquipmentViewTab(EquipmentViewTab.Calculators)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'tools ventilation light cost', group: t('commandPalette.groups.navigation') },
            { id: 'nav-setups', title: t('commandPalette.goToSetups'), subtitle: t('commandPalette.subtitles.goToSetups'), icon: PhosphorIcons.Cube, action: () => { dispatch(uiActions.setActiveView(View.Equipment)); dispatch(uiActions.setEquipmentViewTab(EquipmentViewTab.Setups)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'saved setups my setups', group: t('commandPalette.groups.navigation') },
            { id: 'nav-grow-shops', title: t('commandPalette.goToGrowShops'), subtitle: t('commandPalette.subtitles.goToGrowShops'), icon: PhosphorIcons.Storefront, action: () => { dispatch(uiActions.setActiveView(View.Equipment)); dispatch(uiActions.setEquipmentViewTab(EquipmentViewTab.GrowShops)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'shops stores equipment', group: t('commandPalette.groups.navigation') },
            { id: 'nav-guide', title: t('commandPalette.goToGuide'), subtitle: t('commandPalette.subtitles.goToGuide'), icon: PhosphorIcons.Book, action: () => { dispatch(uiActions.setActiveView(View.Knowledge)); dispatch(uiActions.setKnowledgeViewTab(KnowledgeViewTab.Guide)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'learn tutorial basics', group: t('commandPalette.groups.navigation') },
            { id: 'nav-archive', title: t('commandPalette.goToArchive'), subtitle: t('commandPalette.subtitles.goToArchive'), icon: PhosphorIcons.Archive, action: () => { dispatch(uiActions.setActiveView(View.Knowledge)); dispatch(uiActions.setKnowledgeViewTab(KnowledgeViewTab.Archive)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'saved mentor responses', group: t('commandPalette.groups.navigation') },
            { id: 'nav-breeding', title: t('commandPalette.goToBreeding'), subtitle: t('commandPalette.subtitles.goToBreeding'), icon: PhosphorIcons.TestTube, action: () => { dispatch(uiActions.setActiveView(View.Knowledge)); dispatch(uiActions.setKnowledgeViewTab(KnowledgeViewTab.Breeding)); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'cross breed seeds', group: t('commandPalette.groups.navigation') },
            
            { id: 'add-strain', title: t('strainsView.addStrain'), icon: PhosphorIcons.PlusCircle, action: () => { dispatch(uiActions.openAddModal()); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'new, custom, create', group: t('commandPalette.groups.strains') },
            { id: 'export-strains', title: t('common.export'), subtitle: t('commandPalette.exportStrains'), icon: PhosphorIcons.DownloadSimple, action: () => { dispatch(uiActions.openExportModal()); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'save, download, pdf, csv, json', group: t('commandPalette.groups.strains') },
            
            ...plantCommands,
            { id: 'water-all', title: t('commandPalette.waterAllPlants'), subtitle: t('commandPalette.subtitles.waterAllPlants'), icon: PhosphorIcons.Drop, action: () => { dispatch(simulationActions.waterAllPlants()); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, keywords: 'water all plants', group: t('commandPalette.groups.plants'), },
            ...[0, 1, 2].map(slot => ({
                id: `start-grow-${slot}`, title: t('commandPalette.startGrowSlot', { slot: slot + 1 }), subtitle: t('commandPalette.subtitles.startGrowSlot'), icon: PhosphorIcons.Plant,
                action: () => { dispatch(uiActions.setActiveView(View.Plants)); dispatch(uiActions.startGrowInSlot(slot)); dispatch(uiActions.setIsCommandPaletteOpen(false)); },
                keywords: `new plant grow slot ${slot + 1}`, group: t('commandPalette.groups.plants'),
            })),
            
            { id: 'toggle-language', title: t('commandPalette.toggleLanguage', { lang: newLang === 'de' ? 'Deutsch' : 'English' }), subtitle: t('commandPalette.subtitles.switchTo'), icon: PhosphorIcons.Globe, action: () => dispatch(settingsActions.setSetting({ path: 'language', value: newLang })), group: t('commandPalette.groups.settings') },
            { id: 'toggle-theme', title: t('commandPalette.toggleTheme'), subtitle: `${t('common.next')}: ${t(`settingsView.general.themes.${nextTheme}`)}`, icon: PhosphorIcons.PaintBrush, action: () => dispatch(settingsActions.setSetting({ path: 'theme', value: nextTheme })), group: t('commandPalette.groups.settings') },
            createNotifToggle('stageChange', 'commandPalette.toggleStageChangeNotifs'),
            createNotifToggle('problemDetected', 'commandPalette.toggleProblemNotifs'),
            createNotifToggle('harvestReady', 'commandPalette.toggleHarvestNotifs'),
            createNotifToggle('newTask', 'commandPalette.toggleTaskNotifs'),
            { id: 'toggle-tts', title: t('commandPalette.toggleTts'), subtitle: t('commandPalette.subtitles.status', { status: settings.tts.enabled ? 'On' : 'Off' }), icon: PhosphorIcons.SpeakerHigh, action: () => dispatch(settingsActions.toggleSetting({ path: 'tts.enabled' })), group: t('commandPalette.groups.settings') },
            { id: 'toggle-dyslexia', title: t('commandPalette.toggleDyslexiaFont'), subtitle: t('commandPalette.subtitles.status', { status: settings.accessibility.dyslexiaFont ? 'On' : 'Off' }), icon: PhosphorIcons.TextBolder, action: () => dispatch(settingsActions.toggleSetting({ path: 'accessibility.dyslexiaFont' })), group: t('commandPalette.groups.settings') },
            { id: 'toggle-motion', title: t('commandPalette.toggleReducedMotion'), subtitle: t('commandPalette.subtitles.status', { status: settings.accessibility.reducedMotion ? 'On' : 'Off' }), icon: PhosphorIcons.GameController, action: () => dispatch(settingsActions.toggleSetting({ path: 'accessibility.reducedMotion' })), group: t('commandPalette.groups.settings') },
            { id: 'toggle-ui-density', title: t('commandPalette.toggleUiDensity'), subtitle: `${t('common.next')}: ${t(`settingsView.accessibility.uiDensities.${newDensity}`)}`, icon: PhosphorIcons.ListBullets, action: () => dispatch(settingsActions.setSetting({ path: 'uiDensity', value: newDensity })), group: t('commandPalette.groups.settings') },
            
            { id: 'export-all', title: t('commandPalette.exportAllData'), subtitle: t('commandPalette.subtitles.exportAllData'), icon: PhosphorIcons.Archive, action: () => { dispatch(settingsActions.exportAllData()); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, group: t('commandPalette.groups.data'), },
            { id: 'reset-plants', title: t('commandPalette.resetAllPlants'), subtitle: t('commandPalette.subtitles.resetAllPlants'), icon: PhosphorIcons.WarningCircle, action: () => { dispatch(simulationActions.resetPlants()); dispatch(uiActions.setIsCommandPaletteOpen(false)); }, group: t('commandPalette.groups.data'), }
        ];
    }, [t, settings, activePlants, dispatch]);

    return { allCommands };
};