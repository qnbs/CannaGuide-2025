import React, { useState, useMemo, memo } from 'react'
import { SavedSetup } from '@/types'
import { useTranslation } from 'react-i18next'
import { SetupCard } from './SetupCard'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch } from '@/stores/store'
import { addSetup } from '@/stores/slices/savedItemsSlice'
import { PRESET_SETUPS, PRESET_CATEGORIES, type PresetCategory } from '@/data/presetSetups'

const CATEGORY_FILTERS: Array<{ key: PresetCategory | 'all'; order: number }> = [
    { key: 'all', order: 0 },
    { key: 'micro', order: 1 },
    { key: 'small', order: 2 },
    { key: 'medium', order: 3 },
    { key: 'large', order: 4 },
    { key: 'specialty', order: 5 },
]

const PresetSetupsViewComponent: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const [activeFilter, setActiveFilter] = useState<PresetCategory | 'all'>('all')
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const filteredPresets = useMemo(() => {
        const filtered =
            activeFilter === 'all'
                ? PRESET_SETUPS
                : PRESET_SETUPS.filter((p) => p.category === activeFilter)
        return filtered.toSorted(
            (a, b) =>
                (PRESET_CATEGORIES[a.category]?.order ?? 99) -
                (PRESET_CATEGORIES[b.category]?.order ?? 99),
        )
    }, [activeFilter])

    const handleCopyToMySetups = async (presetId: string): Promise<void> => {
        const preset = PRESET_SETUPS.find((p) => p.presetId === presetId)
        if (!preset) return

        const {
            presetId: _pid,
            category: _cat,
            tags: _tags,
            difficulty: _diff,
            ...setupData
        } = preset

        await dispatch(addSetup(setupData))
        setCopiedId(presetId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const toSavedSetup = (presetId: string, index: number): SavedSetup => {
        const preset = PRESET_SETUPS.find((p) => p.presetId === presetId)
        if (!preset) {
            return {
                id: presetId,
                name: '',
                createdAt: 0,
                recommendation: {
                    tent: { name: '', price: 0, rationale: '' },
                    light: { name: '', price: 0, rationale: '' },
                    ventilation: { name: '', price: 0, rationale: '' },
                    circulationFan: { name: '', price: 0, rationale: '' },
                    pots: { name: '', price: 0, rationale: '' },
                    soil: { name: '', price: 0, rationale: '' },
                    nutrients: { name: '', price: 0, rationale: '' },
                    extra: { name: '', price: 0, rationale: '' },
                    proTip: '',
                },
                totalCost: 0,
                sourceDetails: {
                    plantCount: '1',
                    experience: 'beginner',
                    budget: 0,
                    priorities: [],
                    customNotes: '',
                    growSpace: { width: 0, depth: 0 },
                    floweringTypePreference: 'any',
                },
            }
        }
        return {
            id: preset.presetId,
            name: preset.name,
            createdAt: index,
            recommendation: preset.recommendation,
            totalCost: preset.totalCost,
            sourceDetails: preset.sourceDetails,
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="text-center pb-2">
                <p className="text-sm text-slate-400">{t('equipmentView.presetSetups.subtitle')}</p>
            </div>

            {/* Category filter chips */}
            <div className="flex flex-wrap gap-2 justify-center">
                {CATEGORY_FILTERS.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        onClick={() => setActiveFilter(f.key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                            activeFilter === f.key
                                ? 'bg-primary-600 text-white shadow-md ring-1 ring-primary-400'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                    >
                        {t(`equipmentView.presetSetups.categories.${f.key}`)}
                    </button>
                ))}
            </div>

            {/* Count */}
            <p className="text-xs text-slate-500 text-center">
                {t('equipmentView.presetSetups.count', { count: filteredPresets.length })}
            </p>

            {/* Preset cards */}
            {filteredPresets.map((preset, index) => (
                <div key={preset.presetId} className="relative">
                    {/* Tags row */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                                preset.difficulty === 'beginner'
                                    ? 'bg-green-900/50 text-green-300'
                                    : preset.difficulty === 'intermediate'
                                      ? 'bg-yellow-900/50 text-yellow-300'
                                      : 'bg-red-900/50 text-red-300'
                            }`}
                        >
                            {t(`equipmentView.presetSetups.difficulty.${preset.difficulty}`)}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                            {preset.sourceDetails.growSpace
                                ? `${preset.sourceDetails.growSpace.width}x${preset.sourceDetails.growSpace.depth}cm`
                                : ''}
                        </span>
                        {preset.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <SetupCard
                        setup={toSavedSetup(preset.presetId, index)}
                        onEdit={() => void handleCopyToMySetups(preset.presetId)}
                        onDelete={() => void handleCopyToMySetups(preset.presetId)}
                    />

                    {/* Copy to My Setups button overlay */}
                    <div className="flex justify-end mt-1">
                        <Button
                            size="sm"
                            onClick={() => void handleCopyToMySetups(preset.presetId)}
                            disabled={copiedId === preset.presetId}
                        >
                            {copiedId === preset.presetId ? (
                                <>
                                    <PhosphorIcons.CheckCircle className="w-4 h-4 mr-1.5" />
                                    {t('equipmentView.presetSetups.copied')}
                                </>
                            ) : (
                                <>
                                    <PhosphorIcons.PlusCircle className="w-4 h-4 mr-1.5" />
                                    {t('equipmentView.presetSetups.copyToMySetups')}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            ))}

            {/* Info footer */}
            <Card className="text-center py-6 text-slate-500">
                <PhosphorIcons.Info className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs">{t('equipmentView.presetSetups.footer')}</p>
            </Card>
        </div>
    )
}

export const PresetSetupsView = memo(PresetSetupsViewComponent)
PresetSetupsView.displayName = 'PresetSetupsView'
export default PresetSetupsView
