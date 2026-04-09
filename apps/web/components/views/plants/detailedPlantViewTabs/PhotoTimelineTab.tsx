import React, { useState, useMemo, memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { JournalEntry, PhotoDetails } from '@/types'
import { JournalEntryType } from '@/types'

function isPhotoDetails(d: unknown): d is PhotoDetails {
    return d != null && typeof d === 'object' && 'photoCategory' in d
}

interface PhotoTimelineTabProps {
    journal: JournalEntry[]
    plantName: string
}

interface PhotoEntry {
    id: string
    timestamp: number
    imageId: string | undefined
    notes: string
    category: string
    label: string
}

function extractPhotoEntries(journal: JournalEntry[]): PhotoEntry[] {
    return journal
        .filter((e) => e.type === JournalEntryType.Photo)
        .map((e) => {
            const details = isPhotoDetails(e.details) ? e.details : undefined
            return {
                id: e.id,
                timestamp: e.createdAt,
                imageId: details?.imageId,
                notes: e.notes,
                category: details?.photoCategory ?? 'general',
                label: details?.timelineLabel ?? '',
            }
        })
        .sort((a, b) => a.timestamp - b.timestamp)
}

export const PhotoTimelineTab: React.FC<PhotoTimelineTabProps> = memo(
    ({ journal, plantName: _plantName }) => {
        const { t } = useTranslation()
        const [compareMode, setCompareMode] = useState(false)
        const [selectedIndices, setSelectedIndices] = useState<number[]>([])

        const photos = useMemo(() => extractPhotoEntries(journal), [journal])

        const handlePhotoClick = (index: number): void => {
            if (!compareMode) return
            setSelectedIndices((prev) => {
                if (prev.includes(index)) {
                    return prev.filter((i) => i !== index)
                }
                if (prev.length >= 2) {
                    return [prev[1] ?? 0, index]
                }
                return [...prev, index]
            })
        }

        if (photos.length === 0) {
            return (
                <div className="rounded-xl bg-slate-800/40 p-8 text-center">
                    <p className="text-sm text-slate-500">
                        {t('plantsView.photoTimeline.noPhotos', {
                            defaultValue:
                                'No photos yet. Add photos via the Photo action in the toolbar.',
                        })}
                    </p>
                </div>
            )
        }

        return (
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                        {t('plantsView.photoTimeline.title', {
                            defaultValue: 'Photo Timeline',
                        })}{' '}
                        <span className="text-sm font-normal text-slate-400">
                            ({photos.length})
                        </span>
                    </h3>
                    <button
                        type="button"
                        onClick={() => {
                            setCompareMode(!compareMode)
                            setSelectedIndices([])
                        }}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            compareMode
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:text-white'
                        }`}
                    >
                        {compareMode
                            ? t('plantsView.photoTimeline.exitCompare', {
                                  defaultValue: 'Exit Compare',
                              })
                            : t('plantsView.photoTimeline.compare', {
                                  defaultValue: 'Compare Mode',
                              })}
                    </button>
                </div>

                {/* Compare view */}
                {compareMode && selectedIndices.length === 2 && (
                    <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-800/60 p-4 ring-1 ring-inset ring-slate-700/50">
                        {selectedIndices.map((idx) => {
                            const photo = photos[idx]
                            if (!photo) return null
                            return (
                                <div key={photo.id} className="text-center space-y-2">
                                    <div className="aspect-square rounded-lg bg-slate-700 flex items-center justify-center">
                                        <span className="text-xs text-slate-500">
                                            {photo.imageId ??
                                                t('plantsView.photoTimeline.noPreview', {
                                                    defaultValue: 'No preview',
                                                })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        {new Date(photo.timestamp).toLocaleDateString()}
                                    </p>
                                    {photo.label && (
                                        <p className="text-xs text-slate-300">{photo.label}</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {compareMode && selectedIndices.length < 2 && (
                    <p className="text-sm text-slate-400 text-center">
                        {t('plantsView.photoTimeline.selectTwo', {
                            defaultValue: 'Select 2 photos to compare',
                        })}
                    </p>
                )}

                {/* Timeline grid */}
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700" />

                    <div className="space-y-4">
                        {photos.map((photo, index) => (
                            <button
                                type="button"
                                key={photo.id}
                                onClick={() => handlePhotoClick(index)}
                                className={`relative w-full text-left flex items-start gap-4 pl-8 transition-colors ${
                                    compareMode
                                        ? 'cursor-pointer hover:bg-slate-800/40 rounded-lg p-2'
                                        : ''
                                } ${selectedIndices.includes(index) ? 'ring-2 ring-primary-400 rounded-lg' : ''}`}
                            >
                                {/* Timeline dot */}
                                <div
                                    className={`absolute left-2.5 top-3 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                                        selectedIndices.includes(index)
                                            ? 'bg-primary-400'
                                            : 'bg-slate-600'
                                    }`}
                                />

                                {/* Photo placeholder */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg bg-slate-700/60 ring-1 ring-inset ring-slate-600 flex items-center justify-center">
                                    <span className="text-[10px] text-slate-500 text-center px-1">
                                        {photo.category}
                                    </span>
                                </div>

                                {/* Photo info */}
                                <div className="min-w-0 flex-1 pt-1">
                                    <p className="text-xs text-slate-400">
                                        {new Date(photo.timestamp).toLocaleDateString(undefined, {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                    {photo.label && (
                                        <p className="text-sm font-medium text-white truncate">
                                            {photo.label}
                                        </p>
                                    )}
                                    {photo.notes && (
                                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                                            {photo.notes}
                                        </p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    },
)
PhotoTimelineTab.displayName = 'PhotoTimelineTab'
