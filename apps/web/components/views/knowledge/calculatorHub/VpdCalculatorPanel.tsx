import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { calculateVPD } from '@/lib/vpd/calculator'
import { RagExplainBox, SimulationPanel } from './shared'

interface VpdResult {
    vpd: number
    status: 'low' | 'ok' | 'high'
}

function getVpdStatus(vpd: number): VpdResult['status'] {
    if (vpd < 0.4) return 'low'
    if (vpd > 1.6) return 'high'
    return 'ok'
}

export const VpdCalculatorPanel: React.FC = () => {
    const { t } = useTranslation()
    const [temp, setTemp] = useState(25)
    const [humidity, setHumidity] = useState(60)
    const [leafOffset, setLeafOffset] = useState(2)

    const vpd = calculateVPD(temp, humidity, leafOffset)
    const status = getVpdStatus(vpd)

    const statusConfig = {
        low: {
            label: t('knowledgeView.rechner.vpd.statusLow'),
            color: 'text-blue-400',
            bg: 'bg-blue-900/40 border-blue-700',
        },
        ok: {
            label: t('knowledgeView.rechner.vpd.statusOk'),
            color: 'text-green-400',
            bg: 'bg-green-900/40 border-green-700',
        },
        high: {
            label: t('knowledgeView.rechner.vpd.statusHigh'),
            color: 'text-red-400',
            bg: 'bg-red-900/40 border-red-700',
        },
    }[status]

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.vpd.temperature')}
                    </span>
                    <input
                        type="number"
                        min={15}
                        max={40}
                        step={0.5}
                        value={temp}
                        onChange={(e) => {
                            setTemp(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        aria-label={t('knowledgeView.rechner.vpd.temperature')}
                    />
                    <span className="text-3xs text-slate-500 text-center">
                        {t('knowledgeView.rechner.vpd.celsius')}
                    </span>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.vpd.humidity')}
                    </span>
                    <input
                        type="number"
                        min={10}
                        max={99}
                        step={1}
                        value={humidity}
                        onChange={(e) => {
                            setHumidity(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        aria-label={t('knowledgeView.rechner.vpd.humidity')}
                    />
                    <span className="text-3xs text-slate-500 text-center">%</span>
                </label>
                <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-400">
                        {t('knowledgeView.rechner.vpd.leafOffset')}
                    </span>
                    <input
                        type="number"
                        min={0}
                        max={5}
                        step={0.5}
                        value={leafOffset}
                        onChange={(e) => {
                            setLeafOffset(Number(e.target.value))
                        }}
                        className="w-full rounded bg-slate-700 border border-slate-600 text-slate-100 text-center py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        aria-label={t('knowledgeView.rechner.vpd.leafOffset')}
                    />
                    <span className="text-3xs text-slate-500 text-center">
                        {t('knowledgeView.rechner.vpd.celsius')}
                    </span>
                </label>
            </div>

            <div
                className={`rounded-lg p-4 border text-center ${statusConfig.bg}`}
                role="status"
                aria-live="polite"
            >
                <p className="text-4xl font-bold font-display text-slate-100">
                    {vpd.toFixed(2)}
                    <span className="text-sm font-normal text-slate-400 ml-1">kPa</span>
                </p>
                <p className={`text-sm font-semibold mt-1 ${statusConfig.color}`}>
                    {statusConfig.label}
                </p>
            </div>

            <div className="text-xs text-slate-400 space-y-0.5">
                <div className="flex justify-between">
                    <span className="text-blue-400">
                        {t('knowledgeView.rechner.vpd.rangeSeedling')}
                    </span>
                    <span>0.4 - 0.8 kPa</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-green-400">{t('knowledgeView.rechner.vpd.rangeVeg')}</span>
                    <span>0.6 - 1.0 kPa</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-amber-400">
                        {t('knowledgeView.rechner.vpd.rangeFlower')}
                    </span>
                    <span>0.8 - 1.2 kPa</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-orange-400">
                        {t('knowledgeView.rechner.vpd.rangeLateFlower')}
                    </span>
                    <span>1.0 - 1.5 kPa</span>
                </div>
            </div>

            <SimulationPanel
                command="SIMULATE_VPD"
                payload={{ temp, humidity, leafOffset }}
                color="#22c55e"
                unit="kPa"
                i18nPrefix="knowledgeView.rechner.vpd"
            />
            <RagExplainBox
                calculator="vpd"
                values={{ vpd: vpd.toFixed(2), status, temp, humidity, leafOffset }}
                i18nPrefix="knowledgeView.rechner.vpd"
                suggestedPathId="environment-mastery"
            />
        </div>
    )
}
