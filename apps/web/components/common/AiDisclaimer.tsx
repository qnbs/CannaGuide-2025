import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface AiDisclaimerProps {
    /**
     * Also render the medical / health disclaimer. Enable for diagnosis-style
     * surfaces where output could be misread as professional health advice.
     */
    medical?: boolean
    className?: string
}

/**
 * Standardised disclaimer shown beneath AI-generated output. Centralises the
 * `ai.disclaimer` (and optional `legal.medicalDisclaimer`) copy so every AI
 * surface presents a consistent, translated notice.
 */
const AiDisclaimerComponent: React.FC<AiDisclaimerProps> = ({ medical = false, className }) => {
    const { t } = useTranslation()

    return (
        <div className={cn('mt-4 text-center', className)} role="note" data-testid="ai-disclaimer">
            <p className="text-xs text-slate-500 italic">{t('ai.disclaimer')}</p>
            {medical && (
                <p className="text-xs text-red-400/80 italic mt-1">
                    {t('legal.medicalDisclaimer')}
                </p>
            )}
        </div>
    )
}

AiDisclaimerComponent.displayName = 'AiDisclaimer'

export const AiDisclaimer = memo(AiDisclaimerComponent)
AiDisclaimer.displayName = 'AiDisclaimer'
