import React, { useState, useMemo, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import {
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Legend,
    Tooltip,
} from 'recharts'
import { AccessibleChart } from '@/components/common/AccessibleChart'
import { Strain, YieldLevel } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectFavoriteIds } from '@/stores/selectors'
import { toggleFavorite } from '@/stores/slices/favoritesSlice'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { chartSeriesColor, CHART_CHROME } from '@/utils/chartPalette'
import { formatFloweringWeeks } from './reportedStrainFacts'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_STRAINS = 3

// Normalize yield level to a numeric 0-100 score
const yieldLevelToScore = (level?: YieldLevel): number | null => {
    if (level === 'High') return 90
    if (level === 'Medium') return 60
    if (level === 'Low') return 30
    return null
}

const finiteNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined

// Normalize THC % (0-35 typical max) to 0-100
const normalizeTHC = (thc?: number): number | null => {
    const value = finiteNumber(thc)
    return value === undefined ? null : Math.min(100, Math.round((value / 35) * 100))
}

// Normalize CBD % (0-20 typical max) to 0-100
const normalizeCBD = (cbd: number | undefined): number | null => {
    const value = finiteNumber(cbd)
    return value === undefined ? null : Math.min(100, Math.round((value / 20) * 100))
}

// Shorter flowering scores higher. The stored value is weeks; 8-16 weeks matches 56-112 days.
const normalizeFloweringTime = (weeks: number | undefined): number | null => {
    const value = finiteNumber(weeks)
    if (value === undefined) return null
    const days = value * 7
    return Math.max(0, Math.min(100, Math.round(((112 - days) / 56) * 100)))
}

const reportedPercent = (
    range: string | undefined,
    value: unknown,
    unknownLabel: string,
): string => {
    if (range) return range
    const numeric = finiteNumber(value)
    if (numeric === undefined) return unknownLabel
    return `${numeric}%`
}

const reportedTerpenes = (terpenes: readonly string[] | undefined): string => {
    if (terpenes === undefined) return '--'
    return terpenes.slice(0, 3).join(', ')
}

const quickAddStrains = (favorites: Strain[], selectedCount: number, max: number): Strain[] => {
    if (selectedCount >= max) return []
    return favorites.slice(0, 6)
}

