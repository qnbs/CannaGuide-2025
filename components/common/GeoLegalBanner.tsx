import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

const GEO_LEGAL_DISMISSED_KEY = 'cg.geoLegal.dismissed.v1'

export const useGeoLegalBanner = () => {
    const [isDismissed, setIsDismissed] = useState(
        () => localStorage.getItem(GEO_LEGAL_DISMISSED_KEY) === '1',
    )

    const dismiss = useCallback(() => {
        localStorage.setItem(GEO_LEGAL_DISMISSED_KEY, '1')
        setIsDismissed(true)
    }, [])

    return { showBanner: !isDismissed, dismiss }
}

interface GeoLegalBannerProps {
    onDismiss: () => void
}

export const GeoLegalBanner: React.FC<GeoLegalBannerProps> = ({ onDismiss }) => {
    const { t } = useTranslation()

    return (
        <div
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-lg animate-slide-in-up"
            role="alert"
        >
            <div className="mx-4 rounded-xl border border-amber-500/30 bg-slate-900/95 backdrop-blur-sm p-4 shadow-2xl">
                <div className="flex items-start gap-3">
                    <PhosphorIcons.WarningCircle weight="fill" className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <h3 className="text-sm font-semibold text-amber-300">
                            {t('legal.geoLegal.title')}
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            {t('legal.geoLegal.body')}
                        </p>
                        <button
                            onClick={onDismiss}
                            className="mt-1 px-4 py-2 min-h-9 text-xs rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                            {t('legal.geoLegal.dismiss')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
