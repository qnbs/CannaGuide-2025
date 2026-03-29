import React, { useState, useCallback, useMemo } from 'react'
import type { Plant } from '@/types'
import { JournalEntryType } from '@/types'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch } from '@/stores/store'
import { addJournalEntry, setGlobalEnvironment } from '@/stores/slices/simulationSlice'
import { getUISnapshot } from '@/stores/useUIStore'
import { calculateVPD } from '@/lib/vpd/calculator'

// ---------------------------------------------------------------------------
// Metric configuration
// ---------------------------------------------------------------------------

interface MetricConfig {
    key: string
    label: string
    unit: string
    min: number
    max: number
    step: number
    icon: React.ReactNode
    color: string
    defaultValue: number
}

function useMetricConfigs(): MetricConfig[] {
    const { t } = useTranslation()
    return useMemo(
        () => [
            {
                key: 'temperature',
                label: t('plantsView.environment.temperature', { defaultValue: 'Temperature' }),
                unit: '\u00B0C',
                min: 10,
                max: 40,
                step: 0.5,
                icon: <PhosphorIcons.Thermometer className="w-5 h-5" />,
                color: 'text-red-400',
                defaultValue: 25,
            },
            {
                key: 'humidity',
                label: t('plantsView.environment.humidity', { defaultValue: 'Humidity' }),
                unit: '%',
                min: 20,
                max: 95,
                step: 1,
                icon: <PhosphorIcons.Drop className="w-5 h-5" />,
                color: 'text-sky-400',
                defaultValue: 60,
            },
            {
                key: 'lightPpfd',
                label: t('plantsView.environment.light', { defaultValue: 'Light (PPFD)' }),
                unit: '\u00B5mol/s',
                min: 0,
                max: 1500,
                step: 10,
                icon: <PhosphorIcons.Sun className="w-5 h-5" />,
                color: 'text-amber-400',
                defaultValue: 600,
            },
            {
                key: 'ph',
                label: t('plantsView.environment.ph', { defaultValue: 'pH' }),
                unit: '',
                min: 4.0,
                max: 8.0,
                step: 0.1,
                icon: <PhosphorIcons.Flask className="w-5 h-5" />,
                color: 'text-purple-400',
                defaultValue: 6.2,
            },
            {
                key: 'ec',
                label: t('plantsView.environment.ec', { defaultValue: 'EC' }),
                unit: 'mS/cm',
                min: 0,
                max: 4.0,
                step: 0.1,
                icon: <PhosphorIcons.Lightning className="w-5 h-5" />,
                color: 'text-yellow-400',
                defaultValue: 1.2,
            },
            {
                key: 'waterVolume',
                label: t('plantsView.environment.water', { defaultValue: 'Water' }),
                unit: 'ml',
                min: 0,
                max: 5000,
                step: 50,
                icon: <PhosphorIcons.Drop className="w-5 h-5" />,
                color: 'text-cyan-400',
                defaultValue: 500,
            },
        ],
        [t],
    )
}

// ---------------------------------------------------------------------------
// Individual metric control
// ---------------------------------------------------------------------------

interface MetricControlProps {
    config: MetricConfig
    value: number
    onChange: (value: number) => void
}

const MetricControl: React.FC<MetricControlProps> = React.memo(({ config, value, onChange }) => {
    const handleSlider = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange(Number(e.target.value))
        },
        [onChange],
    )

    const handleInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = parseFloat(e.target.value)
            if (!Number.isNaN(raw)) {
                const clamped = Math.min(config.max, Math.max(config.min, raw))
                onChange(Math.round(clamped / config.step) * config.step)
            }
        },
        [onChange, config.min, config.max, config.step],
    )

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <span className={config.color}>{config.icon}</span>
                    {config.label}
                </label>
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        value={parseFloat(value.toFixed(2))}
                        onChange={handleInput}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        className="w-20 bg-slate-800 border border-slate-600 rounded-md px-2 py-1 text-right text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <span className="text-xs text-slate-500 w-12">{config.unit}</span>
                </div>
            </div>
            <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={value}
                onChange={handleSlider}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
        </div>
    )
})
MetricControl.displayName = 'MetricControl'

// ---------------------------------------------------------------------------
// VPD Live Indicator
// ---------------------------------------------------------------------------

interface VpdIndicatorProps {
    temperature: number
    humidity: number
    stage: string
}

const VPD_ZONES = [
    { max: 0.4, labelKey: 'tooLow', color: 'text-sky-400', bg: 'bg-sky-500/15' },
    { max: 0.8, labelKey: 'seedling', color: 'text-lime-400', bg: 'bg-lime-500/15' },
    { max: 1.2, labelKey: 'vegetative', color: 'text-green-400', bg: 'bg-green-500/15' },
    { max: 1.6, labelKey: 'flowering', color: 'text-amber-400', bg: 'bg-amber-500/15' },
    { max: Infinity, labelKey: 'tooHigh', color: 'text-red-400', bg: 'bg-red-500/15' },
] as const

