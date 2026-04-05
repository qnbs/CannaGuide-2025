import React, { useState, useEffect, useCallback, memo } from 'react'
import { useStreamingResponse } from '@/hooks/useStreamingResponse'
import { Plant, ArchivedAdvisorResponse, AIResponse } from '@/types'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { getDynamicLoadingMessages } from '@/services/aiLoadingMessages'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { EditResponseModal } from '@/components/common/EditResponseModal'
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectArchivedAdvisorResponsesForPlant, selectLanguage } from '@/stores/selectors'
import { useGetPlantAdviceMutation, useGetProactiveDiagnosisMutation } from '@/stores/api'
import {
    addArchivedAdvisorResponse,
    updateArchivedAdvisorResponse,
    deleteArchivedAdvisorResponse,
    setAdvisorResponseFeedback,
} from '@/stores/slices/archivesSlice'
import { Speakable } from '@/components/common/Speakable'
import { SafeHtml } from '@/components/common/SafeHtml'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { LeafDiagnosisPanel } from '@/components/views/plants/LeafDiagnosisPanel'

interface AiTabProps {
    plant: Plant
}

type LoadingUseCase = 'advisor' | 'proactiveDiagnosis'

const AiTabComponent: React.FC<AiTabProps> = ({ plant }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const lang = useAppSelector(selectLanguage)

    const archive = useAppSelector((state) =>
        selectArchivedAdvisorResponsesForPlant(state, plant.id),
    )
    const [getPlantAdvice, advisorState] = useGetPlantAdviceMutation()
    const [getProactiveDiagnosis, diagnosisState] = useGetProactiveDiagnosisMutation()

    const [loadingMessage, setLoadingMessage] = useState('')
    const [editingResponse, setEditingResponse] = useState<ArchivedAdvisorResponse | null>(null)
    const [isCurrentResponseSaved, setIsCurrentResponseSaved] = useState(false)
    const [isDiagnosisSaved, setIsDiagnosisSaved] = useState(false)
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

    // Streaming state via shared hook (RAF-debounced token accumulation)
    const adviceStream = useStreamingResponse<AIResponse>()
    const diagnosisStream = useStreamingResponse<AIResponse>()
    const [streamedAdvice, setStreamedAdvice] = useState<AIResponse | null>(null)
    const [streamedDiagnosis, setStreamedDiagnosis] = useState<AIResponse | null>(null)

    const plantQueryData = JSON.stringify(
        {
            age: plant.age,
            stage: plant.stage,
            medium: plant.medium,
            environment: plant.environment,
            problems: plant.problems,
            journal: plant.journal.slice(-5),
        },
        null,
        2,
    )

    useEffect(() => {
        const useCase: LoadingUseCase | null =
            advisorState.isLoading || adviceStream.isStreaming
                ? 'advisor'
                : diagnosisState.isLoading || diagnosisStream.isStreaming
                  ? 'proactiveDiagnosis'
                  : null

        if (!useCase) {
            setLoadingMessage('')
            return
        }

        const messages = getDynamicLoadingMessages({
            useCase,
            data: { plantName: plant.name },
        })

        if (messages.length === 0) {
            setLoadingMessage('')
            return
        }

        let messageIndex = 0
        setLoadingMessage(messages[0] ?? '')

        const intervalId = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length
            setLoadingMessage(messages[messageIndex] ?? '')
        }, 2000)

        return () => clearInterval(intervalId)
    }, [
        advisorState.isLoading,
        diagnosisState.isLoading,
        adviceStream.isStreaming,
        diagnosisStream.isStreaming,
        plant.name,
    ])

    const handleGetAdvice = useCallback(async () => {
        setIsCurrentResponseSaved(false)
        setStreamedAdvice(null)
        adviceStream.reset()

        const { aiService } = await import('@/services/aiService')
        const result = await adviceStream.start(
            (onToken) => aiService.getPlantAdviceStream(plant, lang, onToken),
            () => getPlantAdvice({ plant, lang }),
        )
        if (result !== undefined) {
            setStreamedAdvice(result)
        }
    }, [plant, lang, getPlantAdvice, adviceStream])

    const handleGetDiagnosis = useCallback(async () => {
        setIsDiagnosisSaved(false)
        setStreamedDiagnosis(null)
        diagnosisStream.reset()

        const { aiService } = await import('@/services/aiService')
        const result = await diagnosisStream.start(
            (onToken) => aiService.getProactiveDiagnosisStream(plant, lang, onToken),
            () => getProactiveDiagnosis({ plant, lang }),
        )
        if (result !== undefined) {
            setStreamedDiagnosis(result)
        }
    }, [plant, lang, getProactiveDiagnosis, diagnosisStream])

    const handleSaveResponse = () => {
        const data = streamedAdvice ?? advisorState.data
        if (data) {
            dispatch(
                addArchivedAdvisorResponse({
                    plant,
                    response: data,
                    query: plantQueryData,
                }),
            )
            setIsCurrentResponseSaved(true)
        }
    }

    const handleSaveDiagnosisResponse = () => {
        const data = streamedDiagnosis ?? diagnosisState.data
        if (data) {
            dispatch(
                addArchivedAdvisorResponse({
                    plant,
                    response: data,
                    query: t('ai.proactiveDiagnosis'),
                }),
            )
            setIsDiagnosisSaved(true)
        }
    }

    const sortedArchive = archive.toSorted((a, b) => b.createdAt - a.createdAt)

    return (
        <div className="space-y-6">
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
                        dispatch(
                            deleteArchivedAdvisorResponse({
                                plantId: plant.id,
                                responseId: pendingDeleteId,
                            }),
                        )
                    }
                    setPendingDeleteId(null)
                }}
            />

            {editingResponse && (
                <EditResponseModal
                    response={editingResponse}
                    onClose={() => setEditingResponse(null)}
                    onSave={(updated) => {
                        if (editingResponse) {
                            dispatch(
                                updateArchivedAdvisorResponse({ ...editingResponse, ...updated }),
                            )
                        }
                        setEditingResponse(null)
                    }}
                />
            )}
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-2 flex items-center gap-2">
                    <PhosphorIcons.Sparkle className="w-6 h-6" />{' '}
                    {t('plantsView.aiAdvisor.proactiveDiagnosisTitle')}
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                    {t('plantsView.aiAdvisor.proactiveDiagnosisDescription')}
                </p>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                    <Button
                        onClick={handleGetDiagnosis}
                        disabled={diagnosisState.isLoading || diagnosisStream.isStreaming}
                        className="w-full"
                    >
                        {diagnosisState.isLoading || diagnosisStream.isStreaming
                            ? loadingMessage
                            : t('plantsView.aiAdvisor.runDiagnosis')}
                    </Button>

                    <div className="mt-4">
                        {(diagnosisState.isLoading || diagnosisStream.isStreaming) &&
                            !diagnosisStream.streamedText && (
                                <AiLoadingIndicator loadingMessage={loadingMessage} />
                            )}
                        {diagnosisStream.isStreaming && diagnosisStream.streamedText && (
                            <Card className="bg-slate-900/70 animate-fade-in">
                                <p className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {diagnosisStream.streamedText}
                                </p>
                            </Card>
                        )}
                        {(streamedDiagnosis ?? diagnosisState.data) &&
                            !diagnosisState.isLoading &&
                            !diagnosisStream.isStreaming && (
                                <Card className="bg-slate-900/70 animate-fade-in">
                                    <Speakable elementId={`proactive-diag-content-${plant.id}`}>
                                        <h4 className="font-bold text-primary-300">
                                            {(streamedDiagnosis ?? diagnosisState.data)?.title}
                                        </h4>
                                        <SafeHtml
                                            className="prose prose-sm dark:prose-invert max-w-none"
                                            html={
                                                (streamedDiagnosis ?? diagnosisState.data)
                                                    ?.content ?? ''
                                            }
                                        />
                                    </Speakable>
                                    <div className="text-right mt-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleSaveDiagnosisResponse}
                                            disabled={isDiagnosisSaved}
                                        >
                                            {isDiagnosisSaved ? (
                                                <>
                                                    <PhosphorIcons.CheckCircle className="w-4 h-4 mr-1.5" />
                                                    {t('strainsView.tips.saved')}
                                                </>
                                            ) : (
                                                <>
                                                    <PhosphorIcons.ArchiveBox className="w-4 h-4 mr-1.5" />
                                                    {t('knowledgeView.archive.saveButton')}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </Card>
                            )}
                    </div>
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-2 flex items-center gap-2">
                    <PhosphorIcons.Brain className="w-6 h-6" /> {t('ai.advisor')}
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                    {t('plantsView.aiAdvisor.description')}
                </p>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                    <Button
                        onClick={handleGetAdvice}
                        disabled={advisorState.isLoading || adviceStream.isStreaming}
                        className="w-full"
                    >
                        {advisorState.isLoading || adviceStream.isStreaming
                            ? loadingMessage
                            : t('ai.getAdvice')}
                    </Button>

                    <div className="mt-4">
                        {(advisorState.isLoading || adviceStream.isStreaming) &&
                            !adviceStream.streamedText && (
                                <AiLoadingIndicator loadingMessage={loadingMessage} />
                            )}
                        {adviceStream.isStreaming && adviceStream.streamedText && (
                            <Card className="bg-slate-900/70 animate-fade-in">
                                <p className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {adviceStream.streamedText}
                                </p>
                            </Card>
                        )}
                        {(streamedAdvice ?? advisorState.data) &&
                            !advisorState.isLoading &&
                            !adviceStream.isStreaming && (
                                <Card className="bg-slate-900/70 animate-fade-in">
                                    <Speakable elementId={`advisor-content-${plant.id}`}>
                                        <h4 className="font-bold text-primary-300">
                                            {(streamedAdvice ?? advisorState.data)?.title}
                                        </h4>
                                        <SafeHtml
                                            className="prose prose-sm dark:prose-invert max-w-none"
                                            html={
                                                (streamedAdvice ?? advisorState.data)?.content ?? ''
                                            }
                                        />
                                    </Speakable>
                                    {!advisorState.error && (
                                        <div className="text-right mt-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={handleSaveResponse}
                                                disabled={isCurrentResponseSaved}
                                            >
                                                {isCurrentResponseSaved ? (
                                                    <>
                                                        <PhosphorIcons.CheckCircle
                                                            className="w-4 h-4 mr-1.5"
                                                            weight="fill"
                                                        />
                                                        {t('strainsView.tips.saved')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <PhosphorIcons.ArchiveBox className="w-4 h-4 mr-1.5" />
                                                        {t('knowledgeView.archive.saveButton')}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </Card>
                            )}
                    </div>
                    <p className="text-xs text-slate-500 mt-4 text-center">{t('ai.disclaimer')}</p>
                </div>
            </Card>

            {/* ONNX Leaf Scanner */}
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-3 flex items-center gap-2">
                    <PhosphorIcons.Leafy className="w-6 h-6" /> {t('plantsView.diagnosis.title')}
                </h3>
                <LeafDiagnosisPanel plant={plant} />
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2 mb-3">
                    <PhosphorIcons.Archive className="w-6 h-6" />{' '}
                    {t('plantsView.aiAdvisor.archiveTitle')}
                </h3>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="space-y-4">
                        {sortedArchive.length > 0 ? (
                            sortedArchive.map((res) => (
                                <Card key={res.id} className="bg-slate-900/70">
                                    <p className="text-xs text-slate-400">
                                        {new Date(res.createdAt).toLocaleString()} -{' '}
                                        {t(`plantStages.${res.plantStage}`)}
                                    </p>
                                    <Speakable elementId={`advisor-archive-${res.id}`}>
                                        <h4 className="font-bold text-primary-300 mt-1">
                                            {res.title}
                                        </h4>
                                        <SafeHtml
                                            className="prose prose-sm dark:prose-invert max-w-none"
                                            html={res.content}
                                        />
                                    </Speakable>
                                    <div className="flex justify-end items-center gap-2 mt-2">
                                        <div className="flex items-center gap-1 mr-auto">
                                            <Button
                                                size="sm"
                                                variant={
                                                    res.feedback === 'positive'
                                                        ? 'primary'
                                                        : 'secondary'
                                                }
                                                onClick={() =>
                                                    dispatch(
                                                        setAdvisorResponseFeedback({
                                                            plantId: plant.id,
                                                            responseId: res.id,
                                                            feedback: 'positive',
                                                        }),
                                                    )
                                                }
                                                aria-label={t('common.feedback.helpful')}
                                            >
                                                <PhosphorIcons.ThumbsUp
                                                    className="w-4 h-4"
                                                    weight={
                                                        res.feedback === 'positive'
                                                            ? 'fill'
                                                            : 'regular'
                                                    }
                                                />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={
                                                    res.feedback === 'negative'
                                                        ? 'danger'
                                                        : 'secondary'
                                                }
                                                onClick={() =>
                                                    dispatch(
                                                        setAdvisorResponseFeedback({
                                                            plantId: plant.id,
                                                            responseId: res.id,
                                                            feedback: 'negative',
                                                        }),
                                                    )
                                                }
                                                aria-label={t('common.feedback.notHelpful')}
                                            >
                                                <PhosphorIcons.ThumbsDown
                                                    className="w-4 h-4"
                                                    weight={
                                                        res.feedback === 'negative'
                                                            ? 'fill'
                                                            : 'regular'
                                                    }
                                                />
                                            </Button>
                                        </div>{' '}
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
                                            onClick={() => setPendingDeleteId(res.id)}
                                            aria-label={t('common.deleteResponse')}
                                        >
                                            <PhosphorIcons.TrashSimple className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <p className="text-slate-400 text-sm text-center py-4">
                                {t('plantsView.aiAdvisor.archiveEmpty')}
                            </p>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}

export const AiTab: React.FC<AiTabProps> = memo(AiTabComponent)
