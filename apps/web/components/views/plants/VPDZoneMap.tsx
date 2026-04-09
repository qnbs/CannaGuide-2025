import React, { useMemo, memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateVPD } from '@/lib/vpd/calculator'
import { VPD_TARGET_BANDS } from '@/lib/vpd/recommendations'
import type { GrowthStage } from '@/types/simulation.types'

interface VPDZoneMapProps {
    currentTemp: number
    currentRH: number
    leafTempOffset?: number | undefined
    altitudeM?: number | undefined
    currentStage?: GrowthStage | undefined
}

interface ZoneConfig {
    label: string
    min: number
    max: number
    color: string
    bgClass: string
    textClass: string
}

type ZoneKey = 'propagation' | 'seedling' | 'vegetative' | 'earlyFlower' | 'lateFlower' | 'danger'

const ZONE_CONFIGS: Record<ZoneKey, ZoneConfig> = {
    propagation: {
        label: 'Propagation',
        min: 0.0,
        max: 0.4,
        color: '#3b82f6',
        bgClass: 'bg-blue-500/20',
        textClass: 'text-blue-400',
    },
    seedling: {
        label: 'Seedling',
        min: 0.4,
        max: 0.8,
        color: '#06b6d4',
        bgClass: 'bg-cyan-500/20',
        textClass: 'text-cyan-400',
    },
    vegetative: {
        label: 'Vegetative',
        min: 0.8,
        max: 1.2,
        color: '#22c55e',
        bgClass: 'bg-green-500/20',
        textClass: 'text-green-400',
    },
    earlyFlower: {
        label: 'Early Flower',
        min: 1.0,
        max: 1.4,
        color: '#eab308',
        bgClass: 'bg-yellow-500/20',
        textClass: 'text-yellow-400',
    },
    lateFlower: {
        label: 'Late Flower',
        min: 1.2,
        max: 1.6,
        color: '#f97316',
        bgClass: 'bg-orange-500/20',
        textClass: 'text-orange-400',
    },
    danger: {
        label: 'Danger',
        min: 1.6,
        max: 2.5,
        color: '#ef4444',
        bgClass: 'bg-red-500/20',
        textClass: 'text-red-400',
    },
}

const TEMP_RANGE = { min: 15, max: 35 }
const RH_RANGE = { min: 20, max: 90 }
const GRID_COLS = 21
const GRID_ROWS = 15

function getVPDZoneColor(vpd: number): string {
    if (vpd < 0.4) return ZONE_CONFIGS.propagation.color
    if (vpd < 0.8) return ZONE_CONFIGS.seedling.color
    if (vpd < 1.2) return ZONE_CONFIGS.vegetative.color
    if (vpd < 1.4) return ZONE_CONFIGS.earlyFlower.color
    if (vpd < 1.6) return ZONE_CONFIGS.lateFlower.color
    return ZONE_CONFIGS.danger.color
}

function getVPDStatus(vpd: number, stage: GrowthStage | undefined): string {
    if (stage == null) {
        if (vpd >= 0.8 && vpd <= 1.2) return 'optimal'
        if (vpd < 0.4 || vpd > 1.6) return 'danger'
        return vpd < 0.8 ? 'low' : 'high'
    }
    const band = VPD_TARGET_BANDS[stage]
    if (vpd >= band.min && vpd <= band.max) return 'optimal'
    if (vpd < 0.4 || vpd > 1.6) return 'danger'
    return vpd < band.min ? 'low' : 'high'
}

