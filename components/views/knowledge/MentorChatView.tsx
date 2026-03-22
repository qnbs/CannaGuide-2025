import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Plant, MentorMessage } from '@/types'
import { Button } from '@/components/common/Button'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator'
import { Textarea } from '@/components/ui/textarea'
import { useGetMentorResponseMutation } from '@/stores/api'
import { addArchivedMentorResponse } from '@/stores/slices/archivesSlice'
import { selectLanguage } from '@/stores/selectors'
import { Speakable } from '@/components/common/Speakable'
import { SafeHtml } from '@/components/common/SafeHtml'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { TFunction } from 'i18next'

interface MentorChatViewProps {
    plant: Plant
    onClose: () => void
}

const removeEmptyModelPlaceholders = (messages: MentorMessage[]): MentorMessage[] =>
    messages.filter((msg) => msg.role !== 'model' || msg.content !== '')

const resolveApiErrorMessage = (error: unknown, fallback: string): string | null => {
    if (typeof error === 'object' && error !== null && 'message' in error) {
        const message = (error as { message?: unknown }).message
        return typeof message === 'string' ? message : fallback
    }
    return null
}

const resolveMentorErrorMessage = (
    fallbackError: unknown,
    streamError: unknown,
    t: TFunction,
): string => {
    const fallbackMessage = resolveApiErrorMessage(fallbackError, t('ai.error.unknown'))
    if (fallbackMessage) return fallbackMessage

    const streamMessage = resolveApiErrorMessage(streamError, t('ai.error.unknown'))
    if (streamMessage) return streamMessage

    return t('ai.error.unknown')
}

const replaceMessageContent = (
    messages: MentorMessage[],
    messageId: string,
    content: string,
): MentorMessage[] => messages.map((msg) => (msg.id === messageId ? { ...msg, content } : msg))

const enqueueMeasureVersionUpdate = (
    setHistory: React.Dispatch<React.SetStateAction<MentorMessage[]>>,
    streamMsgId: string,
    text: string,
) => {
    setHistory((prev) => replaceMessageContent(prev, streamMsgId, text))
}

const scheduleStreamMessageUpdate = (
    streamMsgId: string,
    streamingTextRef: React.MutableRefObject<string>,
    setHistory: React.Dispatch<React.SetStateAction<MentorMessage[]>>,
    scrollToBottom: () => void,
) => {
    let rafPending = false

    return (_token: string, accumulated: string) => {
        streamingTextRef.current = accumulated
        if (rafPending) {
            return
        }

        rafPending = true
        requestAnimationFrame(() => {
            rafPending = false
            const text = streamingTextRef.current
            enqueueMeasureVersionUpdate(setHistory, streamMsgId, text)
            scrollToBottom()
        })
    }
}

const Message: React.FC<{ message: MentorMessage }> = memo(({ message }) => {
    const isUser = message.role === 'user'
    const content = (
        <div
            className={`max-w-md p-3 rounded-lg ${
                isUser ? 'bg-primary-800 text-slate-100' : 'bg-slate-800'
            }`}
        >
            {message.title && <h4 className="font-bold text-primary-300">{message.title}</h4>}
            <SafeHtml
                className="prose prose-sm dark:prose-invert max-w-none"
                html={message.content}
            />
        </div>
    )
    const wrappedContent = (
        <Speakable elementId={`mentor-${message.id || Date.now()}`}>{content}</Speakable>
    )
    const rowAlignmentClass = isUser ? 'justify-end' : ''

    return (
        <div className={`flex items-start gap-3 ${rowAlignmentClass}`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <PhosphorIcons.Brain className="w-5 h-5 text-primary-300" />
                </div>
            )}
            {wrappedContent}
        </div>
    )
})

Message.displayName = 'Message'

