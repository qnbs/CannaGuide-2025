import React from 'react'
import {
    View,
    BeforeInstallPromptEvent,
    StrainViewTab,
    EquipmentViewTab,
    KnowledgeViewTab,
} from '@/types'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '../icons/PhosphorIcons'
import { CannabisLeafIcon } from '../icons/CannabisLeafIcon'
import { Button } from '../common/Button'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { selectActiveView, selectIsExpertMode } from '@/stores/selectors'
import { setActiveView, setEquipmentViewTab, setKnowledgeViewTab } from '@/stores/slices/uiSlice'
import { setSetting } from '@/stores/slices/settingsSlice'
import { Switch } from '../common/Switch'
import { setSelectedPlantId } from '@/stores/slices/simulationSlice'
import { setStrainsViewTab } from '@/stores/slices/strainsViewSlice'

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
    const activeView = useAppSelector(selectActiveView)
    const isExpertMode = useAppSelector(selectIsExpertMode)

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
        switch (activeView) {
            case View.Strains:
                dispatch(setStrainsViewTab(StrainViewTab.All))
                break
            case View.Plants:
                dispatch(setSelectedPlantId(null))
                break
            case View.Equipment:
                dispatch(setEquipmentViewTab(EquipmentViewTab.Configurator))
                break
            case View.Knowledge:
                dispatch(setKnowledgeViewTab(KnowledgeViewTab.Mentor))
                break
            // Default behavior for views without sub-pages: go to main dashboard
            default:
                dispatch(setActiveView(View.Plants))
                break
        }
    }

    return (
        <header className="glass-pane sticky top-0 z-30 flex-shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <button
                        onClick={handleHeaderClick}
                        className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md p-1 -m-1"
                        aria-label="Go to main page"
                    >
                        <CannabisLeafIcon className="w-8 h-8 flex-shrink-0" />
                        <div className="flex items-baseline gap-2">
                            <h1 className="text-xl font-bold font-display text-slate-100 hidden sm:block">
                                CannaGuide 2025
                            </h1>
                            <span className="text-slate-400 hidden sm:inline">/</span>
                            <h2 className="text-lg font-semibold text-slate-300">{currentTitle}</h2>
                        </div>
                    </button>
                    <div className="flex items-center gap-2">
                        {deferredPrompt && !isInstalled && (
                            <Button
                                onClick={onInstallClick}
                                size="sm"
                                className="flex items-center gap-1.5 animate-pulse-glow"
                                variant={'primary'}
                                title={t('common.installPwa')}
                            >
                                <PhosphorIcons.DownloadSimple className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('common.installPwa')}</span>
                            </Button>
                        )}
                        <div
                            className="flex items-center gap-2 pr-2"
                            title={t('settingsView.general.expertModeTitle')}
                        >
                            <PhosphorIcons.GraduationCap
                                className={`hidden sm:block w-5 h-5 transition-colors ${
                                    isExpertMode ? 'text-primary-300' : 'text-slate-400'
                                }`}
                            />
                            <Switch
                                checked={isExpertMode}
                                onChange={(val) =>
                                    dispatch(setSetting({ path: 'isExpertMode', value: val }))
                                }
                                aria-label={t('settingsView.general.expertModeTitle')}
                            />
                        </div>
                        <button
                            onClick={onCommandPaletteOpen}
                            aria-label={t('commandPalette.open')}
                            className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300"
                        >
                            <PhosphorIcons.CommandLine className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => dispatch(setActiveView(View.Help))}
                            aria-label={t('nav.help')}
                            className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300"
                        >
                            <PhosphorIcons.Question className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => dispatch(setActiveView(View.Settings))}
                            aria-label={t('nav.settings')}
                            className="p-2 rounded-md hover:bg-slate-700 transition-colors text-slate-300"
                        >
                            <PhosphorIcons.Gear className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}