import React, { useRef, useState, useLayoutEffect } from 'react';
import { View } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setActiveView } from '@/stores/slices/uiSlice';
import { selectActiveView } from '@/stores/selectors';

const navIcons: Record<string, React.ReactNode> = {
    [View.Strains]: <PhosphorIcons.Leafy />,
    [View.Plants]: <PhosphorIcons.Plant />,
    [View.Equipment]: <PhosphorIcons.Wrench />,
    [View.Knowledge]: <PhosphorIcons.Brain />,
};

const mainNavViews: View[] = [View.Strains, View.Plants, View.Equipment, View.Knowledge];

export const BottomNav: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const activeView = useAppSelector(selectActiveView);
    const navRef = useRef<HTMLDivElement>(null);
    const [indicatorStyle, setIndicatorStyle] = useState({});

    const navLabels: Record<View, string> = {
        [View.Strains]: t('nav.strains'),
        [View.Plants]: t('nav.plants'),
        [View.Equipment]: t('nav.equipment'),
        [View.Knowledge]: t('nav.knowledge'),
        [View.Settings]: t('nav.settings'),
        [View.Help]: t('nav.help'),
    };

    useLayoutEffect(() => {
        if (navRef.current) {
            const activeIndex = mainNavViews.indexOf(activeView);
            const activeButton = navRef.current.children[activeIndex] as HTMLElement;
            if (activeButton) {
                setIndicatorStyle({
                    left: `${activeButton.offsetLeft}px`,
                    width: `${activeButton.offsetWidth}px`,
                });
            }
        }
    }, [activeView]);

    return (
        <nav className="fixed bottom-0 left-0 right-0 sm:relative bg-[rgb(var(--color-bg-component))] border-t border-[rgb(var(--color-border))] flex-shrink-0 z-20 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>
            <div ref={navRef} className="relative flex justify-around max-w-5xl mx-auto">
                <div
                    className="absolute top-0 h-full p-1 transition-all duration-300 ease-in-out"
                    style={indicatorStyle}
                >
                    <div className="w-full h-full bg-primary-500/20 rounded-lg shadow-glow-primary"></div>
                </div>
                {mainNavViews.map((view) => (
                    <button
                        key={view}
                        onClick={() => dispatch(setActiveView(view))}
                        className={`flex-1 flex flex-col items-center justify-center py-2 px-1 text-center transition-colors duration-200 relative z-10 ${
                            activeView === view
                                ? 'text-primary-400'
                                : 'text-slate-400 hover:text-primary-300'
                        }`}
                        aria-current={activeView === view ? 'page' : undefined}
                    >
                        <div className="w-6 h-6 mb-1">{navIcons[view]}</div>
                        <span className="text-xs font-semibold tracking-tight">{navLabels[view]}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};