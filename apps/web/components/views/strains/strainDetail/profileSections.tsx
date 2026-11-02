import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import type {
    CannabinoidProfile,
    ChemovarProfile,
    FlavonoidProfile,
    Strain,
    TerpeneName,
    TerpeneProfile,
} from '@/types'
import { InfoSection } from '@/components/common/InfoSection'
import { AttributeDisplay } from '@/components/common/AttributeDisplay'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { analyzeEntourage } from '@/services/terpeneService'
import { TERPENE_DATABASE } from '@/data/terpeneDatabase'
import { FLAVONOID_DATABASE } from '@/data/flavonoidDatabase'
import { Tag } from './strainDetailShared'
import { FlavonoidEntry } from './FlavonoidEntry'

const CHEMOVAR_LABEL_KEYS: Record<string, string> = {
    'Type I': 'strainsView.strainDetail.chemovar.typeI',
    'Type II': 'strainsView.strainDetail.chemovar.typeII',
    'Type III': 'strainsView.strainDetail.chemovar.typeIII',
    'Type IV': 'strainsView.strainDetail.chemovar.typeIV',
    'Type V': 'strainsView.strainDetail.chemovar.typeV',
}

const OVERALL_LABEL_KEYS: Record<string, string> = {
    sedating: 'strainsView.strainDetail.chemovar.sedating',
    balanced: 'strainsView.strainDetail.chemovar.balanced',
    energizing: 'strainsView.strainDetail.chemovar.energizing',
}

const SUBCLASS_CLASS: Record<string, string> = {
    cannflavin: 'bg-amber-900/40 text-amber-300',
    flavone: 'bg-purple-900/40 text-purple-300',
    flavonol: 'bg-emerald-900/40 text-emerald-300',
    flavanonol: 'bg-blue-900/40 text-blue-300',
    catechin: 'bg-rose-900/40 text-rose-300',
}

const labeled = (keyMap: Record<string, string>, value: string, t: TFunction): string => {
    const key = keyMap[value]
    return key ? t(key) : value
}

const stringList = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const NameTags: React.FC<{ names: string[]; prefix: string }> = ({ names, prefix }) => {
    const { t } = useTranslation()
    return (
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
            {names.map((name) => (
                <Tag key={name}>{t(`${prefix}.${name}`, { defaultValue: name })}</Tag>
            ))}
        </div>
    )
}

export const AromaProfileSection: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    return (
        <InfoSection title={t('strainsView.strainDetail.aromaProfile')}>
            <div className="space-y-4">
                <AttributeDisplay
                    label={t('strainsView.strainModal.aromas')}
                    value={<NameTags names={stringList(strain.aromas)} prefix="common.aromas" />}
                />
                <AttributeDisplay
                    label={t('strainsView.strainModal.dominantTerpenes')}
                    value={
                        <NameTags
                            names={stringList(strain.dominantTerpenes)}
                            prefix="common.terpenes"
                        />
                    }
                />
            </div>
        </InfoSection>
    )
}

const sortedTerpenes = (profile: TerpeneProfile | undefined): [TerpeneName, number][] => {
    if (!profile) return []
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return (Object.entries(profile) as [TerpeneName, number][])
        .filter(([, value]) => value >= 0.01)
        .sort((left, right) => right[1] - left[1])
}

const TerpeneReference: React.FC<{ name: TerpeneName }> = ({ name }) => {
    const { t } = useTranslation()
    const ref = TERPENE_DATABASE[name]
    if (!ref) return null
    return (
        <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1 pl-1">
            <span>
                {t('strainsView.strainDetail.terpeneClass')}: {ref.class}
            </span>
            <span>
                {t('strainsView.strainDetail.chemovar.boilingPoint')}:{' '}
                {t('strainsView.strainDetail.terpeneBoilingPoint', { temp: ref.boilingPointC })}
            </span>
            {ref.alsoFoundIn.length > 0 ? (
                <span>
                    {t('strainsView.strainDetail.terpeneAlsoFoundIn')}:{' '}
                    {ref.alsoFoundIn.slice(0, 3).join(', ')}
                </span>
            ) : null}
        </div>
    )
}

