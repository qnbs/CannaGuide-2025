/**
 * WhatIfSandbox
 *
 * A shared control panel at the top of the Equipment Calculator Suite.
 * Adjusting the room dimensions or light wattage here instantly propagates
 * the values to all connected calculators (Ventilation, CO2, Light Hanging).
 */

import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
    useCalculatorSessionStore,
    DEFAULT_ROOM_DIMENSIONS,
    DEFAULT_SHARED_LIGHT_WATTAGE,
} from '@/stores/useCalculatorSessionStore'

export const WhatIfSandbox: React.FC = memo(() => {
    const { t } = useTranslation()
    const roomDimensions = useCalculatorSessionStore((s) => s.roomDimensions)
    const sharedLightWattage = useCalculatorSessionStore((s) => s.sharedLightWattage)
    const setRoomDimensions = useCalculatorSessionStore((s) => s.setRoomDimensions)
    const setSharedLightWattage = useCalculatorSessionStore((s) => s.setSharedLightWattage)

    const volumeM3 =
        (roomDimensions.width / 100) * (roomDimensions.depth / 100) * (roomDimensions.height / 100)

    const handleReset = () => {
        setRoomDimensions(DEFAULT_ROOM_DIMENSIONS)
        setSharedLightWattage(DEFAULT_SHARED_LIGHT_WATTAGE)
    }

    return (
        <details className="group rounded-xl border border-primary-700/30 bg-primary-950/20 p-4 mb-2">
            <summary className="flex cursor-pointer list-none items-center justify-between select-none">
                <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-primary-300">
                        {t('equipmentView.calculators.sandbox.title')}
                    </span>
                    <span className="hidden text-xs text-slate-500 group-open:hidden sm:inline">
                        {t('equipmentView.calculators.sandbox.collapseHint')}
                    </span>
                </div>
                <span className="ml-auto mr-2 text-xs text-slate-500">
                    {volumeM3.toFixed(2)} {t('equipmentView.calculators.sandbox.unitM3')} &mdash;{' '}
                    {sharedLightWattage} {t('equipmentView.calculators.sandbox.unitWatt')}
                </span>
                <svg
                    className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </summary>

            <div className="mt-4 space-y-4">
                <p className="text-xs text-slate-500">
                    {t('equipmentView.calculators.sandbox.description')}
                </p>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <SliderField
                        label={t('equipmentView.calculators.sandbox.width')}
                        unit="cm"
                        min={30}
                        max={600}
                        step={10}
                        value={roomDimensions.width}
                        onChange={(v) => setRoomDimensions({ ...roomDimensions, width: v })}
                    />
                    <SliderField
                        label={t('equipmentView.calculators.sandbox.depth')}
                        unit="cm"
                        min={30}
                        max={600}
                        step={10}
                        value={roomDimensions.depth}
                        onChange={(v) => setRoomDimensions({ ...roomDimensions, depth: v })}
                    />
                    <SliderField
                        label={t('equipmentView.calculators.sandbox.height')}
                        unit="cm"
                        min={100}
                        max={500}
                        step={10}
                        value={roomDimensions.height}
                        onChange={(v) => setRoomDimensions({ ...roomDimensions, height: v })}
                    />
                    <SliderField
                        label={t('equipmentView.calculators.sandbox.lightWattage')}
                        unit="W"
                        min={50}
                        max={2000}
                        step={50}
                        value={sharedLightWattage}
                        onChange={setSharedLightWattage}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                        {t('equipmentView.calculators.sandbox.propagateNote')}
                    </p>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs text-primary-400 underline hover:text-primary-300"
                    >
                        {t('equipmentView.calculators.sandbox.reset')}
                    </button>
                </div>
            </div>
        </details>
    )
})
WhatIfSandbox.displayName = 'WhatIfSandbox'

// --- Internal slider field ---

const SliderField: React.FC<{
    label: string
    unit: string
    min: number
    max: number
    step: number
    value: number
    onChange: (v: number) => void
}> = memo(({ label, unit, min, max, step, value, onChange }) => (
    <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">{label}</label>
            <span className="text-xs text-primary-400">
                {value} {unit}
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-primary-500"
            aria-label={label}
        />
    </div>
))
SliderField.displayName = 'SliderField'
