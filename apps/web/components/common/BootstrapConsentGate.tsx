import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConsentBanner } from '@/components/common/ConsentBanner'
import { PrivacyPolicyModal } from '@/components/common/PrivacyPolicyModal'

interface BootstrapConsentGateProps {
    onAccept: () => Promise<void>
}

export const BootstrapConsentGate: React.FC<BootstrapConsentGateProps> = ({ onAccept }) => {
    const { t } = useTranslation()
    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
    const [isApplyingConsent, setIsApplyingConsent] = useState(false)

    const handleAccept = async () => {
        if (isApplyingConsent) {
            return
        }

        setIsApplyingConsent(true)
        try {
            await onAccept()
        } catch (error) {
            console.debug('[ConsentBootstrap] Could not continue after consent.', error)
            setIsApplyingConsent(false)
        }
    }

    return (
        <>
            <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--color-bg-primary))] text-slate-300">
                <div className="sr-only" aria-live="polite">
                    {isApplyingConsent ? t('common.preparingGuide') : ''}
                </div>
                <ConsentBanner
                    onAccept={handleAccept}
                    onShowPrivacyPolicy={() => setShowPrivacyPolicy(true)}
                />
            </div>
            <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
        </>
    )
}
