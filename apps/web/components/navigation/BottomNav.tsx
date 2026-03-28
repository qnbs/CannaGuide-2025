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

    const triggerHaptics = () => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate?.(10)
        }
    }

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
        <nav aria-label={t('common.accessibility.mainNavigation')} className="fixed inset-x-0 bottom-0 z-[90] mt-auto px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 sm:hidden">
            <div ref={navRef} className="glass-pane relative mx-auto flex max-w-md justify-around rounded-[1.75rem] border-white/10 px-2 py-2 shadow-[0_-12px_48px_rgba(2,6,23,0.34)]">
                <div
                    className="absolute inset-y-2 h-auto rounded-2xl border border-white/10 bg-white/8 transition-all duration-300 ease-out"
                    style={indicatorStyle}
                >
                    <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-primary-300/70 to-transparent"></div>
                </div>
                {mainNavViews.map((view) => (
                    <button
                        type="button"
                        key={view}
                        data-view-id={view}
                        onClick={() => {
                            triggerHaptics()
                            dispatch(setActiveView(view))
                        }}
                        className={`touch-manipulation relative z-10 flex min-h-12 flex-1 flex-col items-center justify-center rounded-2xl px-1 py-2 text-center transition-all duration-200 active:scale-[0.98] ${
                            activeView === view
                                ? 'text-primary-200'
                                : 'text-slate-400 hover:text-slate-100'
                        }`}
                        aria-label={navLabels[view]}
                        aria-current={activeView === view ? 'page' : undefined}
                    >
                        <div className="mb-0.5 h-6 w-6">{navIcons[view]}</div>
                        <span className="text-[11px] font-semibold tracking-tight leading-tight">{navLabels[view]}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};
