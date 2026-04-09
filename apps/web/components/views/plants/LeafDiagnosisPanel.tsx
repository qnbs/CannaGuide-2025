import React, { useState, useEffect, useRef, useCallback, memo, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { cn } from '@/lib/utils'
import type { Plant, LeafDiagnosisResult, ModelStatus } from '@/types'

const LazyNutrientDeficiencyWizard = lazy(() =>
    import('@/components/views/plants/NutrientDeficiencyWizard').then((m) => ({
        default: m.NutrientDeficiencyWizard,
    })),
)

type DiagnosisTab = 'ai' | 'manual'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
    plant: Plant
}

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
])

// ---------------------------------------------------------------------------
// Severity badge colours
// ---------------------------------------------------------------------------

const SEVERITY_COLOURS: Readonly<Record<string, string>> = {
    none: 'bg-green-900/50 text-green-300 border border-green-700',
    mild: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700',
    moderate: 'bg-orange-900/50 text-orange-300 border border-orange-700',
    severe: 'bg-red-900/50 text-red-300 border border-red-700',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LeafDiagnosisPanelComponent: React.FC<Props> = ({ plant }) => {
    const { t } = useTranslation()

    const [activeTab, setActiveTab] = useState<DiagnosisTab>('ai')
    const [modelStatus, setModelStatus] = useState<ModelStatus>('not-cached')
    const [downloadProgress, setDownloadProgress] = useState(0)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [imageData, setImageData] = useState<ImageData | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<LeafDiagnosisResult | null>(null)
    const [error, setError] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // ---- Sync model status on mount ----------------------------------------
    useEffect(() => {
        let active = true
        void (async () => {
            const { isModelCached } = await import('@/services/plantDiseaseModelService')
            const { getModelStatus } = await import('@/services/plantDiseaseModelService')
            await isModelCached()
            if (active) setModelStatus(getModelStatus())
        })()
        return () => {
            active = false
        }
    }, [])

    // ---- Model download -------------------------------------------------------
    const handleDownload = useCallback(async () => {
        const { downloadModel, getModelStatus } =
            await import('@/services/plantDiseaseModelService')
        setModelStatus('downloading')
        setDownloadProgress(0)
        const ok = await downloadModel((pct) => setDownloadProgress(pct))
        setModelStatus(getModelStatus())
        if (!ok && getModelStatus() === 'error') {
            setError(t('plantsView.diagnosis.error'))
        }
    }, [t])

    // ---- Image selection ------------------------------------------------------
    const extractImageData = useCallback((file: File): void => {
        if (!ALLOWED_MIME_TYPES.has(file.type)) return
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        setResult(null)
        setError(null)

        const img = new Image()
        img.onload = () => {
            const canvas = canvasRef.current
            if (!canvas) return
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            ctx.drawImage(img, 0, 0)
            setImageData(ctx.getImageData(0, 0, img.width, img.height))
        }
        img.src = url
    }, [])

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) extractImageData(file)
        },
        [extractImageData],
    )

    const handleClearImage = useCallback(() => {
        setPreviewUrl(null)
        setImageData(null)
        setResult(null)
        setError(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }, [])

    // ---- Camera capture -------------------------------------------------------
    const handleCamera = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) return
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            const video = document.createElement('video')
            video.srcObject = stream
            await video.play()
            const cap = document.createElement('canvas')
            cap.width = video.videoWidth
            cap.height = video.videoHeight
            const ctx = cap.getContext('2d')
            if (!ctx) {
                stream.getTracks().forEach((t) => t.stop())
                return
            }
            ctx.drawImage(video, 0, 0)
            stream.getTracks().forEach((t) => t.stop())
            cap.toBlob((blob) => {
                if (blob) extractImageData(new File([blob], 'capture.jpg', { type: 'image/jpeg' }))
            }, 'image/jpeg')
        } catch {
            // Camera permission denied or hardware unavailable
            setError(t('plantsView.aiDiagnostics.cameraError'))
        }
    }, [extractImageData, t])

    // ---- Inference ------------------------------------------------------------
    const handleAnalyze = useCallback(async () => {
        if (!imageData) return
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const { classifyLeafImage } = await import('@/services/localAiDiagnosisService')
            const res = await classifyLeafImage(imageData)
            setResult(res)
        } catch {
            setError(t('plantsView.diagnosis.error'))
        } finally {
            setLoading(false)
        }
    }, [imageData, t])

    // ---- Render ---------------------------------------------------------------
    const isReady = modelStatus === 'ready'
    const canAnalyze = isReady && imageData !== null && !loading

    return (
        <div className="space-y-4" data-testid="leaf-diagnosis-panel">
            {/* Hidden canvas for ImageData extraction */}
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

            {/* --- Tab Toggle --- */}
            <div className="flex gap-1 rounded-lg bg-slate-800/60 p-1" data-testid="diagnosis-tabs">
                <button
                    type="button"
                    className={cn(
                        'flex-1 text-xs font-medium rounded-md px-3 py-1.5 transition-colors',
                        activeTab === 'ai'
                            ? 'bg-primary-600 text-white'
                            : 'text-slate-400 hover:text-slate-200',
                    )}
                    onClick={() => setActiveTab('ai')}
                    data-testid="tab-ai"
                >
                    <PhosphorIcons.Brain className="w-3.5 h-3.5 inline mr-1" />
                    {t('plantsView.nutrientWizard.tabAiScanner')}
                </button>
                <button
                    type="button"
                    className={cn(
                        'flex-1 text-xs font-medium rounded-md px-3 py-1.5 transition-colors',
                        activeTab === 'manual'
                            ? 'bg-primary-600 text-white'
                            : 'text-slate-400 hover:text-slate-200',
                    )}
                    onClick={() => setActiveTab('manual')}
                    data-testid="tab-manual"
                >
                    <PhosphorIcons.TreeStructure className="w-3.5 h-3.5 inline mr-1" />
                    {t('plantsView.nutrientWizard.tabManual')}
                </button>
            </div>

            {/* --- Manual Diagnosis Tab --- */}
            {activeTab === 'manual' && (
                <Suspense
                    fallback={<p className="text-xs text-slate-500 text-center py-4">Loading...</p>}
                >
                    <LazyNutrientDeficiencyWizard />
                </Suspense>
            )}

            {/* --- AI Scanner Tab --- */}
            {activeTab === 'ai' && (
                <>
                    {/* --- Model Status Bar --- */}
                    <div
                        className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
                            modelStatus === 'ready' && 'bg-green-900/30 border border-green-800',
                            modelStatus === 'not-cached' &&
                                'bg-amber-900/30 border border-amber-800',
                            modelStatus === 'downloading' &&
                                'bg-blue-900/30 border border-blue-800',
                            modelStatus === 'error' && 'bg-red-900/30 border border-red-800',
                        )}
                    >
                        {modelStatus === 'ready' && (
                            <>
                                <PhosphorIcons.CheckCircle
                                    className="w-4 h-4 text-green-400 shrink-0"
                                    weight="fill"
                                />
                                <span className="text-green-300">
                                    {t('plantsView.diagnosis.ready')}
                                </span>
                            </>
                        )}
                        {modelStatus === 'not-cached' && (
                            <>
                                <PhosphorIcons.Warning className="w-4 h-4 text-amber-400 shrink-0" />
                                <span
                                    className="text-amber-300 flex-1"
                                    data-testid="model-not-loaded"
                                >
                                    {t('plantsView.diagnosis.modelNotLoaded')}
                                </span>
                                <Button size="sm" onClick={() => void handleDownload()}>
                                    {t('plantsView.diagnosis.download')}
                                </Button>
                            </>
                        )}
                        {modelStatus === 'downloading' && (
                            <>
                                <PhosphorIcons.ArrowClockwise className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />
                                <div className="flex-1">
                                    <p className="text-blue-300 mb-1">
                                        {t('plantsView.diagnosis.downloading', {
                                            pct: downloadProgress,
                                        })}
                                    </p>
                                    <div className="h-1.5 bg-blue-900/50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-300"
                                            style={{ width: `${downloadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                        {modelStatus === 'error' && (
                            <>
                                <PhosphorIcons.XCircle
                                    className="w-4 h-4 text-red-400 shrink-0"
                                    weight="fill"
                                />
                                <span className="text-red-300 flex-1">
                                    {t('plantsView.diagnosis.error')}
                                </span>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => void handleDownload()}
                                >
                                    {t('plantsView.diagnosis.download')}
                                </Button>
                            </>
                        )}
                    </div>

                    {/* --- Upload Zone --- */}
                    <div className="space-y-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            aria-label={t('plantsView.diagnosis.uploadPhoto')}
                        />
                        {previewUrl ? (
                            <div className="relative">
                                <img
                                    src={previewUrl}
                                    alt={`${plant.name} leaf`}
                                    className="w-full max-h-48 object-contain rounded-lg border border-slate-700 bg-slate-900"
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="absolute top-2 right-2"
                                    onClick={handleClearImage}
                                    aria-label={t('plantsView.diagnosis.clearImage')}
                                >
                                    <PhosphorIcons.X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="w-full border-2 border-dashed border-slate-600 rounded-lg p-6 text-center text-slate-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                                data-testid="upload-button"
                            >
                                <PhosphorIcons.UploadSimple className="w-8 h-8 mx-auto mb-2" />
                                <span className="text-sm">
                                    {t('plantsView.diagnosis.uploadPhoto')}
                                </span>
                            </button>
                        )}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <PhosphorIcons.UploadSimple className="w-4 h-4 mr-1.5" />
                                {t('plantsView.diagnosis.uploadPhoto')}
                            </Button>
                            {typeof navigator !== 'undefined' &&
                                typeof navigator.mediaDevices?.getUserMedia === 'function' && (
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        onClick={() => void handleCamera()}
                                        aria-label={t('plantsView.diagnosis.capturePhoto')}
                                    >
                                        <PhosphorIcons.Camera className="w-4 h-4" />
                                    </Button>
                                )}
                        </div>
                    </div>

                    {/* --- Analyze Button --- */}
                    <Button
                        onClick={() => void handleAnalyze()}
                        disabled={!canAnalyze}
                        className="w-full"
                        data-testid="analyze-button"
                    >
                        {loading ? (
                            <>
                                <PhosphorIcons.ArrowClockwise className="w-4 h-4 mr-1.5 animate-spin" />
                                {t('plantsView.diagnosis.analyzing')}
                            </>
                        ) : (
                            <>
                                <PhosphorIcons.MagnifyingGlass className="w-4 h-4 mr-1.5" />
                                {t('plantsView.diagnosis.analyze')}
                            </>
                        )}
                    </Button>

                    {/* --- Error message --- */}
                    {error && (
                        <p className="text-sm text-red-400" role="alert">
                            {error}
                        </p>
                    )}

                    {/* --- Results Card --- */}
                    {result !== null && (
                        <Card
                            className="bg-slate-900/70 animate-fade-in space-y-3"
                            data-testid="result-card"
                        >
                            <h4 className="font-semibold text-primary-300 flex items-center gap-2">
                                <PhosphorIcons.Leafy className="w-4 h-4" />
                                {t('plantsView.diagnosis.result')}
                            </h4>

                            {/* Label */}
                            <p className="text-sm text-slate-200" data-testid="result-label">
                                {t('plantsView.diagnosis.label', {
                                    label: result.label.replace(/_/g, ' '),
                                })}
                            </p>

                            {/* Confidence bar */}
                            <div>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span>{t('plantsView.diagnosis.confidence')}</span>
                                    <span>{Math.round(result.confidence * 100)}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary-500 transition-all duration-500"
                                        style={{ width: `${Math.round(result.confidence * 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Severity badge */}
                            <span
                                className={cn(
                                    'inline-block text-xs px-2 py-0.5 rounded-full font-medium',
                                    SEVERITY_COLOURS[result.severity],
                                )}
                            >
                                {t(`diagnosis.severity.${result.severity}`)}
                            </span>

                            {/* Model used chip */}
                            <p className="text-xs text-slate-500">
                                {t(`diagnosis.modelUsed.${result.modelUsed}`)}
                            </p>

                            {/* Recommendations */}
                            {result.recommendations.length > 0 ? (
                                <div>
                                    <p className="text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                                        {t('plantsView.diagnosis.recommendations')}
                                    </p>
                                    <ul className="space-y-1">
                                        {result.recommendations.map((rec) => (
                                            <li
                                                key={rec.diseaseId}
                                                className="text-xs text-slate-400"
                                            >
                                                <span className="text-primary-400 font-medium">
                                                    {rec.diseaseId.replace(/-/g, ' ')}
                                                </span>
                                                {rec.relatedLexiconKeys.length > 0 && (
                                                    <span className="text-slate-500">
                                                        {' '}
                                                        &mdash; {rec.relatedLexiconKeys.join(', ')}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500">
                                    {t('plantsView.diagnosis.noRecommendations')}
                                </p>
                            )}
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}

LeafDiagnosisPanelComponent.displayName = 'LeafDiagnosisPanel'

export const LeafDiagnosisPanel: React.FC<Props> = memo(LeafDiagnosisPanelComponent)
