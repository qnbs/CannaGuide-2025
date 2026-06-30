import React, { useMemo } from 'react'
import { StrainType } from '@/types'
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons'
import {
    buildPunnettSquare,
    summarisePunnett,
    type Allele,
    type Genotype,
    type Trait,
} from './genetics'

export const PunnettGrid: React.FC<{
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

export const TypeIcon: React.FC<{ type: StrainType }> = ({ type }) => {
    const cls = 'w-4 h-4 flex-shrink-0'
    if (type === StrainType.Indica) return <IndicaIcon className={cls} />
    if (type === StrainType.Sativa) return <SativaIcon className={cls} />
    return <HybridIcon className={cls} />
}
