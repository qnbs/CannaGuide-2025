import React, { useState } from 'react'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from '@/stores/store'
import { openAddModal, openExportModal } from '@/stores/slices/uiSlice'
import { StrainType, SortKey, SortDirection } from '@/types'
import { SearchBar } from '@/components/common/SearchBar'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { AlphabeticalFilter } from '@/components/views/strains/AlphabeticalFilter'
import { setStrainsViewMode } from '@/stores/slices/strainsViewSlice'

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

export const StrainToolbar: React.FC<StrainToolbarProps> = (props) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
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

    const [isSortOpen, setIsSortOpen] = useState(false)
    const sortRef = useOutsideClick<HTMLDivElement>(() => setIsSortOpen(false))

    const typeOptions = [
        { value: 'Sativa' as StrainType, label: t('strainsView.sativa') },
        { value: 'Indica' as StrainType, label: t('strainsView.indica') },
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
                    onClick={() => dispatch(openAddModal())}
                    variant="secondary"
                    className="!p-2.5"
                    title={t('strainsView.addStrain')}
                >
                    <PhosphorIcons.PlusCircle className="w-5 h-5" />
                </Button>

                <Button
                    onClick={() => dispatch(openExportModal())}
                    variant="secondary"
                    className="!p-2.5"
                    title={t('common.export')}
                >
                    <PhosphorIcons.DownloadSimple className="w-5 h-5" />
                </Button>


                <div ref={sortRef} className="relative hidden sm:block">
                    <Button
                        onClick={() => setIsSortOpen((prev) => !prev)}
                        variant="secondary"
                        className="!px-3 !py-2.5"
                    >
                        <span className="text-sm">{currentSortLabel}</span>
                        {sort.direction === 'asc' ? (
                            <PhosphorIcons.ArrowUp className="w-4 h-4 ml-2" />
                        ) : (
                            <PhosphorIcons.ArrowDown className="w-4 h-4 ml-2" />
                        )}
                    </Button>
                    {isSortOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-20 p-1 animate-slide-down-fade-in">
                            {sortOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        handleSort(opt.value)
                                        setIsSortOpen(false)
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-sm rounded-md flex justify-between items-center ${
                                        sort.key === opt.value
                                            ? 'bg-primary-500/20 text-primary-300'
                                            : 'text-slate-200 hover:bg-slate-700'
                                    }`}
                                >
                                    {opt.label}
                                    {sort.key === opt.value &&
                                        (sort.direction === 'asc' ? (
                                            <PhosphorIcons.ArrowUp className="w-4 h-4" />
                                        ) : (
                                            <PhosphorIcons.ArrowDown className="w-4 h-4" />
                                        ))}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <Button onClick={onOpenDrawer} variant="secondary" className="relative !p-2.5">
                    <PhosphorIcons.FunnelSimple className="w-5 h-5" />
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-white text-[10px] font-bold ring-2 ring-slate-800">
                            {activeFilterCount}
                        </span>
                    )}
                </Button>
                <Button
                    onClick={() =>
                        dispatch(setStrainsViewMode(viewMode === 'list' ? 'grid' : 'list'))
                    }
                    variant="secondary"
                    className="!p-2.5"
                    title={t('strainsView.toggleView')}
                >
                    {viewMode === 'list' ? (
                        <PhosphorIcons.GridFour className="w-5 h-5" />
                    ) : (
                        <PhosphorIcons.ListBullets className="w-5 h-5" />
                    )}
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