import React, { useMemo, memo, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { CalculatorSection, Input, ResultDisplay } from './common'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useCalculatorSessionStore } from '@/stores/useCalculatorSessionStore'

export const VentilationCalculator: React.FC = memo(() => {
    const { t } = useTranslation()
    const tooltipId = useId()
    const roomDimensions = useCalculatorSessionStore((s) => s.roomDimensions)
    const setRoomDimensions = useCalculatorSessionStore((s) => s.setRoomDimensions)
    const sharedLightWattage = useCalculatorSessionStore((s) => s.sharedLightWattage)
    const setSharedLightWattage = useCalculatorSessionStore((s) => s.setSharedLightWattage)
    const [hasFilter, setHasFilter] = React.useState(true)
    const filterEnabledVariant = hasFilter ? 'primary' : 'secondary'
    const filterDisabledVariant = hasFilter ? 'secondary' : 'primary'

    const result = useMemo(() => {
        const volume =
            (roomDimensions.width / 100) *
            (roomDimensions.depth / 100) *
            (roomDimensions.height / 100)
        if (volume <= 0) return 0

        const airChangesPerHour = 60
        let baseM3h = volume * airChangesPerHour

        const heatFactor = 1 + sharedLightWattage / 1000
        baseM3h *= heatFactor

        if (hasFilter) {
            baseM3h *= 1.35
        }

        return Math.ceil(baseM3h)
    }, [roomDimensions, sharedLightWattage, hasFilter])

    return (
        <CalculatorSection
            title={t('equipmentView.calculators.ventilation.title')}
            description={t('equipmentView.calculators.ventilation.description')}
        >
            <div className="grid grid-cols-3 gap-4">
                <Input
                    label={t('equipmentView.calculators.ventilation.width')}
                    type="number"
                    unit="cm"
                    value={roomDimensions.width}
                    onChange={(e) =>
                        setRoomDimensions({ ...roomDimensions, width: Number(e.target.value) })
                    }
                />
                <Input
                    label={t('equipmentView.calculators.ventilation.depth')}
                    type="number"
                    unit="cm"
                    value={roomDimensions.depth}
                    onChange={(e) =>
                        setRoomDimensions({ ...roomDimensions, depth: Number(e.target.value) })
                    }
                />
                <Input
                    label={t('equipmentView.calculators.ventilation.height')}
                    type="number"
                    unit="cm"
                    value={roomDimensions.height}
                    onChange={(e) =>
                        setRoomDimensions({ ...roomDimensions, height: Number(e.target.value) })
                    }
                />
            </div>
            <Input
                label={t('equipmentView.calculators.ventilation.lightWattage')}
                type="number"
                unit="W"
                value={sharedLightWattage}
                onChange={(e) => setSharedLightWattage(Number(e.target.value))}
                tooltip={t('equipmentView.calculators.ventilation.lightWattageTooltip')}
            />
            <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1">
                    {t('equipmentView.calculators.ventilation.carbonFilter')}
                    <span className="group/tooltip relative">
                        <button
                            type="button"
                            className="rounded text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                            aria-label={t('equipmentView.calculators.ventilation.carbonFilter')}
                            aria-describedby={tooltipId}
                        >
                            <PhosphorIcons.Question className="w-4 h-4" />
                        </button>
                        <span
                            id={tooltipId}
                            role="tooltip"
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-slate-200 text-xs rounded-md shadow-lg opacity-0 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 transition-opacity pointer-events-none z-10"
                        >
                            {t('equipmentView.calculators.ventilation.carbonFilterTooltip')}
                        </span>
                    </span>
                </label>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setHasFilter(true)}
                        variant={filterEnabledVariant}
                        className="flex-1"
                    >
                        {t('equipmentView.calculators.yes')}
                    </Button>
                    <Button
                        onClick={() => setHasFilter(false)}
                        variant={filterDisabledVariant}
                        className="flex-1"
                    >
                        {t('equipmentView.calculators.no')}
                    </Button>
                </div>
            </div>
            <ResultDisplay
                label={t('equipmentView.calculators.ventilation.result')}
                value={result.toString()}
                unit="m³/h"
            />
        </CalculatorSection>
    )
})
