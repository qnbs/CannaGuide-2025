import React from 'react';
import { View } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppStore } from '@/stores/useAppStore';
import { selectActiveView } from '@/stores/selectors';

const navIcons: Record<string, React.ReactNode> = {
    [View.Strains]: <PhosphorIcons.Leafy />,
    [View.Plants]: <PhosphorIcons.Plant />,
    [View.Equipment]: <PhosphorIcons.Wrench />,
    [View.Knowledge]: <PhosphorIcons.BookOpenText />,
};

const mainNavViews: View[] = [View.Strains, View.Plants, View.Equipment, View.Knowledge];

export const BottomNav: React.FC = () => {
    const { t } = useTranslations();
    const activeView = useAppStore(selectActiveView);
    const setActiveView = useAppStore(state => state.setActiveView);

    const navLabels: Record<View, string> = {
        [View.Strains]: t('nav.strains'),
        [View.Plants]: t('nav.plants'),
        [View.Equipment]: t('nav.equipment'),
        [View.Knowledge]: t('nav.knowledge'),
        [View.Settings]: t('nav.settings'),
        [View.Help]: t('nav.help'),
    };
    
    return (
        <nav className="glass-pane border-t-0 flex-shrink-0 z-20">
            <div className="flex justify-around max-w-5xl mx-auto">
                {mainNavViews.map((viewValue) => {
                    const isActive = activeView === viewValue;
                    return (
                        <button
                            key={viewValue}
                            onClick={() => setActiveView(viewValue)}
                            className={`relative flex flex-col items-center justify-center w-full py-1 transition-colors duration-200 ${
                                isActive ? 'text-primary-400' : 'text-slate-400 hover:text-primary-300'
                            }`}
                        >
                            <div className="w-6 h-6">{navIcons[viewValue]}</div>
                            <span className="text-xs font-semibold relative">
                                {navLabels[viewValue]}
                                <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary-400 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}></span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