const TerpeneRow: React.FC<{ name: TerpeneName; percent: number }> = ({ name, percent }) => {
    const { t } = useTranslation()
    const ref = TERPENE_DATABASE[name]
    const barWidth = Math.min((percent / 2.0) * 100, 100)
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">
                    {t(`common.terpenes.${name}`, { defaultValue: name })}
                </span>
                <span className="text-sm text-primary-300 font-mono">{percent.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                    className="bg-primary-500 rounded-full h-2 transition-all"
                    style={{ width: `${barWidth}%` }}
                />
            </div>
            {ref ? <TerpeneReference name={name} /> : null}
        </div>
    )
}

export const TerpeneDetailSection: React.FC<{ profile: TerpeneProfile | undefined }> = ({
    profile,
}) => {
    const { t } = useTranslation()
    const rows = sortedTerpenes(profile)
    if (rows.length === 0) return null
    return (
        <InfoSection title={t('strainsView.strainDetail.terpeneDetails')}>
            <div className="space-y-3">
                {rows.map(([name, percent]) => (
                    <TerpeneRow key={name} name={name} percent={percent} />
                ))}
            </div>
        </InfoSection>
    )
}

const flavonoidReference = (name: string) =>
    Object.entries(FLAVONOID_DATABASE).find(([key]) => key === name)?.[1]

const exclusiveFlavonoids = (profile: FlavonoidProfile): [string, number][] =>
    (Object.entries(profile) as [string, number][]).filter(
        ([name]) => flavonoidReference(name)?.cannabisExclusive,
    )

const ExclusiveFlavonoidCard: React.FC<{ name: string; value: number }> = ({ name, value }) => {
    const ref = flavonoidReference(name)
    return (
        <div className="bg-slate-800/60 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm font-medium text-amber-300">{name}</span>
            </div>
            <div className="text-lg font-mono text-slate-200">{value.toFixed(3)}%</div>
            {ref ? (
                <div className="text-xs text-muted mt-1">
                    {ref.formula} -- {ref.molecularWeight} g/mol
                </div>
            ) : null}
        </div>
    )
}

const ExclusiveFlavonoids: React.FC<{ profile: FlavonoidProfile }> = ({ profile }) => {
    const { t } = useTranslation()
    const exclusives = exclusiveFlavonoids(profile)
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
                {exclusives.map(([name, value]) => (
                    <ExclusiveFlavonoidCard key={name} name={name} value={value} />
                ))}
            </div>
            <div className="mt-2 text-xs text-muted italic">
                {t('strainsView.flavonoids.cannflavinNote')}
            </div>
        </div>
    )
}

const rankedFlavonoids = (profile: FlavonoidProfile): [string, number][] =>
    (Object.entries(profile) as [string, number][])
        .filter(([, value]) => value > 0)
        .sort((left, right) => right[1] - left[1])

const FlavonoidBar: React.FC<{ name: string; value: number }> = ({ name, value }) => {
    const { t } = useTranslation()
    const ref = flavonoidReference(name)
    return (
        <FlavonoidEntry
            name={name}
            val={value}
            barWidth={Math.min((value / 0.1) * 100, 100)}
            ref_={ref}
            isExclusive={ref?.cannabisExclusive ?? false}
            t={t}
        />
    )
}

const FlavonoidSubclassLegend: React.FC = () => {
    const { t } = useTranslation()
    const subclasses = ['cannflavin', 'flavone', 'flavonol', 'flavanonol', 'catechin'] as const
    return (
        <div className="mt-4 pt-3 border-t border-slate-700/50">
            <div className="text-xs font-semibold text-slate-400 mb-2">
                {t('strainsView.flavonoids.subclassLegend')}
            </div>
            <div className="flex flex-wrap gap-2">
                {subclasses.map((subclass) => (
                    <span
                        key={subclass}
                        className={`text-xs px-2 py-0.5 rounded-full ${SUBCLASS_CLASS[subclass]}`}
                    >
                        {t(`strainsView.flavonoids.subclass.${subclass}`)}
                    </span>
                ))}
            </div>
        </div>
    )
}

