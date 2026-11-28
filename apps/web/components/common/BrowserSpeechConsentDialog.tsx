import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'

interface BrowserSpeechConsentDialogProps {
    isOpen: boolean
    onAllow: () => void
    onCancel: () => void
}

export const BrowserSpeechConsentDialog: React.FC<BrowserSpeechConsentDialogProps> = ({
    isOpen,
    onAllow,
    onCancel,
}) => {
    const { t } = useTranslation()

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title={t('common.voiceControl.speechConsent.title')}
            description={t('common.voiceControl.speechConsent.description')}
            footer={
                <>
                    <Button variant="secondary" onClick={onCancel}>
                        {t('common.voiceControl.speechConsent.cancel')}
                    </Button>
                    <Button onClick={onAllow}>
                        {t('common.voiceControl.speechConsent.allow')}
                    </Button>
                </>
            }
        >
            <p className="text-sm text-slate-300">
                {t('common.voiceControl.speechConsent.details')}
            </p>
        </Modal>
    )
}
