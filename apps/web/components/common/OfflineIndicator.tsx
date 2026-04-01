import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

export const OfflineIndicator: React.FC = () => {
    const { t } = useTranslation()
    const [isOffline, setIsOffline] = useState(!navigator.onLine)

    useEffect(() => {
        const goOffline = () => setIsOffline(true)
        const goOnline = () => setIsOffline(false)
        window.addEventListener('offline', goOffline)
        window.addEventListener('online', goOnline)
        return () => {
            window.removeEventListener('offline', goOffline)
            window.removeEventListener('online', goOnline)
        }
    }, [])

    if (!isOffline) return null

    return (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-600 text-white text-center text-sm font-semibold py-1.5 px-4 shadow-lg animate-fade-in flex items-center justify-center gap-2">
            <PhosphorIcons.Warning className="w-4 h-4" />
            {t('settings.pwa.offlineNotice')}
        </div>
    )
}

OfflineIndicator.displayName = 'OfflineIndicator'