const VPD_ZONE_DEFAULTS: Record<string, string> = {
    tooLow: 'Too Low',
    seedling: 'Seedling',
    vegetative: 'Vegetative',
    flowering: 'Flowering',
    tooHigh: 'Too High',
}

const VpdIndicator: React.FC<VpdIndicatorProps> = React.memo(({ temperature, humidity }) => {
    const { t } = useTranslation()
    const vpd = calculateVPD(temperature, humidity)
    const zone = VPD_ZONES.find((z) => vpd < z.max) ?? VPD_ZONES[VPD_ZONES.length - 1]
    const zoneLabel = t(`plantsView.environment.vpdZone.${zone?.labelKey ?? 'tooHigh'}`, {
        defaultValue: VPD_ZONE_DEFAULTS[zone?.labelKey ?? 'tooHigh'],
    })

    return (
        <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 ring-1 ring-inset ring-current/20 ${zone?.bg ?? ''}`}
        >
            <div className="flex items-center gap-2">
                <PhosphorIcons.ChartLineUp className="w-5 h-5" />
                <span className="text-sm font-medium text-slate-300">
                    {t('plantsView.environment.liveVpd', { defaultValue: 'Live VPD' })}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span
                    className={`text-2xl font-bold tabular-nums ${zone?.color ?? 'text-slate-300'}`}
                >
                    {vpd.toFixed(2)}
                </span>
                <span className={`text-xs font-medium ${zone?.color ?? 'text-slate-400'}`}>
                    kPa -- {zoneLabel}
                </span>
            </div>
        </div>
    )
})
VpdIndicator.displayName = 'VpdIndicator'

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface EnvironmentControlPanelProps {
    plant: Plant
}

export const EnvironmentControlPanel: React.FC<EnvironmentControlPanelProps> = ({ plant }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const metrics = useMetricConfigs()

    // Initialize from plant's current state
    const [values, setValues] = useState<Record<string, number>>(() => ({
        temperature: plant.environment.internalTemperature,
        humidity: plant.environment.internalHumidity,
        lightPpfd: 600,
        ph: plant.medium.ph,
        ec: plant.medium.ec,
        waterVolume: 500,
    }))

    const handleChange = useCallback((key: string, value: number) => {
        setValues((prev) => ({ ...prev, [key]: value }))
    }, [])

    const handleLog = useCallback(() => {
        const temp = values['temperature'] ?? 25
        const humidity = values['humidity'] ?? 60
        const ph = values['ph'] ?? 6.2
        const ec = values['ec'] ?? 1.2
        const lightPpfd = values['lightPpfd'] ?? 600
        const waterVolumeMl = values['waterVolume'] ?? 500

        // 1. Log as journal entry
        dispatch(
            addJournalEntry({
                plantId: plant.id,
                entry: {
                    type: JournalEntryType.Environment,
                    notes: t('plantsView.environment.logNote', {
                        defaultValue: 'Manual environment reading',
                    }),
                    details: {
                        temp,
                        humidity,
                        ec,
                        ph,
                        lightPpfd,
                        waterVolumeMl,
                        source: 'manual' as const,
                    },
                },
            }),
        )

        // 2. Apply to plant simulation state
        dispatch(
            setGlobalEnvironment({
                temperature: temp,
                humidity,
                ph,
            }),
        )

        // 3. Toast
        getUISnapshot().addNotification({
            message: t('plantsView.environment.logSuccess', {
                defaultValue: 'Environment readings saved',
            }),
            type: 'success',
        })
    }, [values, dispatch, plant.id, t])

    const temp = values['temperature'] ?? 25
    const hum = values['humidity'] ?? 60

    return (
        <div className="space-y-4">
            {/* VPD Live */}
            <VpdIndicator temperature={temp} humidity={hum} stage={plant.stage} />

            {/* Metric grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.map((config) => (
                    <Card key={config.key} className="bg-slate-800/60 border border-slate-700/50">
                        <MetricControl
                            config={config}
                            value={values[config.key] ?? config.defaultValue}
                            onChange={(v) => handleChange(config.key, v)}
                        />
                    </Card>
                ))}
            </div>

            {/* Source indicator + Log button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <PhosphorIcons.PencilSimple className="w-4 h-4" />
                    <span>
                        {t('plantsView.environment.sourceManual', {
                            defaultValue: 'Source: Manual Input',
                        })}
                    </span>
                </div>
                <Button onClick={handleLog}>
                    <PhosphorIcons.CheckCircle className="w-5 h-5 mr-1.5" />
                    {t('plantsView.environment.logButton', {
                        defaultValue: 'Log Readings',
                    })}
                </Button>
            </div>
        </div>
    )
}

EnvironmentControlPanel.displayName = 'EnvironmentControlPanel'