export const MentorChatView: React.FC<MentorChatViewProps> = ({ plant, onClose }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const lang = useAppSelector(selectLanguage)
    const [getMentorResponse, { isLoading: isMutationLoading }] = useGetMentorResponseMutation()
    const [history, setHistory] = useState<MentorMessage[]>([])
    const [isStreaming, setIsStreaming] = useState(false)
    const streamingTextRef = useRef('')

    const [input, setInput] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
    const isLoading = isMutationLoading || isStreaming

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(scrollToBottom, [history])

    const handleSend = useCallback(async () => {
        const trimmedInput = input.trim()
        if (!trimmedInput || isLoading) {
            return
        }

        const userMessage: MentorMessage = {
            id: `msg-user-${Date.now()}`,
            role: 'user',
            content: trimmedInput,
            title: '',
        }
        setHistory((prev) => [...prev, userMessage])
        setInput('')

        try {
            // Try streaming first for typing effect
            const { aiService } = await import('@/services/aiService')
            setIsStreaming(true)
            streamingTextRef.current = ''

            const streamMsgId = `msg-stream-${Date.now()}`
            setHistory((prev) => [
                ...prev,
                { id: streamMsgId, role: 'model', title: '', content: '' },
            ])

            const onToken = scheduleStreamMessageUpdate(
                streamMsgId,
                streamingTextRef,
                setHistory,
                scrollToBottom,
            )

            const response = await aiService.getMentorResponseStream(
                plant,
                trimmedInput,
                lang,
                onToken,
            )
            const modelMessage: MentorMessage = {
                id: `msg-model-${Date.now()}`,
                role: 'model',
                ...response,
            }
            setHistory((prev) => prev.map((msg) => (msg.id === streamMsgId ? modelMessage : msg)))
            dispatch(addArchivedMentorResponse({ query: trimmedInput, ...response }))
        } catch (streamError) {
            try {
                const response = await getMentorResponse({
                    plant,
                    query: trimmedInput,
                    lang,
                }).unwrap()

                const modelMessage: MentorMessage = {
                    id: `msg-model-${Date.now()}`,
                    role: 'model',
                    ...response,
                }
                setHistory((prev) => [...removeEmptyModelPlaceholders(prev), modelMessage])
                dispatch(addArchivedMentorResponse({ query: trimmedInput, ...response }))
            } catch (fallbackError) {
                const errorMessage: MentorMessage = {
                    id: `msg-error-${Date.now()}`,
                    role: 'model',
                    title: t('common.error'),
                    content: resolveMentorErrorMessage(fallbackError, streamError, t),
                }
                setHistory((prev) => [...removeEmptyModelPlaceholders(prev), errorMessage])
            }
        } finally {
            setIsStreaming(false)
            streamingTextRef.current = ''
        }
    }, [input, isLoading, plant, lang, getMentorResponse, dispatch, t])

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleClear = () => {
        setIsClearConfirmOpen(true)
    }

    return (
        <div className="flex flex-col animate-fade-in">
            <ConfirmDialog
                open={isClearConfirmOpen}
                onOpenChange={setIsClearConfirmOpen}
                title={t('knowledgeView.aiMentor.clearChat')}
                description={t('knowledgeView.aiMentor.clearConfirm')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => {
                    setHistory([])
                    setIsClearConfirmOpen(false)
                }}
            />

            <header className="flex-shrink-0 mb-4">
                <div className="flex items-center justify-between">
                    <Button variant="secondary" onClick={onClose}>
                        <PhosphorIcons.ArrowLeft className="w-5 h-5 mr-1" />
                        {t('common.back')}
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleClear}
                        disabled={history.length === 0}
                    >
                        <PhosphorIcons.TrashSimple className="w-4 h-4 mr-1" />
                        {t('knowledgeView.aiMentor.clearChat')}
                    </Button>
                </div>
                <div className="mt-4">
                    <h1 className="text-3xl font-bold font-display text-primary-300">
                        {t('knowledgeView.aiMentor.title')}
                    </h1>
                    <p className="text-slate-400">
                        {t('knowledgeView.aiMentor.plantContext', { name: plant.name })}
                    </p>
                </div>
            </header>
            <div className="flex-grow overflow-y-auto pr-2 -mr-4 space-y-4">
                {history.map((msg) => (
                    <Message key={msg.id} message={msg} />
                ))}
                {isLoading && <AiLoadingIndicator loadingMessage={t('ai.generating')} />}
                <div ref={messagesEndRef} />
            </div>
            <p className="text-xs text-slate-500 italic px-1 pt-2">{t('ai.disclaimer')}</p>
            <div className="flex-shrink-0 mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-start gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={t('knowledgeView.aiMentor.inputPlaceholder')}
                        className="flex-grow resize-none"
                        rows={1}
                        disabled={isLoading}
                    />
                    <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                        <PhosphorIcons.PaperPlaneTilt weight="fill" className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
