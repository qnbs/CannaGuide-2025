import React, { useMemo } from 'react';
import { View, Command, Plant } from '@/types';
import { useTranslations } from '@/hooks/useTranslations';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useAppStore } from '@/stores/useAppStore';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { selectActivePlants, selectSettings } from '@/stores/selectors';

export const useCommandPalette = () => {
    const { t } = useTranslations();
    const { deferredPrompt, handleInstallClick, isInstalled } = usePwaInstall();
    
    const { setActiveView, setIsCommandPaletteOpen, waterAllPlants, advanceDay, setSetting, setSelectedPlantId } = useAppStore(state => ({
        setActiveView: state.setActiveView,
        setIsCommandPaletteOpen: state.setIsCommandPaletteOpen,
        waterAllPlants: state.waterAllPlants,
        advanceDay: state.advanceDay,
        setSetting: state.setSetting,
        setSelectedPlantId: state.setSelectedPlantId,
    }));
    const activePlants = useAppStore(selectActivePlants);
    const settings = useAppStore(selectSettings);

    const commands: Command[] = useMemo(() => {
        const navigationCommands: Command[] = Object.values(View).map(view => ({
            id: `nav-${view}`,
            title: t(`nav.${view.toLowerCase()}`),
            subtitle: t('commandPalette.navigation'),
            icon: React.createElement(PhosphorIcons.ArrowSquareOut),
            action: () => {
                setActiveView(view);
                setIsCommandPaletteOpen(false);
            },
            keywords: `go to navigate ${view}`
        }));

        const plantCommands: Command[] = [
            ...activePlants.map((plant) => ({
                id: `plant-inspect-${plant.id}`,
                title: `${t('commandPalette.inspect')} ${plant.name}`,
                subtitle: t('commandPalette.plants'),
                icon: React.createElement(PhosphorIcons.Plant),
                action: () => {
                    setActiveView(View.Plants);
                    setSelectedPlantId(plant.id);
                    setIsCommandPaletteOpen(false);
                },
                keywords: `view details ${plant.name}`
            })),
            {
                id: 'plant-water-all',
                title: t('plantsView.summary.waterAll'),
                subtitle: t('commandPalette.plants'),
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
                subtitle: t('commandPalette.plants'),
                icon: React.createElement(PhosphorIcons.ArrowClockwise),
                action: () => {
                    advanceDay();
                    setIsCommandPaletteOpen(false);
                },
                keywords: 'next day simulate forward time'
            }
        ];
        
        const generalActionCommands: Command[] = [];
        if (deferredPrompt || isInstalled) {
            generalActionCommands.push({
                id: 'pwa-install',
                title: isInstalled ? t('common.installed') : t('common.installPwa'),
                subtitle: t('commandPalette.actions'),
                icon: React.createElement(isInstalled ? PhosphorIcons.CheckCircle : PhosphorIcons.DownloadSimple, { weight: 'fill' }),
                action: () => {
                    if (!isInstalled && deferredPrompt) {
                        handleInstallClick();
                    }
                    setIsCommandPaletteOpen(false);
                },
                keywords: 'install pwa application app homescreen add herunterladen installieren'
            });
        }
        
        const settingsCommands: Command[] = [
            {
                id: 'settings-toggle-language',
                title: t('commandPalette.toggleLanguage', { lang: settings.language === 'en' ? 'Deutsch' : 'English' }),
                subtitle: t('commandPalette.settings'),
                icon: React.createElement(PhosphorIcons.Globe),
                action: () => {
                    setSetting('language', settings.language === 'en' ? 'de' : 'en');
                    setIsCommandPaletteOpen(false);
                },
                keywords: 'sprache language deutsch english'
            },
        ];

        return [...navigationCommands, ...generalActionCommands, ...plantCommands, ...settingsCommands];
    }, [t, setActiveView, activePlants, waterAllPlants, advanceDay, settings.language, setSetting, setIsCommandPaletteOpen, setSelectedPlantId, deferredPrompt, handleInstallClick, isInstalled]);

    return { commands };
};
