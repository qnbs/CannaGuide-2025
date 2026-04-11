import React, { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { BeforeInstallPromptEvent } from '@/types'

const DISMISS_KEY = 'cannaguide-pwa-banner-dismissed'
const LATER_KEY = 'cannaguide-pwa-banner-later'
const LATER_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000 // 3 days

interface PwaInstallBannerProps {
    deferredPrompt: BeforeInstallPromptEvent | null
    isInstalled: boolean
    onInstallClick: () => void
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({
    deferredPrompt,
    isInstalled,
    onInstallClick,
}) => {
    const { t } = useTranslation()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!deferredPrompt || isInstalled) {
            setVisible(false)
            return
        }

        const dismissed = localStorage.getItem(DISMISS_KEY)
        if (dismissed === 'true') {
            setVisible(false)
            return
        }

        const laterTs = localStorage.getItem(LATER_KEY)
        if (laterTs) {
            const elapsed = Date.now() - Number(laterTs)
            if (elapsed < LATER_COOLDOWN_MS) {
                setVisible(false)
                return
            }
        }

        setVisible(true)
    }, [deferredPrompt, isInstalled])

    const handleLater = useCallback(() => {
        localStorage.setItem(LATER_KEY, String(Date.now()))
        setVisible(false)
    }, [])

    const handleDismiss = useCallback(() => {
        localStorage.setItem(DISMISS_KEY, 'true')
        setVisible(false)
    }, [])

    const handleInstall = useCallback(() => {
        onInstallClick()
        setVisible(false)
    }, [onInstallClick])

    if (!visible) return null

    return (
        <div className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] sm:bottom-4 left-4 right-4 z-50 mx-auto max-w-lg animate-fade-in">
            <div className="rounded-2xl bg-slate-900/95 backdrop-blur-sm border border-primary-500/30 p-4 shadow-xl ring-1 ring-inset ring-white/10">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 rounded-xl bg-primary-600/20 p-2">
                        <PhosphorIcons.DownloadSimple className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-slate-100 text-sm">
                            {t('settingsView.pwa.installBannerTitle')}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {t('settingsView.pwa.installBannerDesc')}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" onClick={handleInstall} glow>
                                <PhosphorIcons.DownloadSimple className="w-4 h-4 mr-1.5" />
                                {t('settingsView.pwa.installNow')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleLater}>
                                {t('settingsView.pwa.later')}
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={t('settingsView.pwa.dontShowAgain')}
                        title={t('settingsView.pwa.dontShowAgain')}
                    >
                        <PhosphorIcons.X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

PwaInstallBanner.displayName = 'PwaInstallBanner'
