import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface UpdateBannerProps {
    updateAvailable: boolean
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ updateAvailable }) => {
    const { t } = useTranslation()

    if (!updateAvailable) return null

    const handleUpdate = () => {
        navigator.serviceWorker
            .getRegistration()
            .then((reg) => {
                if (reg?.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' })
                }
            })
            .catch(() => {
                // Fallback: reload
            })
        window.location.reload()
    }

    return (
        <div className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] sm:bottom-4 left-4 right-4 z-50 mx-auto max-w-lg animate-fade-in">
            <div className="rounded-2xl bg-blue-900/95 backdrop-blur-sm border border-blue-500/30 p-4 shadow-xl ring-1 ring-inset ring-white/10">
                <div className="flex items-center gap-3">
                    <PhosphorIcons.ArrowClockwise className="w-6 h-6 text-blue-300 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                        <p className="text-sm font-semibold text-slate-100">
                            {t('settingsView.pwa.updateAvailable')}
                        </p>
                    </div>
                    <Button size="sm" onClick={handleUpdate}>
                        {t('settingsView.pwa.updateNow')}
                    </Button>
                </div>
            </div>
        </div>
    )
}

UpdateBanner.displayName = 'UpdateBanner'
