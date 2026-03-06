import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

const CONSENT_KEY = 'cg.gdpr.consent.v1'

export const useGdprConsent = () => {
    const [hasConsent, setHasConsent] = useState(
        () => localStorage.getItem(CONSENT_KEY) === '1',
    )

    const accept = useCallback(() => {
        localStorage.setItem(CONSENT_KEY, '1')
        setHasConsent(true)
    }, [])

    return { hasConsent, accept }
}

interface ConsentBannerProps {
    onAccept: () => void
    onShowPrivacyPolicy: () => void
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({ onAccept, onShowPrivacyPolicy }) => {
    const { t } = useTranslation()

    return (
        <div
            className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-title"
        >
            <div className="max-w-lg w-full rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
                <div className="flex items-start gap-3">
                    <PhosphorIcons.ShieldCheck weight="fill" className="w-6 h-6 text-primary-400 mt-0.5 shrink-0" />
                    <h2 id="consent-title" className="text-lg font-bold text-slate-100">
                        {t('legal.consent.title')}
                    </h2>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                    {t('legal.consent.body')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        onClick={onAccept}
                        className="flex-1 px-5 py-3 min-h-11 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        {t('legal.consent.accept')}
                    </button>
                    <button
                        onClick={onShowPrivacyPolicy}
                        className="flex-1 px-5 py-3 min-h-11 rounded-lg border border-slate-600 text-slate-300 hover:text-slate-100 hover:border-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                        {t('legal.consent.learnMore')}
                    </button>
                </div>
            </div>
        </div>
    )
}
