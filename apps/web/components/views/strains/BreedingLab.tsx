/**
 * Unified Breeding Lab -- consolidates Strains BreedingLab + Knowledge BreedingView
 *
 * Three internal tabs:
 *   1. Genetics -- Punnett Squares for 3 di-allelic traits + generation tracker (P->F1->IBL)
 *   2. Seeds   -- Seed collection, phenotype tracking, worker-based genetics, save results
 *   3. AR      -- 3D/AR preview of offspring
 */

import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain, Seed } from '@/types'
import { StrainType } from '@/types'
import { crossStrains, strainTypeInfo } from '@/utils/breedingUtils'
import { Card } from '@/components/common/Card'
import { Select, Input } from '@/components/ui/form'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { selectCollectedSeeds, selectBreedingSlots } from '@/stores/selectors'
import { setParentA, setParentB, clearBreedingSlots } from '@/stores/slices/breedingSlice'
import { addUserStrainWithValidation } from '@/stores/slices/userStrainsSlice'
import { workerBus } from '@/services/workerBus'
import { createStrainObject } from '@/services/strainFactory'
import { compareText } from './compareText'

const BreedingArPreview = lazy(() =>
    import('./BreedingArPreview').then((module) => ({ default: module.BreedingArPreview })),
)

// ---------------------------------------------------------------------------
// Genotype helpers
// ---------------------------------------------------------------------------

/** Two alleles for a single di-allelic locus */
type Allele = '0' | '1' // 0 = recessive, 1 = dominant
type Genotype = [Allele, Allele]

interface Trait {
    label: string
    dominant: string
    recessive: string
    dominantSymbol: string
    recessiveSymbol: string
}

type TraitKey = 'thc' | 'phenotype' | 'autoflowering'

/** Infer a simplified genotype from strain properties (homozygous assumption for known traits). */
function inferGenotype(strain: Strain, traitKey: string): Genotype {
    const safeThc = typeof strain.thc === 'number' && Number.isFinite(strain.thc) ? strain.thc : 0
    switch (traitKey) {
        case 'thc':
            return safeThc >= 18 ? ['1', '1'] : ['0', '0']
        case 'phenotype':
            if (strain.type === StrainType.Indica) return ['1', '1']
            if (strain.type === StrainType.Sativa) return ['0', '0']
            // Hybrid → heterozygous
            return ['1', '0']
        case 'autoflowering':
            return strain.floweringType === 'Autoflower' ? ['0', '0'] : ['1', '1']
        default:
            return ['1', '0']
    }
}

function genotypeLabel(g: Genotype, t: Trait): string {
    const sym = (x: Allele) => (x === '1' ? t.dominantSymbol : t.recessiveSymbol)
    return `${sym(g[0])}${sym(g[1])}`
}

function phenotypeLabel(g: Genotype, t: Trait): string {
    return g[0] === '1' || g[1] === '1' ? t.dominant : t.recessive
}

/** 2×2 Punnett Square for one trait */
function buildPunnettSquare(parentA: Genotype, parentB: Genotype): Genotype[][] {
    const gamA: Allele[] = [parentA[0], parentA[1]]
    const gamB: Allele[] = [parentB[0], parentB[1]]
    return gamA.map((a) => gamB.map((b) => [a, b] as Genotype))
}

interface PunnettResult {
    outcomeLabel: string
    count: number
    percentage: number
    isDominantPhenotype: boolean
}

function summarisePunnett(grid: Genotype[][], traitDef: Trait): PunnettResult[] {
    const flat = grid.flat()
    const map = new Map<string, { count: number; genotype: Genotype }>()
    flat.forEach((g) => {
        const label = genotypeLabel(g, traitDef)
        const existing = map.get(label)
        if (existing) existing.count++
        else map.set(label, { count: 1, genotype: g })
    })
    return Array.from(map.entries()).map(([label, { count, genotype }]) => ({
        outcomeLabel: `${label} -- ${phenotypeLabel(genotype, traitDef)}`,
        count,
        percentage: (count / flat.length) * 100,
        isDominantPhenotype: genotype[0] === '1' || genotype[1] === '1',
    }))
}