export const FlavonoidProfileSection: React.FC<{ profile: FlavonoidProfile | undefined }> = ({
    profile,
}) => {
    const { t } = useTranslation()
    if (!profile || Object.keys(profile).length === 0) return null
    return (
        <InfoSection
            title={t('strainsView.strainDetail.flavonoidSection')}
            icon={<PhosphorIcons.Leafy className="w-5 h-5 text-amber-400" />}
        >
            <p className="text-xs text-slate-400 mb-4">
                {t('strainsView.flavonoids.sectionDescription')}
            </p>
            <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 text-xs bg-slate-700/80 text-amber-300 px-2 py-0.5 rounded-full">
                    <PhosphorIcons.Info className="w-3 h-3" />
                    {t('strainsView.flavonoids.estimated')}
                </span>
                <span className="text-xs text-muted">
                    {t('strainsView.flavonoids.estimatedHint')}
                </span>
            </div>
            <ExclusiveFlavonoids profile={profile} />
            <div className="space-y-3">
                {rankedFlavonoids(profile).map(([name, value]) => (
                    <FlavonoidBar key={name} name={name} value={value} />
                ))}
            </div>
            <FlavonoidSubclassLegend />
        </InfoSection>
    )
}

const ratioText = (ratio: number | undefined, unknownLabel: string): string => {
    if (ratio === Number.POSITIVE_INFINITY) return 'Infinity:1'
    if (ratio === undefined || !Number.isFinite(ratio)) return unknownLabel
    return `${ratio.toFixed(1)}:1`
}

export const ChemovarSection: React.FC<{ profile: ChemovarProfile | undefined }> = ({
    profile,
}) => {
    const { t } = useTranslation()
    if (!profile) return null
    return (
        <InfoSection title={t('strainsView.strainDetail.chemovarSection')}>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">
                        {t('strainsView.strainDetail.chemovar.type')}
                    </div>
                    <div className="text-sm font-semibold text-primary-300 mt-1">
                        {labeled(CHEMOVAR_LABEL_KEYS, profile.chemovarType, t)}
                    </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">
                        {t('strainsView.strainDetail.chemovar.thcCbdRatio')}
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                        {ratioText(profile.thcCbdRatio, t('common.unknown'))}
                    </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">
                        {t('strainsView.strainDetail.chemovar.totalCannabinoids')}
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                        {profile.totalCannabinoidPercent.toFixed(1)}%
                    </div>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">
                        {t('strainsView.strainDetail.chemovar.totalTerpenes')}
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mt-1">
                        {profile.totalTerpenePercent.toFixed(2)}%
                    </div>
                </div>
            </div>
            {profile.predictedEffects.length > 0 ? (
                <div className="mt-3">
                    <div className="text-xs text-slate-400 mb-2">
                        {t('strainsView.strainDetail.chemovar.predictedEffects')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {profile.predictedEffects.map((effect) => (
                            <Tag key={effect}>{effect}</Tag>
                        ))}
                    </div>
                </div>
            ) : null}
        </InfoSection>
    )
}

const SynergyList: React.FC<{ synergies: string[] }> = ({ synergies }) => {
    const { t } = useTranslation()
    if (synergies.length === 0) {
        return (
            <p className="text-sm text-muted italic">{t('strainsView.strainDetail.noSynergies')}</p>
        )
    }
    return (
        <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">
                {t('strainsView.strainDetail.chemovar.synergies')}
            </div>
            {synergies.map((synergy) => (
                <div
                    key={synergy}
                    className="bg-slate-800 rounded-lg p-3 text-sm text-slate-300 flex items-start gap-2"
                >
                    <PhosphorIcons.Sparkle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>{synergy}</span>
                </div>
            ))}
        </div>
    )
}

export const EntourageSection: React.FC<{
    terpeneProfile: TerpeneProfile | undefined
    cannabinoidProfile: CannabinoidProfile | undefined
}> = ({ terpeneProfile, cannabinoidProfile }) => {
    const { t } = useTranslation()
    const entourage = useMemo(() => {
        if (!terpeneProfile || !cannabinoidProfile) return null
        return analyzeEntourage(terpeneProfile, cannabinoidProfile)
    }, [terpeneProfile, cannabinoidProfile])
    if (!entourage) return null
    return (
        <InfoSection title={t('strainsView.strainDetail.entourageSection')}>
            <p className="text-xs text-slate-400 mb-3">
                {t('strainsView.strainDetail.entourageDescription')}
            </p>
            <div className="space-y-3">
                <AttributeDisplay
                    label={t('strainsView.strainDetail.overallCharacter')}
                    value={<Tag>{labeled(OVERALL_LABEL_KEYS, entourage.overallProfile, t)}</Tag>}
                />
                <SynergyList synergies={entourage.synergies} />
            </div>
        </InfoSection>
    )
}
