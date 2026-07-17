import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'
import { AccessibleChart } from '@/components/common/AccessibleChart'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'
import type {
    LookupStrainResult,
    ConfidenceSource,
    FlavonoidDataPoint,
    TerpeneDataPoint,
} from '@/services/strainLookupService'
import { CANNABINOID_COLORS, CHART_CHROME, CHART_STATUS, FLAVONOID_COLORS } from '@/utils/chartPalette'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BAR_COLORS: Record<string, string> = {
    THC: CANNABINOID_COLORS.thc,
    CBD: CANNABINOID_COLORS.cbd,
    CBG: CANNABINOID_COLORS.cbg,
    THCV: CANNABINOID_COLORS.thcv,
    CBC: CANNABINOID_COLORS.cbc,
    CBN: CANNABINOID_COLORS.cbn,
}
const RADAR_COLOR = CANNABINOID_COLORS.thc

// ---------------------------------------------------------------------------
// Confidence badge
// ---------------------------------------------------------------------------

const CONFIDENCE_META: Record<ConfidenceSource, { color: string }> = {
    local: {
        color: 'text-emerald-400 bg-emerald-400/10',
    },
    cannlytics: {
        color: 'text-blue-400 bg-blue-400/10',
    },
    otreeba: { color: 'text-cyan-400 bg-cyan-400/10' },
    'cannabis-api': {
        color: 'text-violet-400 bg-violet-400/10',
    },
    ai: {
        color: 'text-amber-400 bg-amber-400/10',
    },
}

interface ConfidenceBadgeProps {
    source: ConfidenceSource
    score: number
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = memo(({ source, score }) => {
    const { t } = useTranslation()
    const meta = CONFIDENCE_META[source]
    const sourceKey = source === 'cannabis-api' ? 'ai' : source
    const label = t(`strainLookup.confidenceSources.${sourceKey}`)
    return (
        <span
            className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1',
                meta.color,
            )}
            title={t('strainLookup.confidenceTooltip', { label, score })}
        >
            <PhosphorIcons.ShieldCheck className="w-3 h-3" />
            {score}% {label}
        </span>
    )
})
ConfidenceBadge.displayName = 'ConfidenceBadge'

// ---------------------------------------------------------------------------
// Pie chart: THC / CBD / Other
// ---------------------------------------------------------------------------

interface CannabinoidPieProps {
    thc: number
    cbd: number
}

export const CannabinoidPie: React.FC<CannabinoidPieProps> = memo(({ thc, cbd }) => {
    const { t } = useTranslation()
    const other = Math.max(0, 100 - thc - cbd)
    const data = [
        { name: 'THC', value: Math.round(thc * 10) / 10 },
        { name: 'CBD', value: Math.round(cbd * 10) / 10 },
        ...(other > 0.5
            ? [{ name: t('strainLookup.other', 'Other'), value: Math.round(other * 10) / 10 }]
            : []),
    ].filter((d) => d.value > 0)

    return (
        <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {t('strainLookup.cannabinoidBalance', 'Cannabinoid Balance')}
            </p>
            <AccessibleChart
                label={t('common.accessibility.strainCannabinoidBalanceChart')}
                data={data}
                categoryKey="name"
                categoryLabel={t('common.accessibility.chart.cannabinoid')}
                series={[{ dataKey: 'value', label: t('common.accessibility.chart.share') }]}
                height={160}
                className="w-full"
            >
                <PieChart accessibilityLayer>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={index}
                                fill={
                                    entry.name === 'THC'
                                        ? CANNABINOID_COLORS.thc
                                        : entry.name === 'CBD'
                                          ? CANNABINOID_COLORS.cbd
                                          : CHART_CHROME.grid
                                }
                            />
                        ))}
                    </Pie>
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                            <span className="text-xs text-slate-300">{value}</span>
                        )}
                    />
                    <Tooltip
                        formatter={(value: unknown) => {
                            const v = typeof value === 'number' ? value : 0
                            return [`${v.toFixed(1)}%`, '']
                        }}
                        contentStyle={{
                            background: 'rgb(var(--color-bg-component))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                    />
                </PieChart>
            </AccessibleChart>
        </div>
    )
})
CannabinoidPie.displayName = 'CannabinoidPie'

