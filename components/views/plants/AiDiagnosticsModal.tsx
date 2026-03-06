import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { Plant, PlantDiagnosisResponse, JournalEntryType, PhotoCategory, Language } from '@/types'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator'
import { CameraModal } from '@/components/common/CameraModal'
import { Modal } from '@/components/common/Modal'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { addNotification } from '@/stores/slices/uiSlice'
import { addJournalEntry } from '@/stores/slices/simulationSlice'
import { Card } from '@/components/common/Card'
import { getDynamicLoadingMessages } from '@/services/aiLoadingMessages'
import { dbService } from '@/services/dbService'
import { Textarea } from '@/components/ui/textarea'
import { selectLanguage } from '@/stores/selectors'
import { resizeImage, base64ToMimeType, validateImageFile } from '@/services/imageService'

const IMAGE_CONSENT_KEY = 'cg.image.ai.consent.v1'

interface DiagnosisResultProps {
    response: PlantDiagnosisResponse
    plantId: string
    image: string | null
}

const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ response, plantId, image }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    const handleSaveToJournal = async () => {
        const content = `
### ${t('plantsView.aiDiagnostics.diagnosis')}: ${response.title} (${(
            response.confidence * 100
        ).toFixed(0)}%)

**${t('plantsView.aiDiagnostics.actions')}:** 
${response.immediateActions}

**${t('plantsView.aiDiagnostics.solution')}:** 
${response.longTermSolution}

**${t('plantsView.aiDiagnostics.prevention')}:** 
${response.prevention}
        `

        const journalDetails: { diagnosis: string; imageId?: string; photoCategory: PhotoCategory } = {
            diagnosis: content,
            photoCategory: PhotoCategory.ProblemArea,
        }

        if (image) {
            const imageId = `diag-${plantId}-${Date.now()}`
            try {
                const base64Data = image.split(',')[1]
                const mimeType = base64ToMimeType(base64Data)
                await dbService.addImage({
                    id: imageId,
                    data: `data:${mimeType};base64,${base64Data}`,
                    createdAt: Date.now(),
                })
                journalDetails.imageId = imageId
            } catch (error) {
                console.error('Failed to save diagnosis image to DB', error)
                dispatch(
                    addNotification({
                        message: t('plantsView.aiDiagnostics.saveImageError'),
                        type: 'error',
                    }),
                )
            }
        }

        dispatch(
            addJournalEntry({
                plantId: plantId,
                entry: {
                    type: JournalEntryType.Observation,
                    notes: t('plantsView.aiDiagnostics.journalTitle', { title: response.title }),
                    details: journalDetails,
                },
            }),
        )
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <Card className="bg-slate-800/50">
                <div className="flex justify-between items-baseline">
                    <h4 className="text-xl font-bold font-display text-primary-300">
                        {response.title}
                    </h4>
                    <span className="text-sm font-mono bg-slate-700 px-2 py-0.5 rounded-full">
                        {t('plantsView.aiDiagnostics.confidence')}:{' '}
                        {(response.confidence * 100).toFixed(0)}%
                    </span>
                </div>
            </Card>

            <Card>
                <h5 className="font-semibold text-slate-100 flex items-center gap-2 mb-2">
                    <PhosphorIcons.FirstAidKit className="w-5 h-5" />
                    {t('plantsView.aiDiagnostics.diagnosis')}
                </h5>
                <p className="text-sm text-slate-300">{response.diagnosis}</p>
            </Card>

            <Card>
                <h5 className="font-semibold text-slate-100 flex items-center gap-2 mb-2">
                    <PhosphorIcons.Lightning weight="fill" className="w-5 h-5 text-amber-400" />
                    {t('plantsView.aiDiagnostics.actions')}
                </h5>
                <p className="text-sm text-slate-300 whitespace-pre-line">
                    {response.immediateActions}
                </p>
            </Card>

            <Card>
                <h5 className="font-semibold text-slate-100 flex items-center gap-2 mb-2">
                    <PhosphorIcons.Plant className="w-5 h-5" />
                    {t('plantsView.aiDiagnostics.solution')} &amp;{' '}
                    {t('plantsView.aiDiagnostics.prevention')}
                </h5>
                <div className="text-sm text-slate-300 space-y-2 whitespace-pre-line">
                    <p>{response.longTermSolution}</p>
                    <p>{response.prevention}</p>
                </div>
            </Card>

            <div className="text-center pt-2">
                <Button onClick={handleSaveToJournal} variant="secondary">
                    <PhosphorIcons.BookOpenText className="w-5 h-5 mr-2" />
                    {t('common.saveToJournal')}
                </Button>
            </div>
        </div>
    )
}

