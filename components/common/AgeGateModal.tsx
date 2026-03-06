import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CannabisLeafIcon } from '@/components/icons/CannabisLeafIcon'

const AGE_VERIFIED_KEY = 'cg.ageVerified.v1'

export const useAgeGate = () => {
    const [isVerified, setIsVerified] = useState(
        () => localStorage.getItem(AGE_VERIFIED_KEY) === '1',
    )

    const verify = useCallback(() => {
        localStorage.setItem(AGE_VERIFIED_KEY, '1')
        setIsVerified(true)
    }, [])

    return { isVerified, verify }
}

interface AgeGateModalProps {
    onVerified: () => void
}

export const AgeGateModal: React.FC<AgeGateModalProps> = ({ onVerified }) => {
    const { t } = useTranslation()
    const [denied, setDenied] = useState(false)

    if (denied) {
        return (
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgb(var(--color-bg-primary))] p-6"
                role="alert"
            >
                <div className="text-center max-w-md">
                    <CannabisLeafIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-lg text-red-400 font-semibold">
                        {t('legal.ageGate.denied')}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgb(var(--color-bg-primary))] p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="age-gate-title"
        >
            <div className="max-w-lg w-full text-center space-y-6">
                <CannabisLeafIcon className="w-20 h-20 text-primary-500 mx-auto" />
                <h1
                    id="age-gate-title"
                    className="text-2xl font-bold font-display text-slate-100"
                >
                    {t('legal.ageGate.title')}
                </h1>
                <p className="text-slate-400 text-sm">
                    {t('legal.ageGate.subtitle')}
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">
                    {t('legal.ageGate.body')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button
                        onClick={onVerified}
                        className="px-6 py-3 min-h-11 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-[rgb(var(--color-bg-primary))]"
                    >
                        {t('legal.ageGate.confirm')}
                    </button>
                    <button
                        onClick={() => setDenied(true)}
                        className="px-6 py-3 min-h-11 rounded-lg border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-[rgb(var(--color-bg-primary))]"
                    >
                        {t('legal.ageGate.deny')}
                    </button>
                </div>
            </div>
        </div>
    )
}
