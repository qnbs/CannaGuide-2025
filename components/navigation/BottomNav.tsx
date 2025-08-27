import React from 'react';
import { View } from '../../types';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { useTranslations } from '../../hooks/useTranslations';

const navIcons: Record<string, React.ReactNode> = {
    [View.Strains]: <PhosphorIcons.Leafy />,
    [View.Plants]: <PhosphorIcons.Plant />,
    [View.Equipment]: <PhosphorIcons.Wrench />,
    [View.Knowledge]: <PhosphorIcons.BookOpenText />,
};

const mainNavViews: View[] = [View.Strains, View.Plants, View.Equipment, View.Knowledge];


interface BottomNavProps {
    activeView: View;
    setActiveView: (view: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView }) => {
    const { t } = useTranslations();
    const navLabels: Record<View, string> = {
        [View.Strains]: t('nav.strains'),
        [View.Plants]: t('nav.plants'),
        [View.Equipment]: t('nav.equipment'),
        [View.Knowledge]: t('nav.knowledge'),
        [View.Settings]: t('nav.settings'),
        [View.Help]: t('nav.help'),
    };
    
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="flex justify-around max-w-5xl mx-auto">
                {mainNavViews.map((viewValue) => {
                    return (
                        <button
                            key={viewValue}
                            onClick={() => setActiveView(viewValue)}
                            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
                                activeView === viewValue ? 'text-primary-500' : 'text-slate-500 dark:text-slate-400 hover:text-primary-400 dark:hover:text-primary-300'
                            }`}
                        >
                            <div className="w-7 h-7 mb-0.5">{navIcons[viewValue]}</div>
                            <span className="text-xs font-medium">{navLabels[viewValue]}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