// ---------------------------------------------------------------------------
// Radar chart: Terpene profile
// ---------------------------------------------------------------------------

interface TerpeneRadarProps {
    terpenes: LookupStrainResult['terpenes']
}

export const TerpeneRadar: React.FC<TerpeneRadarProps> = memo(({ terpenes }) => {
    const { t } = useTranslation()
    if (terpenes.length === 0) return null

    const data = terpenes.slice(0, 6).map((tp) => ({
        subject: tp.name,
        value: Math.round(tp.percentage * 10) / 10,
        fullMark: 40,
    }))

    return (
        <div className="flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {t('strainLookup.terpeneProfile', 'Terpene Profile')}
            </p>
            <AccessibleChart
                label={t('common.accessibility.strainTerpeneChart')}
                data={data}
                categoryKey="subject"
                categoryLabel={t('common.accessibility.chart.terpene')}
                series={[{ dataKey: 'value', label: t('common.accessibility.chart.share') }]}
                height={180}
                className="w-full"
            >
                <RadarChart accessibilityLayer cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: CHART_CHROME.label, fontSize: 10 }} />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 40]}
                        tick={{ fill: CHART_CHROME.label, fontSize: 9 }}
                    />
                    <Radar
                        name={t('strainLookup.terpenes', 'Terpenes')}
                        dataKey="value"
                        stroke={RADAR_COLOR}
                        fill={RADAR_COLOR}
                        fillOpacity={0.25}
                    />
                    <Tooltip
                        formatter={(value: unknown) => {
                            const v = typeof value === 'number' ? value : 0
                            return [`${v.toFixed(1)}%`, '']
                        }}
                        contentStyle={{
                            background: 'rgb(var(--color-bg-component))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                    />
                </RadarChart>
            </AccessibleChart>
        </div>
    )
})
TerpeneRadar.displayName = 'TerpeneRadar'

// ---------------------------------------------------------------------------
// Horizontal bar chart: cannabinoid breakdown
// ---------------------------------------------------------------------------

interface CannabinoidBarProps {
    cannabinoids: LookupStrainResult['cannabinoids']
}