interface AiDiagnosticsModalProps {
    plant: Plant
    onClose: () => void
    diagnosePlant: (args: {
        base64Image: string
        mimeType: string
        plant: Plant
        userNotes: string
        lang: Language
    }) => unknown
    isLoading: boolean
    response: PlantDiagnosisResponse | undefined
    error: unknown
    resetDiagnosis: () => void
}

export const AiDiagnosticsModal: React.FC<AiDiagnosticsModalProps> = ({
    plant,
    onClose,
    diagnosePlant,
    isLoading,
    response,
    error,
    resetDiagnosis,
}) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const lang = useAppSelector(selectLanguage)

    const [image, setImage] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const cameraButtonRef = useRef<HTMLButtonElement>(null)
    const [userNotes, setUserNotes] = useState('')
    const [loadingMessage, setLoadingMessage] = useState('')
    const [consentGiven, setConsentGiven] = useState(() => localStorage.getItem(IMAGE_CONSENT_KEY) === '1')

    const step = useMemo(() => {
        if (isLoading || response || error) return 'result'
        if (image) return 'context'
        return 'upload'
    }, [isLoading, response, error, image])

    useEffect(() => {
        if (isLoading) {
            const messages = getDynamicLoadingMessages({
                useCase: 'diagnostics',
                data: {},
            })
            let i = 0
            setLoadingMessage(messages[0])
            const interval = setInterval(() => {
                i++
                setLoadingMessage(messages[i % messages.length])
            }, 2500)
            return () => clearInterval(interval)
        }
    }, [isLoading])

    const handleFile = useCallback(
        async (file: File) => {
            resetDiagnosis()
            const validationError = validateImageFile(file)
            if (validationError) {
                dispatch(
                    addNotification({
                        message: t(`plantsView.aiDiagnostics.validation.${validationError}`),
                        type: 'error',
                    }),
                )
                return
            }
            const reader = new FileReader()
            reader.onload = async () => {
                try {
                    // browser-image-compression re-encodes via canvas → strips EXIF/GPS metadata
                    const resizedImage = await resizeImage(reader.result as string)
                    setImage(resizedImage)
                } catch (err) {
                    console.error('Image resizing failed:', err)
                    setImage(reader.result as string) // fallback to original
                    dispatch(
                        addNotification({ message: t('common.imageResizeFailed'), type: 'error' }),
                    )
                }
            }
            reader.readAsDataURL(file)
        },
        [dispatch, t, resetDiagnosis],
    )

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])
    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])
    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])
    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFile(e.dataTransfer.files[0])
            }
        },
        [handleFile],
    )

    const handleCapture = async (dataUrl: string) => {
        resetDiagnosis()
        try {
            const resizedImage = await resizeImage(dataUrl)
            setImage(resizedImage)
        } catch (err) {
            console.error('Image resizing failed:', err)
            setImage(dataUrl) // fallback to original
            dispatch(addNotification({ message: t('common.imageResizeFailed'), type: 'error' }))
        }
        setIsCameraOpen(false)
    }

    const handleGetDiagnosis = () => {
        if (!image) return
        const base64Data = image.split(',')[1]
        const mimeType = base64ToMimeType(base64Data)
        diagnosePlant({ base64Image: base64Data, mimeType, plant, userNotes, lang })
    }

    const handleAcceptConsent = useCallback(() => {
        localStorage.setItem(IMAGE_CONSENT_KEY, '1')
        setConsentGiven(true)
    }, [])

    const handleRevokeConsent = useCallback(() => {
        localStorage.removeItem(IMAGE_CONSENT_KEY)
        setConsentGiven(false)
        dispatch(addNotification({ message: t('legal.imageConsent.revoked'), type: 'info' }))
    }, [dispatch, t])

    const errorMessage =
        error && typeof error === 'object' && 'message' in error
            ? (error as { message: string }).message
            : t('ai.error.unknown')

    return (
        <>
            {isCameraOpen && (
                <CameraModal
                    isOpen={isCameraOpen}
                    onClose={() => setIsCameraOpen(false)}
                    triggerRef={cameraButtonRef}
                    onCapture={handleCapture}
                />
            )}
            <Modal
                isOpen={true}
                onClose={onClose}
                title={`${t('plantsView.aiDiagnostics.title')} for ${plant.name}`}
                size="2xl"
            >
                <div className="min-h-[50dvh] sm:min-h-[420px]">
                    {step === 'upload' && (
                        <div className="space-y-4 p-1 sm:p-2">
                            {!consentGiven ? (
                                <div className="rounded-xl border border-amber-500/40 bg-amber-900/20 p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <PhosphorIcons.WarningCircle weight="fill" className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                                        <p className="text-sm text-amber-200">
                                            {t('legal.imageConsent.banner')}
                                        </p>
                                    </div>
                                    <Button onClick={handleAcceptConsent} variant="secondary" className="w-full min-h-11">
                                        <PhosphorIcons.CheckCircle className="w-5 h-5 mr-2" />
                                        {t('legal.imageConsent.accept')}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <PhosphorIcons.CheckCircle className="w-4 h-4 text-primary-500 shrink-0" />
                                        {t('legal.imageConsent.accepted')}
                                    </span>
                                    <button
                                        onClick={handleRevokeConsent}
                                        className="text-xs text-red-400 hover:text-red-300 underline transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                                    >
                                        {t('legal.imageConsent.revoke')}
                                    </button>
                                </div>
                            )}
                            <div
                                onDragEnter={consentGiven ? handleDragIn : undefined}
                                onDragLeave={consentGiven ? handleDragOut : undefined}
                                onDragOver={consentGiven ? handleDrag : undefined}
                                onDrop={consentGiven ? handleDrop : undefined}
                                className={`min-h-[220px] rounded-xl border-2 border-dashed p-6 sm:p-10 text-center cursor-pointer transition-colors flex flex-col items-center justify-center ${
                                    isDragging
                                        ? 'border-primary-500 bg-primary-900/20'
                                        : 'border-slate-600 hover:border-slate-500'
                                }`}
                                onClick={() => consentGiven && document.getElementById('ai-diag-image-upload')?.click()
                                }
                                onKeyDown={(e) => {
                                    if ((e.key === 'Enter' || e.key === ' ') && consentGiven) {
                                        e.preventDefault()
                                        document.getElementById('ai-diag-image-upload')?.click()
                                    }
                                }}
                                role="button"
                                tabIndex={consentGiven ? 0 : -1}
                                aria-label={t('plantsView.actionModals.photo.selectImage')}
                                aria-disabled={!consentGiven}
                            >
                                <PhosphorIcons.UploadSimple className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                                <p className="font-semibold text-slate-300">
                                    {t('plantsView.aiDiagnostics.dragDrop')}
                                </p>
                            </div>
                            <input
                                id="ai-diag-image-upload"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                                className="hidden"
                                disabled={!consentGiven}
                                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                            />
                            <Button
                                onClick={() => setIsCameraOpen(true)}
                                ref={cameraButtonRef}
                                variant="secondary"
                                className="w-full min-h-11"
                                disabled={!consentGiven}
                            >
                                <PhosphorIcons.Camera className="w-5 h-5 mr-1.5" />
                                {t('plantsView.aiDiagnostics.capture')}
                            </Button>
                        </div>
                    )}
                    {step === 'context' && image && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in p-1 sm:p-2">
                            <div className="relative">
                                <img
                                    src={image}
                                    alt={t('plantsView.aiDiagnostics.title')}
                                    className="w-full h-auto rounded-lg max-h-64 object-contain"
                                />
                                <Button
                                    variant="danger"
                                    className="absolute top-2 right-2 !h-11 !w-11 !p-0"
                                    onClick={() => {
                                        setImage(null)
                                    }}
                                    aria-label={t('common.removeImage')}
                                >
                                    <PhosphorIcons.X />
                                </Button>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-slate-100">
                                    {t('plantsView.aiDiagnostics.stepContextTitle')}
                                </h4>
                                <p className="text-sm text-slate-400">
                                    {t('plantsView.aiDiagnostics.stepContextDesc')}
                                </p>
                                <Textarea
                                    value={userNotes}
                                    onChange={(e) => setUserNotes(e.target.value)}
                                    placeholder={t('plantsView.aiDiagnostics.userNotesPlaceholder')}
                                    className="min-h-[120px]"
                                />
                                <Button
                                    onClick={handleGetDiagnosis}
                                    disabled={isLoading}
                                    className="w-full min-h-11"
                                >
                                    {t('ai.diagnostics')}
                                </Button>
                            </div>
                        </div>
                    )}
                    {step === 'result' && (
                        <div>
                            {isLoading && <AiLoadingIndicator loadingMessage={loadingMessage} />}
                            {Boolean(error) && (
                                <div className="text-red-400 p-4 bg-red-900/20 rounded-lg" role="alert">
                                    {errorMessage}
                                </div>
                            )}
                            {response && !isLoading && (
                                <DiagnosisResult
                                    response={response}
                                    plantId={plant.id}
                                    image={image}
                                />
                            )}
                            <p className="text-xs text-slate-500 italic mt-4 text-center">{t('ai.disclaimer')}</p>
                            <p className="text-xs text-red-400/80 italic mt-1 text-center">{t('legal.medicalDisclaimer')}</p>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    )
}
