import React from 'react';
// FIX: Corrected import path for types to use the '@/' alias.
import { View } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
// FIX: Corrected import path for Redux store to use the '@/' alias.
import { useAppDispatch, useAppSelector } from '@/stores/store';
// FIX: Corrected import to get the action creator from the uiSlice.
import { setActiveView } from '@/stores/slices/uiSlice';
import { selectActiveView } from '@/stores/selectors';

const navIcons: Record<string, React.ReactNode> = {
    [View.Strains]: <PhosphorIcons.Leafy />,
    [View.Plants]: <PhosphorIcons.Plant />,
    [View.Equipment]: <PhosphorIcons.Wrench />,
    [View.Knowledge]: <PhosphorIcons.BookOpenText />,
};

const mainNavViews: View[] = [View.Strains, View.Plants, View.Equipment, View.Knowledge];

export const BottomNav: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const activeView = useAppSelector(selectActiveView);

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
                            onClick={() => dispatch(setActiveView(viewValue))}
                            className={`relative flex flex-col items-center justify-center w-full py-2 transition-all duration-300 rounded-lg ${
                                isActive ? 'text-primary-300 bg-primary-500/10' : 'text-slate-400 hover:text-primary-300 hover:bg-slate-700/50'
                            }`}
                        >
                            <div className="w-6 h-6">{navIcons[viewValue]}</div>
                            <span className="text-xs font-semibold relative">
                                {navLabels[viewValue]}
                                <span className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full bg-primary-400 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}></span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};