import React, { useMemo, useState, useEffect, lazy, Suspense } from 'react'
import { Card } from '@/components/common/Card'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { selectCollectedSeeds, selectBreedingSlots } from '@/stores/selectors'
import { Button } from '@/components/common/Button'
import { Seed, Strain } from '@/types'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { setParentA, setParentB, clearBreedingSlots } from '@/stores/slices/breedingSlice'
import { addUserStrainWithValidation } from '@/stores/slices/userStrainsSlice'
import { strainService } from '@/services/strainService'
import { Input } from '@/components/ui/form'
import { createStrainObject } from '@/services/strainFactory'
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator'
import { crossStrains, strainTypeInfo } from '@/utils/breedingUtils'
const BreedingArPreview = lazy(() =>
    import('./BreedingArPreview').then((module) => ({ default: module.BreedingArPreview })),
)

const SeedCard: React.FC<{
    seed: Seed
    onClick: () => void
    isSelected?: boolean
    strain?: Strain | null
}> = ({ seed, onClick, isSelected, strain }) => {
    const { t } = useTranslation()
    const TypeInfo = strain ? strainTypeInfo[strain.type] : null
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-2 rounded-lg transition-all ring-1 ring-inset ring-white/20 flex items-center gap-3 ${isSelected ? 'bg-primary-900/50 ring-2 ring-primary-500' : 'bg-slate-800 hover:bg-slate-700/50'}`}
        >
            {TypeInfo && (
                <div className={`w-6 h-6 flex-shrink-0 ${TypeInfo.color}`}>{TypeInfo.icon}</div>
            )}
            <div className="flex-grow min-w-0">
                <p className="font-bold truncate">{seed.strainName}</p>
                <p className="text-xs text-slate-400">
                    {t('common.quality')}: {(seed.quality * 100).toFixed(0)}%
                </p>
            </div>
        </button>
    )
}

const ParentSlot: React.FC<{
    title: string
    seed: Seed | undefined
    onClear: () => void
    allStrains: Strain[]
}> = ({ title, seed, onClear, allStrains }) => {
    const { t } = useTranslation()
    const parentStrain = seed ? allStrains.find((s) => s.id === seed.strainId) : null
    const TypeInfo = parentStrain ? strainTypeInfo[parentStrain.type] : null

    return (
        <Card className="flex flex-col items-center justify-center h-48 text-center relative bg-slate-800/30">
            <h4 className="absolute top-2 text-sm font-semibold text-slate-400">{title}</h4>
            {seed && parentStrain && TypeInfo ? (
                <>
                    <div className={`w-12 h-12 mb-2 ${TypeInfo.color}`}>{TypeInfo.icon}</div>
                    <p className="font-bold text-slate-100">{seed.strainName}</p>
                    <div className="text-xs text-slate-400 mt-1">
                        <p>
                            THC: {parentStrain.thc.toFixed(1)}% | CBD: {parentStrain.cbd.toFixed(1)}
                            %
                        </p>
                        <p>
                            {t('common.quality')}: {(seed.quality * 100).toFixed(0)}%
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="danger"
                        className="!absolute top-1 right-1 !p-1"
                        onClick={onClear}
                        aria-label={t('knowledgeView.breeding.clearParent', { title })}
                    >
                        <PhosphorIcons.X />
                    </Button>
                </>
            ) : (
                <div className="text-slate-500">
                    <PhosphorIcons.Drop className="w-12 h-12 mb-2" />
                    <p>{t('knowledgeView.breeding.selectSeed')}</p>
                </div>
            )}
        </Card>
    )
}

const TraitComparison: React.FC<{
    label: string
    valA: string
    valB: string
    valChild: string
    icon?: React.ReactNode
}> = ({ label, valA, valB, valChild, icon }) => (
    <div className="grid grid-cols-3 items-center text-center text-sm py-1 border-b border-slate-700/50 last:border-0">
        <span className="text-slate-300 font-mono">{valA}</span>
        <span className="font-bold text-slate-100 flex items-center justify-center gap-1.5">
            {icon}
            {label}
        </span>
        <span className="text-slate-300 font-mono">{valB}</span>
        <div className="col-span-3 text-2xl font-bold text-primary-300 mt-1">{valChild}</div>
    </div>
)

const getSafeNumericValue = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback
const getSafeStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const BreedingView: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const [allStrains, setAllStrains] = useState<Strain[]>([])
    const [isBreeding, setIsBreeding] = useState(false)
    const collectedSeeds = useAppSelector(selectCollectedSeeds)
    const { parentA: parentA_id, parentB: parentB_id } = useAppSelector(selectBreedingSlots)
    const [newStrainName, setNewStrainName] = useState('')
    const [result, setResult] = useState<Omit<Strain, 'id'> | null>(null)
    const [phenoA, setPhenoA] = useState({ vigor: 6, resin: 6, aroma: 6, resistance: 6 })
    const [phenoB, setPhenoB] = useState({ vigor: 6, resin: 6, aroma: 6, resistance: 6 })
    const [automatedGenetics, setAutomatedGenetics] = useState<{
        thc: number
        cbd: number
        floweringWeeks: number
        stabilityScore: number
        vigorScore: number
        resinScore: number
        aromaScore: number
        resistanceScore: number
    } | null>(null)

    useEffect(() => {
        strainService.getAllStrains().then(setAllStrains).catch(console.error)
    }, [])

    const seedA = useMemo(
        () => collectedSeeds.find((s) => s.id === parentA_id),
        [collectedSeeds, parentA_id],
    )
    const seedB = useMemo(
        () => collectedSeeds.find((s) => s.id === parentB_id),
        [collectedSeeds, parentB_id],
    )
    const parentA = useMemo(
        () => (seedA ? allStrains.find((s) => s.id === seedA.strainId) : null),
        [allStrains, seedA],
    )
    const parentB = useMemo(
        () => (seedB ? allStrains.find((s) => s.id === seedB.strainId) : null),
        [allStrains, seedB],
    )
    useEffect(() => {
        if (!parentA || !parentB) {
            setAutomatedGenetics(null)
            return
        }

        const worker = new Worker(
            new URL('../../../workers/genealogy.worker.ts', import.meta.url),
            { type: 'module' },
        )

        worker.onmessage = (
            event: MessageEvent<
                | { type: 'OFFSPRING_PROFILE_RESULT'; result: typeof automatedGenetics }
                | { type: 'ERROR'; message: string }
            >,
        ) => {
            if (event.data.type === 'OFFSPRING_PROFILE_RESULT') {
                setAutomatedGenetics(event.data.result)
            } else {
                console.error('[BreedingView] worker error:', event.data.message)
                setAutomatedGenetics(null)
            }
        }

        worker.postMessage({
            type: 'OFFSPRING_PROFILE',
            parentA,
            parentB,
            phenotypes: {
                parentA: phenoA,
                parentB: phenoB,
            },
        })

        return () => worker.terminate()
    }, [parentA, parentB, phenoA, phenoB])

    const handleSeedClick = (seedId: string) => {
        if (!parentA_id) {
            dispatch(setParentA(seedId))
        } else if (!parentB_id && seedId !== parentA_id) {
            dispatch(setParentB(seedId))
        }
    }

    const handleBreed = () => {
        if (parentA && parentB) {
            setIsBreeding(true)
            setTimeout(() => {
                const crossResult = crossStrains(parentA, parentB)
                setResult(crossResult)
                setNewStrainName(crossResult?.name || '')
                setIsBreeding(false)
            }, 1500) // Simulate processing time for animation
        }
    }

    const handleSave = () => {
        if (result && newStrainName.trim()) {
            const finalStrain = createStrainObject({ ...result, name: newStrainName.trim() })
            dispatch(addUserStrainWithValidation(finalStrain))
            setResult(null)
            setNewStrainName('')
            dispatch(clearBreedingSlots())
        }
    }

    const handleReset = () => {
        setResult(null)
        setNewStrainName('')
        dispatch(clearBreedingSlots())
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-2">
                    {t('knowledgeView.breeding.title')}
                </h3>
                <p className="text-sm text-slate-400">{t('knowledgeView.breeding.description')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h4 className="font-bold text-lg text-slate-200 mb-2">
                        {t('knowledgeView.breeding.collectedSeeds')} ({collectedSeeds.length})
                    </h4>
                    {collectedSeeds.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
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
                                    isSelected={seed.id === parentA_id || seed.id === parentB_id}
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
                            onClear={() => dispatch(setParentA(null))}
                            allStrains={allStrains}
                        />
                        <PhosphorIcons.Plus className="w-8 h-8 text-slate-500 mx-auto" />
                        <ParentSlot
                            title={t('knowledgeView.breeding.parentB')}
                            seed={seedB}
                            onClear={() => dispatch(setParentB(null))}
                            allStrains={allStrains}
                        />
                    </div>
                    <Card className="bg-slate-800/40 !p-4">
                        <h4 className="font-bold text-slate-100 mb-3">
                            {t('knowledgeView.breeding.phenoTracking')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-slate-300">
                                    {t('knowledgeView.breeding.parentA')}
                                </p>
                                <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    label={t('knowledgeView.breeding.vigor')}
                                    value={phenoA.vigor}
                                    onChange={(e) =>
                                        setPhenoA((prev) => ({
                                            ...prev,
                                            vigor: Number(e.target.value),
                                        }))
                                    }
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    label={t('knowledgeView.breeding.resin')}
                                    value={phenoA.resin}
                                    onChange={(e) =>
                                        setPhenoA((prev) => ({
                                            ...prev,
                                            resin: Number(e.target.value),
                                        }))
                                    }
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    label={t('knowledgeView.breeding.aroma')}
                                    value={phenoA.aroma}
                                    onChange={(e) =>
                                        setPhenoA((prev) => ({
                                            ...prev,
                                            aroma: Number(e.target.value),
                                        }))
                                    }
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    label={t('knowledgeView.breeding.diseaseResistance')}
                                    value={phenoA.resistance}
                                    onChange={(e) =>
                                        setPhenoA((prev) => ({
                                            ...prev,
                                            resistance: Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-slate-300">
                                    {t('knowledgeView.breeding.parentB')}
                                </p>
                                <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    label={t('knowledgeView.breeding.vigor')}
                                    value={phenoB.vigor}
                                    onChange={(e) =>
                                        setPhenoB((prev) => ({
                                            ...prev,
                                            vigor: Number(e.target.value),
                                        }))
                                    }
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    label={t('knowledgeView.breeding.resin')}
                                    value={phenoB.resin}
                                    onChange={(e) =>
                                        setPhenoB((prev) => ({
                                            ...prev,
                                            resin: Number(e.target.value),
                                        }))
                                    }
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    label={t('knowledgeView.breeding.aroma')}
                                    value={phenoB.aroma}
                                    onChange={(e) =>
                                        setPhenoB((prev) => ({
                                            ...prev,
                                            aroma: Number(e.target.value),
                                        }))
                                    }
                                />
                                <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    label={t('knowledgeView.breeding.diseaseResistance')}
                                    value={phenoB.resistance}
                                    onChange={(e) =>
                                        setPhenoB((prev) => ({
                                            ...prev,
                                            resistance: Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </Card>
                    <Button
                        onClick={handleBreed}
                        disabled={!parentA_id || !parentB_id || !!result || isBreeding}
                        className="w-full"
                    >
                        <PhosphorIcons.TestTube className="w-5 h-5 mr-2" />
                        {isBreeding ? t('ai.generating') : t('knowledgeView.breeding.breedButton')}
                    </Button>
                </div>
            </div>

            {isBreeding && (
                <AiLoadingIndicator loadingMessage={t('knowledgeView.breeding.splicingGenes')} />
            )}

            {result && parentA && parentB && (
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
                                onChange={(e) => setNewStrainName(e.target.value)}
                                placeholder={t('knowledgeView.breeding.newStrainName')}
                            />
                            <TraitComparison
                                label="THC"
                                valA={`${getSafeNumericValue(parentA.thc, 0).toFixed(1)}%`}
                                valB={`${getSafeNumericValue(parentB.thc, 0).toFixed(1)}%`}
                                valChild={`~${getSafeNumericValue(result.thc, 0).toFixed(1)}%`}
                                icon={<PhosphorIcons.Lightning weight="fill" />}
                            />
                            <TraitComparison
                                label={t('knowledgeView.breeding.flowering')}
                                valA={`${getSafeNumericValue(parentA.floweringTime, 0)} w`}
                                valB={`${getSafeNumericValue(parentB.floweringTime, 0)} w`}
                                valChild={`~${getSafeNumericValue(result.floweringTime, 0).toFixed(0)} w`}
                                icon={<PhosphorIcons.ArrowClockwise />}
                            />
                        </div>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-slate-200 mb-2">
                                    {t('strainsView.addStrainModal.aromas')}
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {getSafeStringArray(result.aromas).map((a) => (
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
                                    {t('strainsView.addStrainModal.dominantTerpenes')}
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                    {getSafeStringArray(result.dominantTerpenes).map((a) => (
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
                                        {getSafeNumericValue(automatedGenetics.thc, 0).toFixed(1)}%
                                    </p>
                                    <p>
                                        CBD: ~
                                        {getSafeNumericValue(automatedGenetics.cbd, 0).toFixed(1)}%
                                    </p>
                                    <p>
                                        {t('knowledgeView.breeding.flowering')}: ~
                                        {getSafeNumericValue(
                                            automatedGenetics.floweringWeeks,
                                            0,
                                        ).toFixed(1)}{' '}
                                        {t('common.units.weeks')}
                                    </p>
                                    <p>
                                        {t('knowledgeView.breeding.stabilityScore')}:{' '}
                                        {getSafeNumericValue(
                                            automatedGenetics.stabilityScore,
                                            0,
                                        ).toFixed(0)}{' '}
                                        / 100
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-6">
                        <Suspense
                            fallback={
                                <Card className="bg-slate-900/60 text-slate-400">
                                    {t('knowledgeView.breeding.arLoading')}
                                </Card>
                            }
                        >
                            <BreedingArPreview
                                label={newStrainName.trim() || result.name}
                                vigor={Math.round((automatedGenetics?.stabilityScore ?? 60) / 10)}
                                resin={Math.round(result.thc / 2)}
                                aroma={Math.round(
                                    (result.aromas?.length ?? 0) * 2 +
                                        (result.dominantTerpenes?.length ?? 0),
                                )}
                                resistance={Math.round(
                                    (automatedGenetics?.stabilityScore ?? 60) / 12,
                                )}
                            />
                        </Suspense>
                    </div>
                    <div className="text-right mt-6">
                        <Button onClick={handleSave} disabled={!newStrainName.trim()} glow>
                            <PhosphorIcons.PlusCircle className="w-5 h-5 mr-2" />
                            {t('knowledgeView.breeding.saveStrain')}
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    )
}

export default BreedingView
