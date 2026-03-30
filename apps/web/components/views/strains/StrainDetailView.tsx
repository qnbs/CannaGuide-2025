import React, { useState, useEffect, useMemo } from 'react'
import { Strain, StrainType } from '@/types'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectHasAvailableSlots, selectFavoriteIds } from '@/stores/selectors'
import { toggleFavorite } from '@/stores/slices/favoritesSlice'
import { initiateGrowFromStrainList } from '@/stores/useUIStore'
import { updateNote, undoNoteChange, redoNoteChange } from '@/stores/slices/notesSlice'
import { StrainAiTips } from './StrainAiTips'
import { Tabs } from '@/components/common/Tabs'
import { InfoSection } from '@/components/common/InfoSection'
import { AttributeDisplay } from '@/components/common/AttributeDisplay'
import { Speakable } from '@/components/common/Speakable'
import { StrainImageGalleryTab } from './StrainImageGalleryTab'
import { AvailabilityTab } from './AvailabilityTab'
import {
    buildChemovarProfile,
    analyzeEntourage,
    generateTerpeneProfile,
    generateCannabinoidProfile,
} from '@/services/terpeneService'
import { TERPENE_DATABASE, CANNABINOID_DATABASE } from '@/data/terpeneDatabase'
import { FLAVONOID_DATABASE } from '@/data/flavonoidDatabase'
import type { TerpeneName, CannabinoidName, FlavonoidName } from '@/types'

/** Simple deterministic hash from string */
const strHash = (s: string): number => {
    let h = 0
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0
    }
    return Math.abs(h)
}

// --- Sub-components for better structure ---

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="bg-slate-700 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-full">
        {children}
    </span>
)

const DifficultyMeter: React.FC<{ difficulty: Strain['agronomic']['difficulty'] }> = ({
    difficulty,
}) => {
    const { t } = useTranslation()
    const safeDifficulty =
        difficulty === 'Easy' || difficulty === 'Medium' || difficulty === 'Hard'
            ? difficulty
            : 'Medium'
    const difficultyLabels: Record<'Easy' | 'Medium' | 'Hard', string> = {
        Easy: t('strainsView.difficulty.easy'),
        Medium: t('strainsView.difficulty.medium'),
        Hard: t('strainsView.difficulty.hard'),
    }
    const difficultyMap = {
        Easy: { level: 1, color: 'text-success' },
        Medium: { level: 2, color: 'text-warning' },
        Hard: { level: 3, color: 'text-danger' },
    }
    const { level, color } = difficultyMap[safeDifficulty] ?? difficultyMap.Medium

    return (
        <div
            className="flex items-center gap-2 justify-end"
            title={difficultyLabels[safeDifficulty]}
        >
            <span>{difficultyLabels[safeDifficulty]}</span>
            <div className="flex">
                {[1, 2, 3].map((marker) => (
                    <PhosphorIcons.Cannabis
                        key={`difficulty-marker-${marker}`}
                        className={`w-5 h-5 ${marker <= level ? color : 'text-slate-700'}`}
                    />
                ))}
            </div>
        </div>
    )
}

