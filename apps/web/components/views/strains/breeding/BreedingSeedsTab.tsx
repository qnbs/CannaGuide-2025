import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain } from '@/types'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/ui/form'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator'
import { SeedCard, ParentSlot, TraitComparison } from './SeedComponents'
import { getSafeStringArray } from './genetics'
import type { BreedingLabState } from './useBreedingLab'

export const BreedingSeedsTab: React.FC<{ state: BreedingLabState; allStrains: Strain[] }> = ({
    state,
    allStrains,
}) => {
    const { t } = useTranslation()
    const reported = (value: unknown, digits?: number, suffix = ''): string => {
        if (typeof value !== 'number' || !Number.isFinite(value)) return t('common.unknown')
        const text = digits === undefined ? String(value) : value.toFixed(digits)
        return `${text}${suffix}`
    }
    const {
        collectedSeeds,
        seedParentA_id,
        seedParentB_id,
        seedA,
        seedB,
        seedParentA,
        seedParentB,
        isBreeding,
        seedResult,
        newStrainName,
        setNewStrainName,
        phenoA,
        setPhenoA,
        phenoB,
        setPhenoB,
        automatedGenetics,
        canStartBreeding,
        breedButtonLabel,
        handleSeedClick,
        clearSeedParentA,
        clearSeedParentB,
        handleBreed,
        handleSave,
        handleReset,
    } = state

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h4 className="font-bold text-lg text-slate-200 mb-2">
                        {t('knowledgeView.breeding.collectedSeeds')} ({collectedSeeds.length})
                    </h4>
                    {collectedSeeds.length === 0 ? (
                        <div className="text-center py-8 text-muted">
                            <PhosphorIcons.TestTube className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                            <p className="text-sm font-semibold text-slate-300">
                                {t('knowledgeView.breeding.noSeeds')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {collectedSeeds.map((seed) => (
                                <SeedCard
                                    key={seed.id}
                                    seed={seed}
                                    onClick={() => handleSeedClick(seed.id)}
                                    isSelected={
                                        seed.id === seedParentA_id || seed.id === seedParentB_id
                                    }
                                    strain={allStrains.find((s) => s.id === seed.strainId) ?? null}
                                />
                            ))}
                        </div>
                    )}
                </Card>

                <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
                        <ParentSlot
                            title={t('knowledgeView.breeding.parentA')}
                            seed={seedA}
                            onClear={clearSeedParentA}
                            allStrains={allStrains}
                        />
                        <PhosphorIcons.Plus className="w-8 h-8 text-muted mx-auto" />
                        <ParentSlot
                            title={t('knowledgeView.breeding.parentB')}
                            seed={seedB}
                            onClear={clearSeedParentB}
                            allStrains={allStrains}
                        />
                    </div>

                    {/* Phenotype tracking */}
                    <Card className="bg-slate-800/40 !p-4">
                        <h4 className="font-bold text-slate-100 mb-3">
                            {t('knowledgeView.breeding.phenoTracking')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-slate-300">
                                    {t('knowledgeView.breeding.parentA')}
                                </p>
                                {(['vigor', 'resin', 'aroma', 'resistance'] as const).map((key) => (
                                    <Input
                                        key={`phenoA-${key}`}
                                        type="number"
                                        min={0}
                                        max={10}
                                        label={t(
                                            `knowledgeView.breeding.${key === 'resistance' ? 'diseaseResistance' : key}`,
                                        )}
                                        value={phenoA[key]}
                                        onChange={(e) =>
                                            setPhenoA((prev) => ({
                                                ...prev,
                                                [key]: Number((e.target as HTMLInputElement).value),
                                            }))
                                        }
                                    />
                                ))}
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-slate-300">
                                    {t('knowledgeView.breeding.parentB')}
                                </p>
                                {(['vigor', 'resin', 'aroma', 'resistance'] as const).map((key) => (
                                    <Input
                                        key={`phenoB-${key}`}
                                        type="number"
                                        min={0}
                                        max={10}
                                        label={t(
                                            `knowledgeView.breeding.${key === 'resistance' ? 'diseaseResistance' : key}`,
                                        )}
                                        value={phenoB[key]}
                                        onChange={(e) =>
                                            setPhenoB((prev) => ({
                                                ...prev,
                                                [key]: Number((e.target as HTMLInputElement).value),
                                            }))
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    </Card>

                    <Button onClick={handleBreed} disabled={!canStartBreeding} className="w-full">
                        <PhosphorIcons.TestTube className="w-5 h-5 mr-2" />
                        {breedButtonLabel}
                    </Button>
                </div>
            </div>

            {isBreeding && (
                <AiLoadingIndicator loadingMessage={t('knowledgeView.breeding.splicingGenes')} />
            )}

            {seedResult && seedParentA && seedParentB && (
                <Card className="animate-fade-in bg-slate-800/50">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-primary-400">
                            {t('knowledgeView.breeding.resultsTitle')}
                        </h3>
                        <Button variant="secondary" size="sm" onClick={handleReset}>
                            <PhosphorIcons.ArrowClockwise className="w-4 h-4 mr-1.5" />{' '}
                            {t('common.startOver')}
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div className="space-y-4">
                            <Input
                                type="text"
                                value={newStrainName}
                                onChange={(e) =>
                                    setNewStrainName((e.target as HTMLInputElement).value)
                                }
                                placeholder={t('knowledgeView.breeding.newStrainName')}
                            />
                            <TraitComparison
                                label="THC"
                                valA={reported(seedParentA.thc, 1, '%')}
                                valB={reported(seedParentB.thc, 1, '%')}
                                valChild={`~${reported(seedResult.thc, 1, '%')}`}
                                icon={<PhosphorIcons.Lightning weight="fill" />}
                            />
                            <TraitComparison
                                label={t('knowledgeView.breeding.flowering')}
                                valA={reported(seedParentA.floweringTime, undefined, ' w')}
                                valB={reported(seedParentB.floweringTime, undefined, ' w')}
                                valChild={`~${reported(seedResult.floweringTime, 0, ' w')}`}
                                icon={<PhosphorIcons.ArrowClockwise />}
                            />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-slate-200 mb-2">
                                    {t('strainsView.strainModal.aromas')}
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {getSafeStringArray(seedResult.aromas).map((a) => (
                                        <span
                                            key={a}
                                            className="bg-slate-700 text-xs px-2 py-0.5 rounded-full"
                                        >
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-200 mb-2">
                                    {t('strainsView.strainModal.dominantTerpenes')}
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {getSafeStringArray(seedResult.dominantTerpenes).map((a) => (
                                        <span
                                            key={a}
                                            className="bg-slate-700 text-xs px-2 py-0.5 rounded-full"
                                        >
                                            {a}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {automatedGenetics && (
                                <div className="bg-slate-900/50 p-3 rounded-lg ring-1 ring-inset ring-white/20 text-sm text-slate-200 space-y-1">
                                    <p className="font-semibold text-primary-300">
                                        {t('knowledgeView.breeding.automatedGenetics')}
                                    </p>
                                    <p>
                                        THC: ~
                                        {typeof automatedGenetics.thc === 'number'
                                            ? `${automatedGenetics.thc.toFixed(1)}%`
                                            : t('common.unknown')}
                                    </p>
                                    <p>
                                        CBD: ~
                                        {typeof automatedGenetics.cbd === 'number'
                                            ? `${automatedGenetics.cbd.toFixed(1)}%`
                                            : t('common.unknown')}
                                    </p>
                                    <p>
                                        {t('knowledgeView.breeding.flowering')}: ~
                                        {typeof automatedGenetics.floweringWeeks === 'number'
                                            ? `${automatedGenetics.floweringWeeks.toFixed(1)} ${t('common.units.weeks')}`
                                            : t('common.unknown')}
                                    </p>
                                    <p>
                                        {t('knowledgeView.breeding.stabilityScore')}:{' '}
                                        {typeof automatedGenetics.stabilityScore === 'number'
                                            ? `${automatedGenetics.stabilityScore.toFixed(0)} / 100`
                                            : t('common.unknown')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-right mt-6">
                        <Button onClick={handleSave} disabled={!newStrainName.trim()} glow>
                            <PhosphorIcons.PlusCircle className="w-5 h-5 mr-2" />
                            {t('knowledgeView.breeding.saveStrain')}
                        </Button>
                    </div>
                </Card>
            )}
        </>
    )
}
