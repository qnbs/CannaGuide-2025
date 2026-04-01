import React, { useMemo } from 'react'
import { View, BeforeInstallPromptEvent } from '@/types'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '../icons/PhosphorIcons'
import { CannabisLeafIcon } from '../icons/CannabisLeafIcon'
import { Button } from '../common/Button'
import { useUIStore } from '@/stores/useUIStore'
import { VoiceControl } from '../common/VoiceControl'

interface HeaderProps {
    onCommandPaletteOpen: () => void
    deferredPrompt: BeforeInstallPromptEvent | null
    isInstalled: boolean
    onInstallClick: () => void
}

export const Header: React.FC<HeaderProps> = ({
    onCommandPaletteOpen,
    deferredPrompt,
    isInstalled,
    onInstallClick,
}) => {
    const { t } = useTranslation()
    const activeView = useUIStore((s) => s.activeView)
    const setActiveView = useUIStore((s) => s.setActiveView)

    const viewTitles: Record<View, string> = {
        [View.Strains]: t('nav.strains'),
        [View.Plants]: t('nav.plants'),
        [View.Equipment]: t('nav.equipment'),
        [View.Knowledge]: t('nav.knowledge'),
        [View.Settings]: t('nav.settings'),
        [View.Help]: t('nav.help'),
    }

    const currentTitle = viewTitles[activeView]

    const handleHeaderClick = () => {
        // Act as a "home" button, returning to the main dashboard
        setActiveView(View.Plants)
    }

    const headerIcon = useMemo(() => {
        const iconClass = 'w-8 h-8 flex-shrink-0'
        switch (activeView) {
            case View.Strains:
                return <PhosphorIcons.Leafy className={`${iconClass} text-green-400`} />
            case View.Plants:
                return <PhosphorIcons.Plant className={`${iconClass} text-green-400`} />
            case View.Equipment:
                return <PhosphorIcons.MagicWand className={`${iconClass} text-purple-400`} />
            case View.Knowledge:
                return <PhosphorIcons.Flask className={`${iconClass} text-rose-400`} />
            case View.Help:
                return <PhosphorIcons.Question className={`${iconClass} text-primary-400`} />
            case View.Settings:
                return <PhosphorIcons.GearSix className={`${iconClass} text-primary-400`} />
            default:
                return <CannabisLeafIcon className={`${iconClass} text-primary-400`} />
        }
    }, [activeView])

    return (
        <header className="sticky top-0 z-30 flex-shrink-0 px-3 pt-3 sm:px-6 sm:pt-4 lg:px-8">
            <div className="mx-auto max-w-7xl rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02)),rgba(15,23,42,0.72)] shadow-[0_24px_80px_rgba(2,6,23,0.36)] backdrop-blur-xl">
                <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <div className="flex h-[4.5rem] items-center justify-between gap-3 px-3 sm:px-5">
                    <button
                        type="button"
                        onClick={handleHeaderClick}
                        className="group flex min-w-0 items-center gap-3 rounded-2xl px-1 py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        aria-label={t('nav.plants')}
                    >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-transform duration-200 group-hover:scale-[1.03]">
                            {headerIcon}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                                CannaGuide
                            </p>
                            <h1 className="truncate text-xl font-bold font-display text-slate-50">
                                {currentTitle}
                            </h1>
                        </div>
                    </button>
                    <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-black/10 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:gap-2">
                        {!isInstalled && deferredPrompt && (
                            <Button
                                variant="ghost"
                                className="rounded-xl !p-2 flex"
                                onClick={onInstallClick}
                                aria-label={t('common.installPwa')}
                            >
                                <PhosphorIcons.DownloadSimple className="w-6 h-6" />
                            </Button>
                        )}

                        <VoiceControl />

                        <Button
                            variant="ghost"
                            className="rounded-xl !p-2"
                            onClick={onCommandPaletteOpen}
                            aria-label={t('commandPalette.open')}
                        >
                            <PhosphorIcons.CommandLine className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="rounded-xl !p-2"
                            onClick={() => setActiveView(View.Help)}
                            aria-label={t('nav.help')}
                        >
                            <PhosphorIcons.Question className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="rounded-xl !p-2"
                            onClick={() => setActiveView(View.Settings)}
                            aria-label={t('nav.settings')}
                        >
                            <PhosphorIcons.GearSix className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}
