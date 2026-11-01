import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain } from '@/types'
import { InfoSection } from '@/components/common/InfoSection'
import { AttributeDisplay } from '@/components/common/AttributeDisplay'
import { DifficultyMeter } from './strainDetailShared'

const textOrEmpty = (value: string | undefined): string => value ?? ''

const yieldIndoorOf = (strain: Strain): string =>
    textOrEmpty(strain.agronomic?.yieldDetails?.indoor)

const yieldOutdoorOf = (strain: Strain): string =>
    textOrEmpty(strain.agronomic?.yieldDetails?.outdoor)

const heightIndoorOf = (strain: Strain): string =>
    textOrEmpty(strain.agronomic?.heightDetails?.indoor)

const heightOutdoorOf = (strain: Strain): string =>
    textOrEmpty(strain.agronomic?.heightDetails?.outdoor)

const floweringWeeks = (strain: Strain): string => {
    if (strain.floweringTimeRange) return strain.floweringTimeRange
    if (typeof strain.floweringTime === 'number' && Number.isFinite(strain.floweringTime)) {
        return String(strain.floweringTime)
    }
    return ''
}

const shown = (value: string, unknown: string): string => value || unknown

export const AgronomicsTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const unknown = t('common.unknown')
    const weeks = t('common.units.weeks')
    const yieldIndoor = t(`strainsData.${strain.id}.yieldDetails.indoor`, {
        defaultValue: yieldIndoorOf(strain),
    })
    const yieldOutdoor = t(`strainsData.${strain.id}.yieldDetails.outdoor`, {
        defaultValue: yieldOutdoorOf(strain),
    })
    const heightIndoor = t(`strainsData.${strain.id}.heightDetails.indoor`, {
        defaultValue: heightIndoorOf(strain),
    })
    const heightOutdoor = t(`strainsData.${strain.id}.heightDetails.outdoor`, {
        defaultValue: heightOutdoorOf(strain),
    })
    const difficulty = strain.agronomic?.difficulty
    const flowering = floweringWeeks(strain)
    return (
        <InfoSection title={t('strainsView.strainModal.agronomicData')}>
            <div className="space-y-2">
                <AttributeDisplay
                    label={t('strainsView.strainModal.difficulty')}
                    value={difficulty ? <DifficultyMeter difficulty={difficulty} /> : unknown}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.yieldIndoor')}
                    value={shown(yieldIndoor, unknown)}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.yieldOutdoor')}
                    value={shown(yieldOutdoor, unknown)}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.heightIndoor')}
                    value={shown(heightIndoor, unknown)}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.heightOutdoor')}
                    value={shown(heightOutdoor, unknown)}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.floweringTime')}
                    value={flowering ? `${flowering} ${weeks}` : unknown}
                />
            </div>
        </InfoSection>
    )
}