/** Expandable flavonoid entry with scientific details */
const FlavonoidEntry: React.FC<{
    name: string
    val: number
    barWidth: number
    ref_: (typeof FLAVONOID_DATABASE)[FlavonoidName] | undefined
    isExclusive: boolean
    t: ReturnType<typeof useTranslation>['t']
}> = React.memo(({ name, val, barWidth, ref_, isExclusive, t }) => {
    const [expanded, setExpanded] = useState(false)

    const subclassColor = ref_
        ? ({
              cannflavin: 'bg-amber-900/40 text-amber-300',
              flavone: 'bg-purple-900/40 text-purple-300',
              flavonol: 'bg-emerald-900/40 text-emerald-300',
              flavanonol: 'bg-blue-900/40 text-blue-300',
              flavanone: 'bg-orange-900/40 text-orange-300',
              catechin: 'bg-rose-900/40 text-rose-300',
          }[ref_.subclass] ?? 'bg-slate-700 text-slate-300')
        : ''

    const barColor = isExclusive ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-amber-500'

    return (
        <div
            className="group cursor-pointer rounded-lg hover:bg-slate-800/50 transition-colors p-2 -mx-2"
            onClick={() => setExpanded((prev) => !prev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setExpanded((prev) => !prev)
            }}
        >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{name}</span>
                    {isExclusive && (
                        <span className="text-xs bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <PhosphorIcons.Star className="w-3 h-3" />
                            {t('strainsView.flavonoids.exclusive')}
                        </span>
                    )}
                    {ref_ && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${subclassColor}`}>
                            {t(`strainsView.flavonoids.subclass.${ref_.subclass}`)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-amber-300 font-mono">{val.toFixed(3)}%</span>
                    <PhosphorIcons.ChevronDown
                        className={`w-3.5 h-3.5 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                    className={`${barColor} rounded-full h-1.5 transition-all`}
                    style={{ width: `${barWidth}%` }}
                />
            </div>

            {/* Inline Effects Preview */}
            {ref_ && ref_.effects.length > 0 && !expanded && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                    {ref_.effects.map((effect) => (
                        <span key={effect} className="text-xs text-slate-500">
                            {t(`strainsView.flavonoids.effects.${effect.replace(/[\s-]/g, '')}`, {
                                defaultValue: effect,
                            })}
                        </span>
                    ))}
                </div>
            )}

            {/* Expanded Details */}
            {expanded && ref_ && (
                <div className="mt-3 space-y-3 text-xs">
                    {/* Molecular Info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500">
                        <span>
                            {t('strainsView.flavonoids.detail.formula')}:{' '}
                            <span className="text-slate-300 font-mono">{ref_.formula}</span>
                        </span>
                        <span>
                            {t('strainsView.flavonoids.detail.molarMass')}:{' '}
                            <span className="text-slate-300">{ref_.molecularWeight} g/mol</span>
                        </span>
                        <span>
                            CAS: <span className="text-slate-300 font-mono">{ref_.cas}</span>
                        </span>
                        <span>
                            {t('strainsView.flavonoids.detail.typicalRange')}:{' '}
                            <span className="text-slate-300 font-mono">
                                {ref_.typicalRange.min.toFixed(4)}-
                                {ref_.typicalRange.max.toFixed(3)}%
                            </span>
                        </span>
                    </div>

                    {/* Effects */}
                    {ref_.effects.length > 0 && (
                        <div>
                            <div className="text-slate-400 font-semibold mb-1">
                                {t('strainsView.flavonoids.detail.effects')}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {ref_.effects.map((effect) => (
                                    <span
                                        key={effect}
                                        className="bg-amber-900/30 text-amber-200 px-2 py-0.5 rounded-full"
                                    >
                                        {t(
                                            `strainsView.flavonoids.effects.${effect.replace(/[\s-]/g, '')}`,
                                            { defaultValue: effect },
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mechanisms */}
                    {ref_.mechanisms.length > 0 && (
                        <div>
                            <div className="text-slate-400 font-semibold mb-1">
                                {t('strainsView.flavonoids.detail.mechanisms')}
                            </div>
                            <ul className="space-y-1 text-slate-400">
                                {ref_.mechanisms.map((m, i) => (
                                    <li key={`mech-${i}`} className="flex items-start gap-1.5">
                                        <PhosphorIcons.Flask className="w-3 h-3 text-amber-500/60 flex-shrink-0 mt-0.5" />
                                        <span>{m}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Also Found In */}
                    {ref_.alsoFoundIn.length > 0 && (
                        <div>
                            <div className="text-slate-400 font-semibold mb-1">
                                {t('strainsView.flavonoids.detail.alsoFoundIn')}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {ref_.alsoFoundIn.map((source) => (
                                    <span
                                        key={source}
                                        className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full"
                                    >
                                        {source}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
})
FlavonoidEntry.displayName = 'FlavonoidEntry'

const OverviewTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const safeThc =
        typeof strain.thc === 'number' && Number.isFinite(strain.thc)
            ? `${strain.thc.toFixed(1)}%`
            : 'N/A'
    const safeCbd =
        typeof strain.cbd === 'number' && Number.isFinite(strain.cbd)
            ? `${strain.cbd.toFixed(1)}%`
            : 'N/A'
    const description = t(`strainsData.${strain.id}.description`, {
        defaultValue: strain.description || 'No description available.',
    })
    const genetics = t(`strainsData.${strain.id}.genetics`, { defaultValue: strain.genetics ?? '' })

    // Build extended cannabinoid profile
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

    // Minor cannabinoids beyond THC/CBD
    const minorCannabinoids = useMemo(() => {
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
                                            <span className="text-xs text-slate-500">
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
                        <p className="text-xs text-slate-500 mt-2 italic">
                            {t('strainsView.strainDetail.cannabinoidNote')}
                        </p>
                    )}
                </div>
            </InfoSection>
        </div>
    )
}

const AgronomicsTab: React.FC<{ strain: Strain }> = ({ strain }) => {
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
                    value={
                        <DifficultyMeter difficulty={strain.agronomic?.difficulty ?? 'Medium'} />
                    }
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

const ProfileTab: React.FC<{ strain: Strain }> = ({ strain }) => {
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
                                                {t(
                                                    'strainsView.strainDetail.chemovar.boilingPoint',
                                                )}
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
                        <span className="text-xs text-slate-500">
                            {t('strainsView.flavonoids.estimatedHint')}
                        </span>
                    </div>

                    {/* Cannabis-exclusive Cannflavins highlight */}
                    {(() => {
                        const exclusives = (
                            Object.entries(flavonoidProfile) as [string, number][]
                        ).filter(([name]) => {
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
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        {ref.formula} -- {ref.molecularWeight} g/mol
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="mt-2 text-xs text-slate-500 italic">
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
                        <p className="text-sm text-slate-500 italic">
                            {t('strainsView.strainDetail.noSynergies')}
                        </p>
                    )}
                </div>
            </InfoSection>
        </div>
    )
}

const NotesTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const noteHistory = useAppSelector((state) => state.notes.strainNotes[strain.id])
    const [showTemplates, setShowTemplates] = useState(false)

    const canUndo = noteHistory && noteHistory.past.length > 0
    const canRedo = noteHistory && noteHistory.future.length > 0
    const noteContent = noteHistory ? noteHistory.present : ''

    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch(updateNote({ strainId: strain.id, note: e.target.value }))
    }

    const today = new Date().toISOString().slice(0, 10)
    const templateData = { name: strain.name, date: today }

    const templates = [
        {
            id: 'grow',
            label: t('strainsView.strainDetail.notesTemplateGrow'),
            icon: <PhosphorIcons.Leafy className="w-4 h-4" />,
            content: t('strainsView.strainDetail.notesGrowTemplate', templateData),
        },
        {
            id: 'review',
            label: t('strainsView.strainDetail.notesTemplateReview'),
            icon: <PhosphorIcons.Star className="w-4 h-4" />,
            content: t('strainsView.strainDetail.notesReviewTemplate', templateData),
        },
        {
            id: 'medical',
            label: t('strainsView.strainDetail.notesTemplateMedical'),
            icon: <PhosphorIcons.Heart className="w-4 h-4" />,
            content: t('strainsView.strainDetail.notesMedicalTemplate', templateData),
        },
        {
            id: 'breeding',
            label: t('strainsView.strainDetail.notesTemplateBreeding'),
            icon: <PhosphorIcons.Flask className="w-4 h-4" />,
            content: t('strainsView.strainDetail.notesBreedingTemplate', templateData),
        },
    ]

    const insertTemplate = (content: string) => {
        const resolvedContent = content.replace(/\\n/g, '\n')
        const newContent = noteContent ? `${noteContent}\n\n${resolvedContent}` : resolvedContent
        dispatch(updateNote({ strainId: strain.id, note: newContent }))
        setShowTemplates(false)
    }

    return (
        <InfoSection title={t('strainsView.strainModal.notes')}>
            <div className="bg-slate-800 rounded-md border border-slate-700">
                <div className="flex items-center p-2 border-b border-slate-700 gap-2 flex-wrap">
                    <Button
                        variant="secondary"
                        onClick={() => dispatch(undoNoteChange({ strainId: strain.id }))}
                        disabled={!canUndo}
                        className="!h-11 !w-11 !p-0"
                        aria-label={t('common.undo')}
                    >
                        <PhosphorIcons.ArrowClockwise className="w-4 h-4 transform scale-x-[-1]" />
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => dispatch(redoNoteChange({ strainId: strain.id }))}
                        disabled={!canRedo}
                        className="!h-11 !w-11 !p-0"
                        aria-label={t('common.redo')}
                    >
                        <PhosphorIcons.ArrowClockwise className="w-4 h-4" />
                    </Button>
                    <div className="ml-auto relative">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="min-h-11"
                        >
                            <PhosphorIcons.BookOpenText className="w-4 h-4 mr-1.5" />
                            {t('strainsView.strainDetail.notesTemplates')}
                            <PhosphorIcons.ChevronDown
                                className={`w-3 h-3 ml-1 transition-transform ${showTemplates ? 'rotate-180' : ''}`}
                            />
                        </Button>
                        {showTemplates && (
                            <div className="absolute right-0 top-full mt-1 z-20 bg-slate-700 border border-slate-600 rounded-lg shadow-xl min-w-[200px]">
                                {templates.map((tmpl) => (
                                    <button
                                        key={tmpl.id}
                                        onClick={() => insertTemplate(tmpl.content)}
                                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-600 first:rounded-t-lg last:rounded-b-lg transition-colors text-left"
                                    >
                                        {tmpl.icon}
                                        {tmpl.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <textarea
                    value={noteContent}
                    onChange={handleNoteChange}
                    className="w-full bg-transparent resize-none min-h-[250px] p-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 rounded-b-md font-mono text-sm"
                    placeholder={t('strainsView.strainDetail.notesPlaceholder')}
                />
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-700 text-xs text-slate-500">
                    <span>
                        {t('strainsView.strainDetail.notes.charCount', {
                            count: noteContent.length,
                        })}
                    </span>
                </div>
            </div>
        </InfoSection>
    )
}

interface StrainDetailViewProps {
    strain: Strain
    onBack: () => void
    onNavigateToGenealogy?: (strainId: string) => void
}

export const StrainDetailView: React.FC<StrainDetailViewProps> = ({
    strain,
    onBack,
    onNavigateToGenealogy,
}) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const favoriteIds = useAppSelector(selectFavoriteIds) ?? new Set<string>()
    const isFavorite = favoriteIds.has(strain.id)
    const hasAvailableSlots = useAppSelector(selectHasAvailableSlots)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        setActiveTab('overview')
    }, [strain])

    const tabs: { id: string; label: string; icon: React.ReactNode }[] = [
        {
            id: 'overview',
            label: t('strainsView.strainDetail.tabs.overview'),
            icon: <PhosphorIcons.Book />,
        },
        {
            id: 'agronomics',
            label: t('strainsView.strainDetail.tabs.agronomics'),
            icon: <PhosphorIcons.Ruler />,
        },
        {
            id: 'profile',
            label: t('strainsView.strainDetail.tabs.profile'),
            icon: <PhosphorIcons.Sparkle />,
        },
        {
            id: 'notes',
            label: t('strainsView.strainDetail.tabs.notes'),
            icon: <PhosphorIcons.BookOpenText />,
        },
        {
            id: 'aiTips',
            label: t('strainsView.strainDetail.tabs.aiTips'),
            icon: <PhosphorIcons.Brain />,
        },
        {
            id: 'images',
            label: t('strainsView.strainDetail.tabs.images'),
            icon: <PhosphorIcons.Camera />,
        },
        {
            id: 'availability',
            label: t('strainsView.strainDetail.tabs.availability', { defaultValue: 'Seedbanks' }),
            icon: <PhosphorIcons.Storefront />,
        },
    ]

    const typeClasses: Record<StrainType, string> = {
        [StrainType.Sativa]: 'text-accent-400',
        [StrainType.Indica]: 'text-secondary-400',
        [StrainType.Hybrid]: 'text-primary-400',
    }
    const TypeIcon =
        {
            [StrainType.Sativa]: SativaIcon,
            [StrainType.Indica]: IndicaIcon,
            [StrainType.Hybrid]: HybridIcon,
        }[strain.type] ?? HybridIcon

    const typeDetails = t(`strainsData.${strain.id}.typeDetails`, {
        defaultValue: strain.typeDetails ?? '',
    })

    return (
        <div className="space-y-6">
            <header>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                        variant="secondary"
                        onClick={onBack}
                        className="min-h-11 w-full sm:w-auto"
                    >
                        <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                        {t('common.back')}
                    </Button>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div
                            title={
                                !hasAvailableSlots
                                    ? t('plantsView.notifications.allSlotsFull')
                                    : undefined
                            }
                        >
                            <Button
                                onClick={() => initiateGrowFromStrainList(strain)}
                                disabled={!hasAvailableSlots}
                                className="inline-flex min-h-11 w-full sm:w-auto"
                            >
                                {t('strainsView.startGrowing')}
                            </Button>
                        </div>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => dispatch(toggleFavorite(strain.id))}
                            aria-pressed={isFavorite}
                            aria-label={
                                isFavorite
                                    ? t('strainsView.accessibility.removeFromFavorites', {
                                          name: strain.name,
                                      })
                                    : t('strainsView.accessibility.addToFavorites', {
                                          name: strain.name,
                                      })
                            }
                            className={`favorite-btn-glow ${isFavorite ? 'is-favorite' : ''}`}
                        >
                            <PhosphorIcons.Heart
                                weight={isFavorite ? 'fill' : 'regular'}
                                className="w-5 h-5"
                            />
                        </Button>
                        {onNavigateToGenealogy && (
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={() => onNavigateToGenealogy(strain.id)}
                                aria-label={t('strainsView.strainDetail.viewGenealogy')}
                                title={t('strainsView.strainDetail.viewGenealogyTooltip')}
                            >
                                <PhosphorIcons.TreeStructure className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <TypeIcon
                        className={`w-12 h-12 flex-shrink-0 ${typeClasses[strain.type] ?? typeClasses[StrainType.Hybrid]}`}
                    />
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold font-display text-primary-300">
                            {typeof strain.name === 'string' && strain.name.trim() !== ''
                                ? strain.name
                                : t('strainsView.unknownStrain')}
                        </h1>
                        <p className="text-slate-300">
                            {strain.type ?? StrainType.Hybrid} {typeDetails && `- ${typeDetails}`}
                        </p>
                    </div>
                </div>
            </header>

            <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="mt-6">
                {activeTab === 'overview' && <OverviewTab strain={strain} />}
                {activeTab === 'agronomics' && <AgronomicsTab strain={strain} />}
                {activeTab === 'profile' && <ProfileTab strain={strain} />}
                {activeTab === 'notes' && <NotesTab strain={strain} />}
                {activeTab === 'aiTips' && <StrainAiTips strain={strain} />}
                {activeTab === 'images' && <StrainImageGalleryTab strain={strain} />}
                {activeTab === 'availability' && <AvailabilityTab strain={strain} />}
            </div>
        </div>
    )
}
