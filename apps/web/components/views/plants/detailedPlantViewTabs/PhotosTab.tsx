import React, { useState, useEffect, useMemo, memo, useCallback } from 'react'
import { JournalEntry, PhotoDetails, JournalEntryType } from '@/types'
import { Card } from '@/components/common/Card'
import { useTranslation } from 'react-i18next'
import { dbService } from '@/services/dbService'
import { SkeletonLoader } from '@/components/common/SkeletonLoader'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface PhotoTabProps {
    journal: JournalEntry[]
}

const PhotoItem: React.FC<{
    entry: JournalEntry
    onOpen: (url: string, entry: JournalEntry) => void
}> = memo(({ entry, onOpen }) => {
    const [imageUrl, setImageUrl] = useState(
        (entry.details as PhotoDetails)?.imageUrl || null,
    )
    const [isLoading, setIsLoading] = useState(!(entry.details as PhotoDetails)?.imageUrl)
    const details = entry.details as PhotoDetails

    useEffect(() => {
        let isMounted = true
        const photoDetails = entry.details as PhotoDetails
        if (photoDetails?.imageId && !imageUrl) {
            setIsLoading(true)
            dbService
                .getImage(photoDetails.imageId)
                .then((storedImage) => {
                    if (isMounted && storedImage) setImageUrl(storedImage.data)
                })
                .catch((err) => {
                    console.debug('[PhotosTab] Failed to load image:', err)
                })
                .finally(() => {
                    if (isMounted) setIsLoading(false)
                })
        } else if (imageUrl) {
            setIsLoading(false)
        }
        return () => {
            isMounted = false
        }
    }, [entry.details, imageUrl])

    if (isLoading) {
        return <SkeletonLoader className="w-full aspect-square rounded-lg" />
    }

    if (!imageUrl) return null

    return (
        <button
            type="button"
            className="group relative cursor-pointer text-left w-full"
            onClick={() => onOpen(imageUrl, entry)}
            aria-label={entry.notes}
        >
            <img
                src={imageUrl}
                alt={entry.notes}
                className="w-full aspect-square object-cover rounded-lg ring-1 ring-inset ring-white/10"
                loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 p-3 flex flex-col justify-end rounded-lg">
                <p className="text-white text-sm font-semibold truncate">{entry.notes}</p>
                {details?.photoCategory && (
                    <span className="inline-flex items-center self-start mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary-500/30 text-primary-200">
                        {details.photoCategory}
                    </span>
                )}
                {details?.timelineLabel && (
                    <p className="text-primary-200 text-xs font-semibold mt-0.5">
                        {details.timelineLabel}
                    </p>
                )}
                <p className="text-white/60 text-[11px] mt-0.5">
                    {new Date(entry.createdAt).toLocaleDateString()}
                </p>
            </div>
        </button>
    )
})

PhotoItem.displayName = 'PhotoItem'

const Lightbox: React.FC<{ imageUrl: string; entry: JournalEntry; onClose: () => void }> = memo(
    ({ imageUrl, entry, onClose }) => {
        const { t } = useTranslation()
        const details = entry.details as PhotoDetails

        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose()
            }
            document.addEventListener('keydown', handleKeyDown)
            return () => document.removeEventListener('keydown', handleKeyDown)
        }, [onClose])

        return (
            <dialog
                open
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in"
                aria-label={entry.notes}
            >
                <div className="relative max-w-[90vw] max-h-[90vh]">
                    <button
                        type="button"
                        className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white ring-1 ring-white/20 hover:bg-slate-700 transition-colors"
                        onClick={onClose}
                        aria-label={t('common.close')}
                    >
                        <PhosphorIcons.X className="w-5 h-5" />
                    </button>
                    <img
                        src={imageUrl}
                        alt={entry.notes}
                        className="max-w-full max-h-[85vh] rounded-lg object-contain"
                    />
                    <div className="mt-3 text-center space-y-1">
                        <p className="text-white font-semibold">{entry.notes}</p>
                        {details?.photoCategory && (
                            <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-primary-500/30 text-primary-200">
                                {details.photoCategory}
                            </span>
                        )}
                        <p className="text-white/50 text-sm">
                            {new Date(entry.createdAt).toLocaleString()}
                        </p>
                    </div>
                </div>
            </dialog>
        )
    },
)

Lightbox.displayName = 'Lightbox'

export const PhotosTab: React.FC<PhotoTabProps> = memo(({ journal }) => {
    const { t } = useTranslation()
    const [lightbox, setLightbox] = useState<{ url: string; entry: JournalEntry } | null>(null)

    const photoJournalEntries = useMemo(
        () =>
            journal.filter(
                (entry) =>
                    entry.type === JournalEntryType.Photo &&
                    ((entry.details as PhotoDetails)?.imageUrl ||
                        (entry.details as PhotoDetails)?.imageId),
            ),
        [journal],
    )

    const handleOpenLightbox = useCallback((url: string, entry: JournalEntry) => {
        setLightbox({ url, entry })
    }, [])

    const handleCloseLightbox = useCallback(() => {
        setLightbox(null)
    }, [])

    return (
        <>
            {lightbox && (
                <Lightbox
                    imageUrl={lightbox.url}
                    entry={lightbox.entry}
                    onClose={handleCloseLightbox}
                />
            )}
            <Card>
                {photoJournalEntries.length > 0 ? (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold font-display text-primary-400 flex items-center gap-2">
                                <PhosphorIcons.Camera className="w-5 h-5" />
                                {t('plantsView.detailedView.tabs.photos')}
                            </h3>
                            <span className="text-xs font-bold rounded-full bg-slate-800 text-slate-300 px-2.5 py-1 ring-1 ring-inset ring-white/20">
                                {photoJournalEntries.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {[...photoJournalEntries].reverse().map((entry) => (
                                <PhotoItem
                                    key={entry.id}
                                    entry={entry}
                                    onOpen={handleOpenLightbox}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <PhosphorIcons.Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-400">
                            {t('plantsView.detailedView.photosNoEntries')}
                        </p>
                    </div>
                )}
            </Card>
        </>
    )
})

PhotosTab.displayName = 'PhotosTab'
