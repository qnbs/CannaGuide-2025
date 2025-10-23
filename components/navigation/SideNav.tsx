import React, { useRef, useState, useLayoutEffect } from 'react';
import { View } from '@/types';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { setActiveView } from '@/stores/slices/uiSlice';
import { selectActiveView } from '@/stores/selectors';
import { CannabisLeafIcon } from '../icons/CannabisLeafIcon';

const navIcons: Record<string, React.ReactNode> = {
    [View.Strains]: <PhosphorIcons.Leafy />,
    [View.Plants]: <PhosphorIcons.Plant />,
    [View.Equipment]: <PhosphorIcons.Wrench />,
    [View.Knowledge]: <PhosphorIcons.Brain />,
};

const mainNavViews: View[] = [View.Strains, View.Plants, View.Equipment, View.Knowledge];

export const SideNav: React.FC = () => {
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
                        top: `${activeButton.offsetTop}px`,
                        height: `${activeButton.offsetHeight}px`,
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
        <nav className="hidden md:flex flex-col w-20 bg-slate-900/80 backdrop-blur-sm border-r border-slate-800 flex-shrink-0 pt-4 items-center">
            <div className="mb-8">
                <CannabisLeafIcon className="w-10 h-10 text-primary-400" />
            </div>
            <div ref={navRef} className="relative w-full flex flex-col items-center gap-2">
                <div className="side-nav-indicator" style={indicatorStyle}></div>
                {mainNavViews.map((view) => (
                    <button
                        key={view}
                        data-view-id={view}
                        onClick={() => dispatch(setActiveView(view))}
                        className={`w-16 h-16 flex flex-col items-center justify-center rounded-lg transition-colors duration-200 relative z-10 ${
                            activeView === view
                                ? 'text-primary-300 bg-primary-500/10 text-glow'
                                : 'text-slate-400 hover:text-primary-300 hover:bg-slate-700/50'
                        }`}
                        aria-current={activeView === view ? 'page' : undefined}
                        title={navLabels[view]}
                    >
                        <div className="w-6 h-6 mb-1">{navIcons[view]}</div>
                        <span className="text-[10px] font-semibold tracking-tight">{navLabels[view]}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};
