import React, { useState, useMemo, memo } from 'react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useTranslation } from 'react-i18next'
import { ArchivedMentorResponse } from '@/types'
import { EditResponseModal } from '@/components/common/EditResponseModal'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { selectArchivedMentorResponses } from '@/stores/selectors'
import {
    updateArchivedMentorResponse,
    deleteArchivedMentorResponse,
} from '@/stores/slices/archivesSlice'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { SafeHtml } from '@/components/common/SafeHtml'
import { SearchBar } from '@/components/common/SearchBar'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

interface MentorArchiveTabProps {
    archivedResponses?: ArchivedMentorResponse[]
}

export const MentorArchiveTab: React.FC<MentorArchiveTabProps> = memo(({
    archivedResponses: propsResponses,
}) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const storeResponses = useAppSelector(selectArchivedMentorResponses)
    const archivedResponses = propsResponses || storeResponses

    const hasInvalidArchiveData = !Array.isArray(archivedResponses)

    const [editingResponse, setEditingResponse] = useState<ArchivedMentorResponse | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedIds, setSelectedIds] = useState(new Set<string>())
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
    const normalizedArchiveResponses = useMemo(
        () => Array.isArray(archivedResponses) ? archivedResponses : [],
        [archivedResponses],
    )

    const sortedArchive = useMemo(
        () => [...normalizedArchiveResponses].sort((a, b) => b.createdAt - a.createdAt),
        [normalizedArchiveResponses],
    )

    const filteredArchive = useMemo(() => {
        const cleanArchive = sortedArchive.filter((res) => res && typeof res === 'object')
        if (!searchTerm) return cleanArchive

        const lowerCaseSearch = searchTerm.toLowerCase()
        return cleanArchive.filter(
            (res) =>
                (res.title || '').toLowerCase().includes(lowerCaseSearch) ||
                (res.query || '').toLowerCase().includes(lowerCaseSearch) ||
                (res.content || '').toLowerCase().includes(lowerCaseSearch),
        )
    }, [sortedArchive, searchTerm])

    if (hasInvalidArchiveData) {
        return (
            <Card>
                <SkeletonLoader count={3} />
            </Card>
        )
    }

    const handleToggleSelection = (id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(id)) newSet.delete(id)
            else newSet.add(id)
            return newSet
        })
    }

    const handleToggleAll = () => {
        if (selectedIds.size === filteredArchive.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredArchive.map((res) => res.id)))
        }
    }

    const handleUpdate = (response: ArchivedMentorResponse) => {
        dispatch(updateArchivedMentorResponse(response))
        setEditingResponse(null)
    }

    const handleDelete = (id: string) => {
        setPendingDeleteId(id)
    }

    return (
        <div>
            <ConfirmDialog
                open={pendingDeleteId !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingDeleteId(null)
                }}
                title={t('common.deleteResponse')}
                description={t('common.deleteConfirm')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => {
                    if (pendingDeleteId) {
                        dispatch(deleteArchivedMentorResponse(pendingDeleteId))
                    }
                    setPendingDeleteId(null)
                }}
            />

            {editingResponse && (
                <EditResponseModal
                    response={{ ...editingResponse, title: editingResponse.title || '' }}
                    onClose={() => setEditingResponse(null)}
                    onSave={(updated) => handleUpdate({ ...editingResponse, ...updated })}
                />
            )}

            <div className="flex justify-between items-center mb-4">
                <div className="flex-grow">
                    <SearchBar
                        placeholder={t('strainsView.tips.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                {filteredArchive.length > 0 ? (
                    <>
                        <div className="px-1 flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={
                                    selectedIds.size === filteredArchive.length &&
                                    filteredArchive.length > 0
                                }
                                onChange={handleToggleAll}
                                className="custom-checkbox"
                            />
                            <label className="text-sm text-slate-400">
                                {t('strainsView.selectedCount', { count: selectedIds.size })}
                            </label>
                        </div>
                        {filteredArchive.map(
                            (res) =>
                                res &&
                                res.title && (
                                    <Card
                                        key={res.id}
                                        className="bg-slate-800/70 p-3 flex items-start gap-3"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(res.id)}
                                            onChange={() => handleToggleSelection(res.id)}
                                            className="custom-checkbox mt-1.5 flex-shrink-0"
                                        />
                                        <div className="flex-grow">
                                            <p className="text-xs text-slate-400 italic">
                                                {t('knowledgeView.archive.queryLabel')}: &quot;{res.query}&quot;
                                            </p>
                                            <h4 className="font-bold text-primary-300 mt-1">
                                                {res.title}
                                            </h4>
                                            <SafeHtml
                                                className="prose prose-sm dark:prose-invert max-w-none"
                                                html={res.content}
                                            />
                                            <div className="flex justify-end items-center gap-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => setEditingResponse(res)}
                                                    aria-label={t('common.edit')}
                                                >
                                                    <PhosphorIcons.PencilSimple className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleDelete(res.id)}
                                                    aria-label={t('common.delete')}
                                                >
                                                    <PhosphorIcons.TrashSimple className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ),
                        )}
                    </>
                ) : (
                    <div className="text-center py-10 text-slate-500">
                        <PhosphorIcons.Archive className="w-16 h-16 mx-auto text-slate-400 mb-4" />
                        <h3 className="font-semibold text-slate-300">
                            {t('knowledgeView.archive.empty')}
                        </h3>
                    </div>
                )}
            </div>
        </div>
    )
});