const radarScore = (strain: Strain, metricIndex: number): number | null => {
    if (metricIndex === 0) return normalizeTHC(strain.thc)
    if (metricIndex === 1) return normalizeCBD(strain.cbd)
    if (metricIndex === 2) return yieldLevelToScore(strain.agronomic?.yield)
    return normalizeFloweringTime(strain.floweringTime)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RadarDataPoint {
    metric: string
    [strainName: string]: string | number | null
}

interface StrainComparisonViewProps {
    allStrains: Strain[]
}

interface ComparisonLabels {
    chart: string
    chartValue: string
    type: string
    thc: string
    cbd: string
    flowering: string
    yieldLabel: string
    terpenes: string
    favorite: string
    unfavorite: string
    remove: string
    unknown: string
    weeks: string
}

interface ComparisonCell {
    id: string
    text: string
}

interface ComparisonRowProps {
    label: string
    cells: ComparisonCell[]
}

const comparisonCells = (
    strains: Strain[],
    textFor: (strain: Strain) => string,
): ComparisonCell[] => strains.map((strain) => ({ id: strain.id, text: textFor(strain) }))

const buildRadarPoint = (
    metric: string,
    metricIndex: number,
    strains: Strain[],
): RadarDataPoint => {
    const point: RadarDataPoint = { metric }
    strains.forEach((strain) => {
        point[strain.name] = radarScore(strain, metricIndex)
    })
    return point
}

const ComparisonRow: React.FC<ComparisonRowProps> = memo(({ label, cells }) => (
    <tr className="bg-slate-900/30 hover:bg-slate-800/30 transition-colors">
        <td className="px-4 py-3 text-slate-400 font-medium">{label}</td>
        {cells.map((cell) => (
            <td key={cell.id} className="px-4 py-3 text-center text-slate-200">
                {cell.text}
            </td>
        ))}
    </tr>
))

ComparisonRow.displayName = 'ComparisonRow'

const HeartIcon: React.FC<{ isFavorite: boolean }> = ({ isFavorite }) => (
    <PhosphorIcons.Heart
        className="w-4 h-4"
        weight={isFavorite ? 'fill' : 'regular'}
        style={{ color: isFavorite ? '#f87171' : undefined }}
    />
)

const ColumnActions: React.FC<{
    isFavorite: boolean
    favoriteLabel: string
    removeLabel: string
    onToggleFavorite: () => void
    onRemove: () => void
}> = ({ isFavorite, favoriteLabel, removeLabel, onToggleFavorite, onRemove }) => (
    <div className="flex items-center gap-1">
        <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={favoriteLabel}
            className="text-slate-400 hover:text-red-400 transition-colors"
        >
            <HeartIcon isFavorite={isFavorite} />
        </button>
        <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            className="text-slate-400 hover:text-red-400 transition-colors"
        >
            <PhosphorIcons.X className="w-4 h-4" />
        </button>
    </div>
)

const StrainColumnHeader: React.FC<{
    name: string
    color: string
    isFavorite: boolean
    favoriteLabel: string
    removeLabel: string
    onToggleFavorite: () => void
    onRemove: () => void
}> = ({ name, color, isFavorite, favoriteLabel, removeLabel, onToggleFavorite, onRemove }) => (
    <div className="flex flex-col items-center gap-1">
        <span className="font-bold" style={{ color }}>
            {name}
        </span>
        <ColumnActions
            isFavorite={isFavorite}
            favoriteLabel={favoriteLabel}
            removeLabel={removeLabel}
            onToggleFavorite={onToggleFavorite}
            onRemove={onRemove}
        />
    </div>
)

const ComparisonHead: React.FC<{
    strains: Strain[]
    favoriteIds: ReadonlySet<string>
    labels: ComparisonLabels
    onToggleFavorite: (id: string) => void
    onRemove: (id: string) => void
}> = ({ strains, favoriteIds, labels, onToggleFavorite, onRemove }) => (
    <thead>
        <tr className="bg-slate-800">
            <th className="text-left px-4 py-3 text-slate-400 font-semibold w-36">--</th>
            {strains.map((strain, index) => (
                <th key={strain.id} className="px-4 py-3 text-center">
                    <StrainColumnHeader
                        name={strain.name}
                        color={`rgb(var(--color-chart-${index + 1}))`}
                        isFavorite={favoriteIds.has(strain.id)}
                        favoriteLabel={
                            favoriteIds.has(strain.id) ? labels.unfavorite : labels.favorite
                        }
                        removeLabel={labels.remove}
                        onToggleFavorite={() => onToggleFavorite(strain.id)}
                        onRemove={() => onRemove(strain.id)}
                    />
                </th>
            ))}
        </tr>
    </thead>
)

const ComparisonTable: React.FC<{
    strains: Strain[]
    favoriteIds: ReadonlySet<string>
    labels: ComparisonLabels
    onToggleFavorite: (id: string) => void
    onRemove: (id: string) => void
}> = ({ strains, favoriteIds, labels, onToggleFavorite, onRemove }) => (
    <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
            <ComparisonHead
                strains={strains}
                favoriteIds={favoriteIds}
                labels={labels}
                onToggleFavorite={onToggleFavorite}
                onRemove={onRemove}
            />
            <tbody className="divide-y divide-slate-700/50">
                <ComparisonRow
                    label={labels.type}
                    cells={comparisonCells(strains, (strain) => strain.type || labels.unknown)}
                />
                <ComparisonRow
                    label={`${labels.thc} %`}
                    cells={comparisonCells(strains, (strain) =>
                        reportedPercent(strain.thcRange, strain.thc, labels.unknown),
                    )}
                />
                <ComparisonRow
                    label={`${labels.cbd} %`}
                    cells={comparisonCells(strains, (strain) =>
                        reportedPercent(strain.cbdRange, strain.cbd, labels.unknown),
                    )}
                />
                <ComparisonRow
                    label={labels.flowering}
                    cells={comparisonCells(strains, (strain) =>
                        formatFloweringWeeks(
                            strain.floweringTimeRange,
                            strain.floweringTime,
                            labels.weeks,
                            labels.unknown,
                        ),
                    )}
                />
                <ComparisonRow
                    label={labels.yieldLabel}
                    cells={comparisonCells(
                        strains,
                        (strain) => strain.agronomic?.yield ?? labels.unknown,
                    )}
                />
                <ComparisonRow
                    label={labels.terpenes}
                    cells={comparisonCells(strains, (strain) =>
                        reportedTerpenes(strain.dominantTerpenes),
                    )}
                />
            </tbody>
        </table>
    </div>
)

const ComparisonChart: React.FC<{
    strains: Strain[]
    radarData: RadarDataPoint[]
    labels: ComparisonLabels
}> = ({ strains, radarData, labels }) => (
    <AccessibleChart
        label={labels.chart}
        data={radarData}
        categoryKey="metric"
        categoryLabel={labels.chartValue}
        series={strains.map((strain) => ({
            dataKey: strain.name,
            label: strain.name,
        }))}
        height={280}
        plotClassName="bg-slate-800/50 rounded-xl p-4"
        omitDataTable
    >
        <RadarChart accessibilityLayer data={radarData} outerRadius="60%">
            <PolarGrid stroke={CHART_CHROME.grid} />
            <PolarAngleAxis dataKey="metric" tick={{ fill: CHART_CHROME.label, fontSize: 12 }} />
            <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: CHART_CHROME.label, fontSize: 10 }}
            />
            {strains.map((strain, index) => (
                <Radar
                    key={strain.id}
                    name={strain.name}
                    dataKey={strain.name}
                    stroke={chartSeriesColor(index)}
                    fill={chartSeriesColor(index)}
                    fillOpacity={0.15}
                    connectNulls={false}
                />
            ))}
            <Legend
                wrapperStyle={{
                    fontSize: '12px',
                    color: 'rgb(var(--color-chart-label))',
                }}
            />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'rgb(var(--color-bg-component))',
                    border: '1px solid rgba(var(--color-border), 0.1)',
                    borderRadius: '8px',
                    color: 'rgb(var(--color-neutral-200))',
                }}
            />
        </RadarChart>
    </AccessibleChart>
)

