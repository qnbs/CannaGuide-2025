import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain, CannabinoidName } from '@/types'
import { InfoSection } from '@/components/common/InfoSection'
import { AttributeDisplay } from '@/components/common/AttributeDisplay'
import { Speakable } from '@/components/common/Speakable'
import { formatReportedPercent } from '@/components/views/strains/breeding/genetics'
import { CANNABINOID_DATABASE } from '@/data/terpeneDatabase'

const textOr = (value: string | undefined, fallback: string): string => value || fallback

const percentLabel = (value: unknown, unknownLabel: string): string =>
    formatReportedPercent(value, unknownLabel)

const cannabinoidLabel = (name: CannabinoidName): string => {
    const entry = CANNABINOID_DATABASE[name]
    if (entry === undefined) return name
    return entry.abbreviation
}

const cannabinoidActivity = (name: CannabinoidName): string | undefined => {
    const entry = CANNABINOID_DATABASE[name]
    if (entry === undefined) return undefined
    if (entry.psychoactive) return '(psychoactive)'
    return '(non-psychoactive)'
}

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

const isMinorCannabinoid = (entry: [string, unknown]): entry is [CannabinoidName, number] => {
    const [name, value] = entry
    if (name === 'THC' || name === 'CBD') return false
    return isFiniteNumber(value)
}

export const minorCannabinoidEntries = (
    profile?: Strain['cannabinoidProfile'],
): [CannabinoidName, number][] => {
    if (profile === undefined) return []
    return Object.entries(profile)
        .filter(isMinorCannabinoid)
        .sort((left, right) => right[1] - left[1])
}

const MinorCannabinoidLine: React.FC<{ name: CannabinoidName; value: number }> = ({
    name,
    value,
}) => {
    const activity = cannabinoidActivity(name)
    return (
        <AttributeDisplay
            label={cannabinoidLabel(name)}
            value={
                <span className="flex items-center gap-2">
                    <span>{value.toFixed(2)}%</span>
                    {activity === undefined ? null : (
                        <span className="text-xs text-muted">{activity}</span>
                    )}
                </span>
            }
        />
    )
}

const CannabinoidFacts: React.FC<{
    geneticsLabel: string
    genetics: string
    thcLabel: string
    thc: string
    cbdLabel: string
    cbd: string
    minors: [CannabinoidName, number][]
    note: string | undefined
}> = ({ geneticsLabel, genetics, thcLabel, thc, cbdLabel, cbd, minors, note }) => (
    <div className="space-y-2">
        <AttributeDisplay label={geneticsLabel} value={genetics} />
        <AttributeDisplay label={thcLabel} value={thc} />
        <AttributeDisplay label={cbdLabel} value={cbd} />
        {minors.map(([name, value]) => (
            <MinorCannabinoidLine key={name} name={name} value={value} />
        ))}
        {note === undefined ? null : <p className="text-xs text-muted mt-2 italic">{note}</p>}
    </div>
)

const cannabinoidNote = (count: number, note: string): string | undefined => {
    if (count > 0) return note
    return undefined
}

export const OverviewTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const unknown = t('common.unknown')
    const description = t(`strainsData.${strain.id}.description`, {
        defaultValue: textOr(strain.description, 'No description available.'),
    })
    const genetics = t(`strainsData.${strain.id}.genetics`, {
        defaultValue: textOr(strain.genetics, ''),
    })
    const minorCannabinoids = useMemo(
        () => minorCannabinoidEntries(strain.cannabinoidProfile),
        [strain.cannabinoidProfile],
    )

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoSection title={t('common.description')}>
                <Speakable elementId={`strain-desc-${strain.id}`}>
                    <p className="text-slate-300 italic text-sm">{description}</p>
                </Speakable>
            </InfoSection>
            <InfoSection title={t('strainsView.strainDetail.cannabinoidProfile')}>
                <CannabinoidFacts
                    genetics={genetics}
                    thc={textOr(strain.thcRange, percentLabel(strain.thc, unknown))}
                    cbd={textOr(strain.cbdRange, percentLabel(strain.cbd, unknown))}
                    thcLabel={t('strainsView.table.thc')}
                    cbdLabel={t('strainsView.table.cbd')}
                    geneticsLabel={t('common.genetics')}
                    note={cannabinoidNote(
                        minorCannabinoids.length,
                        t('strainsView.strainDetail.cannabinoidNote'),
                    )}
                    minors={minorCannabinoids}
                />
            </InfoSection>
        </div>
    )
}
