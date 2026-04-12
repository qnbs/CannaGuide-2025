import React, { useState, useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts'
import { Strain, YieldLevel } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectFavoriteIds } from '@/stores/selectors'
import { toggleFavorite } from '@/stores/slices/favoritesSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_STRAINS = 3

const RADAR_COLORS = ['#4ade80', '#60a5fa', '#f472b6'] as const

// Normalize yield level to a numeric 0-100 score
const yieldLevelToScore = (level: YieldLevel): number => {
    if (level === 'High') return 90
    if (level === 'Medium') return 60
    return 30
}

// Normalize THC % (0-35 typical max) to 0-100
const normalizeTHC = (thc: number): number => Math.min(100, Math.round((thc / 35) * 100))

// Normalize CBD % (0-20 typical max) to 0-100
const normalizeCBD = (cbd: number): number => Math.min(100, Math.round((cbd / 20) * 100))

// Normalize flowering time: shorter = higher score. Range 56-112 days.
const normalizeFloweringTime = (days: number): number =>
    Math.max(0, Math.min(100, Math.round(((112 - days) / 56) * 100)))

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RadarDataPoint {
    metric: string
    [strainName: string]: string | number
}

interface StrainComparisonViewProps {
    allStrains: Strain[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StrainComparisonView: React.FC<StrainComparisonViewProps> = memo(({ allStrains }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const favoriteIds = useAppSelector(selectFavoriteIds)
    const [selectedStrains, setSelectedStrains] = useState<Strain[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return []
        const q = searchQuery.toLowerCase()
        const selectedIds = new Set(selectedStrains.map((s) => s.id))
        return allStrains
            .filter((s) => !selectedIds.has(s.id) && s.name.toLowerCase().includes(q))
            .slice(0, 8)
    }, [searchQuery, allStrains, selectedStrains])

    const favoriteStrains = useMemo(() => {
        const selectedIds = new Set(selectedStrains.map((s) => s.id))
        return allStrains.filter((s) => favoriteIds.has(s.id) && !selectedIds.has(s.id))
    }, [allStrains, favoriteIds, selectedStrains])

    const handleAddStrain = useCallback(
        (strain: Strain) => {
            if (selectedStrains.length >= MAX_STRAINS) return
            setSelectedStrains((prev) => [...prev, strain])
            setSearchQuery('')
        },
        [selectedStrains.length],
    )

    const handleRemoveStrain = useCallback((id: string) => {
        setSelectedStrains((prev) => prev.filter((s) => s.id !== id))
    }, [])

    const handleToggleFavorite = useCallback(
        (id: string) => {
            dispatch(toggleFavorite(id))
        },
        [dispatch],
    )

    const radarData: RadarDataPoint[] = useMemo(() => {
        if (selectedStrains.length === 0) return []
        const metrics = [
            t('strainsView.comparison.thc'),
            t('strainsView.comparison.cbd'),
            t('strainsView.comparison.yield'),
            t('strainsView.comparison.floweringTime'),
        ]
        return metrics.map((metric, i) => {
            const point: RadarDataPoint = { metric }
            selectedStrains.forEach((strain) => {
                if (i === 0) point[strain.name] = normalizeTHC(strain.thc)
                else if (i === 1) point[strain.name] = normalizeCBD(strain.cbd)
                else if (i === 2) point[strain.name] = yieldLevelToScore(strain.agronomic.yield)
                else point[strain.name] = normalizeFloweringTime(strain.floweringTime)
            })
            return point
        })
    }, [selectedStrains, t])

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">{t('strainsView.comparison.title')}</h2>

            {/* Search box */}
            <div className="relative">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('strainsView.comparison.addStrain')}
                            disabled={selectedStrains.length >= MAX_STRAINS}
                            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg pl-9 pr-4 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={t('strainsView.comparison.addStrain')}
                        />
                    </div>
                </div>
                {selectedStrains.length >= MAX_STRAINS && (
                    <p className="mt-1.5 text-xs text-amber-400">
                        {t('strainsView.comparison.maxReached')}
                    </p>
                )}
                {/* Autocomplete suggestions */}
                {filteredSuggestions.length > 0 && (
                    <div
                        role="listbox"
                        aria-label={t('strainsView.comparison.addStrain')}
                        className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden"
                    >
                        {filteredSuggestions.map((strain) => (
                            <div
                                key={strain.id}
                                role="option"
                                aria-selected={false}
                                aria-label={strain.name}
                            >
                                <button
                                    type="button"
                                    onClick={() => handleAddStrain(strain)}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                                >
                                    <span>{strain.name}</span>
                                    <span className="text-xs text-slate-400">{strain.type}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Favorites quick-add */}
            {favoriteStrains.length > 0 && selectedStrains.length < MAX_STRAINS && (
                <div>
                    <p className="text-xs text-slate-400 mb-2">{t('strainsView.favorites')}</p>
                    <div className="flex flex-wrap gap-2">
                        {favoriteStrains.slice(0, 6).map((strain) => (
                            <button
                                key={strain.id}
                                type="button"
                                onClick={() => handleAddStrain(strain)}
                                className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-full px-3 py-1 transition-colors"
                            >
                                <PhosphorIcons.Heart
                                    className="w-3 h-3 text-red-400"
                                    weight="fill"
                                />
                                {strain.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {selectedStrains.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <PhosphorIcons.Columns className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">{t('strainsView.comparison.emptyHint')}</p>
                </div>
            )}

            {/* Selected strain cards */}
            {selectedStrains.length > 0 && (
                <>
                    {/* Radar chart */}
                    <div
                        className="bg-slate-800/50 rounded-xl p-4"
                        role="img"
                        aria-label={t('common.accessibility.strainRadarChart')}
                    >
                        <ResponsiveContainer width="100%" minHeight={280}>
                            <RadarChart data={radarData} outerRadius="60%">
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis
                                    dataKey="metric"
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                />
                                <PolarRadiusAxis
                                    angle={30}
                                    domain={[0, 100]}
                                    tick={{ fill: '#64748b', fontSize: 10 }}
                                />
                                {selectedStrains.map((strain, i) => (
                                    <Radar
                                        key={strain.id}
                                        name={strain.name}
                                        dataKey={strain.name}
                                        stroke={RADAR_COLORS[i]}
                                        fill={RADAR_COLORS[i]}
                                        fillOpacity={0.15}
                                    />
                                ))}
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        color: '#e2e8f0',
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Comparison table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-700">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-800">
                                    <th className="text-left px-4 py-3 text-slate-400 font-semibold w-36">
                                        --
                                    </th>
                                    {selectedStrains.map((strain, i) => (
                                        <th key={strain.id} className="px-4 py-3 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span
                                                    className="font-bold"
                                                    style={{ color: RADAR_COLORS[i] }}
                                                >
                                                    {strain.name}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleToggleFavorite(strain.id)
                                                        }
                                                        aria-label={
                                                            favoriteIds.has(strain.id)
                                                                ? t('strainsView.unfavorite')
                                                                : t('strainsView.favorite')
                                                        }
                                                        className="text-slate-400 hover:text-red-400 transition-colors"
                                                    >
                                                        <PhosphorIcons.Heart
                                                            className="w-4 h-4"
                                                            weight={
                                                                favoriteIds.has(strain.id)
                                                                    ? 'fill'
                                                                    : 'regular'
                                                            }
                                                            style={{
                                                                color: favoriteIds.has(strain.id)
                                                                    ? '#f87171'
                                                                    : undefined,
                                                            }}
                                                        />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveStrain(strain.id)
                                                        }
                                                        aria-label={t(
                                                            'strainsView.comparison.removeStrain',
                                                        )}
                                                        className="text-slate-400 hover:text-red-400 transition-colors"
                                                    >
                                                        <PhosphorIcons.X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                <ComparisonRow
                                    label={t('strainsView.comparison.type')}
                                    values={selectedStrains.map((s) => s.type)}
                                />
                                <ComparisonRow
                                    label={`${t('strainsView.comparison.thc')} %`}
                                    values={selectedStrains.map((s) => s.thcRange ?? `${s.thc}%`)}
                                />
                                <ComparisonRow
                                    label={`${t('strainsView.comparison.cbd')} %`}
                                    values={selectedStrains.map((s) => s.cbdRange ?? `${s.cbd}%`)}
                                />
                                <ComparisonRow
                                    label={t('strainsView.comparison.floweringTime')}
                                    values={selectedStrains.map(
                                        (s) =>
                                            `${s.floweringTimeRange ?? s.floweringTime} ${t('strainsView.comparison.days')}`,
                                    )}
                                />
                                <ComparisonRow
                                    label={t('strainsView.comparison.yield')}
                                    values={selectedStrains.map((s) => s.agronomic.yield)}
                                />
                                <ComparisonRow
                                    label={t('strainsView.comparison.terpenes')}
                                    values={selectedStrains.map(
                                        (s) => s.dominantTerpenes?.slice(0, 3).join(', ') ?? '--',
                                    )}
                                />
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
})

StrainComparisonView.displayName = 'StrainComparisonView'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ComparisonRowProps {
    label: string
    values: string[]
}

const ComparisonRow: React.FC<ComparisonRowProps> = memo(({ label, values }) => (
    <tr className="bg-slate-900/30 hover:bg-slate-800/30 transition-colors">
        <td className="px-4 py-3 text-slate-400 font-medium">{label}</td>
        {values.map((val, i) => (
            <td key={i} className="px-4 py-3 text-center text-slate-200">
                {val}
            </td>
        ))}
    </tr>
))

ComparisonRow.displayName = 'ComparisonRow'

// ---------------------------------------------------------------------------
// Exports for testing
// ---------------------------------------------------------------------------

export { normalizeTHC, normalizeCBD, normalizeFloweringTime, yieldLevelToScore }