export const VPDZoneMap: React.FC<VPDZoneMapProps> = memo(
    ({ currentTemp, currentRH, leafTempOffset = 0, altitudeM = 0, currentStage }) => {
        const { t } = useTranslation()
        const [leafOffset, setLeafOffset] = useState(leafTempOffset)

        const currentVPD = useMemo(
            () => calculateVPD(currentTemp, currentRH, leafOffset, altitudeM),
            [currentTemp, currentRH, leafOffset, altitudeM],
        )

        const status = useMemo(
            () => getVPDStatus(currentVPD, currentStage),
            [currentVPD, currentStage],
        )

        const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            setLeafOffset(Number(e.target.value))
        }, [])

        // Generate VPD heatmap grid
        const grid = useMemo(() => {
            const cells: Array<{ temp: number; rh: number; vpd: number; color: string }> = []
            for (let row = 0; row < GRID_ROWS; row++) {
                const rh = RH_RANGE.max - row * ((RH_RANGE.max - RH_RANGE.min) / (GRID_ROWS - 1))
                for (let col = 0; col < GRID_COLS; col++) {
                    const temp =
                        TEMP_RANGE.min + col * ((TEMP_RANGE.max - TEMP_RANGE.min) / (GRID_COLS - 1))
                    const vpd = calculateVPD(temp, rh, leafOffset, altitudeM)
                    cells.push({ temp, rh, vpd, color: getVPDZoneColor(vpd) })
                }
            }
            return cells
        }, [leafOffset, altitudeM])

        const statusColor =
            status === 'optimal'
                ? 'text-green-400'
                : status === 'danger'
                  ? 'text-red-400'
                  : status === 'low'
                    ? 'text-cyan-400'
                    : 'text-orange-400'

        const statusBg =
            status === 'optimal'
                ? 'bg-green-500/15 ring-green-400/30'
                : status === 'danger'
                  ? 'bg-red-500/15 ring-red-400/30'
                  : status === 'low'
                    ? 'bg-cyan-500/15 ring-cyan-400/30'
                    : 'bg-orange-500/15 ring-orange-400/30'

        return (
            <div className="space-y-4">
                {/* Current VPD Status */}
                <div
                    className={`flex items-center justify-between rounded-xl p-4 ring-1 ring-inset ${statusBg}`}
                >
                    <div>
                        <p className="text-sm text-slate-400">
                            {t('plantsView.vpd.currentVpd', { defaultValue: 'Current VPD' })}
                        </p>
                        <p className={`text-3xl font-bold ${statusColor}`}>
                            {currentVPD.toFixed(2)}{' '}
                            <span className="text-sm font-normal text-slate-400">kPa</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${statusBg} ${statusColor}`}
                        >
                            {t(`plantsView.vpd.status.${status}`, { defaultValue: status })}
                        </span>
                        {currentStage != null && (
                            <p className="text-xs text-slate-500 mt-1">
                                {t('plantsView.vpd.targetRange', { defaultValue: 'Target' })}:{' '}
                                {VPD_TARGET_BANDS[currentStage].min}--
                                {VPD_TARGET_BANDS[currentStage].max} kPa
                            </p>
                        )}
                    </div>
                </div>

                {/* Leaf Temperature Slider */}
                <div className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-inset ring-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                        <label
                            htmlFor="leaf-temp-slider"
                            className="text-sm font-medium text-slate-300"
                        >
                            {t('plantsView.vpd.leafTempOffset', {
                                defaultValue: 'Leaf Temp Offset',
                            })}
                        </label>
                        <span className="text-sm font-mono text-primary-400">
                            {leafOffset > 0 ? '+' : ''}
                            {leafOffset.toFixed(1)} C
                        </span>
                    </div>
                    <input
                        id="leaf-temp-slider"
                        type="range"
                        min="-5"
                        max="2"
                        step="0.5"
                        value={leafOffset}
                        onChange={handleSliderChange}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700
                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-400"
                        aria-label={t('plantsView.vpd.leafTempOffset', {
                            defaultValue: 'Leaf Temp Offset',
                        })}
                    />
                </div>

                {/* VPD Heatmap Grid */}
                <div className="rounded-xl bg-slate-800/60 p-4 ring-1 ring-inset ring-slate-700/50 overflow-x-auto">
                    <p className="text-sm font-medium text-slate-300 mb-3">
                        {t('plantsView.vpd.zoneMap', { defaultValue: 'VPD Zone Map' })}
                    </p>
                    <div className="relative min-w-[320px]">
                        {/* Y-axis label */}
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-slate-500 whitespace-nowrap">
                            {t('plantsView.vpd.humidity', { defaultValue: 'RH %' })}
                        </div>
                        <div className="ml-6">
                            <div
                                className="grid gap-px"
                                style={{
                                    gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                                }}
                                role="img"
                                aria-label={t('plantsView.vpd.zoneMap', {
                                    defaultValue: 'VPD Zone Map',
                                })}
                            >
                                {grid.map((cell, i) => (
                                    <div
                                        key={i}
                                        className="aspect-square rounded-[2px] transition-colors"
                                        style={{ backgroundColor: cell.color + '40' }}
                                        title={`${cell.temp.toFixed(0)}C / ${cell.rh.toFixed(0)}% = ${cell.vpd.toFixed(2)} kPa`}
                                    />
                                ))}
                            </div>
                            {/* X-axis labels */}
                            <div className="flex justify-between mt-1">
                                <span className="text-[10px] text-slate-500">
                                    {TEMP_RANGE.min}C
                                </span>
                                <span className="text-[10px] text-slate-500">
                                    {t('plantsView.vpd.temperature', {
                                        defaultValue: 'Temperature',
                                    })}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                    {TEMP_RANGE.max}C
                                </span>
                            </div>
                        </div>
                        {/* Y-axis tick labels */}
                        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between ml-1">
                            <span className="text-[10px] text-slate-500">{RH_RANGE.max}%</span>
                            <span className="text-[10px] text-slate-500">{RH_RANGE.min}%</span>
                        </div>
                    </div>
                </div>

                {/* Zone Legend */}
                <div className="flex flex-wrap gap-2">
                    {Object.entries(ZONE_CONFIGS).map(([key, zone]) => (
                        <div
                            key={key}
                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${zone.bgClass} ${zone.textClass} ring-1 ring-inset ring-current/20`}
                        >
                            <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: zone.color }}
                            />
                            {t(`plantsView.vpd.zones.${key}`, { defaultValue: zone.label })}:{' '}
                            {zone.min}--{zone.max}
                        </div>
                    ))}
                </div>
            </div>
        )
    },
)
VPDZoneMap.displayName = 'VPDZoneMap'
