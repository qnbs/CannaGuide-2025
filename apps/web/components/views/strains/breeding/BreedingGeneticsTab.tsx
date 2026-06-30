import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Select } from '@/components/ui/form'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { PunnettGrid, TypeIcon } from './PunnettGrid'
import {
    GENERATIONS,
    inferGenotype,
    getSafeText,
    getSafeNumericValue,
    getSafeStringArray,
} from './genetics'
import type { BreedingLabState } from './useBreedingLab'

export const BreedingGeneticsTab: React.FC<{ state: BreedingLabState }> = ({ state }) => {
    const { t } = useTranslation()
    const {
        strainOptions,
        geneticsParentAId,
        setGeneticsParentAId,
        geneticsParentBId,
        setGeneticsParentBId,
        geneticsParentA,
        geneticsParentB,
        geneticsReady,
        handleGeneticsCross,
        traitDefinitions,
        hasCrossed,
        geneticsOffspring,
        generation,
        generationDescriptions,
        handleNextGen,
        localizeType,
        localizeHeight,
        localizeYield,
        localizeDifficulty,
    } = state

    return (
        <>
            {/* Parent selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                        {t('strainsView.breedingLab.parentA')}
                    </p>
                    <Select
                        value={geneticsParentAId}
                        onChange={(e) => setGeneticsParentAId(String(e.target.value))}
                        options={strainOptions}
                    />
                    {geneticsParentA && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                            <TypeIcon type={geneticsParentA.type} />
                            <span className="font-semibold">
                                {getSafeText(geneticsParentA.name, 'Unknown Strain')}
                            </span>
                            <span className="text-slate-500">|</span>
                            <span className="text-primary-300">
                                THC {getSafeNumericValue(geneticsParentA.thc, 0).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </Card>
                <Card>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                        {t('strainsView.breedingLab.parentB')}
                    </p>
                    <Select
                        value={geneticsParentBId}
                        onChange={(e) => setGeneticsParentBId(String(e.target.value))}
                        options={strainOptions}
                    />
                    {geneticsParentB && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                            <TypeIcon type={geneticsParentB.type} />
                            <span className="font-semibold">
                                {getSafeText(geneticsParentB.name, 'Unknown Strain')}
                            </span>
                            <span className="text-slate-500">|</span>
                            <span className="text-primary-300">
                                THC {getSafeNumericValue(geneticsParentB.thc, 0).toFixed(1)}%
                            </span>
                        </div>
                    )}
                </Card>
            </div>

            {/* Cross button */}
            <div className="flex justify-center">
                <Button
                    onClick={handleGeneticsCross}
                    disabled={!geneticsReady}
                    variant="primary"
                    className="px-8"
                >
                    <PhosphorIcons.ArrowRight className="w-5 h-5 mr-2" />
                    {t('strainsView.breedingLab.cross')}
                </Button>
            </div>

            {/* Punnett Squares */}
            {geneticsParentA && geneticsParentB && geneticsParentA.id !== geneticsParentB.id && (
                <Card>
                    <h3 className="font-bold text-slate-200 mb-4">
                        {t('strainsView.breedingLab.punnettSquares')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {Object.entries(traitDefinitions).map(([key, traitDef]) => (
                            <PunnettGrid
                                key={key}
                                parentA={inferGenotype(geneticsParentA, key)}
                                parentB={inferGenotype(geneticsParentB, key)}
                                traitKey={key}
                                traitDef={traitDef}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {/* Offspring prediction + generation tracker */}
            {hasCrossed && geneticsOffspring && (
                <>
                    <Card>
                        <h3 className="font-bold text-slate-200 mb-3">
                            {t('strainsView.breedingLab.generationTracker')}
                        </h3>
                        <div className="flex items-center gap-1 flex-wrap mb-3">
                            {GENERATIONS.map((gen, i) => {
                                const currentIdx = GENERATIONS.indexOf(generation)
                                const isActive = gen === generation
                                const isPast = i < currentIdx
                                const arrowCls = `w-3 h-3 ${isPast ? 'text-slate-400' : 'text-slate-600'}`
                                let badgeCls =
                                    'px-3 py-1 rounded-full text-xs font-bold transition-colors '
                                if (isActive) {
                                    badgeCls += 'bg-primary-600 text-white ring-2 ring-primary-400'
                                } else if (isPast) {
                                    badgeCls += 'bg-slate-600 text-slate-300'
                                } else {
                                    badgeCls += 'bg-slate-800 text-slate-500'
                                }
                                return (
                                    <React.Fragment key={gen}>
                                        <span className={badgeCls}>{gen}</span>
                                        {i < GENERATIONS.length - 1 && (
                                            <PhosphorIcons.ArrowRight className={arrowCls} />
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </div>
                        <p className="text-xs text-slate-400 italic">
                            {generationDescriptions[generation]}
                        </p>
                        {generation !== 'IBL' && (
                            <Button
                                variant="secondary"
                                size="sm"
                                className="mt-3"
                                onClick={handleNextGen}
                            >
                                <PhosphorIcons.ArrowRight className="w-4 h-4 mr-1" />
                                {t('strainsView.breedingLab.advanceGeneration')}
                            </Button>
                        )}
                        {generation === 'IBL' && (
                            <p className="mt-3 text-xs font-semibold text-green-400">
                                {t('strainsView.breedingLab.iblReached')}
                            </p>
                        )}
                    </Card>

                    <Card>
                        <h3 className="font-bold text-slate-200 mb-4">
                            {t('strainsView.breedingLab.predictedOffspring')}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
                            {[
                                {
                                    label: t('strainsView.breedingLab.summary.name'),
                                    value: getSafeText(geneticsOffspring.name, 'Unknown Strain'),
                                },
                                {
                                    label: t('strainsView.breedingLab.summary.type'),
                                    value: localizeType(geneticsOffspring.type),
                                },
                                {
                                    label: t('strainsView.breedingLab.summary.thc'),
                                    value: `${getSafeNumericValue(geneticsOffspring.thc, 0).toFixed(1)}%`,
                                },
                                {
                                    label: t('strainsView.breedingLab.summary.cbd'),
                                    value: `${getSafeNumericValue(geneticsOffspring.cbd, 0).toFixed(1)}%`,
                                },
                                {
                                    label: t('strainsView.breedingLab.summary.flowering'),
                                    value: `${Math.round(getSafeNumericValue(geneticsOffspring.floweringTime, 63))} ${t('common.days')}`,
                                },
                                {
                                    label: t('strainsView.breedingLab.summary.height'),
                                    value: localizeHeight(geneticsOffspring.agronomic?.height),
                                },
                                {
                                    label: t('strainsView.breedingLab.summary.yield'),
                                    value: localizeYield(geneticsOffspring.agronomic?.yield),
                                },
                                {
                                    label: t('strainsView.breedingLab.summary.difficulty'),
                                    value: localizeDifficulty(
                                        geneticsOffspring.agronomic?.difficulty,
                                    ),
                                },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    className="bg-slate-800/60 rounded-lg p-2 ring-1 ring-white/10"
                                >
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        {item.label}
                                    </p>
                                    <p
                                        className="font-semibold text-slate-100 mt-0.5 truncate"
                                        title={String(item.value)}
                                    >
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {getSafeStringArray(geneticsOffspring.dominantTerpenes).length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                                {getSafeStringArray(geneticsOffspring.dominantTerpenes).map(
                                    (terpene) => (
                                        <span
                                            key={terpene}
                                            className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full"
                                        >
                                            {t(`common.terpenes.${terpene}`, {
                                                defaultValue: terpene,
                                            })}
                                        </span>
                                    ),
                                )}
                            </div>
                        )}
                    </Card>
                </>
            )}
        </>
    )
}
