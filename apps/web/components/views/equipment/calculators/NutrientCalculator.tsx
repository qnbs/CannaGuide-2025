import React, { useState, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorSection, Input, ResultDisplay } from './common'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { NUTRIENT_BRAND_SCHEDULES, findBrandSchedule } from '@/data/nutrientBrands'

interface Component {
    id: string
    name: string
    dose: number // in ml/L
}

export const NutrientCalculator: React.FC = memo(() => {
    const { t } = useTranslation()
    const [waterAmount, setWaterAmount] = useState(5) // in Liters
    const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
    const [selectedWeek, setSelectedWeek] = useState(1)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
    const [components, setComponents] = useState<Component[]>([
        { id: `comp-${Date.now()}`, name: 'Grow', dose: 2 },
    ])

    const selectedSchedule = selectedBrandId ? findBrandSchedule(selectedBrandId) : undefined
    const weekData = selectedSchedule?.data.weeks.find((w) => w.week === selectedWeek)
    const maxWeek = selectedSchedule?.data.weeks.length ?? 0

    const handleApplyBrandWeek = useCallback(() => {
        if (!weekData) return
        const brandComponents: Component[] = weekData.products.map((p, i) => ({
            id: `brand-${Date.now()}-${i}`,
            name: p.name,
            dose: p.dosageMlPerLiter,
        }))
        setComponents(brandComponents)
    }, [weekData])

    const handleAddComponent = () => {
        setComponents((prev) => [
            ...prev,
            { id: `comp-${Date.now()}-${prev.length}`, name: '', dose: 0 },
        ])
    }

    const handleRemoveComponent = (id: string) => {
        setComponents((prev) => prev.filter((c) => c.id !== id))
    }

    const handleComponentChange = (id: string, field: 'name' | 'dose', value: string | number) => {
        setComponents((prev) =>
            prev.map((c) => {
                if (c.id === id) {
                    const numericValue = field === 'dose' ? Number(value) : value
                    return { ...c, [field]: numericValue }
                }
                return c
            }),
        )
    }

    return (
        <CalculatorSection
            title={t('equipmentView.calculators.nutrients.title')}
            description={t('equipmentView.calculators.nutrients.description')}
        >
            {/* Brand schedule selector */}
            <div className="space-y-2 p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                <label className="block text-xs font-medium text-slate-300">
                    {t('equipmentView.nutrientBrands.selectBrand')}
                </label>
                <select
                    className="w-full rounded-md bg-slate-900/60 border border-slate-600 text-sm text-slate-200 px-3 py-2"
                    value={selectedBrandId ?? ''}
                    onChange={(e) => {
                        const val = e.target.value || null
                        setSelectedBrandId(val)
                        setSelectedWeek(1)
                    }}
                >
                    <option value="">{t('equipmentView.nutrientBrands.noBrand')}</option>
                    {NUTRIENT_BRAND_SCHEDULES.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.data.brand} -- {s.data.scheduleName}
                        </option>
                    ))}
                </select>
                {selectedSchedule && maxWeek > 0 && (
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                                {t('equipmentView.nutrientBrands.weekLabel', {
                                    week: selectedWeek,
                                })}
                                {weekData && (
                                    <span className="ml-2 text-slate-400">
                                        (
                                        {t('equipmentView.nutrientBrands.stageLabel', {
                                            stage: weekData.stage,
                                        })}
                                        )
                                    </span>
                                )}
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={maxWeek}
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                                className="w-full accent-emerald-500"
                            />
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleApplyBrandWeek}
                            className="shrink-0"
                        >
                            <PhosphorIcons.ArrowRight className="w-3 h-3 mr-1" />
                            {t('equipmentView.nutrientBrands.applySchedule')}
                        </Button>
                    </div>
                )}
                {weekData && (
                    <div className="flex gap-3 text-xs text-slate-400">
                        {weekData.ecTarget !== undefined && (
                            <span>
                                {t('equipmentView.nutrientBrands.ecTarget', {
                                    value: weekData.ecTarget,
                                })}
                            </span>
                        )}
                        {weekData.phTarget && (
                            <span>
                                {t('equipmentView.nutrientBrands.phRange', {
                                    min: weekData.phTarget[0],
                                    max: weekData.phTarget[1],
                                })}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <Input
                label={t('equipmentView.calculators.nutrients.reservoir')}
                type="number"
                unit="L"
                value={waterAmount}
                onChange={(e) => setWaterAmount(Number(e.target.value))}
            />
            <div className="space-y-3">
                {components.map((comp, index) => (
                    <div
                        key={comp.id}
                        className="grid grid-cols-1 sm:grid-cols-[2fr_1.5fr_2fr] gap-2 items-end p-2 bg-slate-800/50 rounded-lg"
                    >
                        <Input
                            label={`${t('equipmentView.calculators.nutrients.component')} #${index + 1}`}
                            type="text"
                            placeholder={t(
                                'equipmentView.calculators.nutrients.componentPlaceholder',
                            )}
                            value={comp.name}
                            onChange={(e) => handleComponentChange(comp.id, 'name', e.target.value)}
                        />
                        <Input
                            label={t('equipmentView.calculators.nutrients.dose')}
                            type="number"
                            unit="ml/L"
                            value={comp.dose}
                            onChange={(e) => handleComponentChange(comp.id, 'dose', e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <div className="flex-grow">
                                <ResultDisplay
                                    label={`${t('equipmentView.calculators.nutrients.totalFor')} ${waterAmount}L`}
                                    value={(comp.dose * waterAmount).toFixed(1)}
                                    unit="ml"
                                />
                            </div>
                            <Button
                                variant="danger"
                                size="icon"
                                className="self-center mb-1"
                                onClick={() => handleRemoveComponent(comp.id)}
                                aria-label={t('common.delete')}
                            >
                                <PhosphorIcons.TrashSimple className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            <Button variant="secondary" onClick={handleAddComponent} className="w-full">
                <PhosphorIcons.Plus className="w-4 h-4 mr-2" />
                {t('equipmentView.calculators.nutrients.addComponent')}
            </Button>
        </CalculatorSection>
    )
})