// ---------------------------------------------------------------------------
// Generation tracker
// ---------------------------------------------------------------------------

type Generation = 'P' | 'F1' | 'F2' | 'F3' | 'IBL'
const GENERATIONS: Generation[] = ['P', 'F1', 'F2', 'F3', 'IBL']

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

const PunnettGrid: React.FC<{
    parentA: Genotype
    parentB: Genotype
    traitKey: string
    traitDef: Trait
}> = ({ parentA, parentB, traitDef }) => {
    const grid = useMemo(() => buildPunnettSquare(parentA, parentB), [parentA, parentB])
    const results = useMemo(() => summarisePunnett(grid, traitDef), [grid, traitDef])
    const getAlleleAt = (genotype: Genotype, idx: number): Allele => genotype[idx] ?? '0'
    const gamA: [Allele, Allele] = [getAlleleAt(parentA, 0), getAlleleAt(parentA, 1)]
    const gamB: [Allele, Allele] = [getAlleleAt(parentB, 0), getAlleleAt(parentB, 1)]
    const gamASlots = [
        { id: 'row-a', allele: gamA[0] },
        { id: 'row-b', allele: gamA[1] },
    ] as const
    const gamBSlots = [
        { id: 'col-a', allele: gamB[0] },
        { id: 'col-b', allele: gamB[1] },
    ] as const
    const sym = (x: Allele) => (x === '1' ? traitDef.dominantSymbol : traitDef.recessiveSymbol)

    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 text-sm">{traitDef.label}</h4>
            {/* Grid */}
            <div
                className="inline-grid gap-1 text-xs font-mono"
                style={{ gridTemplateColumns: 'auto repeat(2, 2rem)' }}
            >
                {/* Header row */}
                <div />
                {gamBSlots.map(({ id, allele }) => (
                    <div key={id} className="text-center font-bold text-primary-300">
                        {sym(allele)}
                    </div>
                ))}
                {/* Data rows */}
                {gamASlots.map(({ id, allele: ga }) => (
                    <React.Fragment key={id}>
                        <div className="text-center font-bold text-primary-300 pr-1">{sym(ga)}</div>
                        {gamBSlots.map(({ id: colId, allele: gb }) => {
                            const combo: Genotype = [ga, gb]
                            const isDom = combo[0] === '1' || combo[1] === '1'
                            return (
                                <div
                                    key={`${id}-${colId}`}
                                    className={`flex items-center justify-center rounded w-8 h-8 border text-xs font-bold transition-colors
                                        ${
                                            isDom
                                                ? 'bg-primary-900/50 border-primary-600 text-primary-200'
                                                : 'bg-slate-700/50 border-slate-600 text-slate-300'
                                        }`}
                                >
                                    {sym(ga)}
                                    {sym(gb)}
                                </div>
                            )
                        })}
                    </React.Fragment>
                ))}
            </div>
            {/* Results */}
            <div className="flex flex-wrap gap-2 mt-1">
                {results.map((r) => (
                    <span
                        key={r.outcomeLabel}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                            r.isDominantPhenotype
                                ? 'bg-primary-900 text-primary-200 border border-primary-700'
                                : 'bg-slate-700 text-slate-300 border border-slate-600'
                        }`}
                    >
                        {r.count}/4 ({r.percentage.toFixed(0)}%) {r.outcomeLabel}
                    </span>
                ))}
            </div>
        </div>
    )
}

const TypeIcon: React.FC<{ type: StrainType }> = ({ type }) => {
    const cls = 'w-4 h-4 flex-shrink-0'
    if (type === StrainType.Indica) return <IndicaIcon className={cls} />
    if (type === StrainType.Sativa) return <SativaIcon className={cls} />
    return <HybridIcon className={cls} />
}

// ---------------------------------------------------------------------------
// Additional subcomponents for Seeds tab
// ---------------------------------------------------------------------------

const SeedCard: React.FC<{
    seed: Seed
    onClick: () => void
    isSelected?: boolean
    strain?: Strain | null
}> = ({ seed, onClick, isSelected, strain }) => {
    const { t } = useTranslation()
    const TypeInfo = strain ? strainTypeInfo[strain.type] : null
    const selectedStateClass = isSelected
        ? 'bg-primary-900/50 ring-2 ring-primary-500'
        : 'bg-slate-800 hover:bg-slate-700/50'
    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-2 rounded-lg transition-all ring-1 ring-inset ring-white/20 flex items-center gap-3 ${selectedStateClass}`}
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
                        size="icon"
                        variant="danger"
                        className="!absolute top-1 right-1"
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getSafeText = (value: unknown, fallback = ''): string =>
    typeof value === 'string' ? value : fallback
const getSafeNumericValue = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback
const getSafeStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

// ---------------------------------------------------------------------------
// Internal tab type
// ---------------------------------------------------------------------------

type LabTab = 'genetics' | 'seeds' | 'ar'

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface BreedingLabProps {
    allStrains: Strain[]
}

export const BreedingLab: React.FC<BreedingLabProps> = ({ allStrains }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const [activeTab, setActiveTab] = useState<LabTab>('genetics')

    // --- Genetics tab state ---
    const traitDefinitions = useMemo<Record<TraitKey, Trait>>(
        () => ({
            thc: {
                label: t('strainsView.breedingLab.traits.thc.label'),
                dominant: t('strainsView.breedingLab.traits.thc.dominant'),
                recessive: t('strainsView.breedingLab.traits.thc.recessive'),
                dominantSymbol: 'H',
                recessiveSymbol: 'h',
            },
            phenotype: {
                label: t('strainsView.breedingLab.traits.phenotype.label'),
                dominant: t('strainsView.breedingLab.traits.phenotype.dominant'),
                recessive: t('strainsView.breedingLab.traits.phenotype.recessive'),
                dominantSymbol: 'I',
                recessiveSymbol: 'i',
            },
            autoflowering: {
                label: t('strainsView.breedingLab.traits.autoflowering.label'),
                dominant: t('strainsView.breedingLab.traits.autoflowering.dominant'),
                recessive: t('strainsView.breedingLab.traits.autoflowering.recessive'),
                dominantSymbol: 'A',
                recessiveSymbol: 'a',
            },
        }),
        [t],
    )

    const generationDescriptions = useMemo<Record<Generation, string>>(
        () => ({
            P: t('strainsView.breedingLab.generations.P'),
            F1: t('strainsView.breedingLab.generations.F1'),
            F2: t('strainsView.breedingLab.generations.F2'),
            F3: t('strainsView.breedingLab.generations.F3'),
            IBL: t('strainsView.breedingLab.generations.IBL'),
        }),
        [t],
    )

    const [geneticsParentAId, setGeneticsParentAId] = useState<string>('')
    const [geneticsParentBId, setGeneticsParentBId] = useState<string>('')
    const [generation, setGeneration] = useState<Generation>('F1')
    const [geneticsOffspring, setGeneticsOffspring] = useState<Omit<Strain, 'id'> | null>(null)
    const [hasCrossed, setHasCrossed] = useState(false)

    // --- Seeds tab state ---
    const collectedSeeds = useAppSelector(selectCollectedSeeds)
    const { parentA: seedParentA_id, parentB: seedParentB_id } = useAppSelector(selectBreedingSlots)
    const [isBreeding, setIsBreeding] = useState(false)
    const [seedResult, setSeedResult] = useState<Omit<Strain, 'id'> | null>(null)
    const [newStrainName, setNewStrainName] = useState('')
    const [phenoA, setPhenoA] = useState({ vigor: 6, resin: 6, aroma: 6, resistance: 6 })
    const [phenoB, setPhenoB] = useState({ vigor: 6, resin: 6, aroma: 6, resistance: 6 })
    const [automatedGenetics, setAutomatedGenetics] = useState<{
        thc: number
        cbd: number
        floweringWeeks: number
        stabilityScore: number
    } | null>(null)

    const sortedStrains = useMemo(
        () =>
            allStrains
                .filter((strain): strain is Strain => Boolean(strain))
                .toSorted((a, b) => compareText(a.name, b.name)),
        [allStrains],
    )

    const strainOptions = useMemo(
        () => [
            { value: '', label: `-- ${t('strainsView.breedingLab.selectStrainPlaceholder')} --` },
            ...sortedStrains.map((s) => ({
                value: s.id,
                label: getSafeText(s.name, 'Unknown Strain'),
            })),
        ],
        [sortedStrains, t],
    )

    // Genetics parent lookups
    const geneticsParentA = useMemo(
        () => allStrains.find((s) => s.id === geneticsParentAId) ?? null,
        [allStrains, geneticsParentAId],
    )
    const geneticsParentB = useMemo(
        () => allStrains.find((s) => s.id === geneticsParentBId) ?? null,
        [allStrains, geneticsParentBId],
    )

    // Seeds parent lookups
    const seedA = useMemo(
        () => collectedSeeds.find((s) => s.id === seedParentA_id),
        [collectedSeeds, seedParentA_id],
    )
    const seedB = useMemo(
        () => collectedSeeds.find((s) => s.id === seedParentB_id),
        [collectedSeeds, seedParentB_id],
    )
    const seedParentA = useMemo(
        () => (seedA ? allStrains.find((s) => s.id === seedA.strainId) : null),
        [allStrains, seedA],
    )
    const seedParentB = useMemo(
        () => (seedB ? allStrains.find((s) => s.id === seedB.strainId) : null),
        [allStrains, seedB],
    )

    const localizeType = useCallback(
        (value: string | undefined) => {
            if (typeof value !== 'string' || value.trim() === '') return '--'
            return t(`strainsView.${value.toLowerCase()}`, { defaultValue: value })
        },
        [t],
    )

    const localizeDifficulty = useCallback(
        (value: string | undefined) => {
            if (typeof value !== 'string' || value.trim() === '') return '--'
            return t(`strainsView.difficulty.${value.toLowerCase()}`, { defaultValue: value })
        },
        [t],
    )

    const localizeYield = useCallback(
        (value: string | undefined) => {
            if (typeof value !== 'string' || value.trim() === '') return '--'
            return t(`strainsView.addStrainModal.yields.${value.toLowerCase()}`, {
                defaultValue: value,
            })
        },
        [t],
    )

    const localizeHeight = useCallback(
        (value: string | undefined) => {
            if (typeof value !== 'string' || value.trim() === '') return '--'
            return t(`strainsView.addStrainModal.heights.${value.toLowerCase()}`, {
                defaultValue: value,
            })
        },
        [t],
    )

    // Worker-based automated genetics for seeds tab
    useEffect(() => {
        if (!seedParentA || !seedParentB) {
            setAutomatedGenetics(null)
            return
        }

        const workerName = `genealogy-breeding-${crypto.randomUUID()}`
        workerBus.register(
            workerName,
            new Worker(new URL('../../../workers/genealogy.worker.ts', import.meta.url), {
                type: 'module',
            }),
        )

        let cancelled = false
        workerBus
            .dispatch<{ result: typeof automatedGenetics }>(workerName, 'OFFSPRING_PROFILE', {
                parentA: seedParentA,
                parentB: seedParentB,
                phenotypes: {
                    parentA: phenoA,
                    parentB: phenoB,
                },
            })
            .then((data) => {
                if (!cancelled) {
                    setAutomatedGenetics(data.result)
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.debug('[BreedingLab] worker error:', err)
                    setAutomatedGenetics(null)
                }
            })
            .finally(() => workerBus.unregister(workerName))

        return () => {
            cancelled = true
            workerBus.unregister(workerName)
        }
    }, [seedParentA, seedParentB, phenoA, phenoB])

    // --- Genetics handlers ---
    const handleGeneticsCross = useCallback(() => {
        if (!geneticsParentA || !geneticsParentB) return
        setGeneticsOffspring(crossStrains(geneticsParentA, geneticsParentB))
        setHasCrossed(true)
        setGeneration('F1')
    }, [geneticsParentA, geneticsParentB])

    const handleNextGen = useCallback(() => {
        setGeneration((prev) => {
            const idx = GENERATIONS.indexOf(prev)
            if (idx < GENERATIONS.length - 1) {
                return GENERATIONS[idx + 1] ?? prev
            }
            return prev
        })
    }, [])

    // --- Seeds handlers ---
    const handleSeedClick = useCallback(
        (seedId: string) => {
            if (!seedParentA_id) {
                dispatch(setParentA(seedId))
            } else if (!seedParentB_id && seedId !== seedParentA_id) {
                dispatch(setParentB(seedId))
            }
        },
        [dispatch, seedParentA_id, seedParentB_id],
    )

    const handleBreed = useCallback(() => {
        if (seedParentA && seedParentB) {
            setIsBreeding(true)
            setTimeout(() => {
                const crossResult = crossStrains(seedParentA, seedParentB)
                setSeedResult(crossResult)
                setNewStrainName(crossResult?.name ?? '')
                setIsBreeding(false)
            }, 1500)
        }
    }, [seedParentA, seedParentB])

    const handleSave = useCallback(() => {
        if (seedResult && newStrainName.trim()) {
            const finalStrain = createStrainObject({ ...seedResult, name: newStrainName.trim() })
            dispatch(addUserStrainWithValidation(finalStrain))
            setSeedResult(null)
            setNewStrainName('')
            dispatch(clearBreedingSlots())
        }
    }, [seedResult, newStrainName, dispatch])

    const handleReset = useCallback(() => {
        setSeedResult(null)
        setNewStrainName('')
        dispatch(clearBreedingSlots())
    }, [dispatch])

    const geneticsReady =
        geneticsParentA !== null &&
        geneticsParentB !== null &&
        geneticsParentA.id !== geneticsParentB.id
    const hasSelectedBothSeeds = seedParentA_id !== null && seedParentB_id !== null
    const hasSeedResult = seedResult !== null
    const canStartBreeding = hasSelectedBothSeeds && !hasSeedResult && !isBreeding
    const breedButtonLabel = isBreeding
        ? t('ai.generating')
        : t('knowledgeView.breeding.breedButton')

    // Tab configuration
    const tabs: Array<{ id: LabTab; label: string; icon: React.ReactNode }> = useMemo(
        () => [
            {
                id: 'genetics',
                label: t('strainsView.breedingLab.tabs.genetics'),
                icon: <PhosphorIcons.Flask className="w-5 h-5" />,
            },
            {
                id: 'seeds',
                label: t('strainsView.breedingLab.tabs.seeds'),
                icon: <PhosphorIcons.TestTube className="w-5 h-5" />,
            },
            {
                id: 'ar',
                label: t('strainsView.breedingLab.tabs.ar'),
                icon: <PhosphorIcons.Cube className="w-5 h-5" />,
            },
        ],
        [t],
    )

    const ready = geneticsReady

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <Card>
                <div className="flex items-center gap-3 mb-2">
                    <PhosphorIcons.Flask className="w-7 h-7 text-primary-400" />
                    <h3 className="text-xl font-bold font-display text-primary-400">
                        {t('strainsView.breedingLab.title')}
                    </h3>
                </div>
                <p className="text-sm text-slate-400">{t('strainsView.breedingLab.description')}</p>
            </Card>

            {/* Tab bar */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                            ${
                                activeTab === tab.id
                                    ? 'bg-primary-600 text-white shadow-lg ring-1 ring-primary-400'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        aria-current={activeTab === tab.id ? 'page' : undefined}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* =============== GENETICS TAB =============== */}
            {activeTab === 'genetics' && (
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
                                        THC {getSafeNumericValue(geneticsParentA.thc, 0).toFixed(1)}
                                        %
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
                                        THC {getSafeNumericValue(geneticsParentB.thc, 0).toFixed(1)}
                                        %
                                    </span>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Cross button */}
                    <div className="flex justify-center">
                        <Button
                            onClick={handleGeneticsCross}
                            disabled={!ready}
                            variant="primary"
                            className="px-8"
                        >
                            <PhosphorIcons.ArrowRight className="w-5 h-5 mr-2" />
                            {t('strainsView.breedingLab.cross')}
                        </Button>
                    </div>

                    {/* Punnett Squares */}
                    {geneticsParentA &&
                        geneticsParentB &&
                        geneticsParentA.id !== geneticsParentB.id && (
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
                                            badgeCls +=
                                                'bg-primary-600 text-white ring-2 ring-primary-400'
                                        } else if (isPast) {
                                            badgeCls += 'bg-slate-600 text-slate-300'
                                        } else {
                                            badgeCls += 'bg-slate-800 text-slate-500'
                                        }
                                        return (
                                            <React.Fragment key={gen}>
                                                <span className={badgeCls}>{gen}</span>
                                                {i < GENERATIONS.length - 1 && (
                                                    <PhosphorIcons.ArrowRight
                                                        className={arrowCls}
                                                    />
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
                                            value: getSafeText(
                                                geneticsOffspring.name,
                                                'Unknown Strain',
                                            ),
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
                                            value: localizeHeight(
                                                geneticsOffspring.agronomic?.height,
                                            ),
                                        },
                                        {
                                            label: t('strainsView.breedingLab.summary.yield'),
                                            value: localizeYield(
                                                geneticsOffspring.agronomic?.yield,
                                            ),
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
                                {getSafeStringArray(geneticsOffspring.dominantTerpenes).length >
                                    0 && (
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
            )}

            {/* =============== SEEDS TAB =============== */}
            {activeTab === 'seeds' && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1">
                            <h4 className="font-bold text-lg text-slate-200 mb-2">
                                {t('knowledgeView.breeding.collectedSeeds')} (
                                {collectedSeeds.length})
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
                                            isSelected={
                                                seed.id === seedParentA_id ||
                                                seed.id === seedParentB_id
                                            }
                                            strain={
                                                allStrains.find((s) => s.id === seed.strainId) ??
                                                null
                                            }
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
                                        {(['vigor', 'resin', 'aroma', 'resistance'] as const).map(
                                            (key) => (
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
                                                            [key]: Number(
                                                                (e.target as HTMLInputElement)
                                                                    .value,
                                                            ),
                                                        }))
                                                    }
                                                />
                                            ),
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-slate-300">
                                            {t('knowledgeView.breeding.parentB')}
                                        </p>
                                        {(['vigor', 'resin', 'aroma', 'resistance'] as const).map(
                                            (key) => (
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
                                                            [key]: Number(
                                                                (e.target as HTMLInputElement)
                                                                    .value,
                                                            ),
                                                        }))
                                                    }
                                                />
                                            ),
                                        )}
                                    </div>
                                </div>
                            </Card>

                            <Button
                                onClick={handleBreed}
                                disabled={!canStartBreeding}
                                className="w-full"
                            >
                                <PhosphorIcons.TestTube className="w-5 h-5 mr-2" />
                                {breedButtonLabel}
                            </Button>
                        </div>
                    </div>

                    {isBreeding && (
                        <AiLoadingIndicator
                            loadingMessage={t('knowledgeView.breeding.splicingGenes')}
                        />
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
                                        valA={`${getSafeNumericValue(seedParentA.thc, 0).toFixed(1)}%`}
                                        valB={`${getSafeNumericValue(seedParentB.thc, 0).toFixed(1)}%`}
                                        valChild={`~${getSafeNumericValue(seedResult.thc, 0).toFixed(1)}%`}
                                        icon={<PhosphorIcons.Lightning weight="fill" />}
                                    />
                                    <TraitComparison
                                        label={t('knowledgeView.breeding.flowering')}
                                        valA={`${getSafeNumericValue(seedParentA.floweringTime, 0)} w`}
                                        valB={`${getSafeNumericValue(seedParentB.floweringTime, 0)} w`}
                                        valChild={`~${getSafeNumericValue(seedResult.floweringTime, 0).toFixed(0)} w`}
                                        icon={<PhosphorIcons.ArrowClockwise />}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-slate-200 mb-2">
                                            {t('strainsView.addStrainModal.aromas')}
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
                                            {t('strainsView.addStrainModal.dominantTerpenes')}
                                        </h4>
                                        <div className="flex flex-wrap gap-1">
                                            {getSafeStringArray(seedResult.dominantTerpenes).map(
                                                (a) => (
                                                    <span
                                                        key={a}
                                                        className="bg-slate-700 text-xs px-2 py-0.5 rounded-full"
                                                    >
                                                        {a}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                    {automatedGenetics && (
                                        <div className="bg-slate-900/50 p-3 rounded-lg ring-1 ring-inset ring-white/20 text-sm text-slate-200 space-y-1">
                                            <p className="font-semibold text-primary-300">
                                                {t('knowledgeView.breeding.automatedGenetics')}
                                            </p>
                                            <p>
                                                THC: ~
                                                {getSafeNumericValue(
                                                    automatedGenetics.thc,
                                                    0,
                                                ).toFixed(1)}
                                                %
                                            </p>
                                            <p>
                                                CBD: ~
                                                {getSafeNumericValue(
                                                    automatedGenetics.cbd,
                                                    0,
                                                ).toFixed(1)}
                                                %
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
                            <div className="text-right mt-6">
                                <Button onClick={handleSave} disabled={!newStrainName.trim()} glow>
                                    <PhosphorIcons.PlusCircle className="w-5 h-5 mr-2" />
                                    {t('knowledgeView.breeding.saveStrain')}
                                </Button>
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* =============== AR TAB =============== */}
            {activeTab === 'ar' && (
                <Card>
                    {seedResult ? (
                        <Suspense
                            fallback={
                                <div className="bg-slate-900/60 text-slate-400 p-8 text-center">
                                    {t('knowledgeView.breeding.arLoading')}
                                </div>
                            }
                        >
                            <BreedingArPreview
                                label={newStrainName.trim() || seedResult.name}
                                vigor={Math.round((automatedGenetics?.stabilityScore ?? 60) / 10)}
                                resin={Math.round(seedResult.thc / 2)}
                                aroma={Math.round(
                                    (seedResult.aromas?.length ?? 0) * 2 +
                                        (seedResult.dominantTerpenes?.length ?? 0),
                                )}
                                resistance={Math.round(
                                    (automatedGenetics?.stabilityScore ?? 60) / 12,
                                )}
                            />
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
                                resin={Math.round(
                                    getSafeNumericValue(geneticsOffspring.thc, 0) / 2,
                                )}
                                aroma={Math.round(
                                    (geneticsOffspring.aromas?.length ?? 0) * 2 +
                                        (geneticsOffspring.dominantTerpenes?.length ?? 0),
                                )}
                                resistance={5}
                            />
                        </Suspense>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <PhosphorIcons.Cube className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-sm font-semibold text-slate-300">
                                {t('strainsView.breedingLab.arNoResult')}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {t('strainsView.breedingLab.arNoResultHint')}
                            </p>
                        </div>
                    )}
                </Card>
            )}
        </div>
    )
}

BreedingLab.displayName = 'BreedingLab'
