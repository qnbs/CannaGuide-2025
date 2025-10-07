import React, { useState, useRef, memo } from 'react'
import { Button } from '@/components/common/Button'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { Modal } from './Modal'
import { Input } from '@/components/ui/ThemePrimitives'

interface EditableResponse {
    id: string
    title: string
    content: string
}

interface EditResponseModalProps<T extends EditableResponse> {
    response: T
    onClose: () => void
    onSave: (updatedResponse: T) => void
    title?: string
}

const EditResponseModalComponent = <T extends EditableResponse>({
    response,
    onClose,
    onSave,
    title: customTitle,
}: EditResponseModalProps<T>) => {
    const { t } = useTranslation()
    const [title, setTitle] = useState(response.title)
    const [content, setContent] = useState(response.content)
    const contentRef = useRef<HTMLDivElement>(null)

    const handleSave = () => {
        onSave({ ...response, title, content })
    }

    const handleContentChange = () => {
        if (contentRef.current) {
            setContent(contentRef.current.innerHTML)
        }
    }

    const applyFormat = (command: string) => {
        document.execCommand(command, false)
        handleContentChange()
        contentRef.current?.focus()
    }

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>
                {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} glow={true}>{t('common.save')}</Button>
        </>
    )

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={customTitle || t('knowledgeView.archive.editTitle')}
            size="lg"
            footer={footer}
        >
            <div className="space-y-4">
                <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    aria-label={t('common.name')}
                />

                {content && (
                    <div className="bg-primary-950/50 border-transparent ring-1 ring-inset ring-white/20 rounded-md">
                        <div className="flex items-center gap-1 p-1 border-b border-primary-800/50">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => applyFormat('bold')}
                                className="!p-1.5"
                                aria-label={t('common.editor.bold')}
                            >
                                <PhosphorIcons.TextBolder className="w-5 h-5" />
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => applyFormat('italic')}
                                className="!p-1.5"
                                aria-label={t('common.editor.italic')}
                            >
                                <PhosphorIcons.TextItalic className="w-5 h-5" />
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => applyFormat('insertUnorderedList')}
                                className="!p-1.5"
                                aria-label={t('common.editor.list')}
                            >
                                <PhosphorIcons.ListBullets className="w-5 h-5" />
                            </Button>
                        </div>
                        <div
                            ref={contentRef}
                            contentEditable={true}
                            onInput={handleContentChange}
                            dangerouslySetInnerHTML={{ __html: content }}
                            className="w-full min-h-[150px] p-2 focus:outline-none prose prose-sm dark:prose-invert max-w-none"
                            aria-label={t('common.notes')}
                        />
                    </div>
                )}
            </div>
        </Modal>
    )
}

export const EditResponseModal = memo(EditResponseModalComponent)
