import React, { useState, useCallback, useEffect } from 'react'
import type { Strain } from '@/types'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '@/stores/store'
import { selectLanguage } from '@/stores/selectors'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import type { ImageGenerationProgress } from '@/services/imageGenerationService'

interface StrainImageGeneratorProps {
    strain: Strain
    onImageGenerated?: (dataUrl: string) => void
}

const PHASE_LABELS: Record<ImageGenerationProgress['phase'], string> = {
    loading: 'strainsView.imageGen.phases.loading',
    encoding: 'strainsView.imageGen.phases.encoding',
    denoising: 'strainsView.imageGen.phases.denoising',
    decoding: 'strainsView.imageGen.phases.decoding',
    complete: 'strainsView.imageGen.phases.complete',
}

export const StrainImageGenerator: React.FC<StrainImageGeneratorProps> = ({
    strain,
    onImageGenerated,
}) => {
    const { t } = useTranslation()
    const lang = useAppSelector(selectLanguage)

    const [isGenerating, setIsGenerating] = useState(false)
    const [progress, setProgress] = useState<ImageGenerationProgress | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)
    const [isCapable, setIsCapable] = useState<boolean | null>(null)
    const [capabilityReason, setCapabilityReason] = useState('')
    const [gpuBusy, setGpuBusy] = useState(false)

    const [imageStyle, setImageStyle] = useState('random')
    const [imageCriteria, setImageCriteria] = useState({
        focus: 'buds',
        composition: 'dynamic',
        mood: 'mystical',
    })

    // Check device capability on mount
    useEffect(() => {
        let cancelled = false
        Promise.all([import('@/services/imageGenerationService'), import('@/services/local-ai')])
            .then(([{ checkImageGenCapability }, { getGpuLockState }]) => {
                if (cancelled) return
                const cap = checkImageGenCapability()
                setIsCapable(cap.supported)
                setCapabilityReason(cap.reason)
                const lock = getGpuLockState()
                setGpuBusy(lock.locked && lock.holder !== 'image-gen')
            })
            .catch(() => {
                if (!cancelled) {
                    setIsCapable(false)
                    setCapabilityReason(
                        t('common.imageGenCapability.serviceUnavailable', {
                            defaultValue: 'Image generation service unavailable.',
                        }),
                    )
                }
            })
        return () => {
            cancelled = true
        }
    }, [t])

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true)
        setError(null)
        setProgress(null)
        setGeneratedImage(null)

        try {
            const { generateStrainImageLocal } = await import('@/services/imageGenerationService')
            const result = await generateStrainImageLocal(
                {
                    id: `gallery-${strain.id}-${Date.now()}`,
                    strain,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    style: imageStyle as
                        | 'random'
                        | 'fantasy'
                        | 'botanical'
                        | 'psychedelic'
                        | 'macro'
                        | 'cyberpunk',
                    criteria: imageCriteria,
                    lang: lang === 'de' ? 'de' : 'en',
                },
                (p) => setProgress(p),
            )
            setGeneratedImage(result.dataUrl)
            onImageGenerated?.(result.dataUrl)
        } catch (err) {
            setError(err instanceof Error ? err.message : t('strainsView.imageGen.error'))
        } finally {
            setIsGenerating(false)
        }
    }, [strain, imageStyle, imageCriteria, lang, onImageGenerated, t])

    const styleOptions = Object.keys(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        t('strainsView.tips.form.imageStyles', { returnObjects: true }) as Record<string, string>,
    ).map((k) => ({ value: k, label: t(`strainsView.tips.form.imageStyles.${k}`) }))

    const focusOptions = Object.keys(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        t('strainsView.tips.form.imageFocusOptions', { returnObjects: true }) as Record<
            string,
            string
        >,
    ).map((k) => ({ value: k, label: t(`strainsView.tips.form.imageFocusOptions.${k}`) }))

    const compositionOptions = Object.keys(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        t('strainsView.tips.form.imageCompositionOptions', { returnObjects: true }) as Record<
            string,
            string
        >,
    ).map((k) => ({ value: k, label: t(`strainsView.tips.form.imageCompositionOptions.${k}`) }))

    const moodOptions = Object.keys(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        t('strainsView.tips.form.imageMoodOptions', { returnObjects: true }) as Record<
            string,
            string
        >,
    ).map((k) => ({ value: k, label: t(`strainsView.tips.form.imageMoodOptions.${k}`) }))

    // Don't render if capability check hasn't completed yet
    if (isCapable === null) return null

    const renderGenerateButtonContent = (): React.ReactNode => {
        if (isGenerating) {
            return (
                <span className="flex items-center gap-2">
                    <PhosphorIcons.ArrowClockwise className="w-4 h-4 animate-spin" />
                    {progress
                        ? `${t(PHASE_LABELS[progress.phase])} (${progress.percent}%)`
                        : t('strainsView.imageGen.generating')}
                </span>
            )
        }

        if (generatedImage) {
            return (
                <>
                    <PhosphorIcons.ArrowClockwise className="w-4 h-4 mr-1.5" />
                    {t('strainsView.imageGen.regenerate')}
                </>
            )
        }

        return (
            <>
                <PhosphorIcons.Sparkle className="w-4 h-4 mr-1.5" />
                {t('strainsView.imageGen.generate')}
            </>
        )
    }

    return (
        <Card className="mb-6">
            <h3 className="text-lg font-bold text-primary-400 flex items-center gap-2 mb-3">
                <PhosphorIcons.MagicWand className="w-5 h-5" />
                {t('strainsView.imageGen.title')}
            </h3>

            {!isCapable ? (
                <div className="text-sm text-slate-400 flex items-center gap-2">
                    <PhosphorIcons.Warning className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>{capabilityReason}</span>
                </div>
            ) : (
                <>
                    <p className="text-sm text-slate-400 mb-4">{t('imageGen.description')}</p>

                    {gpuBusy && !isGenerating && (
                        <div className="text-sm text-amber-300 bg-amber-900/20 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
                            <PhosphorIcons.Warning className="w-4 h-4 flex-shrink-0" />
                            <span>{t('strainsView.imageGen.gpuBusy')}</span>
                        </div>
                    )}

                    <details className="group bg-slate-800 rounded-lg ring-1 ring-inset ring-slate-700/50 hover:ring-primary-500/30 transition-[box-shadow,color] duration-200 mb-4">
                        <summary className="list-none text-sm font-semibold text-slate-300 cursor-pointer flex items-center gap-2 p-3 select-none">
                            <PhosphorIcons.GearSix className="w-4 h-4" />
                            {t('strainsView.imageGen.settings')}
                            <PhosphorIcons.ChevronDown className="w-4 h-4 transition-transform duration-300 group-open:rotate-180 ml-auto" />
                        </summary>
                        <div className="px-3 pb-3 pt-2 border-t border-slate-700/50 space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1">
                                    {t('strainsView.tips.form.imageStyle')}
                                </label>
                                <SegmentedControl
                                    value={[imageStyle]}
                                    onToggle={(v) => setImageStyle(v as string)}
                                    options={styleOptions}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1">
                                    {t('strainsView.tips.form.imageFocus')}
                                </label>
                                <SegmentedControl
                                    value={[imageCriteria.focus]}
                                    onToggle={(v) =>
                                        setImageCriteria((c) => ({ ...c, focus: v as string }))
                                    }
                                    options={focusOptions}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1">
                                    {t('strainsView.tips.form.imageComposition')}
                                </label>
                                <SegmentedControl
                                    value={[imageCriteria.composition]}
                                    onToggle={(v) =>
                                        setImageCriteria((c) => ({
                                            ...c,
                                            composition: v as string,
                                        }))
                                    }
                                    options={compositionOptions}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-1">
                                    {t('strainsView.tips.form.imageMood')}
                                </label>
                                <SegmentedControl
                                    value={[imageCriteria.mood]}
                                    onToggle={(v) =>
                                        setImageCriteria((c) => ({ ...c, mood: v as string }))
                                    }
                                    options={moodOptions}
                                />
                            </div>
                        </div>
                    </details>

                    <Button
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full mb-4"
                    >
                        {renderGenerateButtonContent()}
                    </Button>

                    {isGenerating && progress && (
                        <div className="mb-4">
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div
                                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress.percent}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1 text-center">
                                {t(PHASE_LABELS[progress.phase])} &mdash;{' '}
                                {(progress.elapsedMs / 1000).toFixed(1)}s
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-red-400 flex items-center gap-2 mb-4">
                            <PhosphorIcons.Warning className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {generatedImage && !isGenerating && (
                        <div className="animate-fade-in">
                            <img
                                src={generatedImage}
                                alt={t('strainsView.imageGen.altText', { name: strain.name })}
                                className="rounded-lg w-full shadow-lg"
                                decoding="async"
                            />
                        </div>
                    )}
                </>
            )}
        </Card>
    )
}
