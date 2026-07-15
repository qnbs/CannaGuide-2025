import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { useUIStore } from '@/stores/useUIStore'
import { aiConsentService } from '@/services/aiConsentService'

/**
 * Global modal that requests per-provider data-transmission consent
 * before the first cloud AI call to each provider (GDPR Art. 6/7).
 *
 * Rendered once at the app root; shown automatically when
 * `useUIStore.providerConsentRequest` is non-null.
 */
const ProviderConsentModalComponent: React.FC = () => {
    const { t } = useTranslation()
    const { request, resolveConsent } = useUIStore(
        useShallow((s) => ({
            request: s.providerConsentRequest,
            resolveConsent: s.resolveProviderConsent,
        })),
    )

    const isOpen = request !== null
    const provider = request?.provider
    const displayName = provider ? aiConsentService.getDisplayName(provider) : ''
    const dpaLink = provider ? aiConsentService.getDpaLink(provider) : undefined

    const handleGrant = () => resolveConsent(true)
    const handleDeny = () => resolveConsent(false)

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleDeny}
            title={t('settingsView.security.providerConsent')}
            size="md"
            footer={
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={handleDeny}>
                        {t('settingsView.security.providerConsentDeny')}
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleGrant}>
                        {t('common.confirm')}
                    </Button>
                </div>
            }
        >
            <div className="space-y-3 text-sm text-slate-300">
                <p>
                    {t('settingsView.security.providerConsentPrompt', {
                        provider: displayName,
                    })}
                </p>
                {dpaLink && (
                    <a
                        href={dpaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 underline hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded"
                    >
                        {t('settingsView.security.providerDpaLink')}
                    </a>
                )}
            </div>
        </Modal>
    )
}

ProviderConsentModalComponent.displayName = 'ProviderConsentModal'

export const ProviderConsentModal = memo(ProviderConsentModalComponent)
