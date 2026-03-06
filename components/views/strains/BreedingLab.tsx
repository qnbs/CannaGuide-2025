/**
 * Advanced Breeding Lab
 * - Punnett Square for 3 di-allelic traits (THC level, phenotype, autoflowering)
 * - Predicted F1 offspring profile via crossStrains()
 * - Generation tracker P → F1 → F2 → F3 → IBL
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Strain } from '@/types';
import { StrainType } from '@/types';
import { crossStrains } from '@/utils/breedingUtils';
import { Card } from '@/components/common/Card';
import { Select } from '@/components/ui/form';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { SativaIcon, IndicaIcon, HybridIcon } from '@/components/icons/StrainTypeIcons';

// ---------------------------------------------------------------------------
// Genotype helpers
// ---------------------------------------------------------------------------

/** Two alleles for a single di-allelic locus */
type Allele = '0' | '1'; // 0 = recessive, 1 = dominant
type Genotype = [Allele, Allele];

interface Trait {
    label: string;
    dominant: string;
    recessive: string;
    dominantSymbol: string;
    recessiveSymbol: string;
}

const TRAITS: Record<string, Trait> = {
    thc: {
        label: 'THC Level',
        dominant: 'High THC (≥18 %)',
        recessive: 'Low THC (<18 %)',
        dominantSymbol: 'H',
        recessiveSymbol: 'h',
    },
    phenotype: {
        label: 'Phenotype',
        dominant: 'Indica',
        recessive: 'Sativa',
        dominantSymbol: 'I',
        recessiveSymbol: 'i',
    },
    autoflowering: {
        label: 'Autoflowering',
        dominant: 'Photoperiod',
        recessive: 'Autoflowering',
        dominantSymbol: 'A',
        recessiveSymbol: 'a',
    },
};

/** Infer a simplified genotype from strain properties (homozygous assumption for known traits). */
function inferGenotype(strain: Strain, traitKey: string): Genotype {
    switch (traitKey) {
        case 'thc':
            return strain.thc >= 18 ? ['1', '1'] : ['0', '0'];
        case 'phenotype':
            if (strain.type === StrainType.Indica) return ['1', '1'];
            if (strain.type === StrainType.Sativa) return ['0', '0'];
            // Hybrid → heterozygous
            return ['1', '0'];
        case 'autoflowering':
            return strain.floweringType === 'Autoflower' ? ['0', '0'] : ['1', '1'];
        default:
            return ['1', '0'];
    }
}

function genotypeLabel(g: Genotype, t: Trait): string {
    const [a, b] = g;
    const sym = (x: Allele) => (x === '1' ? t.dominantSymbol : t.recessiveSymbol);
    return `${sym(a)}${sym(b)}`;
}

function phenotypeLabel(g: Genotype, t: Trait): string {
    const [a, b] = g;
    return a === '1' || b === '1' ? t.dominant : t.recessive;
}

/** 2×2 Punnett Square for one trait */
function buildPunnettSquare(parentA: Genotype, parentB: Genotype): Genotype[][] {
    const gamA: Allele[] = [parentA[0], parentA[1]];
    const gamB: Allele[] = [parentB[0], parentB[1]];
    return gamA.map(a => gamB.map(b => [a, b] as Genotype));
}

interface PunnettResult {
    outcomeLabel: string;
    count: number;
    percentage: number;
    isDominantPhenotype: boolean;
}

function summarisePunnett(grid: Genotype[][], traitDef: Trait): PunnettResult[] {
    const flat = grid.flat();
    const map = new Map<string, { count: number; genotype: Genotype }>();
    flat.forEach(g => {
        const label = genotypeLabel(g, traitDef);
        const existing = map.get(label);
        if (existing) existing.count++;
        else map.set(label, { count: 1, genotype: g });
    });
    return Array.from(map.entries()).map(([label, { count, genotype }]) => ({
        outcomeLabel: `${label} – ${phenotypeLabel(genotype, traitDef)}`,
        count,
        percentage: (count / flat.length) * 100,
        isDominantPhenotype: genotype[0] === '1' || genotype[1] === '1',
    }));
}

// ---------------------------------------------------------------------------
// Generation tracker
// ---------------------------------------------------------------------------

type Generation = 'P' | 'F1' | 'F2' | 'F3' | 'IBL';
const GENERATIONS: Generation[] = ['P', 'F1', 'F2', 'F3', 'IBL'];
const GEN_DESCRIPTIONS: Record<Generation, string> = {
    P:   'Parental generation – original parent strains',
    F1:  'First filial – all offspring identical (max. heterozygosity)',
    F2:  'Second filial – significant phenotype variation (25% recessive appear)',
    F3:  'Third filial – beginning to stabilise, select desired phenotypes',
    IBL: 'Inbred line – near-fully homozygous, stable true-breeding cultivar',
};

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

