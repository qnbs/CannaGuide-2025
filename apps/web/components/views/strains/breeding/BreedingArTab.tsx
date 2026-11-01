import React, { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { getSafeText, getSafeNumericValue } from './genetics'
import type { BreedingLabState } from './useBreedingLab'

const BreedingArPreview = lazy(() =>
    import('../BreedingArPreview').then((module) => ({ default: module.BreedingArPreview })),
)

const stabilityAxes = (
    score: number | null | undefined,
): { vigor: number; resistance: number } | null => {
    if (typeof score !== 'number' || !Number.isFinite(score)) return null
    return {
        vigor: Math.round(score / 10),
        resistance: Math.round(score / 12),
    }
}

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
    const stability = stabilityAxes(automatedGenetics?.stabilityScore)
    if (!stability) {
        return <p className="text-center py-12 text-sm text-slate-300">{t('common.unknown')}</p>
    }
    return (
        <Suspense fallback={<ArLoading />}>
            <BreedingArPreview
                label={previewLabel(newStrainName, seedResult.name)}
                vigor={stability.vigor}
                resin={Math.round(seedResult.thc / 2)}
                aroma={aromaScore(seedResult.aromas, seedResult.dominantTerpenes)}
                resistance={stability.resistance}
            />
        </Suspense>
    )
}

const OffspringPreview: React.FC<{
    offspring: NonNullable<BreedingLabState['geneticsOffspring']>
}> = ({ offspring }) => (
    <Suspense fallback={<ArLoading />}>
        <BreedingArPreview
            label={getSafeText(offspring.name, 'Offspring')}
            vigor={6}
            resin={Math.round(getSafeNumericValue(offspring.thc, 0) / 2)}
            aroma={aromaScore(offspring.aromas, offspring.dominantTerpenes)}
            resistance={5}
        />
    </Suspense>
)

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
