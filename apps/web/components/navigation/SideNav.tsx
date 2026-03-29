import React, { useRef, useState, useLayoutEffect } from 'react'
import { View } from '@/types'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/useUIStore'
import { CannabisLeafIcon } from '../icons/CannabisLeafIcon'

const navIcons: Record<string, React.ReactNode> = {
    [View.Strains]: <PhosphorIcons.Leafy />,
    [View.Plants]: <PhosphorIcons.Plant />,
    [View.Equipment]: <PhosphorIcons.Wrench />,
    [View.Knowledge]: <PhosphorIcons.Brain />,
}

const mainNavViews: View[] = [View.Strains, View.Plants, View.Equipment, View.Knowledge]

export const SideNav: React.FC = () => {
    const { t } = useTranslation()
    const activeView = useUIStore((s) => s.activeView)
    const setActiveView = useUIStore((s) => s.setActiveView)
    const navRef = useRef<HTMLDivElement>(null)
    const [indicatorStyle, setIndicatorStyle] = useState({})

    const navLabels: Record<View, string> = {
        [View.Strains]: t('nav.strains'),
        [View.Plants]: t('nav.plants'),
        [View.Equipment]: t('nav.equipment'),
        [View.Knowledge]: t('nav.knowledge'),
        [View.Settings]: t('nav.settings'),
        [View.Help]: t('nav.help'),
    }

    useLayoutEffect(() => {
        const calculateStyle = () => {
            if (navRef.current) {
                const activeButton = navRef.current.querySelector(
                    `[data-view-id="${activeView}"]`,
                ) as HTMLElement
                if (activeButton) {
                    setIndicatorStyle({
                        top: `${activeButton.offsetTop}px`,
                        height: `${activeButton.offsetHeight}px`,
                    })
                }
            }
        }

        calculateStyle()

        const navElement = navRef.current
        if (!navElement) return

        const resizeObserver = new ResizeObserver(calculateStyle)
        resizeObserver.observe(navElement)

        return () => resizeObserver.disconnect()
    }, [activeView])

    return (
        <aside className="relative hidden md:block px-4 py-4 lg:px-5 lg:py-5">
            <nav
                aria-label={t('common.accessibility.mainNavigation')}
                className="glass-pane flex h-full w-[5.5rem] flex-col items-center rounded-[1.8rem] px-3 py-5"
            >
                <div className="surface-badge mb-8 flex h-12 w-12 items-center justify-center rounded-2xl p-0">
                    <CannabisLeafIcon className="h-7 w-7 text-primary-300" />
                </div>
                <div ref={navRef} className="relative flex w-full flex-col items-center gap-2">
                    <div className="side-nav-indicator" style={indicatorStyle}></div>
                    {mainNavViews.map((view) => (
                        <button
                            type="button"
                            key={view}
                            data-view-id={view}
                            onClick={() => setActiveView(view)}
                            className={`relative z-10 flex h-[4.5rem] w-full flex-col items-center justify-center rounded-2xl border transition-all duration-200 ${
                                activeView === view
                                    ? 'border-white/12 bg-white/10 text-primary-200 shadow-[0_16px_40px_rgba(2,6,23,0.24)]'
                                    : 'border-transparent text-slate-400 hover:border-white/8 hover:bg-white/6 hover:text-slate-100'
                            }`}
                            aria-label={navLabels[view]}
                            aria-current={activeView === view ? 'page' : undefined}
                            title={navLabels[view]}
                        >
                            <div className="mb-1 h-6 w-6">{navIcons[view]}</div>
                            <span className="text-[10px] font-semibold tracking-[0.02em]">
                                {navLabels[view]}
                            </span>
                        </button>
                    ))}
                </div>
            </nav>
        </aside>
    )
}