const ComparisonResults: React.FC<{
    strains: Strain[]
    radarData: RadarDataPoint[]
    favoriteIds: ReadonlySet<string>
    labels: ComparisonLabels
    onToggleFavorite: (id: string) => void
    onRemove: (id: string) => void
}> = ({ strains, radarData, favoriteIds, labels, onToggleFavorite, onRemove }) => (
    <div className="space-y-6">
        <ComparisonChart strains={strains} radarData={radarData} labels={labels} />
        <ComparisonTable
            strains={strains}
            favoriteIds={favoriteIds}
            labels={labels}
            onToggleFavorite={onToggleFavorite}
            onRemove={onRemove}
        />
    </div>
)

const SearchField: React.FC<{
    query: string
    placeholder: string
    disabled: boolean
    onQueryChange: (query: string) => void
}> = ({ query, placeholder, disabled, onQueryChange }) => (
    <div className="relative flex-1">
        <PhosphorIcons.MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg pl-9 pr-4 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={placeholder}
        />
    </div>
)

const SuggestionOption: React.FC<{ name: string; detail: string; onSelect: () => void }> = ({
    name,
    detail,
    onSelect,
}) => (
    <div role="option" aria-selected={false} aria-label={name}>
        <button
            type="button"
            onClick={onSelect}
            className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center justify-between"
        >
            <span>{name}</span>
            <span className="text-xs text-slate-400">{detail}</span>
        </button>
    </div>
)

const SuggestionList: React.FC<{
    label: string
    strains: Strain[]
    unknownLabel: string
    onSelect: (strain: Strain) => void
}> = ({ label, strains, unknownLabel, onSelect }) => (
    <div
        role="listbox"
        aria-label={label}
        className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-lg overflow-hidden"
    >
        {strains.map((strain) => (
            <SuggestionOption
                key={strain.id}
                name={strain.name}
                detail={strain.type || unknownLabel}
                onSelect={() => onSelect(strain)}
            />
        ))}
    </div>
)

const StrainSearch: React.FC<{
    query: string
    atMax: boolean
    placeholder: string
    maxMessage: string
    suggestions: Strain[]
    unknownLabel: string
    onQueryChange: (query: string) => void
    onSelect: (strain: Strain) => void
}> = ({
    query,
    atMax,
    placeholder,
    maxMessage,
    suggestions,
    unknownLabel,
    onQueryChange,
    onSelect,
}) => (
    <div className="relative">
        <div className="flex items-center gap-2">
            <SearchField
                query={query}
                placeholder={placeholder}
                disabled={atMax}
                onQueryChange={onQueryChange}
            />
        </div>
        {atMax ? <p className="mt-1.5 text-xs text-amber-400">{maxMessage}</p> : null}
        {suggestions.length > 0 ? (
            <SuggestionList
                label={placeholder}
                strains={suggestions}
                unknownLabel={unknownLabel}
                onSelect={onSelect}
            />
        ) : null}
    </div>
)

