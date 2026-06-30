import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain } from '@/types'
import { InfoSection } from '@/components/common/InfoSection'
import { AttributeDisplay } from '@/components/common/AttributeDisplay'
import { DifficultyMeter } from './strainDetailShared'

export const AgronomicsTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const yieldIndoor = t(`strainsData.${strain.id}.yieldDetails.indoor`, {
        defaultValue: strain.agronomic?.yieldDetails?.indoor ?? '',
    })
    const yieldOutdoor = t(`strainsData.${strain.id}.yieldDetails.outdoor`, {
        defaultValue: strain.agronomic?.yieldDetails?.outdoor ?? '',
    })
    const heightIndoor = t(`strainsData.${strain.id}.heightDetails.indoor`, {
        defaultValue: strain.agronomic?.heightDetails?.indoor ?? '',
    })
    const heightOutdoor = t(`strainsData.${strain.id}.heightDetails.outdoor`, {
        defaultValue: strain.agronomic?.heightDetails?.outdoor ?? '',
    })
    return (
        <InfoSection title={t('strainsView.strainModal.agronomicData')}>
            <div className="space-y-2">
                <AttributeDisplay
                    label={t('strainsView.strainModal.difficulty')}
                    value={<DifficultyMeter difficulty={strain.agronomic?.difficulty ?? 'Medium'} />}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.yieldIndoor')}
                    value={yieldIndoor}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.yieldOutdoor')}
                    value={yieldOutdoor}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.heightIndoor')}
                    value={heightIndoor}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.heightOutdoor')}
                    value={heightOutdoor}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.floweringTime')}
                    value={`${strain.floweringTimeRange || strain.floweringTime} ${t('common.units.weeks')}`}
                />
            </div>
        </InfoSection>
    )
}
