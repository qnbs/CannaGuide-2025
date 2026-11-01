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

export const BreedingArTab: React.FC<{ state: BreedingLabState }> = ({ state }) => {
    const { t } = useTranslation()
    const { seedResult, newStrainName, automatedGenetics, geneticsOffspring } = state
    const stability = stabilityAxes(automatedGenetics?.stabilityScore)

    return (
        <Card>
            {seedResult ? (
                <Suspense
                    fallback={
                        <div className="bg-slate-900/60 text-slate-400 p-8 text-center">
                            {t('knowledgeView.breeding.arLoading')}
                        </div>
                    }
                >
                    {stability ? (
                        <BreedingArPreview
                            label={newStrainName.trim() || seedResult.name}
                            vigor={stability.vigor}
                            resin={Math.round(seedResult.thc / 2)}
                            aroma={Math.round(
                                (seedResult.aromas?.length ?? 0) * 2 +
                                    (seedResult.dominantTerpenes?.length ?? 0),
                            )}
                            resistance={stability.resistance}
                        />
                    ) : (
                        <p className="text-center py-12 text-sm text-slate-300">
                            {t('common.unknown')}
                        </p>
                    )}
                </Suspense>
            ) : geneticsOffspring ? (
                <Suspense
                    fallback={
                        <div className="bg-slate-900/60 text-slate-400 p-8 text-center">
                            {t('knowledgeView.breeding.arLoading')}
                        </div>
                    }
                >
                    <BreedingArPreview
                        label={getSafeText(geneticsOffspring.name, 'Offspring')}
                        vigor={6}
                        resin={Math.round(getSafeNumericValue(geneticsOffspring.thc, 0) / 2)}
                        aroma={Math.round(
                            (geneticsOffspring.aromas?.length ?? 0) * 2 +
                                (geneticsOffspring.dominantTerpenes?.length ?? 0),
                        )}
                        resistance={5}
                    />
                </Suspense>
            ) : (
                <div className="text-center py-12 text-muted">
                    <PhosphorIcons.Cube className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-sm font-semibold text-slate-300">
                        {t('strainsView.breedingLab.arNoResult')}
                    </p>
                    <p className="text-xs text-muted mt-1">
                        {t('strainsView.breedingLab.arNoResultHint')}
                    </p>
                </div>
            )}
        </Card>
    )
}
