import type React from 'react'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface SettingsSubNavProps {
    activeTab: string
    onTabChange: (tab: string) => void
}

const navItemIds = [
    'general',
    'ai',
    'tts',
    'strains',
    'plants',
    'grows',
    'notifications',
    'defaults',
    'privacy',
    'iot',
    'data',
    'workerTelemetry',
    'about',
] as const

const navIcons: Record<string, React.ReactNode> = {
    general: <PhosphorIcons.GearSix />,
    ai: <PhosphorIcons.Brain />,
    tts: <PhosphorIcons.SpeakerHigh />,
    strains: <PhosphorIcons.Leafy />,
    plants: <PhosphorIcons.Plant />,
    grows: <PhosphorIcons.TreeStructure />,
    notifications: <PhosphorIcons.Bell />,
    defaults: <PhosphorIcons.ListChecks />,
    privacy: <PhosphorIcons.ShieldCheck />,
    iot: <PhosphorIcons.WifiHigh />,
    data: <PhosphorIcons.Archive />,
    workerTelemetry: <PhosphorIcons.ChartLineUp />,
    about: <PhosphorIcons.Info />,
}

export const SettingsSubNav: React.FC<SettingsSubNavProps> = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation()
    const navRef = useRef<HTMLDivElement>(null)

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const currentIndex = (navItemIds as readonly string[]).indexOf(activeTab)
            if (currentIndex === -1) return

            let nextIndex = -1
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                nextIndex = (currentIndex + 1) % navItemIds.length
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                nextIndex = (currentIndex - 1 + navItemIds.length) % navItemIds.length
            } else if (e.key === 'Home') {
                e.preventDefault()
                nextIndex = 0
            } else if (e.key === 'End') {
                e.preventDefault()
                nextIndex = navItemIds.length - 1
            }

            if (nextIndex >= 0) {
                const nextId = navItemIds[nextIndex]
                if (nextId) onTabChange(nextId)
                const btn = navRef.current?.querySelector<HTMLButtonElement>(
                    `[data-tab-id="${nextId}"]`,
                )
                btn?.focus()
            }
        },
        [activeTab, onTabChange],
    )

    return (
        <div
            ref={navRef}
            role="tablist"
            aria-label={t('settingsView.title')}
            tabIndex={0}
            className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-5"
            onKeyDown={handleKeyDown}
        >
            {navItemIds.map((id) => {
                const isActive = activeTab === id
                return (
                    <button
                        type="button"
                        key={id}
                        role="tab"
                        data-tab-id={id}
                        id={`settings-tab-${id}`}
                        aria-selected={isActive}
                        aria-controls={`settings-panel-${id}`}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onTabChange(id)}
                        className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-xl transition-all duration-200 min-h-[56px] sm:min-h-[64px] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                            ${
                                isActive
                                    ? 'bg-primary-600 text-white scale-[1.03] shadow-lg shadow-primary-600/20 ring-1 ring-primary-400/60'
                                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-[1.01]'
                            }`}
                    >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 shrink-0">{navIcons[id]}</div>
                        <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 w-full break-words">
                            {t(`settingsView.categories.${id}`)}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
SettingsSubNav.displayName = 'SettingsSubNav'
