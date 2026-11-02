import React, { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import type { Strain } from '@/types'
import { previewAxesFromStability, resinFromReportedThc } from './breedingArMetrics'
import type { BreedingLabState } from './useBreedingLab'

const BreedingArPreview = lazy(() =>
    import('../BreedingArPreview').then((module) => ({ default: module.BreedingArPreview })),
)

const aromaScore = (
    aromas: readonly string[] | undefined,
    terpenes: readonly string[] | undefined,
): number => Math.round((aromas?.length ?? 0) * 2 + (terpenes?.length ?? 0))

const previewLabel = (typed: string, fallback: string): string => typed.trim() || fallback

const ArLoading: React.FC = () => {
    const { t } = useTranslation()
    return (
        <div className="bg-slate-900/60 text-slate-400 p-8 text-center">
            {t('knowledgeView.breeding.arLoading')}
        </div>
    )
}

const EmptyArState: React.FC = () => {
    const { t } = useTranslation()
    return (
        <div className="text-center py-12 text-muted">
            <PhosphorIcons.Cube className="w-16 h-16 mx-auto mb-4" />
            <p className="text-sm font-semibold text-slate-300">
                {t('strainsView.breedingLab.arNoResult')}
            </p>
            <p className="text-xs text-muted mt-1">{t('strainsView.breedingLab.arNoResultHint')}</p>
        </div>
    )
}

const SeedStabilityPreview: React.FC<{ state: BreedingLabState }> = ({ state }) => {
    const { t } = useTranslation()
    const { seedResult, newStrainName, automatedGenetics } = state
    if (!seedResult) return null
    const axes = previewAxesFromStability(automatedGenetics?.stabilityScore)
    return (
        <>
            {axes.stabilityKnown ? null : (
                <p className="text-center py-4 text-sm text-slate-300">
                    {t('knowledgeView.breeding.stabilityScore')}: {t('common.unknown')}
                </p>
            )}
            <Suspense fallback={<ArLoading />}>
                <BreedingArPreview
                    label={previewLabel(newStrainName, seedResult.name)}
                    vigor={axes.vigor}
                    resin={resinFromReportedThc(seedResult.thc)}
                    aroma={aromaScore(seedResult.aromas, seedResult.dominantTerpenes)}
                    resistance={axes.resistance}
                />
            </Suspense>
        </>
    )
}

const finiteAmount = (value: number | undefined): string | undefined => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
    return `${value}%`
}

const OffspringFact: React.FC<{ label: string; value: string | undefined }> = ({
    label,
    value,
}) => {
    const { t } = useTranslation()
    return (
        <p>
            {label}: {value ?? t('common.unknown')}
        </p>
    )
}

const OffspringPreview: React.FC<{ offspring: Omit<Strain, 'id'> }> = ({ offspring }) => {
    const { t } = useTranslation()
    const weeks =
        typeof offspring.floweringTime === 'number' && Number.isFinite(offspring.floweringTime)
            ? `${offspring.floweringTime} ${t('common.units.weeks')}`
            : undefined
    return (
        <div className="text-center py-8 text-sm text-slate-300 space-y-1">
            <p className="text-lg font-bold text-slate-100">
                {offspring.name || t('common.unknown')}
            </p>
            <OffspringFact label={t('common.type')} value={offspring.type} />
            <OffspringFact label={t('strainsView.table.thc')} value={finiteAmount(offspring.thc)} />
            <OffspringFact label={t('strainsView.table.cbd')} value={finiteAmount(offspring.cbd)} />
            <OffspringFact label={t('strainsView.table.flowering')} value={weeks} />
        </div>
    )
}

const ArBody: React.FC<{ state: BreedingLabState }> = ({ state }) => {
    if (state.seedResult) return <SeedStabilityPreview state={state} />
    if (state.geneticsOffspring) return <OffspringPreview offspring={state.geneticsOffspring} />
    return <EmptyArState />
}

export const BreedingArTab: React.FC<{ state: BreedingLabState }> = ({ state }) => (
    <Card>
        <ArBody state={state} />
    </Card>
)
