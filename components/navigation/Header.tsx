import React from 'react'
import { View, BeforeInstallPromptEvent, AppSettings } from '@/types'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '../icons/PhosphorIcons'
import { CannabisLeafIcon } from '../icons/CannabisLeafIcon'
import { Button } from '../common/Button'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { selectActiveView } from '@/stores/selectors'
import { setActiveView } from '@/stores/slices/uiSlice'
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
    const dispatch = useAppDispatch()
    // FIX: Cast the result of useAppSelector to the correct type to avoid 'unknown' type errors.
    const activeView = useAppSelector(selectActiveView) as View;

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
        dispatch(setActiveView(View.Plants))
    }

    return (
        <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30 flex-shrink-0 border-b border-slate-800 shadow-md relative">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <button
                        onClick={handleHeaderClick}
                        className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md p-1 -m-1"
                        aria-label="Go to Plants Dashboard"
                    >
                        <CannabisLeafIcon className="w-8 h-8 flex-shrink-0 text-primary-400" />
                        <div className="flex items-baseline gap-2">
                            <h1 className="text-xl font-bold font-display text-primary-300">
                                {currentTitle}
                            </h1>
                        </div>
                    </button>
                    <div className="flex items-center gap-1 sm:gap-2">
                        {!isInstalled && deferredPrompt && (
                            <Button
                                variant="ghost"
                                className="!p-2 rounded-full hidden sm:flex"
                                onClick={onInstallClick}
                                title={t('common.installPwa')}
                            >
                                <PhosphorIcons.DownloadSimple className="w-6 h-6" />
                            </Button>
                        )}
                        
                        <VoiceControl />
                        
                        <Button
                            variant="ghost"
                            className="!p-2 rounded-full"
                            onClick={onCommandPaletteOpen}
                            title={t('commandPalette.open')}
                        >
                            <PhosphorIcons.CommandLine className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="!p-2 rounded-full"
                            onClick={() => dispatch(setActiveView(View.Help))}
                            title={t('nav.help')}
                        >
                            <PhosphorIcons.Question className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="!p-2 rounded-full"
                            onClick={() => dispatch(setActiveView(View.Settings))}
                            title={t('nav.settings')}
                        >
                            <PhosphorIcons.Gear className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}