const PunnettGrid: React.FC<{
    parentA: Genotype;
    parentB: Genotype;
    traitKey: string;
    traitDef: Trait;
}> = ({ parentA, parentB, traitDef }) => {
    const grid = useMemo(() => buildPunnettSquare(parentA, parentB), [parentA, parentB]);
    const results = useMemo(() => summarisePunnett(grid, traitDef), [grid, traitDef]);
    const gamA: Allele[] = [parentA[0], parentA[1]];
    const gamB: Allele[] = [parentB[0], parentB[1]];
    const sym = (x: Allele) => (x === '1' ? traitDef.dominantSymbol : traitDef.recessiveSymbol);

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
                {gamB.map((g, i) => (
                    <div key={i} className="text-center font-bold text-primary-300">{sym(g)}</div>
                ))}
                {/* Data rows */}
                {gamA.map((ga, ri) => (
                    <React.Fragment key={ri}>
                        <div className="text-center font-bold text-primary-300 pr-1">{sym(ga)}</div>
                        {gamB.map((gb, ci) => {
                            const combo: Genotype = [ga, gb];
                            const isDom = combo[0] === '1' || combo[1] === '1';
                            return (
                                <div
                                    key={ci}
                                    className={`flex items-center justify-center rounded w-8 h-8 border text-xs font-bold transition-colors
                                        ${isDom
                                            ? 'bg-primary-900/50 border-primary-600 text-primary-200'
                                            : 'bg-slate-700/50 border-slate-600 text-slate-300'}`}
                                >
                                    {sym(ga)}{sym(gb)}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
            {/* Results */}
            <div className="flex flex-wrap gap-2 mt-1">
                {results.map(r => (
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
    );
};

const TypeIcon: React.FC<{ type: StrainType }> = ({ type }) => {
    const cls = 'w-4 h-4 flex-shrink-0';
    if (type === StrainType.Indica) return <IndicaIcon className={cls} />;
    if (type === StrainType.Sativa) return <SativaIcon className={cls} />;
    return <HybridIcon className={cls} />;
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface BreedingLabProps {
    allStrains: Strain[];
}

export const BreedingLab: React.FC<BreedingLabProps> = ({ allStrains }) => {
    const { t } = useTranslation();

    const [parentAId, setParentAId] = useState<string>('');
    const [parentBId, setParentBId] = useState<string>('');
    const [generation, setGeneration] = useState<Generation>('F1');
    const [offspring, setOffspring] = useState<Omit<Strain, 'id'> | null>(null);
    const [hasCrossed, setHasCrossed] = useState(false);

    const sortedStrains = useMemo(() =>
        [...allStrains].sort((a, b) => a.name.localeCompare(b.name)), [allStrains]);

    const strainOptions = useMemo(() => [
        { value: '', label: '— Select strain —' },
        ...sortedStrains.map(s => ({ value: s.id, label: s.name })),
    ], [sortedStrains]);

    const parentA = useMemo(() => allStrains.find(s => s.id === parentAId) ?? null, [allStrains, parentAId]);
    const parentB = useMemo(() => allStrains.find(s => s.id === parentBId) ?? null, [allStrains, parentBId]);

    const handleCross = useCallback(() => {
        if (!parentA || !parentB) return;
        setOffspring(crossStrains(parentA, parentB));
        setHasCrossed(true);
        setGeneration('F1');
    }, [parentA, parentB]);

    const handleNextGen = useCallback(() => {
        setGeneration(prev => {
            const idx = GENERATIONS.indexOf(prev);
            return idx < GENERATIONS.length - 1 ? GENERATIONS[idx + 1] : prev;
        });
    }, []);

    const ready = parentA !== null && parentB !== null && parentA.id !== parentB.id;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <Card>
                <div className="flex items-center gap-3 mb-2">
                    <PhosphorIcons.Flask className="w-7 h-7 text-primary-400" />
                    <h3 className="text-xl font-bold font-display text-primary-400">
                        {t('strainsView.breedingLab.title', { defaultValue: 'Breeding Lab' })}
                    </h3>
                </div>
                <p className="text-sm text-slate-400">
                    {t('strainsView.breedingLab.description', {
                        defaultValue:
                            'Select two parent strains to simulate Punnett Square genetics and predict F1 offspring traits.',
                    })}
                </p>
            </Card>

            {/* Parent selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                        {t('strainsView.breedingLab.parentA', { defaultValue: 'Parent A (♀)' })}
                    </p>
                    <Select
                        value={parentAId}
                        onChange={e => setParentAId(String(e.target.value))}
                        options={strainOptions}
                    />
                    {parentA && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                            <TypeIcon type={parentA.type} />
                            <span className="font-semibold">{parentA.name}</span>
                            <span className="text-slate-500">·</span>
                            <span className="text-primary-300">THC {parentA.thc.toFixed(1)}%</span>
                        </div>
                    )}
                </Card>
                <Card>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                        {t('strainsView.breedingLab.parentB', { defaultValue: 'Parent B (♂)' })}
                    </p>
                    <Select
                        value={parentBId}
                        onChange={e => setParentBId(String(e.target.value))}
                        options={strainOptions}
                    />
                    {parentB && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                            <TypeIcon type={parentB.type} />
                            <span className="font-semibold">{parentB.name}</span>
                            <span className="text-slate-500">·</span>
                            <span className="text-primary-300">THC {parentB.thc.toFixed(1)}%</span>
                        </div>
                    )}
                </Card>
            </div>

            {/* Cross button */}
            <div className="flex justify-center">
                <Button
                    onClick={handleCross}
                    disabled={!ready}
                    variant="primary"
                    className="px-8"
                >
                    <PhosphorIcons.ArrowRight className="w-5 h-5 mr-2" />
                    {t('strainsView.breedingLab.cross', { defaultValue: 'Cross Strains' })}
                </Button>
            </div>

            {/* Punnett Squares (shown once parents are selected, before cross) */}
            {parentA && parentB && parentA.id !== parentB.id && (
                <Card>
                    <h3 className="font-bold text-slate-200 mb-4">
                        {t('strainsView.breedingLab.punnettSquares', { defaultValue: 'Punnett Squares' })}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {Object.entries(TRAITS).map(([key, traitDef]) => (
                            <PunnettGrid
                                key={key}
                                parentA={inferGenotype(parentA, key)}
                                parentB={inferGenotype(parentB, key)}
                                traitKey={key}
                                traitDef={traitDef}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {/* Offspring prediction + generation tracker */}
            {hasCrossed && offspring && (
                <>
                    {/* Generation tracker */}
                    <Card>
                        <h3 className="font-bold text-slate-200 mb-3">
                            {t('strainsView.breedingLab.generationTracker', { defaultValue: 'Generation Tracker' })}
                        </h3>
                        <div className="flex items-center gap-1 flex-wrap mb-3">
                            {GENERATIONS.map((gen, i) => {
                                const currentIdx = GENERATIONS.indexOf(generation);
                                const isActive = gen === generation;
                                const isPast = i < currentIdx;
                                return (
                                    <React.Fragment key={gen}>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                                                isActive
                                                    ? 'bg-primary-600 text-white ring-2 ring-primary-400'
                                                    : isPast
                                                    ? 'bg-slate-600 text-slate-300'
                                                    : 'bg-slate-800 text-slate-500'
                                            }`}
                                        >
                                            {gen}
                                        </span>
                                        {i < GENERATIONS.length - 1 && (
                                            <PhosphorIcons.ArrowRight
                                                className={`w-3 h-3 ${isPast ? 'text-slate-400' : 'text-slate-600'}`}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-400 italic">{GEN_DESCRIPTIONS[generation]}</p>
                        {generation !== 'IBL' && (
                            <Button variant="secondary" size="sm" className="mt-3" onClick={handleNextGen}>
                                <PhosphorIcons.ArrowRight className="w-4 h-4 mr-1" />
                                {t('strainsView.breedingLab.advanceGeneration', { defaultValue: 'Advance to next generation' })}
                            </Button>
                        )}
                        {generation === 'IBL' && (
                            <p className="mt-3 text-xs font-semibold text-green-400">
                                ✓ {t('strainsView.breedingLab.iblReached', { defaultValue: 'Inbred line stabilised. True-breeding cultivar.' })}
                            </p>
                        )}
                    </Card>

                    {/* Predicted offspring card */}
                    <Card>
                        <h3 className="font-bold text-slate-200 mb-4">
                            {t('strainsView.breedingLab.predictedOffspring', {
                                defaultValue: 'Predicted F1 Offspring',
                            })}
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
                            {[
                                { label: 'Name', value: offspring.name },
                                { label: 'Type', value: offspring.type },
                                { label: 'THC', value: `${offspring.thc?.toFixed(1)}%` },
                                { label: 'CBD', value: `${offspring.cbd?.toFixed(1)}%` },
                                { label: 'Flowering', value: `${Math.round(offspring.floweringTime ?? 63)} days` },
                                { label: 'Height', value: offspring.agronomic?.height ?? '–' },
                                { label: 'Yield', value: offspring.agronomic?.yield ?? '–' },
                                { label: 'Difficulty', value: offspring.agronomic?.difficulty ?? '–' },
                            ].map(item => (
                                <div key={item.label} className="bg-slate-800/60 rounded-lg p-2 ring-1 ring-white/10">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                                    <p className="font-semibold text-slate-100 mt-0.5 truncate" title={String(item.value)}>
                                        {item.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                        {offspring.dominantTerpenes && offspring.dominantTerpenes.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                                {offspring.dominantTerpenes.map(t => (
                                    <span key={t} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
};
