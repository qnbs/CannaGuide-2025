import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'
import { PhosphorIcons } from '../icons/PhosphorIcons'
import { Card } from './Card'
import { Button } from '@/components/ui/button'

export type SimpleExportFormat = 'pdf' | 'txt'

interface DataExportModalProps {
    isOpen: boolean
    onClose: () => void
    onExport: (format: SimpleExportFormat) => void
    title: string
    selectionCount: number
    totalCount: number
    translationBasePath: string
}

export const DataExportModal: React.FC<DataExportModalProps> = ({
    isOpen,
    onClose,
    onExport,
    title,
    selectionCount,
    totalCount,
    translationBasePath,
}) => {
    const { t } = useTranslation()
    const [pendingFormat, setPendingFormat] = useState<SimpleExportFormat | null>(null)

    const hasSelection = selectionCount > 0
    const sourceText = hasSelection
        ? t(`${translationBasePath}.sources.selected_other`, { count: selectionCount })
        : t(`${translationBasePath}.sources.all_other`, { count: totalCount })
    const pendingFormatLabel = useMemo(() => {
        if (!pendingFormat) return ''
        return t(`${translationBasePath}.formats.${pendingFormat}`)
    }, [pendingFormat, t, translationBasePath])

    const handleConfirmExport = () => {
        if (!pendingFormat) return
        onExport(pendingFormat)
        setPendingFormat(null)
        onClose()
    }

    const handleClose = () => {
        setPendingFormat(null)
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={title}
            description={t(`${translationBasePath}.chooseFormat`)}
            size="lg"
        >
            <div className="space-y-4 pb-3">
                <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(14,116,144,0.12),rgba(15,23,42,0.9))]">
                    <div className="surface-badge mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-primary-200">
                        <PhosphorIcons.ArchiveBox className="h-3.5 w-3.5" />
                        {t(`${translationBasePath}.source`)}
                    </div>
                    <p className="text-sm leading-6 text-slate-300">{sourceText}</p>
                </Card>

                {pendingFormat === null ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                        <button
                            type="button"
                            onClick={() => setPendingFormat('pdf')}
                            className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(124,58,237,0.18),rgba(15,23,42,0.94))] p-4 text-left transition-all hover:border-white/20 hover:bg-[linear-gradient(135deg,rgba(124,58,237,0.24),rgba(15,23,42,0.98))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                        >
                            <div className="flex items-center gap-3 text-slate-50">
                                <div className="rounded-xl border border-white/10 bg-white/8 p-2">
                                    <PhosphorIcons.FilePdf className="h-5 w-5 text-primary-200" />
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        {t(`${translationBasePath}.formats.pdf`)}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {t('common.exportFormats.pdfHint')}
                                    </p>
                                </div>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPendingFormat('txt')}
                            className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.16),rgba(15,23,42,0.94))] p-4 text-left transition-all hover:border-white/20 hover:bg-[linear-gradient(135deg,rgba(14,165,233,0.24),rgba(15,23,42,0.98))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                        >
                            <div className="flex items-center gap-3 text-slate-50">
                                <div className="rounded-xl border border-white/10 bg-white/8 p-2">
                                    <PhosphorIcons.FileText className="h-5 w-5 text-primary-200" />
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        {t(`${translationBasePath}.formats.txt`)}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {t('common.exportFormats.txtHint')}
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-300">
                            {t('common.exportConfirm')}
                            {pendingFormatLabel ? ` (${pendingFormatLabel})` : ''}
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setPendingFormat(null)}>
                                {t('common.cancel')}
                            </Button>
                            <Button onClick={handleConfirmExport}>
                                <PhosphorIcons.DownloadSimple className="mr-2 h-4 w-4" />
                                {t('common.export')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}
