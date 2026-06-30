/**
 * Pure breeding/genetics helpers extracted from BreedingLab.
 *
 * Di-allelic Punnett-square model + simplified genotype inference. No React.
 */
import type { Strain } from '@/types'
import { StrainType } from '@/types'

/** Two alleles for a single di-allelic locus. 0 = recessive, 1 = dominant. */
export type Allele = '0' | '1'
export type Genotype = [Allele, Allele]

export interface Trait {
    label: string
    dominant: string
    recessive: string
    dominantSymbol: string
    recessiveSymbol: string
}

export type TraitKey = 'thc' | 'phenotype' | 'autoflowering'

export type Generation = 'P' | 'F1' | 'F2' | 'F3' | 'IBL'
export const GENERATIONS: Generation[] = ['P', 'F1', 'F2', 'F3', 'IBL']

/** Infer a simplified genotype from strain properties (homozygous assumption for known traits). */
export function inferGenotype(strain: Strain, traitKey: string): Genotype {
    const safeThc = typeof strain.thc === 'number' && Number.isFinite(strain.thc) ? strain.thc : 0
    switch (traitKey) {
        case 'thc':
            return safeThc >= 18 ? ['1', '1'] : ['0', '0']
        case 'phenotype':
            if (strain.type === StrainType.Indica) return ['1', '1']
            if (strain.type === StrainType.Sativa) return ['0', '0']
            // Hybrid -> heterozygous
            return ['1', '0']
        case 'autoflowering':
            return strain.floweringType === 'Autoflower' ? ['0', '0'] : ['1', '1']
        default:
            return ['1', '0']
    }
}

export function genotypeLabel(g: Genotype, t: Trait): string {
    const sym = (x: Allele) => (x === '1' ? t.dominantSymbol : t.recessiveSymbol)
    return `${sym(g[0])}${sym(g[1])}`
}

export function phenotypeLabel(g: Genotype, t: Trait): string {
    return g[0] === '1' || g[1] === '1' ? t.dominant : t.recessive
}

/** 2×2 Punnett Square for one trait */
export function buildPunnettSquare(parentA: Genotype, parentB: Genotype): Genotype[][] {
    const gamA: Allele[] = [parentA[0], parentA[1]]
    const gamB: Allele[] = [parentB[0], parentB[1]]
    return gamA.map((a) => gamB.map((b) => [a, b] as Genotype))
}

export interface PunnettResult {
    outcomeLabel: string
    count: number
    percentage: number
    isDominantPhenotype: boolean
}

export function summarisePunnett(grid: Genotype[][], traitDef: Trait): PunnettResult[] {
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
// Defensive value coercion (offspring objects can be partially populated)
// ---------------------------------------------------------------------------

export const getSafeText = (value: unknown, fallback = ''): string =>
    typeof value === 'string' ? value : fallback

export const getSafeNumericValue = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback

export const getSafeStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
