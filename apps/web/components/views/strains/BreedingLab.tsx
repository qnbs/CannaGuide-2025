/**
 * Unified Breeding Lab -- consolidates Strains BreedingLab + Knowledge BreedingView
 *
 * Three internal tabs:
 *   1. Genetics -- Punnett Squares for 3 di-allelic traits + generation tracker (P->F1->IBL)
 *   2. Seeds   -- Seed collection, phenotype tracking, worker-based genetics, save results
 *   3. AR      -- 3D/AR preview of offspring
 *
 * State + handlers live in `breeding/useBreedingLab`; each tab is a presentational
 * component under `breeding/`.
 */

import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain } from '@/types'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useBreedingLab, type LabTab } from './breeding/useBreedingLab'
import { BreedingGeneticsTab } from './breeding/BreedingGeneticsTab'
import { BreedingSeedsTab } from './breeding/BreedingSeedsTab'
import { BreedingArTab } from './breeding/BreedingArTab'

interface BreedingLabProps {
    allStrains: Strain[]
}

export const BreedingLab: React.FC<BreedingLabProps> = ({ allStrains }) => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<LabTab>('genetics')
    const state = useBreedingLab(allStrains)

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

            {activeTab === 'genetics' && <BreedingGeneticsTab state={state} />}
            {activeTab === 'seeds' && <BreedingSeedsTab state={state} allStrains={allStrains} />}
            {activeTab === 'ar' && <BreedingArTab state={state} />}
        </div>
    )
}

BreedingLab.displayName = 'BreedingLab'