export const CannabinoidBar: React.FC<CannabinoidBarProps> = memo(({ cannabinoids }) => {
    const { t } = useTranslation()
    if (cannabinoids.length === 0) return null

    return (
        <div className="flex flex-col">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {t('strainLookup.cannabinoids', 'Cannabinoids')}
            </p>
            <AccessibleChart
                label={t('common.accessibility.strainCannabinoidChart')}
                data={cannabinoids}
                categoryKey="name"
                categoryLabel={t('common.accessibility.chart.cannabinoid')}
                series={[{ dataKey: 'percentage', label: t('common.accessibility.chart.share') }]}
                height={Math.max(80, cannabinoids.length * 28)}
                className="w-full"
            >
                <BarChart
                    accessibilityLayer
                    data={cannabinoids}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                    <XAxis
                        type="number"
                        domain={[0, 'auto']}
                        tick={{ fill: CHART_CHROME.label, fontSize: 10 }}
                        tickFormatter={(v: number) => `${v}%`}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: CHART_CHROME.label, fontSize: 11 }}
                        width={44}
                    />
                    <Tooltip
                        formatter={(value: unknown) => {
                            const v = typeof value === 'number' ? value : 0
                            return [`${v.toFixed(1)}%`, '']
                        }}
                        contentStyle={{
                            background: 'rgb(var(--color-bg-component))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                    />
                    <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                        {cannabinoids.map((c, i) => (
                            <Cell
                                key={i}
                                fill={BAR_COLORS[c.name] ?? CHART_CHROME.label}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </AccessibleChart>
        </div>
    )
})
CannabinoidBar.displayName = 'CannabinoidBar'

// ---------------------------------------------------------------------------
// Entourage score ring
// ---------------------------------------------------------------------------

interface EntourageScoreProps {
    score: number
    diversity?: number
}

export const EntourageScore: React.FC<EntourageScoreProps> = memo(({ score, diversity }) => {
    const { t } = useTranslation()
    const clampedScore = Math.max(0, Math.min(100, score))
    const ringColor =
        clampedScore >= 70
            ? CHART_STATUS.good
            : clampedScore >= 45
              ? CHART_STATUS.warning
              : CHART_STATUS.danger
    const dashArray = 2 * Math.PI * 22 // circumference of r=22
    const dashOffset = dashArray * (1 - clampedScore / 100)
    const label =
        clampedScore >= 70
            ? t('strainLookup.entourage.excellent', 'Excellent')
            : clampedScore >= 45
              ? t('strainLookup.entourage.moderate', 'Moderate')
              : t('strainLookup.entourage.low', 'Low')

    return (
        <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {t('strainLookup.entourage.title', 'Entourage Score')}
            </p>
            <div className="relative w-16 h-16">
                <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90">
                    <circle
                        cx="26"
                        cy="26"
                        r="22"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="5"
                    />
                    <circle
                        cx="26"
                        cy="26"
                        r="22"
                        fill="none"
                        stroke={ringColor}
                        strokeWidth="5"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-slate-100">
                    {clampedScore}
                </span>
            </div>
            <span className="text-xs font-semibold" style={{ color: ringColor }}>
                {label}
            </span>
            {diversity !== undefined && diversity > 0 && (
                <span className="text-3xs text-slate-500">H={diversity.toFixed(2)}</span>
            )}
        </div>
    )
})
EntourageScore.displayName = 'EntourageScore'

// ---------------------------------------------------------------------------
// Flavonoid bar chart
// ---------------------------------------------------------------------------

interface FlavonoidBarProps {
    flavonoids: FlavonoidDataPoint[]
}

export const FlavonoidBar: React.FC<FlavonoidBarProps> = memo(({ flavonoids }) => {
    const { t } = useTranslation()
    if (flavonoids.length === 0) return null

    const data = flavonoids.map((f) => ({
        name: f.name.replace('Cannflavin ', 'CF-'),
        fullName: f.name,
        score: f.entourageScore ?? 0,
    }))

    return (
        <div className="flex flex-col">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {t('strainLookup.flavonoids', 'Flavonoids')}
            </p>
            <AccessibleChart
                label={t('common.accessibility.strainFlavonoidChart')}
                data={data}
                categoryKey="fullName"
                categoryLabel={t('common.accessibility.chart.flavonoid')}
                series={[{ dataKey: 'score', label: t('common.accessibility.chart.value') }]}
                height={Math.max(80, data.length * 28)}
                className="w-full"
            >
                <BarChart
                    accessibilityLayer
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                    <XAxis
                        type="number"
                        domain={[0, 10]}
                        tick={{ fill: CHART_CHROME.label, fontSize: 10 }}
                        tickFormatter={(v: number) => v.toFixed(0)}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: CHART_CHROME.label, fontSize: 11 }}
                        width={52}
                    />
                    <Tooltip
                        formatter={(
                            value: unknown,
                            _name: unknown,
                            props: { payload?: { fullName?: string } },
                        ) => {
                            const v = typeof value === 'number' ? value : 0
                            const fname = props.payload?.fullName ?? ''
                            return [`${v.toFixed(1)} / 10`, fname]
                        }}
                        contentStyle={{
                            background: 'rgb(var(--color-bg-component))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {data.map((d, i) => (
                            <Cell key={i} fill={FLAVONOID_COLORS[d.fullName] ?? CHART_CHROME.label} />
                        ))}
                    </Bar>
                </BarChart>
            </AccessibleChart>
        </div>
    )
})
FlavonoidBar.displayName = 'FlavonoidBar'

// ---------------------------------------------------------------------------
// Terpene detail list (aromaNotes + interactions)
// ---------------------------------------------------------------------------

