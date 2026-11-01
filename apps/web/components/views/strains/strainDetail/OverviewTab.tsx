import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain, CannabinoidName } from '@/types'
import { InfoSection } from '@/components/common/InfoSection'
import { AttributeDisplay } from '@/components/common/AttributeDisplay'
import { Speakable } from '@/components/common/Speakable'
import { CANNABINOID_DATABASE } from '@/data/terpeneDatabase'

export const OverviewTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const safeThc =
        typeof strain.thc === 'number' && Number.isFinite(strain.thc)
            ? `${strain.thc.toFixed(1)}%`
            : t('common.unknown')
    const safeCbd =
        typeof strain.cbd === 'number' && Number.isFinite(strain.cbd)
            ? `${strain.cbd.toFixed(1)}%`
            : t('common.unknown')
    const description = t(`strainsData.${strain.id}.description`, {
        defaultValue: strain.description || 'No description available.',
    })
    const genetics = t(`strainsData.${strain.id}.genetics`, { defaultValue: strain.genetics ?? '' })

    const cannabinoidProfile = strain.cannabinoidProfile

    // Minor cannabinoids beyond THC/CBD, only when a source supplied the profile.
    const minorCannabinoids = useMemo(() => {
        if (!cannabinoidProfile) return []
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const entries = Object.entries(cannabinoidProfile) as [CannabinoidName, number][]
        return entries
            .filter(([name, val]) => name !== 'THC' && name !== 'CBD' && val > 0)
            .sort((a, b) => b[1] - a[1])
    }, [cannabinoidProfile])

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoSection title={t('common.description')}>
                <Speakable elementId={`strain-desc-${strain.id}`}>
                    <p className="text-slate-300 italic text-sm">{description}</p>
                </Speakable>
            </InfoSection>
            <InfoSection title={t('strainsView.strainDetail.cannabinoidProfile')}>
                <div className="space-y-2">
                    <AttributeDisplay label={t('common.genetics')} value={genetics} />
                    <AttributeDisplay
                        label={t('strainsView.table.thc')}
                        value={strain.thcRange || safeThc}
                    />
                    <AttributeDisplay
                        label={t('strainsView.table.cbd')}
                        value={strain.cbdRange || safeCbd}
                    />
                    {minorCannabinoids.map(([name, val]) => {
                        const ref = CANNABINOID_DATABASE[name]
                        return (
                            <AttributeDisplay
                                key={name}
                                label={ref?.abbreviation ?? name}
                                value={
                                    <span className="flex items-center gap-2">
                                        <span>{val.toFixed(2)}%</span>
                                        {ref && (
                                            <span className="text-xs text-muted">
                                                {ref.psychoactive
                                                    ? '(psychoactive)'
                                                    : '(non-psychoactive)'}
                                            </span>
                                        )}
                                    </span>
                                }
                            />
                        )
                    })}
                    {minorCannabinoids.length > 0 && (
                        <p className="text-xs text-muted mt-2 italic">
                            {t('strainsView.strainDetail.cannabinoidNote')}
                        </p>
                    )}
                </div>
            </InfoSection>
        </div>
    )
}
