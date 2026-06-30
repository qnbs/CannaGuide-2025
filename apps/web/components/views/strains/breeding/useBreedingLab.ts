import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain } from '@/types'
import { crossStrains } from '@/utils/breedingUtils'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { selectCollectedSeeds, selectBreedingSlots } from '@/stores/selectors'
import { setParentA, setParentB, clearBreedingSlots } from '@/stores/slices/breedingSlice'
import { addUserStrainWithValidation } from '@/stores/slices/userStrainsSlice'
import { workerBus } from '@/services/workerBus'
import { createStrainObject } from '@/services/strainFactory'
import { compareText } from '../compareText'
import {
    GENERATIONS,
    getSafeText,
    type Generation,
    type Trait,
    type TraitKey,
} from './genetics'

export type LabTab = 'genetics' | 'seeds' | 'ar'

type Phenotype = { vigor: number; resin: number; aroma: number; resistance: number }

type AutomatedGenetics = {
    thc: number
    cbd: number
    floweringWeeks: number
    stabilityScore: number
} | null

/**
 * Encapsulates all Breeding Lab state, derived data and handlers so the view
 * layer (tab components) stays presentational.
 */
export function useBreedingLab(allStrains: Strain[]) {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

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

    const [geneticsParentAId, setGeneticsParentAId] = useState('')
    const [geneticsParentBId, setGeneticsParentBId] = useState('')
    const [generation, setGeneration] = useState<Generation>('F1')
    const [geneticsOffspring, setGeneticsOffspring] = useState<Omit<Strain, 'id'> | null>(null)
    const [hasCrossed, setHasCrossed] = useState(false)

    // --- Seeds tab state ---
    const collectedSeeds = useAppSelector(selectCollectedSeeds)
    const { parentA: seedParentA_id, parentB: seedParentB_id } = useAppSelector(selectBreedingSlots)
    const [isBreeding, setIsBreeding] = useState(false)
    const [seedResult, setSeedResult] = useState<Omit<Strain, 'id'> | null>(null)
    const [newStrainName, setNewStrainName] = useState('')
    const [phenoA, setPhenoA] = useState<Phenotype>({ vigor: 6, resin: 6, aroma: 6, resistance: 6 })
    const [phenoB, setPhenoB] = useState<Phenotype>({ vigor: 6, resin: 6, aroma: 6, resistance: 6 })
    const [automatedGenetics, setAutomatedGenetics] = useState<AutomatedGenetics>(null)

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
        () => (seedA ? (allStrains.find((s) => s.id === seedA.strainId) ?? null) : null),
        [allStrains, seedA],
    )
    const seedParentB = useMemo(
        () => (seedB ? (allStrains.find((s) => s.id === seedB.strainId) ?? null) : null),
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
            new Worker(new URL('../../../../workers/genealogy.worker.ts', import.meta.url), {
                type: 'module',
            }),
        )

        let cancelled = false
        workerBus
            .dispatch<{ result: AutomatedGenetics }>(workerName, 'OFFSPRING_PROFILE', {
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

    const clearSeedParentA = useCallback(() => dispatch(setParentA(null)), [dispatch])
    const clearSeedParentB = useCallback(() => dispatch(setParentB(null)), [dispatch])

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

    return {
        // genetics
        traitDefinitions,
        generationDescriptions,
        strainOptions,
        geneticsParentAId,
        setGeneticsParentAId,
        geneticsParentBId,
        setGeneticsParentBId,
        generation,
        geneticsOffspring,
        hasCrossed,
        geneticsParentA,
        geneticsParentB,
        geneticsReady,
        handleGeneticsCross,
        handleNextGen,
        localizeType,
        localizeDifficulty,
        localizeYield,
        localizeHeight,
        // seeds
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
    }
}

export type BreedingLabState = ReturnType<typeof useBreedingLab>
