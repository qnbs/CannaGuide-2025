import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Strain } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { updateNote, undoNoteChange, redoNoteChange } from '@/stores/slices/notesSlice'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { InfoSection } from '@/components/common/InfoSection'

export const NotesTab: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const noteHistory = useAppSelector((state) => state.notes.strainNotes[strain.id])
    const [showTemplates, setShowTemplates] = useState(false)

    const canUndo = noteHistory && noteHistory.past.length > 0
    const canRedo = noteHistory && noteHistory.future.length > 0
    const noteContent = noteHistory ? noteHistory.present : ''

    const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch(updateNote({ strainId: strain.id, note: e.target.value }))
    }

    const today = new Date().toISOString().slice(0, 10)
    const templateData = { name: strain.name, date: today }

    const templates = [
        {
            id: 'grow',
            label: t('strainsView.strainDetail.notesTemplateGrow'),
            icon: <PhosphorIcons.Leafy className="w-4 h-4" />,
            content: t('strainsView.strainDetail.notesGrowTemplate', templateData),
        },
        {
            id: 'review',
            label: t('strainsView.strainDetail.notesTemplateReview'),
            icon: <PhosphorIcons.Star className="w-4 h-4" />,
            content: t('strainsView.strainDetail.notesReviewTemplate', templateData),
        },
        {
            id: 'medical',
            label: t('strainsView.strainDetail.notesTemplateMedical'),
            icon: <PhosphorIcons.Heart className="w-4 h-4" />,
            content: t('strainsView.strainDetail.notesMedicalTemplate', templateData),
        },
        {
            id: 'breeding',
            label: t('strainsView.strainDetail.notesTemplateBreeding'),
            icon: <PhosphorIcons.Flask className="w-4 h-4" />,
            content: t('strainsView.strainDetail.notesBreedingTemplate', templateData),
        },
    ]

    const insertTemplate = (content: string) => {
        const resolvedContent = content.replace(/\\n/g, '\n')
        const newContent = noteContent ? `${noteContent}\n\n${resolvedContent}` : resolvedContent
        dispatch(updateNote({ strainId: strain.id, note: newContent }))
        setShowTemplates(false)
    }

    return (
        <InfoSection title={t('strainsView.strainModal.notes')}>
            <div className="bg-slate-800 rounded-md border border-slate-700">
                <div className="flex items-center p-2 border-b border-slate-700 gap-2 flex-wrap">
                    <Button
                        variant="secondary"
                        onClick={() => dispatch(undoNoteChange({ strainId: strain.id }))}
                        disabled={!canUndo}
                        className="!h-11 !w-11 !p-0"
                        aria-label={t('common.undo')}
                    >
                        <PhosphorIcons.ArrowClockwise className="w-4 h-4 transform scale-x-[-1]" />
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => dispatch(redoNoteChange({ strainId: strain.id }))}
                        disabled={!canRedo}
                        className="!h-11 !w-11 !p-0"
                        aria-label={t('common.redo')}
                    >
                        <PhosphorIcons.ArrowClockwise className="w-4 h-4" />
                    </Button>
                    <div className="ml-auto relative">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="min-h-11"
                        >
                            <PhosphorIcons.BookOpenText className="w-4 h-4 mr-1.5" />
                            {t('strainsView.strainDetail.notesTemplates')}
                            <PhosphorIcons.ChevronDown
                                className={`w-3 h-3 ml-1 transition-transform ${showTemplates ? 'rotate-180' : ''}`}
                            />
                        </Button>
                        {showTemplates && (
                            <div className="absolute right-0 top-full mt-1 z-20 bg-slate-700 border border-slate-600 rounded-lg shadow-xl min-w-[200px]">
                                {templates.map((tmpl) => (
                                    <button
                                        key={tmpl.id}
                                        onClick={() => insertTemplate(tmpl.content)}
                                        className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-600 first:rounded-t-lg last:rounded-b-lg transition-colors text-left"
                                    >
                                        {tmpl.icon}
                                        {tmpl.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <textarea
                    value={noteContent}
                    onChange={handleNoteChange}
                    className="w-full bg-transparent resize-none min-h-[250px] p-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 rounded-b-md font-mono text-sm"
                    placeholder={t('strainsView.strainDetail.notesPlaceholder')}
                />
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-700 text-xs text-slate-500">
                    <span>
                        {t('strainsView.strainDetail.notes.charCount', {
                            count: noteContent.length,
                        })}
                    </span>
                </div>
            </div>
        </InfoSection>
    )
}