interface TerpeneDetailListProps {
    terpenes: TerpeneDataPoint[]
}

export const TerpeneDetailList: React.FC<TerpeneDetailListProps> = memo(({ terpenes }) => {
    const { t } = useTranslation()
    const dominant = terpenes
        .filter((tp) => tp.role === 'dominant' || tp.role === 'secondary')
        .slice(0, 3)
    if (dominant.length === 0) return null

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {t('strainLookup.terpeneDetails', 'Terpene Insights')}
            </p>
            {dominant.map((tp) => (
                <div
                    key={tp.name}
                    className="rounded-lg bg-slate-800/60 border border-white/5 p-3 space-y-1.5"
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-200">{tp.name}</span>
                        <div className="flex items-center gap-1.5">
                            {tp.role && (
                                <span
                                    className={cn(
                                        'text-3xs font-semibold px-1.5 py-0.5 rounded-full',
                                        tp.role === 'dominant'
                                            ? 'text-emerald-400 bg-emerald-400/10'
                                            : 'text-slate-400 bg-slate-400/10',
                                    )}
                                >
                                    {tp.role}
                                </span>
                            )}
                            {tp.entourageScore !== undefined && (
                                <span className="text-3xs text-amber-400 font-semibold">
                                    EES {tp.entourageScore}/10
                                </span>
                            )}
                        </div>
                    </div>
                    {tp.aromaNotes && tp.aromaNotes.length > 0 && (
                        <p className="text-xs text-slate-400">{tp.aromaNotes.join(', ')}</p>
                    )}
                    {tp.primaryEffects && tp.primaryEffects.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {tp.primaryEffects.map((eff) => (
                                <span
                                    key={eff}
                                    className="text-3xs px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400 border border-primary-500/15"
                                >
                                    {eff}
                                </span>
                            ))}
                        </div>
                    )}
                    {tp.cannabinoidInteractions && tp.cannabinoidInteractions.length > 0 && (
                        <div className="space-y-0.5 pt-1 border-t border-white/5">
                            {tp.cannabinoidInteractions.slice(0, 2).map((ix, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-1.5 text-3xs text-slate-400"
                                >
                                    <span
                                        className={cn(
                                            'shrink-0 font-semibold',
                                            ix.strength === 'high'
                                                ? 'text-emerald-400'
                                                : ix.strength === 'medium'
                                                  ? 'text-amber-400'
                                                  : 'text-slate-500',
                                        )}
                                    >
                                        {ix.cannabinoid}
                                    </span>
                                    <span>{ix.effect}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
})
TerpeneDetailList.displayName = 'TerpeneDetailList'

// ---------------------------------------------------------------------------
// Genetics tree (simple parent display)
// ---------------------------------------------------------------------------

interface GeneticsTreeProps {
    genetics: string
    parentA?: string | undefined
    parentB?: string | undefined
}

export const GeneticsTree: React.FC<GeneticsTreeProps> = memo(({ genetics, parentA, parentB }) => {
    const { t } = useTranslation()
    const parts = genetics
        .split(/\s*[xX\u00d7]\s*/)
        .map((p) => p.trim())
        .filter(Boolean)
    const pA = parentA ?? parts[0]
    const pB = parentB ?? parts[1]

    if (!pA && !pB && !genetics) return null

    return (
        <div className="mt-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {t('strainLookup.genetics', 'Genetics')}
            </p>
            {pA || pB ? (
                <div className="flex items-center gap-2 flex-wrap">
                    {pA && (
                        <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            {pA}
                        </span>
                    )}
                    {pA && pB && <span className="text-slate-500 text-xs font-bold">x</span>}
                    {pB && (
                        <span className="text-xs px-2 py-1 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20">
                            {pB}
                        </span>
                    )}
                </div>
            ) : (
                <p className="text-xs text-slate-400">{genetics}</p>
            )}
        </div>
    )
})
GeneticsTree.displayName = 'GeneticsTree'
