import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/common/Card'
import { AiModeCard } from './AiModeCard'
import { GeminiSecurityCard } from './GeminiSecurityCard'
import { LocalAiOfflineCard } from './LocalAiOfflineCard'
import { LocalAiFeaturesCard } from './LocalAiFeaturesCard'

const AiSettingsTab: React.FC = () => {
    const [hasError, setHasError] = useState(false)
    const { t } = useTranslation()

    if (hasError) {
        return (
            <Card>
                <div className="text-center py-8 space-y-3">
                    <PhosphorIcons.Warning className="w-10 h-10 mx-auto text-amber-400" />
                    <p className="text-sm text-slate-300">{t('common.errorBoundary.subtitle')}</p>
                    <Button variant="secondary" onClick={() => setHasError(false)}>
                        {t('common.errorBoundary.retryButton')}
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <AiModeCard />
            <GeminiSecurityCard />
            <LocalAiOfflineCard />
            <LocalAiFeaturesCard />
        </div>
    )
}

export default AiSettingsTab
