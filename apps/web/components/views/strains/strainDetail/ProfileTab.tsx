import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain, TerpeneName, FlavonoidName } from '@/types'
import { InfoSection } from '@/components/common/InfoSection'
import { AttributeDisplay } from '@/components/common/AttributeDisplay'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import {
    buildChemovarProfile,
    analyzeEntourage,
    generateTerpeneProfile,
    generateCannabinoidProfile,
} from '@/services/terpeneService'
import { TERPENE_DATABASE } from '@/data/terpeneDatabase'
import { FLAVONOID_DATABASE } from '@/data/flavonoidDatabase'
import { Tag, strHash } from './strainDetailShared'
import { FlavonoidEntry } from './FlavonoidEntry'

export const ProfileTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const aromas = Array.isArray(strain.aromas)
        ? strain.aromas.filter((item): item is string => typeof item === 'string')
        : []
    const terpenes = Array.isArray(strain.dominantTerpenes)
        ? strain.dominantTerpenes.filter((item): item is string => typeof item === 'string')
        : []

    // Compute full profiles
    const terpeneProfile = useMemo(
        () =>
            strain.terpeneProfile ??
            generateTerpeneProfile(strain.dominantTerpenes ?? [], strHash(strain.id), strain.type),
        [strain],
    )
    const cannabinoidProfile = useMemo(
        () =>
            strain.cannabinoidProfile ??
            generateCannabinoidProfile(
                strain.thc,
                strain.cbd,
                strain.cbg,
                strain.thcv,
                strHash(strain.id),
            ),
        [strain],
    )
    const chemovar = useMemo(() => buildChemovarProfile(strain), [strain])
    const entourage = useMemo(
        () => analyzeEntourage(terpeneProfile, cannabinoidProfile),
        [terpeneProfile, cannabinoidProfile],
    )
    const flavonoidProfile = strain.flavonoidProfile

    // Sort terpenes by percentage for display
    const sortedTerpenes = useMemo(
        () =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            (Object.entries(terpeneProfile) as [TerpeneName, number][])
                .filter(([, v]) => v >= 0.01)
                .sort((a, b) => b[1] - a[1]),
        [terpeneProfile],
    )

    const chemovarLabel =
        {
            'Type I': t('strainsView.strainDetail.chemovar.typeI'),
            'Type II': t('strainsView.strainDetail.chemovar.typeII'),
            'Type III': t('strainsView.strainDetail.chemovar.typeIII'),
            'Type IV': t('strainsView.strainDetail.chemovar.typeIV'),
            'Type V': t('strainsView.strainDetail.chemovar.typeV'),
        }[chemovar.chemovarType] ?? chemovar.chemovarType

    const profileLabel =
        {
            sedating: t('strainsView.strainDetail.chemovar.sedating'),
            balanced: t('strainsView.strainDetail.chemovar.balanced'),
            energizing: t('strainsView.strainDetail.chemovar.energizing'),
        }[entourage.overallProfile] ?? entourage.overallProfile

    return (
        <div className="space-y-6">
            {/* Aromas & Dominant Terpenes */}
            <InfoSection title={t('strainsView.strainDetail.aromaProfile')}>
                <div className="space-y-4">
                    <AttributeDisplay
                        label={t('strainsView.strainModal.aromas')}
                        value={
                            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                                {aromas.map((a) => (
                                    <Tag key={a}>
                                        {t(`common.aromas.${a}`, { defaultValue: a })}
                                    </Tag>
                                ))}
                            </div>
                        }
                    />
                    <AttributeDisplay
                        label={t('strainsView.strainModal.dominantTerpenes')}
                        value={
                            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                                {terpenes.map((terp) => (
                                    <Tag key={terp}>
                                        {t(`common.terpenes.${terp}`, { defaultValue: terp })}
                                    </Tag>
                                ))}
                            </div>
                        }
                    />
                </div>
            </InfoSection>

            {/* Detailed Terpene Analysis */}
            {sortedTerpenes.length > 0 && (
                <InfoSection title={t('strainsView.strainDetail.terpeneDetails')}>
                    <div className="space-y-3">
                        {sortedTerpenes.map(([name, percent]) => {
                            const ref = TERPENE_DATABASE[name]
                            const barWidth = Math.min((percent / 2.0) * 100, 100)
                            return (
                                <div key={name} className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-slate-200">
                                            {t(`common.terpenes.${name}`, { defaultValue: name })}
                                        </span>
                                        <span className="text-sm text-primary-300 font-mono">
                                            {percent.toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div
                                            className="bg-primary-500 rounded-full h-2 transition-all"
                                            style={{ width: `${barWidth}%` }}
                                        />
                                    </div>
                                    {ref && (
                                        <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1 pl-1">
                                            <span>
                                                {t('strainsView.strainDetail.terpeneClass')}:{' '}
                                                {ref.class}
                                            </span>
                                            <span>
                                                {t('strainsView.strainDetail.chemovar.boilingPoint')}
                                                :{' '}
                                                {t('strainsView.strainDetail.terpeneBoilingPoint', {
                                                    temp: ref.boilingPointC,
                                                })}
                                            </span>
                                            {ref.alsoFoundIn.length > 0 && (
                                                <span>
                                                    {t(
                                                        'strainsView.strainDetail.terpeneAlsoFoundIn',
                                                    )}
                                                    : {ref.alsoFoundIn.slice(0, 3).join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </InfoSection>
            )}

            {/* Flavonoid Profile -- Elaborate Section */}
            {flavonoidProfile && Object.keys(flavonoidProfile).length > 0 && (
                <InfoSection
                    title={t('strainsView.strainDetail.flavonoidSection')}
                    icon={<PhosphorIcons.Leafy className="w-5 h-5 text-amber-400" />}
                >
                    <p className="text-xs text-slate-400 mb-4">
                        {t('strainsView.flavonoids.sectionDescription')}
                    </p>

                    {/* Estimated badge */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="inline-flex items-center gap-1 text-xs bg-slate-700/80 text-amber-300 px-2 py-0.5 rounded-full">
                            <PhosphorIcons.Info className="w-3 h-3" />
                            {t('strainsView.flavonoids.estimated')}
                        </span>
                        <span className="text-xs text-muted">
                            {t('strainsView.flavonoids.estimatedHint')}
                        </span>
                    </div>

                    {/* Cannabis-exclusive Cannflavins highlight */}
                    {(() => {
                        const exclusives = (
                            Object.entries(flavonoidProfile) as [string, number][]
                        ).filter(([name]) => {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            const ref = FLAVONOID_DATABASE[name as FlavonoidName]
                            return ref?.cannabisExclusive
                        })
                        if (exclusives.length === 0) return null
                        return (
                            <div className="bg-gradient-to-r from-amber-900/30 to-emerald-900/20 border border-amber-700/30 rounded-lg p-3 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <PhosphorIcons.Star className="w-4 h-4 text-amber-400" />
                                    <span className="text-sm font-semibold text-amber-300">
                                        {t('strainsView.flavonoids.cannabisExclusive')}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mb-3">
                                    {t('strainsView.flavonoids.cannabisExclusiveDescription')}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {exclusives.map(([name, val]) => {
                                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                                        const ref = FLAVONOID_DATABASE[name as FlavonoidName]
                                        return (
                                            <div
                                                key={name}
                                                className="bg-slate-800/60 rounded-lg p-2.5"
                                            >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-sm font-medium text-amber-300">
                                                        {name}
                                                    </span>
                                                </div>
                                                <div className="text-lg font-mono text-slate-200">
                                                    {val.toFixed(3)}%
                                                </div>
                                                {ref && (
                                                    <div className="text-xs text-muted mt-1">
                                                        {ref.formula} -- {ref.molecularWeight} g/mol
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="mt-2 text-xs text-muted italic">
                                    {t('strainsView.flavonoids.cannflavinNote')}
                                </div>
                            </div>
                        )
                    })()}

                    {/* All Flavonoids -- Bar Chart with Details */}
                    <div className="space-y-3">
                        {(Object.entries(flavonoidProfile) as [string, number][])
                            .filter(([, v]) => v > 0)
                            .sort((a, b) => b[1] - a[1])
                            .map(([name, val]) => {
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                                const ref = FLAVONOID_DATABASE[name as FlavonoidName]
                                const barWidth = Math.min((val / 0.1) * 100, 100)
                                const isExclusive = ref?.cannabisExclusive ?? false
                                return (
                                    <FlavonoidEntry
                                        key={name}
                                        name={name}
                                        val={val}
                                        barWidth={barWidth}
                                        ref_={ref}
                                        isExclusive={isExclusive}
                                        t={t}
                                    />
                                )
                            })}
                    </div>

                    {/* Flavonoid Subclass Legend */}
                    <div className="mt-4 pt-3 border-t border-slate-700/50">
                        <div className="text-xs font-semibold text-slate-400 mb-2">
                            {t('strainsView.flavonoids.subclassLegend')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    'cannflavin',
                                    'flavone',
                                    'flavonol',
                                    'flavanonol',
                                    'catechin',
                                ] as const
                            ).map((sc) => (
                                <span
                                    key={sc}
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                        sc === 'cannflavin'
                                            ? 'bg-amber-900/40 text-amber-300'
                                            : sc === 'flavone'
                                              ? 'bg-purple-900/40 text-purple-300'
                                              : sc === 'flavonol'
                                                ? 'bg-emerald-900/40 text-emerald-300'
                                                : sc === 'flavanonol'
                                                  ? 'bg-blue-900/40 text-blue-300'
                                                  : 'bg-rose-900/40 text-rose-300'
                                    }`}
                                >
                                    {t(`strainsView.flavonoids.subclass.${sc}`)}
                                </span>
                            ))}
                        </div>
                    </div>
                </InfoSection>
            )}

            {/* Chemovar Classification */}
            <InfoSection title={t('strainsView.strainDetail.chemovarSection')}>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-400">
                            {t('strainsView.strainDetail.chemovar.type')}
                        </div>
                        <div className="text-sm font-semibold text-primary-300 mt-1">
                            {chemovarLabel}
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-400">
                            {t('strainsView.strainDetail.chemovar.thcCbdRatio')}
                        </div>
                        <div className="text-sm font-semibold text-slate-200 mt-1">
                            {Number.isFinite(chemovar.thcCbdRatio)
                                ? `${chemovar.thcCbdRatio.toFixed(1)}:1`
                                : 'N/A'}
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-400">
                            {t('strainsView.strainDetail.chemovar.totalCannabinoids')}
                        </div>
                        <div className="text-sm font-semibold text-slate-200 mt-1">
                            {chemovar.totalCannabinoidPercent.toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-xs text-slate-400">
                            {t('strainsView.strainDetail.chemovar.totalTerpenes')}
                        </div>
                        <div className="text-sm font-semibold text-slate-200 mt-1">
                            {chemovar.totalTerpenePercent.toFixed(2)}%
                        </div>
                    </div>
                </div>
                {chemovar.predictedEffects.length > 0 && (
                    <div className="mt-3">
                        <div className="text-xs text-slate-400 mb-2">
                            {t('strainsView.strainDetail.chemovar.predictedEffects')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {chemovar.predictedEffects.map((effect) => (
                                <Tag key={effect}>{effect}</Tag>
                            ))}
                        </div>
                    </div>
                )}
            </InfoSection>

            {/* Entourage Effect & Synergies */}
            <InfoSection title={t('strainsView.strainDetail.entourageSection')}>
                <p className="text-xs text-slate-400 mb-3">
                    {t('strainsView.strainDetail.entourageDescription')}
                </p>
                <div className="space-y-3">
                    <AttributeDisplay
                        label={t('strainsView.strainDetail.overallCharacter')}
                        value={<Tag>{profileLabel}</Tag>}
                    />
                    {entourage.synergies.length > 0 ? (
                        <div className="space-y-2">
                            <div className="text-xs font-semibold text-slate-300">
                                {t('strainsView.strainDetail.chemovar.synergies')}
                            </div>
                            {entourage.synergies.map((synergy, idx) => (
                                <div
                                    key={`synergy-${idx}`}
                                    className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300 flex items-start gap-2"
                                >
                                    <PhosphorIcons.Sparkle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <span>{synergy}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted italic">
                            {t('strainsView.strainDetail.noSynergies')}
                        </p>
                    )}
                </div>
            </InfoSection>
        </div>
    )
}
