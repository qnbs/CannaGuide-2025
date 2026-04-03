import React, { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react'
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
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { selectUserStrains } from '@/stores/selectors'
import { addUserStrainWithValidation } from '@/stores/slices/userStrainsSlice'
import { toggleFavorite } from '@/stores/slices/favoritesSlice'
import { resolveDiscoveredToStrain } from '@/services/dailyStrainsService'
import {
    lookupStrain,
    getFuzzySuggestions,
    type LookupStrainResult,
    type ConfidenceSource,
    type FlavonoidDataPoint,
    type TerpeneDataPoint,
} from '@/services/strainLookupService'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIE_COLORS = ['#10b981', '#3b82f6', '#475569'] // THC emerald, CBD blue, other slate
const BAR_COLORS: Record<string, string> = {
    THC: '#10b981',
    CBD: '#3b82f6',
    CBG: '#a855f7',
    THCV: '#f97316',
    CBC: '#eab308',
    CBN: '#6366f1',
}
const RADAR_COLOR = '#10b981'

// ---------------------------------------------------------------------------
// Confidence badge
// ---------------------------------------------------------------------------

const CONFIDENCE_META: Record<ConfidenceSource, { label: string; labelDe: string; color: string }> =
    {
        local: {
            label: 'Local Catalog',
            labelDe: 'Lokaler Katalog',
            color: 'text-emerald-400 bg-emerald-400/10',
        },
        cannlytics: {
            label: 'Cannlytics Labs',
            labelDe: 'Cannlytics Labs',
            color: 'text-blue-400 bg-blue-400/10',
        },
        otreeba: { label: 'Otreeba', labelDe: 'Otreeba', color: 'text-cyan-400 bg-cyan-400/10' },
        'cannabis-api': {
            label: 'Cannabis API',
            labelDe: 'Cannabis API',
            color: 'text-violet-400 bg-violet-400/10',
        },
        ai: {
            label: 'AI Generated',
            labelDe: 'KI-generiert',
            color: 'text-amber-400 bg-amber-400/10',
        },
    }

interface ConfidenceBadgeProps {
    source: ConfidenceSource
    score: number
}

const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = memo(({ source, score }) => {
    const { i18n } = useTranslation()
    const meta = CONFIDENCE_META[source]
    const label = i18n.language.startsWith('de') ? meta.labelDe : meta.label
    return (
        <span
            className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1',
                meta.color,
            )}
            title={`${label} -- ${score}% confidence`}
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

const CannabinoidPie: React.FC<CannabinoidPieProps> = memo(({ thc, cbd }) => {
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
            <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((_entry, index) => (
                            <Cell
                                key={index}
                                fill={PIE_COLORS[index % PIE_COLORS.length] as string}
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
                            background: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
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

const TerpeneRadar: React.FC<TerpeneRadarProps> = memo(({ terpenes }) => {
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
            <ResponsiveContainer width="100%" height={180}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 40]}
                        tick={{ fill: '#64748b', fontSize: 9 }}
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
                            background: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
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

const CannabinoidBar: React.FC<CannabinoidBarProps> = memo(({ cannabinoids }) => {
    const { t } = useTranslation()
    if (cannabinoids.length === 0) return null

    return (
        <div className="flex flex-col">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {t('strainLookup.cannabinoids', 'Cannabinoids')}
            </p>
            <ResponsiveContainer width="100%" height={Math.max(80, cannabinoids.length * 28)}>
                <BarChart
                    data={cannabinoids}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                    <XAxis
                        type="number"
                        domain={[0, 'auto']}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        tickFormatter={(v: number) => `${v}%`}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        width={44}
                    />
                    <Tooltip
                        formatter={(value: unknown) => {
                            const v = typeof value === 'number' ? value : 0
                            return [`${v.toFixed(1)}%`, '']
                        }}
                        contentStyle={{
                            background: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                    />
                    <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                        {cannabinoids.map((c, i) => (
                            <Cell
                                key={i}
                                fill={
                                    BAR_COLORS[c.name] !== undefined
                                        ? (BAR_COLORS[c.name] as string)
                                        : '#6366f1'
                                }
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
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

const EntourageScore: React.FC<EntourageScoreProps> = memo(({ score, diversity }) => {
    const { t } = useTranslation()
    const clampedScore = Math.max(0, Math.min(100, score))
    const ringColor = clampedScore >= 70 ? '#10b981' : clampedScore >= 45 ? '#f59e0b' : '#ef4444'
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
                <span className="text-[10px] text-slate-500">H={diversity.toFixed(2)}</span>
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

const FLAVONOID_COLORS: Record<string, string> = {
    'Cannflavin A': '#f59e0b',
    'Cannflavin B': '#f97316',
    Quercetin: '#84cc16',
    Apigenin: '#22d3ee',
    Luteolin: '#a78bfa',
    Kaempferol: '#fb7185',
}

const FlavonoidBar: React.FC<FlavonoidBarProps> = memo(({ flavonoids }) => {
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
            <ResponsiveContainer width="100%" height={Math.max(80, data.length * 28)}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                    <XAxis
                        type="number"
                        domain={[0, 10]}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        tickFormatter={(v: number) => v.toFixed(0)}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
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
                            background: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {data.map((d, i) => (
                            <Cell key={i} fill={FLAVONOID_COLORS[d.fullName] ?? '#6366f1'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
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

const TerpeneDetailList: React.FC<TerpeneDetailListProps> = memo(({ terpenes }) => {
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
                                        'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                                        tp.role === 'dominant'
                                            ? 'text-emerald-400 bg-emerald-400/10'
                                            : 'text-slate-400 bg-slate-400/10',
                                    )}
                                >
                                    {tp.role}
                                </span>
                            )}
                            {tp.entourageScore !== undefined && (
                                <span className="text-[10px] text-amber-400 font-semibold">
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
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-400 border border-primary-500/15"
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
                                    className="flex items-start gap-1.5 text-[10px] text-slate-400"
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

const GeneticsTree: React.FC<GeneticsTreeProps> = memo(({ genetics, parentA, parentB }) => {
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

// ---------------------------------------------------------------------------
// Result card
// ---------------------------------------------------------------------------

interface ResultCardProps {
    result: LookupStrainResult
    matchScore: number
    onAddToLibrary: (result: LookupStrainResult) => void
    onToggleFavorite: (result: LookupStrainResult) => void
    onFindSimilar: (result: LookupStrainResult) => void
    onOpenBreeding: (result: LookupStrainResult) => void
    onShare: (result: LookupStrainResult) => void
    isInLibrary: boolean
    isFavorited: boolean
}

const ResultCard: React.FC<ResultCardProps> = memo(
    ({
        result,
        matchScore,
        onAddToLibrary,
        onToggleFavorite,
        onFindSimilar,
        onOpenBreeding,
        onShare,
        isInLibrary,
        isFavorited,
    }) => {
        const { t } = useTranslation()

        const typeColor =
            result.type === 'Indica'
                ? 'text-purple-400 bg-purple-400/10'
                : result.type === 'Sativa'
                  ? 'text-orange-400 bg-orange-400/10'
                  : 'text-emerald-400 bg-emerald-400/10'

        const hasTerpenes = result.terpenes.length > 0
        const hasCannabinoids = result.cannabinoids.length > 1

        return (
            <Card className="overflow-hidden border border-primary-500/20 bg-gradient-to-b from-slate-800/80 to-slate-900/80">
                {/* Header gradient bar */}
                <div className="h-1 bg-gradient-to-r from-emerald-500 via-primary-500 to-purple-500" />

                <div className="p-4 md:p-6 space-y-5">
                    {/* Top row: name + badges */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                            <h3 className="text-xl md:text-2xl font-extrabold text-slate-100 leading-tight">
                                {result.name}
                            </h3>
                            {result.breeder &&
                                result.breeder !== 'Community' &&
                                result.breeder !== 'Unknown' && (
                                    <p className="text-sm text-slate-400 mt-0.5">
                                        {result.breeder}
                                    </p>
                                )}
                        </div>
                        <div className="flex flex-wrap gap-2 shrink-0 items-center">
                            <span
                                className={cn(
                                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                                    typeColor,
                                )}
                            >
                                {result.type}
                            </span>
                            {result.floweringType === 'Autoflower' && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-cyan-400 bg-cyan-400/10">
                                    Auto
                                </span>
                            )}
                            {matchScore >= 60 && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-amber-400 bg-amber-400/10">
                                    {matchScore}% {t('strainLookup.match', 'match')}
                                </span>
                            )}
                            <ConfidenceBadge
                                source={result.confidenceSource}
                                score={result.confidenceScore}
                            />
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex gap-4 text-sm flex-wrap">
                        {result.thc > 0 && (
                            <span className="text-emerald-400 font-semibold">
                                THC {result.thc.toFixed(1)}%
                            </span>
                        )}
                        {result.cbd > 0 && (
                            <span className="text-blue-400 font-semibold">
                                CBD {result.cbd.toFixed(1)}%
                            </span>
                        )}
                        {result.cbg > 0 && (
                            <span className="text-purple-400 font-semibold">
                                CBG {result.cbg.toFixed(1)}%
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    {result.description && (
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {result.description}
                        </p>
                    )}

                    {/* AI insight */}
                    {result.aiSummary && (
                        <div className="rounded-lg bg-primary-500/5 border border-primary-500/15 p-3">
                            <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                                <PhosphorIcons.Sparkle className="w-3.5 h-3.5" />
                                {t('strainLookup.whyMatters', 'Why this strain matters')}
                            </p>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {result.aiSummary}
                            </p>
                        </div>
                    )}

                    {/* Charts grid */}
                    {(result.thc > 0 || hasTerpenes || hasCannabinoids) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                            {result.thc > 0 && <CannabinoidPie thc={result.thc} cbd={result.cbd} />}
                            {hasTerpenes && <TerpeneRadar terpenes={result.terpenes} />}
                            {hasCannabinoids && (
                                <CannabinoidBar cannabinoids={result.cannabinoids} />
                            )}
                        </div>
                    )}

                    {/* Entourage score + flavonoid row */}
                    {(result.totalEntourageScore !== undefined ||
                        (result.flavonoids && result.flavonoids.length > 0)) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4 items-start">
                            {result.totalEntourageScore !== undefined && (
                                <div className="flex justify-center sm:justify-start">
                                    <EntourageScore
                                        score={result.totalEntourageScore}
                                        diversity={result.terpeneDiversity}
                                    />
                                </div>
                            )}
                            {result.flavonoids && result.flavonoids.length > 0 && (
                                <div className="sm:col-span-2">
                                    <FlavonoidBar flavonoids={result.flavonoids} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Terpene detail insights */}
                    {hasTerpenes &&
                        result.terpenes.some((tp) => tp.aromaNotes && tp.aromaNotes.length > 0) && (
                            <TerpeneDetailList terpenes={result.terpenes} />
                        )}

                    {/* Genetics */}
                    {result.genetics && <GeneticsTree genetics={result.genetics} />}

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                        {isInLibrary ? (
                            <span className="text-sm text-emerald-400 flex items-center gap-1.5 px-3">
                                <PhosphorIcons.CheckCircle className="w-4 h-4" />
                                {t('strainLookup.inLibrary', 'In Library')}
                            </span>
                        ) : (
                            <Button
                                onClick={() => onAddToLibrary(result)}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-primary-600 hover:from-emerald-500 hover:to-primary-500"
                            >
                                <PhosphorIcons.Database className="w-4 h-4" />
                                {t('strainLookup.addToDB', 'Add to Library')}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={() => onToggleFavorite(result)}
                            className={cn(
                                'flex items-center gap-1.5',
                                isFavorited && 'text-amber-400',
                            )}
                            title={
                                isFavorited
                                    ? t('strainLookup.unfavorite', 'Remove from Favorites')
                                    : t('strainLookup.favorite', 'Add to Favorites')
                            }
                        >
                            <PhosphorIcons.Heart
                                className={cn('w-4 h-4', isFavorited && 'fill-amber-400')}
                            />
                            {t('strainLookup.favorite', 'Favorites')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => onOpenBreeding(result)}
                            className="flex items-center gap-1.5"
                            title={t('strainLookup.breedingLab', 'Open in Breeding Lab')}
                        >
                            <PhosphorIcons.Flask className="w-4 h-4" />
                            {t('strainLookup.breedingLab', 'Breeding Lab')}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => onFindSimilar(result)}
                            className="flex items-center gap-1.5"
                            title={t('strainLookup.findSimilar', 'Find Similar Strains')}
                        >
                            <PhosphorIcons.GridFour className="w-4 h-4" />
                            {t('strainLookup.findSimilar', 'Similar')}
                        </Button>
                        {'share' in navigator && (
                            <Button
                                variant="ghost"
                                onClick={() => onShare(result)}
                                className="flex items-center gap-1.5"
                                title={t('strainLookup.share', 'Share Strain')}
                            >
                                <PhosphorIcons.ShareNetwork className="w-4 h-4" />
                                {t('strainLookup.share', 'Share')}
                            </Button>
                        )}
                        {result.sourceUrl && (
                            <a
                                href={result.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <PhosphorIcons.ArrowSquareOut className="w-4 h-4" />
                                {t('strainLookup.source', 'Source')}
                            </a>
                        )}
                    </div>
                </div>
            </Card>
        )
    },
)
ResultCard.displayName = 'ResultCard'

// ---------------------------------------------------------------------------
// Main StrainLookupSection
// ---------------------------------------------------------------------------

export const StrainLookupSection: React.FC = memo(() => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<LookupStrainResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [addedFeedback, setAddedFeedback] = useState<string | null>(null)

    const inputRef = useRef<HTMLInputElement>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    const userStrains = useAppSelector(selectUserStrains)
    const favoriteIds = useAppSelector((s) => s.favorites.favoriteIds)

    const userStrainIds = useMemo(
        () => new Set((userStrains ?? []).map((s) => s.id)),
        [userStrains],
    )

    const isInLibrary = result !== null && userStrainIds.has(result.id)
    const isFavorited = result !== null && favoriteIds.includes(result.id)

    // Compute match score from user library
    const matchScore = useMemo(() => {
        if (!result || !userStrains || userStrains.length === 0) return 0
        let score = 40
        const typeCounts: Record<string, number> = {}
        let thcSum = 0
        let cbdSum = 0
        for (const s of userStrains) {
            if (s.type) typeCounts[s.type] = (typeCounts[s.type] ?? 0) + 1
            thcSum += s.thc ?? 0
            cbdSum += s.cbd ?? 0
        }
        const total = userStrains.length
        const avgThc = thcSum / total
        const avgCbd = cbdSum / total
        const typeRatio = (typeCounts[result.type] ?? 0) / total
        score += typeRatio * 30
        if (result.thc > 0) score += Math.max(0, 20 - Math.abs(result.thc - avgThc))
        if (result.cbd > 0) score += Math.max(0, 10 - Math.abs(result.cbd - avgCbd) * 5)
        return Math.min(100, Math.max(0, Math.round(score)))
    }, [result, userStrains])

    // Real-time suggestions
    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([])
            return
        }
        setSuggestions(getFuzzySuggestions(query, 8))
    }, [query])

    // Close suggestions on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSearch = useCallback(
        async (searchQuery: string) => {
            const q = searchQuery.trim()
            if (q.length < 2) return
            setIsLoading(true)
            setError(null)
            setResult(null)
            setShowSuggestions(false)
            setAddedFeedback(null)
            try {
                const found = await lookupStrain(q)
                if (found) {
                    setResult(found)
                } else {
                    setError(
                        t(
                            'strainLookup.notFound',
                            'No data found for "{{name}}". Try a different spelling.',
                            { name: q },
                        ),
                    )
                }
            } catch {
                setError(t('strainLookup.lookupError', 'Lookup failed. Please try again.'))
            } finally {
                setIsLoading(false)
            }
        },
        [t],
    )

    const handleSubmit = useCallback(() => {
        void handleSearch(query)
    }, [handleSearch, query])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') void handleSearch(query)
            if (e.key === 'Escape') {
                setShowSuggestions(false)
                inputRef.current?.blur()
            }
        },
        [handleSearch, query],
    )

    const handleSuggestionClick = useCallback(
        (name: string) => {
            setQuery(name)
            void handleSearch(name)
        },
        [handleSearch],
    )

    const handleAddToLibrary = useCallback(
        (r: LookupStrainResult) => {
            const discovered = {
                id: r.id,
                name: r.name,
                breeder: r.breeder,
                type: r.type,
                floweringType: r.floweringType,
                thc: r.thc,
                cbd: r.cbd,
                description: r.description,
                genetics: r.genetics,
                source: 'ai-lookup' as const,
                sourceUrl: r.sourceUrl,
                discoveredAt: r.discoveredAt,
            }
            const fullStrain = r.fullStrain ?? resolveDiscoveredToStrain(discovered)
            void dispatch(addUserStrainWithValidation(fullStrain))
            setAddedFeedback(
                t('strainLookup.addedSuccess', '{{name}} added to your library!', {
                    name: r.name,
                }),
            )
            setTimeout(() => setAddedFeedback(null), 3500)
        },
        [dispatch, t],
    )

    const handleToggleFavorite = useCallback(
        (r: LookupStrainResult) => {
            dispatch(toggleFavorite(r.id))
        },
        [dispatch],
    )

    // Stub navigation callbacks (wired to existing UI patterns)
    const handleFindSimilar = useCallback(
        (r: LookupStrainResult) => {
            // Pre-fill the existing search field with the strain name to find similar
            setQuery(r.name)
            void handleSearch(r.name)
        },
        [handleSearch],
    )

    const handleOpenBreeding = useCallback((r: LookupStrainResult) => {
        if (r.fullStrain) {
            void import('@/stores/useUIStore').then(({ getUISnapshot }) => {
                getUISnapshot().openAddModal(r.fullStrain)
            })
        }
    }, [])

    const handleShare = useCallback((r: LookupStrainResult) => {
        const lines: string[] = [
            r.name,
            r.type !== 'Unknown' ? r.type : '',
            r.thc > 0 ? `THC ${r.thc.toFixed(1)}%` : '',
            r.cbd > 0 ? `CBD ${r.cbd.toFixed(1)}%` : '',
            r.description ?? '',
        ].filter(Boolean)
        void navigator
            .share({
                title: r.name,
                text: lines.join(' | '),
                url: r.sourceUrl ?? window.location.href,
            })
            .catch(() => {
                // user cancelled or share not supported -- silently ignore
            })
    }, [])

    const handleClear = useCallback(() => {
        setQuery('')
        setResult(null)
        setError(null)
        setAddedFeedback(null)
        inputRef.current?.focus()
    }, [])

    return (
        <div className="space-y-4">
            {/* Hero search card */}
            <Card className="relative overflow-hidden border border-primary-500/20">
                {/* Background decoration */}
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{
                        background:
                            'radial-gradient(ellipse at 80% 50%, #10b981 0%, transparent 60%)',
                    }}
                />

                <div className="relative p-4 md:p-6 space-y-3">
                    {/* Section label */}
                    <div className="flex items-center gap-2">
                        <PhosphorIcons.MagnifyingGlass className="w-5 h-5 text-primary-400" />
                        <span className="text-sm font-semibold text-primary-400 uppercase tracking-wide">
                            {t('strainLookup.sectionLabel', 'Strain Intelligence Lookup')}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">
                        {t(
                            'strainLookup.sectionHint',
                            'Local catalog + Cannlytics lab data + Open Cannabis APIs + AI -- multi-layer lookup',
                        )}
                    </p>

                    {/* Search input + button */}
                    <div className="relative flex gap-2">
                        <div className="relative flex-1">
                            <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value)
                                    setShowSuggestions(true)
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder={t(
                                    'strainLookup.placeholder',
                                    'New strain discovered? Enter name (e.g. Gorilla Pie, Lemon Cherry Gelato...)',
                                )}
                                className={cn(
                                    'w-full pl-11 pr-10 py-3 rounded-xl text-slate-100',
                                    'bg-slate-800/80 border border-white/10',
                                    'placeholder-slate-500 text-sm',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500/40',
                                    'transition-all duration-200',
                                )}
                                aria-label={t('strainLookup.placeholder', 'Search strain')}
                                aria-autocomplete="list"
                                aria-expanded={showSuggestions && suggestions.length > 0}
                            />
                            {query && (
                                <button
                                    onClick={handleClear}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    aria-label={t('strainLookup.clear', 'Clear')}
                                >
                                    <PhosphorIcons.X className="w-4 h-4" />
                                </button>
                            )}

                            {/* Suggestions dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className={cn(
                                        'absolute left-0 right-0 top-full mt-1 z-50',
                                        'bg-slate-800 border border-white/10 rounded-xl shadow-2xl',
                                        'overflow-hidden',
                                    )}
                                    role="listbox"
                                >
                                    {suggestions.map((s) => (
                                        <button
                                            key={s}
                                            role="option"
                                            aria-selected={false}
                                            onClick={() => handleSuggestionClick(s)}
                                            className={cn(
                                                'w-full text-left px-4 py-2.5 text-sm text-slate-200',
                                                'hover:bg-primary-500/10 hover:text-primary-300',
                                                'flex items-center gap-2 transition-colors',
                                            )}
                                        >
                                            <PhosphorIcons.Leafy className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || query.trim().length < 2}
                            className="px-5 py-3 rounded-xl font-semibold whitespace-nowrap"
                        >
                            {isLoading ? (
                                <PhosphorIcons.ArrowClockwise className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <PhosphorIcons.Sparkle className="w-4 h-4 mr-1.5" />
                                    {t('strainLookup.analyze', 'Analyze')}
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex items-center gap-3 py-2">
                            <div className="flex gap-1">
                                {(
                                    [
                                        'local',
                                        'cannlytics',
                                        'otreeba',
                                        'cannabis-api',
                                        'ai',
                                    ] as ConfidenceSource[]
                                ).map((src, i) => (
                                    <span
                                        key={src}
                                        className={cn(
                                            'text-xs px-2 py-0.5 rounded-full animate-pulse border',
                                            i === 0
                                                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                                                : i === 1
                                                  ? 'text-blue-400 border-blue-500/30 bg-blue-500/5'
                                                  : i === 2
                                                    ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5'
                                                    : i === 3
                                                      ? 'text-violet-400 border-violet-500/30 bg-violet-500/5'
                                                      : 'text-amber-400 border-amber-500/30 bg-amber-500/5',
                                        )}
                                        style={{ animationDelay: `${i * 0.15}s` }}
                                    >
                                        {src}
                                    </span>
                                ))}
                            </div>
                            <span className="text-xs text-slate-500">
                                {t('strainLookup.searching', 'Searching all sources...')}
                            </span>
                        </div>
                    )}

                    {/* Success feedback */}
                    {addedFeedback && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm py-1">
                            <PhosphorIcons.CheckCircle className="w-4 h-4" />
                            {addedFeedback}
                        </div>
                    )}

                    {/* Error state */}
                    {error && !isLoading && (
                        <div className="flex items-center gap-2 text-amber-400 text-sm py-1">
                            <PhosphorIcons.Warning className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>
            </Card>

            {/* Result card */}
            {result && !isLoading && (
                <ResultCard
                    result={result}
                    matchScore={matchScore}
                    onAddToLibrary={handleAddToLibrary}
                    onToggleFavorite={handleToggleFavorite}
                    onFindSimilar={handleFindSimilar}
                    onOpenBreeding={handleOpenBreeding}
                    onShare={handleShare}
                    isInLibrary={isInLibrary}
                    isFavorited={isFavorited}
                />
            )}
        </div>
    )
})

StrainLookupSection.displayName = 'StrainLookupSection'
