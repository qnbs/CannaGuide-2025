import React, { useMemo, useState } from 'react';
import { View, Command, Plant } from '../types';
import { useTranslations } from './useTranslations';
import { PhosphorIcons } from '../components/icons/PhosphorIcons';
import { usePlants } from './usePlants';
import { useSettings } from './useSettings';

interface UseCommandPaletteProps {
    setActiveView: (view: View) => void;
}

export const useCommandPalette = ({ setActiveView }: UseCommandPaletteProps) => {
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const { t } = useTranslations();
    const { plants, waterAllPlants, advanceDay } = usePlants();
    const { settings, setSetting } = useSettings();

    const commands: Command[] = useMemo(() => {
        const activePlants = plants.filter((p): p is Plant => p !== null);

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
                id: `plant-inspect-${plant!.id}`,
                title: `${t('commandPalette.inspect')} ${plant!.name}`,
                subtitle: t('commandPalette.plants'),
                icon: React.createElement(PhosphorIcons.Plant),
                action: () => {
                    // This is a simplified action. A more robust implementation might
                    // involve a global state to set the selected plant for the detailed view.
                    setActiveView(View.Plants);
                    setIsCommandPaletteOpen(false);
                },
                 keywords: `view details ${plant!.name}`
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

        return [...navigationCommands, ...plantCommands, ...settingsCommands];
    }, [t, setActiveView, plants, waterAllPlants, advanceDay, settings.language, setSetting]);

    return { isCommandPaletteOpen, setIsCommandPaletteOpen, commands };
};
