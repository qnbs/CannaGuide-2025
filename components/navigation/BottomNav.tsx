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
        const calculateStyle = () => {
            if (navRef.current) {
                const activeButton = navRef.current.querySelector(`[data-view-id="${activeView}"]`) as HTMLElement;
                if (activeButton) {
                    setIndicatorStyle({
                        left: `${activeButton.offsetLeft}px`,
                        width: `${activeButton.offsetWidth}px`,
                    });
                }
            }
        };
        
        calculateStyle();

        const navElement = navRef.current;
        if (!navElement) return;

        const resizeObserver = new ResizeObserver(calculateStyle);
        resizeObserver.observe(navElement);

        return () => resizeObserver.disconnect();
    }, [activeView]);

    return (
        <nav className="fixed bottom-0 left-0 right-0 sm:hidden bg-[rgba(var(--color-bg-primary),0.8)] border-t border-[rgb(var(--color-border))] backdrop-blur-lg flex-shrink-0 z-20 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent"></div>
            <div ref={navRef} className="relative flex justify-around max-w-5xl mx-auto">
                <div
                    className="absolute top-0 h-full rounded-md bg-primary-500/10 transition-all duration-300 ease-out"
                    style={indicatorStyle}
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-400 rounded-b-full shadow-glow-primary"></div>
                </div>
                {mainNavViews.map((view) => (
                    <button
                        key={view}
                        data-view-id={view}
                        onClick={() => dispatch(setActiveView(view))}
                        className={`flex-1 flex flex-col items-center justify-center py-2 px-1 text-center transition-colors duration-200 relative z-10 ${
                            activeView === view
                                ? 'text-primary-300'
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
