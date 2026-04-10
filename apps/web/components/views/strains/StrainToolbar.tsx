import React, { memo } from 'react'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/useUIStore'
import { StrainType, SortKey, SortDirection } from '@/types'
import { SearchBar } from '@/components/common/SearchBar'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { AlphabeticalFilter } from '@/components/views/strains/AlphabeticalFilter'
import { useStrainsViewStore } from '@/stores/useStrainsViewStore'

interface StrainToolbarProps {
    searchTerm: string
    onSearchTermChange: (term: string) => void
    onOpenDrawer: () => void
    activeFilterCount: number
    viewMode: 'list' | 'grid'
    typeFilter: StrainType[]
    onToggleTypeFilter: (type: StrainType) => void
    sort: { key: SortKey; direction: SortDirection }
    handleSort: (key: SortKey) => void
    letterFilter: string | null
    handleSetLetterFilter: (letter: string | null) => void
}

const StrainToolbarComponent: React.FC<StrainToolbarProps> = (props) => {
    const { t } = useTranslation()
    const setStrainsViewMode = useStrainsViewStore((s) => s.setStrainsViewMode)
    const {
        searchTerm,
        onSearchTermChange,
        onOpenDrawer,
        activeFilterCount,
        viewMode,
        typeFilter,
        onToggleTypeFilter,
        sort,
        handleSort,
        letterFilter,
        handleSetLetterFilter,
    } = props

    const typeOptions = [
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        { value: 'Sativa' as StrainType, label: t('strainsView.sativa') },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        { value: 'Indica' as StrainType, label: t('strainsView.indica') },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        { value: 'Hybrid' as StrainType, label: t('strainsView.hybrid') },
    ]

    const sortOptions: { value: SortKey; label: string }[] = [
        { value: 'name', label: t('strainsView.table.strain') },
        { value: 'thc', label: t('strainsView.table.thc') },
        { value: 'cbd', label: t('strainsView.table.cbd') },
        { value: 'floweringTime', label: t('strainsView.table.flowering') },
        { value: 'difficulty', label: t('strainsView.table.difficulty') },
        { value: 'yield', label: t('strainsView.table.yield') },
    ]

    const currentSortLabel = sortOptions.find((opt) => opt.value === sort.key)?.label
    const advancedFiltersLabel =
        activeFilterCount > 0
            ? `${t('strainsView.advancedFilters')} (${activeFilterCount})`
            : t('strainsView.advancedFilters')
    const nextViewMode = viewMode === 'list' ? 'grid' : 'list'
    const ViewModeIcon = viewMode === 'list' ? PhosphorIcons.GridFour : PhosphorIcons.ListBullets

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="flex-grow">
                    <SearchBar
                        placeholder={t('strainsView.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        onClear={() => onSearchTermChange('')}
                    />
                </div>

                <Button
                    onClick={() => useUIStore.getState().openAddModal()}
                    variant="secondary"
                    className="!p-2.5"
                    aria-label={t('strainsView.addStrain')}
                    title={t('strainsView.addStrain')}
                >
                    <PhosphorIcons.PlusCircle className="w-5 h-5" />
                </Button>

                <Button
                    onClick={() => useUIStore.getState().openExportModal()}
                    variant="secondary"
                    className="!p-2.5"
                    aria-label={t('common.export')}
                    title={t('common.export')}
                >
                    <PhosphorIcons.DownloadSimple className="w-5 h-5" />
                </Button>

                <div className="hidden sm:flex items-center gap-2">
                    <label className="sr-only" htmlFor="strain-sort-select">
                        {t('strainsView.sortBy')}
                    </label>
                    <select
                        id="strain-sort-select"
                        value={sort.key}
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        onChange={(e) => handleSort(e.target.value as SortKey)}
                        aria-label={`${t('strainsView.sortBy')}: ${currentSortLabel}`}
                        className="h-10 rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                        {sortOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <Button
                        onClick={() => handleSort(sort.key)}
                        variant="secondary"
                        className="!p-2.5"
                        aria-label={t('strainsView.sortBy')}
                        title={t('strainsView.sortBy')}
                    >
                        {sort.direction === 'asc' ? (
                            <PhosphorIcons.ArrowUp className="w-4 h-4" />
                        ) : (
                            <PhosphorIcons.ArrowDown className="w-4 h-4" />
                        )}
                    </Button>
                </div>

                <Button
                    onClick={onOpenDrawer}
                    variant="secondary"
                    className="relative !p-2.5"
                    aria-label={advancedFiltersLabel}
                    title={t('strainsView.advancedFilters')}
                >
                    <PhosphorIcons.FunnelSimple className="w-5 h-5" />
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-white text-[10px] font-bold ring-2 ring-slate-800">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
                <Button
                    onClick={() => setStrainsViewMode(nextViewMode)}
                    variant="secondary"
                    className="!p-2.5"
                    aria-label={t('strainsView.toggleView')}
                    title={t('strainsView.toggleView')}
                >
                    <ViewModeIcon className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
                <SegmentedControl
                    options={typeOptions}
                    value={typeFilter}
                    onToggle={onToggleTypeFilter}
                    className="w-full sm:w-auto"
                />
            </div>

            <AlphabeticalFilter activeLetter={letterFilter} onLetterClick={handleSetLetterFilter} />
        </div>
    )
}

export const StrainToolbar = memo(StrainToolbarComponent)
