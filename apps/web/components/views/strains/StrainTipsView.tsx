import React, { useState, useMemo, useCallback } from 'react'
import type { SavedStrainTip, Strain, StructuredGrowTips } from '@/types'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'
import { EditStrainTipModal } from './EditStrainTipModal'
import { selectHasAvailableSlots } from '@/stores/selectors'
import { DataExportModal } from '@/components/common/DataExportModal'
import type { SimpleExportFormat } from '@/components/common/DataExportModal'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { addNotification, initiateGrowFromStrainList } from '@/stores/slices/uiSlice'
import { BulkActionsBar } from './BulkActionsBar'
import { SearchBar } from '@/components/common/SearchBar'
import { Speakable } from '@/components/common/Speakable'
import { exportStrainTips } from '@/stores/slices/savedItemsSlice'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { compareText } from './compareText'
import { normalizeImageDataUrl } from '@/utils/imageDataUrl'

interface StrainTipsViewProps {
    savedTips: SavedStrainTip[]
    deleteTip: (id: string) => void
    updateTip: (updatedTip: SavedStrainTip) => void
    allStrains: Strain[]
}

const TipItem: React.FC<{
    tip: SavedStrainTip
    onEdit: (tip: SavedStrainTip) => void
    onDelete: (id: string) => void
    onSelect: (id: string) => void
    isSelected: boolean
}> = ({ tip, onEdit, onDelete, onSelect, isSelected }) => {
    const { t } = useTranslation()
    const imageUrl = normalizeImageDataUrl(tip.imageUrl)
    const tipCategories = [
        {
            key: 'nutrientTip',
            icon: <PhosphorIcons.Flask />,
            label: t('strainsView.tips.form.categories.nutrientTip'),
        },
        {
            key: 'trainingTip',
            icon: <PhosphorIcons.Scissors />,
            label: t('strainsView.tips.form.categories.trainingTip'),
        },
        {
            key: 'environmentalTip',
            icon: <PhosphorIcons.Fan />,
            label: t('strainsView.tips.form.categories.environmentalTip'),
        },
        {
            key: 'proTip',
            icon: <PhosphorIcons.Sparkle />,
            label: t('strainsView.tips.form.categories.proTip'),
        },
    ]
    return (
        <div className="flex gap-3 items-start overflow-hidden">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(tip.id)}
                className="mt-1 h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500 flex-shrink-0"
            />
            <div className="flex-1">
                {imageUrl && (
                    <div className="mb-4 -mx-3 -mt-3">
                        <img
                            src={imageUrl}
                            alt={tip.strainName}
                            className="rounded-t-lg w-full"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                )}
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-slate-400">
                            {new Date(tip.createdAt).toLocaleString()}
                        </p>
                        <h4 className="font-bold text-primary-300 mt-1">{tip.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onEdit(tip)}
                            aria-label={t('common.edit')}
                        >
                            <PhosphorIcons.PencilSimple className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onDelete(tip.id)}
                            aria-label={t('common.delete')}
                        >
                            <PhosphorIcons.TrashSimple className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-3">
                    {tipCategories.map((cat) => {
                        const tipContent = tip[cat.key as keyof StructuredGrowTips]
                        if (!tipContent) return null
                        return (
                            <div key={cat.key}>
                                <h5 className="font-semibold text-primary-400 text-sm flex items-center gap-2 mb-1">
                                    {cat.icon}
                                    {cat.label}
                                </h5>
                                <Speakable elementId={`saved-tip-${tip.id}-${cat.key}`}>
                                    <p className="text-sm text-slate-300 pl-7">{tipContent}</p>
                                </Speakable>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

const StrainTipsView: React.FC<StrainTipsViewProps> = ({
    savedTips,
    deleteTip,
    updateTip,
    allStrains,
}) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const hasAvailableSlots = useAppSelector(selectHasAvailableSlots)

    const getSafeText = (value: unknown, fallback = ''): string =>
        typeof value === 'string' ? value : fallback

    const [editingTip, setEditingTip] = useState<SavedStrainTip | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortMode, setSortMode] = useState<'grouped' | 'date'>('grouped')
    const [selectedIds, setSelectedIds] = useState(new Set<string>())
    const [isExportModalOpen, setIsExportModalOpen] = useState(false)
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

    const handleUpdateSave = (updatedTip: SavedStrainTip) => {
        updateTip(updatedTip)
        setEditingTip(null)
    }

    const filteredTips = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase()
        if (!lowerCaseSearch) return savedTips
        return savedTips.filter(
            (tip) =>
                getSafeText(tip.strainName, 'Unknown Strain')
                    .toLowerCase()
                    .includes(lowerCaseSearch) ||
                getSafeText(tip.title, '').toLowerCase().includes(lowerCaseSearch) ||
                getSafeText(tip.nutrientTip, '').toLowerCase().includes(lowerCaseSearch) ||
                getSafeText(tip.trainingTip, '').toLowerCase().includes(lowerCaseSearch) ||
                getSafeText(tip.environmentalTip, '').toLowerCase().includes(lowerCaseSearch) ||
                getSafeText(tip.proTip, '').toLowerCase().includes(lowerCaseSearch),
        )
    }, [savedTips, searchTerm])

    const sortedAndGrouped = useMemo(() => {
        if (sortMode === 'date') {
            return filteredTips.toSorted((a, b) => b.createdAt - a.createdAt)
        }

        const grouped: Record<string, SavedStrainTip[]> = filteredTips.reduce(
            (acc, tip) => {
                const safeStrainName = getSafeText(tip.strainName, 'Unknown Strain')
                if (!acc[safeStrainName]) {
                    acc[safeStrainName] = []
                }
                acc[safeStrainName].push(tip)
                return acc
            },
            {} as Record<string, SavedStrainTip[]>,
        )

        return Object.entries(grouped)
            .map(
                ([strainName, tips]) =>
                    [strainName, tips.toSorted((a, b) => b.createdAt - a.createdAt)] as [
                        string,
                        SavedStrainTip[],
                    ],
            )
            .toSorted((a, b) => compareText(a[0], b[0]))
    }, [filteredTips, sortMode])

    const allVisibleIds = useMemo(() => {
        if (sortMode === 'date') {
            return (sortedAndGrouped as SavedStrainTip[]).map((t) => t.id)
        }
        return (sortedAndGrouped as [string, SavedStrainTip[]][]).flatMap(([, tips]) =>
            tips.map((t) => t.id),
        )
    }, [sortedAndGrouped, sortMode])

    const handleToggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }, [])

    const handleToggleAll = useCallback(() => {
        if (selectedIds.size === allVisibleIds.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(allVisibleIds))
        }
    }, [selectedIds.size, allVisibleIds])

    const handleBulkDelete = useCallback(() => {
        setIsDeleteConfirmOpen(true)
    }, [])

    const onExport = (format: SimpleExportFormat) => {
        const dataToExport =
            selectedIds.size > 0 ? savedTips.filter((tip) => selectedIds.has(tip.id)) : filteredTips

        if (dataToExport.length === 0) {
            dispatch(addNotification({ message: t('common.noDataToExport'), type: 'error' }))
            setIsExportModalOpen(false)
            return
        }

        const fileName = `CannaGuide_Strain_Tips_${new Date().toISOString().slice(0, 10)}`

        dispatch(
            exportStrainTips({
                tips: dataToExport,
                format,
                fileName,
            }),
        )

        setIsExportModalOpen(false)
    }

    const groupedSortButtonClass = `!p-2.5 !rounded-md ${
        sortMode === 'grouped' ? '!bg-slate-700 !text-primary-300' : ''
    }`
    const dateSortButtonClass = `!p-2.5 !rounded-md ${
        sortMode === 'date' ? '!bg-slate-700 !text-primary-300' : ''
    }`

    const hasNoSavedTips = savedTips.length === 0
    const hasNoFilteredTips = filteredTips.length === 0

    const tipsContent = hasNoSavedTips ? (
        <Card className="text-center py-10 text-slate-500">
            <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h3 className="font-semibold">{t('strainsView.tips.noTips.title')}</h3>
            <p className="text-sm">{t('strainsView.tips.noTips.subtitle')}</p>
        </Card>
    ) : hasNoFilteredTips ? (
        <Card className="text-center py-10 text-slate-500">
            <p>{t('strainsView.tips.noResults', { term: searchTerm })}</p>
        </Card>
    ) : (
        <div className="space-y-3">
            <div className="px-3 flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={selectedIds.size === allVisibleIds.length && allVisibleIds.length > 0}
                    onChange={handleToggleAll}
                    className="h-4 w-4 rounded border-slate-500 bg-transparent text-primary-500 focus:ring-primary-500"
                />
                <label className="text-sm text-slate-400">
                    {t('strainsView.selectedCount_other', { count: selectedIds.size })}
                </label>
            </div>
            {sortMode === 'grouped'
                ? (sortedAndGrouped as [string, SavedStrainTip[]][]).map(([strainName, tips]) => {
                      const strain = allStrains.find((s) => s.id === tips[0]?.strainId) ?? null
                      const startGrowingTitle = !hasAvailableSlots
                          ? t('plantsView.notifications.allSlotsFull')
                          : t('strainsView.startGrowing')

                      return (
                          <details
                              key={strainName}
                              open={true}
                              className="group ring-1 ring-inset ring-white/20 rounded-lg overflow-hidden"
                          >
                              <summary className="list-none">
                                  <div className="flex justify-between items-center p-3 rounded-t-lg bg-slate-800 hover:bg-slate-700/50 cursor-pointer">
                                      <h4 className="font-bold text-slate-100">
                                          {strainName} ({tips.length})
                                      </h4>
                                      <div className="flex items-center gap-2">
                                          {strain && (
                                              <div title={startGrowingTitle}>
                                                  <Button
                                                      size="sm"
                                                      variant="secondary"
                                                      className="!p-1.5"
                                                      onClick={(
                                                          e: React.MouseEvent<HTMLButtonElement>,
                                                      ) => {
                                                          e.stopPropagation()
                                                          dispatch(
                                                              initiateGrowFromStrainList(strain),
                                                          )
                                                      }}
                                                      disabled={!hasAvailableSlots}
                                                  >
                                                      <PhosphorIcons.Plant className="w-4 h-4" />
                                                  </Button>
                                              </div>
                                          )}
                                          <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" />
                                      </div>
                                  </div>
                              </summary>
                              <div className="p-3 space-y-3 bg-slate-800/40">
                                  {tips.map((tip) => (
                                      <Card
                                          key={tip.id}
                                          className="bg-slate-800/50 p-3 overflow-hidden"
                                      >
                                          <TipItem
                                              tip={tip}
                                              onEdit={setEditingTip}
                                              onDelete={deleteTip}
                                              onSelect={handleToggleSelection}
                                              isSelected={selectedIds.has(tip.id)}
                                          />
                                      </Card>
                                  ))}
                              </div>
                          </details>
                      )
                  })
                : (sortedAndGrouped as SavedStrainTip[]).map((tip) => (
                      <Card
                          key={tip.id}
                          className="bg-slate-800 p-3 ring-1 ring-inset ring-white/20"
                      >
                          <TipItem
                              tip={tip}
                              onEdit={setEditingTip}
                              onDelete={deleteTip}
                              onSelect={handleToggleSelection}
                              isSelected={selectedIds.has(tip.id)}
                          />
                      </Card>
                  ))}
        </div>
    )

    return (
        <div className="mt-4">
            {editingTip && (
                <EditStrainTipModal
                    tip={editingTip}
                    onClose={() => setEditingTip(null)}
                    onSave={handleUpdateSave}
                />
            )}
            <DataExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={onExport}
                title={t('strainsView.tips.title')}
                selectionCount={selectedIds.size}
                totalCount={filteredTips.length}
                translationBasePath="strainsView.tips.exportModal"
            />
            <ConfirmDialog
                open={isDeleteConfirmOpen}
                onOpenChange={setIsDeleteConfirmOpen}
                title={t('strainsView.tips.title')}
                description={t('strainsView.tips.deleteConfirmPlural_other', {
                    count: selectedIds.size,
                })}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => {
                    selectedIds.forEach((id) => deleteTip(id))
                    setSelectedIds(new Set())
                    setIsDeleteConfirmOpen(false)
                }}
            />

            {selectedIds.size > 0 && (
                <BulkActionsBar
                    selectedCount={selectedIds.size}
                    onClearSelection={() => setSelectedIds(new Set())}
                    onDelete={handleBulkDelete}
                />
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex-grow w-full sm:w-auto">
                    <SearchBar
                        placeholder={t('strainsView.tips.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClear={() => setSearchTerm('')}
                    />
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                    <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}>
                        <PhosphorIcons.DownloadSimple className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
                        <Button
                            variant="ghost"
                            onClick={() => setSortMode('grouped')}
                            className={groupedSortButtonClass}
                            aria-label={t('strainsView.tips.sortOptions.grouped')}
                            title={t('strainsView.tips.sortOptions.grouped')}
                        >
                            <PhosphorIcons.GridFour className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setSortMode('date')}
                            className={dateSortButtonClass}
                            aria-label={t('strainsView.tips.sortOptions.date')}
                            title={t('strainsView.tips.sortOptions.date')}
                        >
                            <PhosphorIcons.ListBullets className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
            {tipsContent}
        </div>
    )
}

export default StrainTipsView
