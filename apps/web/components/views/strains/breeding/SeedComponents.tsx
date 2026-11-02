import React from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain, Seed } from '@/types'
import { strainTypeInfo } from '@/utils/breedingUtils'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

export const SeedCard: React.FC<{
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

const ParentTypeMark: React.FC<{
    info: { color: string; icon: React.ReactNode } | null | undefined
}> = ({ info }) => (
    <div className={`w-12 h-12 mb-2 ${info ? info.color : 'text-slate-400'}`}>
        {info ? info.icon : <PhosphorIcons.Question className="w-full h-full" />}
    </div>
)

const percentText = (value: number, unknown: string): string =>
    Number.isFinite(value) ? `${value.toFixed(1)}%` : unknown

const selectedParent = (
    seed: Seed | undefined,
    strains: Strain[],
): { seed: Seed; strain: Strain } | undefined => {
    if (!seed) return undefined
    const strain = strains.find((item) => item.id === seed.strainId)
    if (!strain) return undefined
    return { seed, strain }
}

const FilledParent: React.FC<{
    title: string
    seed: Seed
    strain: Strain
    onClear: () => void
}> = ({ title, seed, strain, onClear }) => {
    const { t } = useTranslation()
    const unknown = t('common.unknown')
    return (
        <>
            <ParentTypeMark info={strainTypeInfo[strain.type]} />
            <p className="font-bold text-slate-100">{seed.strainName}</p>
            <div className="text-xs text-slate-400 mt-1">
                <p>
                    THC: {percentText(strain.thc, unknown)} | CBD:{' '}
                    {percentText(strain.cbd, unknown)}
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
    )
}

const EmptyParent: React.FC = () => {
    const { t } = useTranslation()
    return (
        <div className="text-muted">
            <PhosphorIcons.Drop className="w-12 h-12 mb-2" />
            <p>{t('knowledgeView.breeding.selectSeed')}</p>
        </div>
    )
}

export const ParentSlot: React.FC<{
    title: string
    seed: Seed | undefined
    onClear: () => void
    allStrains: Strain[]
}> = ({ title, seed, onClear, allStrains }) => {
    const parent = selectedParent(seed, allStrains)
    return (
        <Card className="flex flex-col items-center justify-center h-48 text-center relative bg-slate-800/30">
            <h4 className="absolute top-2 text-sm font-semibold text-slate-400">{title}</h4>
            {parent ? (
                <FilledParent
                    title={title}
                    seed={parent.seed}
                    strain={parent.strain}
                    onClear={onClear}
                />
            ) : (
                <EmptyParent />
            )}
        </Card>
    )
}

export const TraitComparison: React.FC<{
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
