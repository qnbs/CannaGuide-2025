import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { visualGuidesData } from '@/data/visualGuides'
import { VisualGuideCard } from './VisualGuideCard'

export const VisualGuidesSection: React.FC = memo(() => {
    const { t } = useTranslation()

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-2">
                {t('helpView.tabs.guides')}
            </h3>
            <p className="text-sm text-slate-400 mb-4">{t('helpView.guides.subtitle')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visualGuidesData.map((guide) => (
                    <VisualGuideCard
                        key={guide.id}
                        guideId={guide.id}
                        title={t(guide.titleKey)}
                        description={t(guide.descriptionKey)}
                    />
                ))}
            </div>
        </Card>
    )
})
VisualGuidesSection.displayName = 'VisualGuidesSection'
