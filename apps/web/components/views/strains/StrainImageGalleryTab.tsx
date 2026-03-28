import React, { useState, useMemo, useCallback } from 'react'
import type { Strain, SavedStrainTip } from '@/types'
import { useAppSelector, useAppDispatch } from '@/stores/store'
import { selectSavedStrainTips } from '@/stores/selectors'
import { Card } from '@/components/common/Card'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { normalizeImageDataUrl } from '@/utils/imageDataUrl'
import { StrainImageGenerator } from './StrainImageGenerator'
import { addStrainTip } from '@/stores/slices/savedItemsSlice'

interface StrainImageGalleryTabProps {
    strain: Strain
}

export const StrainImageGalleryTab: React.FC<StrainImageGalleryTabProps> = ({ strain }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const rawSavedTips = useAppSelector(selectSavedStrainTips)
    const savedTips = useMemo(() => rawSavedTips ?? [], [rawSavedTips])
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const handleImageGenerated = useCallback(
        (dataUrl: string) => {
            dispatch(
                addStrainTip({
                    strain,
                    tip: {
                        nutrientTip: '',
                        trainingTip: '',
                        environmentalTip: '',
                        proTip: '',
                    },
                    title: t('strainsView.strainDetail.images.generatedImageTitle', {
                        name: strain.name,
                    }),
                    imageUrl: dataUrl,
                }),
            )
        },
        [dispatch, strain, t],
    )

    const images = useMemo(
        () =>
            (savedTips as SavedStrainTip[])
                .filter((tip) => tip?.strainId === strain.id && tip.imageUrl)
                .map((tip) => ({
                    url: normalizeImageDataUrl(tip.imageUrl),
                    createdAt: tip.createdAt,
                    title: tip.title ?? '',
                }))
                .filter((image): image is { url: string; createdAt: number; title: string } =>
                    Boolean(image.url),
                )
                .toSorted((a, b) => b.createdAt - a.createdAt),
        [savedTips, strain.id],
    )

    if (images.length === 0) {
        return (
            <>
                <StrainImageGenerator strain={strain} onImageGenerated={handleImageGenerated} />
                <Card className="text-center py-10 text-slate-500">
                    <PhosphorIcons.Camera className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                    <h3 className="font-semibold">
                        {t('strainsView.strainDetail.images.noImagesTitle')}
                    </h3>
                    <p className="text-sm">
                        {t('strainsView.strainDetail.images.noImagesSubtitle')}
                    </p>
                </Card>
            </>
        )
    }

    return (
        <>
            <StrainImageGenerator strain={strain} onImageGenerated={handleImageGenerated} />
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('strainsView.fullScreenImage')}
                >
                    <button
                        type="button"
                        className="absolute inset-0"
                        aria-label={t('common.close')}
                        onClick={() => setSelectedImage(null)}
                    />
                    <img
                        src={selectedImage}
                        alt={t('strainsView.fullScreenImage')}
                        className="relative z-10 max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        loading="eager"
                        decoding="async"
                    />
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                    <Card key={`${image.url}-${image.createdAt}`} className="p-0 overflow-hidden">
                        <button
                            type="button"
                            className="relative w-full cursor-pointer text-left group"
                            onClick={() => setSelectedImage(image.url)}
                            aria-label={`${image.title} - ${t('strainsView.fullScreenImage')}`}
                        >
                            <img
                                src={image.url}
                                alt={image.title}
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                                decoding="async"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-2 text-xs text-white">
                                <p className="font-semibold truncate">{image.title}</p>
                                <p className="text-white/70">
                                    {new Date(image.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </button>
                    </Card>
                ))}
            </div>
        </>
    )
}