const FavoriteChip: React.FC<{ name: string; onSelect: () => void }> = ({ name, onSelect }) => (
    <button
        type="button"
        onClick={onSelect}
        className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-full px-3 py-1 transition-colors"
    >
        <PhosphorIcons.Heart className="w-3 h-3 text-red-400" weight="fill" />
        {name}
    </button>
)

const FavoriteQuickAdd: React.FC<{
    title: string
    strains: Strain[]
    onSelect: (strain: Strain) => void
}> = ({ title, strains, onSelect }) => {
    if (strains.length === 0) return null
    return (
        <div>
            <p className="text-xs text-slate-400 mb-2">{title}</p>
            <div className="flex flex-wrap gap-2">
                {strains.map((strain) => (
                    <FavoriteChip
                        key={strain.id}
                        name={strain.name}
                        onSelect={() => onSelect(strain)}
                    />
                ))}
            </div>
        </div>
    )
}

const EmptyComparison: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center py-12 text-slate-400">
        <PhosphorIcons.Columns className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">{message}</p>
    </div>
)

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
        const query = searchQuery.toLowerCase()
        const selectedIds = new Set(selectedStrains.map((strain) => strain.id))
        return allStrains
            .filter(
                (strain) =>
                    !selectedIds.has(strain.id) && strain.name.toLowerCase().includes(query),
            )
            .slice(0, 8)
    }, [searchQuery, allStrains, selectedStrains])

    const favoriteStrains = useMemo(() => {
        const selectedIds = new Set(selectedStrains.map((strain) => strain.id))
        return allStrains.filter(
            (strain) => favoriteIds.has(strain.id) && !selectedIds.has(strain.id),
        )
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
        setSelectedStrains((prev) => prev.filter((strain) => strain.id !== id))
    }, [])

    const handleToggleFavorite = useCallback(
        (id: string) => {
            dispatch(toggleFavorite(id))
        },
        [dispatch],
    )

    const radarData = useMemo(() => {
        if (selectedStrains.length === 0) return []
        const metrics = [
            t('strainsView.comparison.thc'),
            t('strainsView.comparison.cbd'),
            t('strainsView.comparison.yield'),
            t('strainsView.comparison.floweringTime'),
        ]
        return metrics.map((metric, index) => buildRadarPoint(metric, index, selectedStrains))
    }, [selectedStrains, t])

    const labels: ComparisonLabels = {
        chart: t('common.accessibility.strainRadarChart'),
        chartValue: t('common.accessibility.chart.value'),
        type: t('strainsView.comparison.type'),
        thc: t('strainsView.comparison.thc'),
        cbd: t('strainsView.comparison.cbd'),
        flowering: t('strainsView.comparison.floweringTime'),
        yieldLabel: t('strainsView.comparison.yield'),
        terpenes: t('strainsView.comparison.terpenes'),
        favorite: t('strainsView.favorite'),
        unfavorite: t('strainsView.unfavorite'),
        remove: t('strainsView.comparison.removeStrain'),
        unknown: t('common.unknown'),
        weeks: t('common.units.weeks'),
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">{t('strainsView.comparison.title')}</h2>
            <StrainSearch
                query={searchQuery}
                atMax={selectedStrains.length >= MAX_STRAINS}
                placeholder={t('strainsView.comparison.addStrain')}
                maxMessage={t('strainsView.comparison.maxReached')}
                suggestions={filteredSuggestions}
                unknownLabel={labels.unknown}
                onQueryChange={setSearchQuery}
                onSelect={handleAddStrain}
            />
            <FavoriteQuickAdd
                title={t('strainsView.favorites')}
                strains={quickAddStrains(favoriteStrains, selectedStrains.length, MAX_STRAINS)}
                onSelect={handleAddStrain}
            />
            {selectedStrains.length === 0 ? (
                <EmptyComparison message={t('strainsView.comparison.emptyHint')} />
            ) : (
                <ComparisonResults
                    strains={selectedStrains}
                    radarData={radarData}
                    favoriteIds={favoriteIds}
                    labels={labels}
                    onToggleFavorite={handleToggleFavorite}
                    onRemove={handleRemoveStrain}
                />
            )}
        </div>
    )
})

StrainComparisonView.displayName = 'StrainComparisonView'

export { normalizeTHC, normalizeCBD, normalizeFloweringTime, yieldLevelToScore }
