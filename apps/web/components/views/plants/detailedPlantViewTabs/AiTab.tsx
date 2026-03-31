import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
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

    // Streaming state
    const [isStreamingAdvice, setIsStreamingAdvice] = useState(false)
    const [streamingAdviceText, setStreamingAdviceText] = useState('')
    const [streamedAdvice, setStreamedAdvice] = useState<AIResponse | null>(null)
    const adviceStreamRef = useRef('')

    const [isStreamingDiagnosis, setIsStreamingDiagnosis] = useState(false)
    const [streamingDiagnosisText, setStreamingDiagnosisText] = useState('')
    const [streamedDiagnosis, setStreamedDiagnosis] = useState<AIResponse | null>(null)
    const diagnosisStreamRef = useRef('')

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
            advisorState.isLoading || isStreamingAdvice
                ? 'advisor'
                : diagnosisState.isLoading || isStreamingDiagnosis
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
        isStreamingAdvice,
        isStreamingDiagnosis,
        plant.name,
    ])

    const handleGetAdvice = useCallback(async () => {
        setIsCurrentResponseSaved(false)
        setStreamedAdvice(null)
        setStreamingAdviceText('')
        adviceStreamRef.current = ''
        setIsStreamingAdvice(true)

        try {
            const { aiService } = await import('@/services/aiService')
            let rafPending = false
            const onToken = (_token: string, accumulated: string) => {
                adviceStreamRef.current = accumulated
                if (!rafPending) {
                    rafPending = true
                    requestAnimationFrame(() => {
                        rafPending = false
                        setStreamingAdviceText(adviceStreamRef.current)
                    })
                }
            }
            const result = await aiService.getPlantAdviceStream(plant, lang, onToken)
            setStreamedAdvice(result)
        } catch {
            // Streaming failed -- fall back to batch RTK mutation
            getPlantAdvice({ plant, lang })
        } finally {
            setIsStreamingAdvice(false)
        }
    }, [plant, lang, getPlantAdvice])

    const handleGetDiagnosis = useCallback(async () => {
        setIsDiagnosisSaved(false)
        setStreamedDiagnosis(null)
        setStreamingDiagnosisText('')
        diagnosisStreamRef.current = ''
        setIsStreamingDiagnosis(true)

        try {
            const { aiService } = await import('@/services/aiService')
            let rafPending = false
            const onToken = (_token: string, accumulated: string) => {
                diagnosisStreamRef.current = accumulated
                if (!rafPending) {
                    rafPending = true
                    requestAnimationFrame(() => {
                        rafPending = false
                        setStreamingDiagnosisText(diagnosisStreamRef.current)
                    })
                }
            }
            const result = await aiService.getProactiveDiagnosisStream(plant, lang, onToken)
            setStreamedDiagnosis(result)
        } catch {
            // Streaming failed -- fall back to batch RTK mutation
            getProactiveDiagnosis({ plant, lang })
        } finally {
            setIsStreamingDiagnosis(false)
        }
    }, [plant, lang, getProactiveDiagnosis])

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
                        disabled={diagnosisState.isLoading || isStreamingDiagnosis}
                        className="w-full"
                    >
                        {diagnosisState.isLoading || isStreamingDiagnosis
                            ? loadingMessage
                            : t('plantsView.aiAdvisor.runDiagnosis')}
                    </Button>

                    <div className="mt-4">
                        {(diagnosisState.isLoading || isStreamingDiagnosis) &&
                            !streamingDiagnosisText && (
                                <AiLoadingIndicator loadingMessage={loadingMessage} />
                            )}
                        {isStreamingDiagnosis && streamingDiagnosisText && (
                            <Card className="bg-slate-900/70 animate-fade-in">
                                <p className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {streamingDiagnosisText}
                                </p>
                            </Card>
                        )}
                        {(streamedDiagnosis ?? diagnosisState.data) &&
                            !diagnosisState.isLoading &&
                            !isStreamingDiagnosis && (
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
                        disabled={advisorState.isLoading || isStreamingAdvice}
                        className="w-full"
                    >
                        {advisorState.isLoading || isStreamingAdvice
                            ? loadingMessage
                            : t('ai.getAdvice')}
                    </Button>

                    <div className="mt-4">
                        {(advisorState.isLoading || isStreamingAdvice) && !streamingAdviceText && (
                            <AiLoadingIndicator loadingMessage={loadingMessage} />
                        )}
                        {isStreamingAdvice && streamingAdviceText && (
                            <Card className="bg-slate-900/70 animate-fade-in">
                                <p className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                    {streamingAdviceText}
                                </p>
                            </Card>
                        )}
                        {(streamedAdvice ?? advisorState.data) &&
                            !advisorState.isLoading &&
                            !isStreamingAdvice && (
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
