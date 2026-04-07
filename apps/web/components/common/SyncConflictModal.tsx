import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { DivergenceInfo } from '@/services/crdtService'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import * as Sentry from '@sentry/react'

interface SyncConflictModalProps {
    open: boolean
    onClose: () => void
    conflictInfo: DivergenceInfo
    onMerge: () => void
    onKeepLocal: () => void
    onUseCloud: () => void
}

const SyncConflictModal: React.FC<SyncConflictModalProps> = memo(
    ({ open, onClose, conflictInfo, onMerge, onKeepLocal, onUseCloud }) => {
        const { t } = useTranslation()
        const [showDetails, setShowDetails] = useState(false)
        const [isKeepLocalConfirmOpen, setIsKeepLocalConfirmOpen] = useState(false)
        const [isUseCloudConfirmOpen, setIsUseCloudConfirmOpen] = useState(false)

        const handleMerge = (): void => {
            Sentry.addBreadcrumb({
                category: 'sync',
                message: 'conflict-resolved: merge',
                data: {
                    conflicting: conflictInfo.conflictingKeys.length,
                    localOnly: conflictInfo.localOnlyChanges,
                    remoteOnly: conflictInfo.remoteOnlyChanges,
                },
                level: 'info',
            })
            onMerge()
            onClose()
        }

        const handleKeepLocal = (): void => {
            Sentry.addBreadcrumb({
                category: 'sync',
                message: 'conflict-resolved: keep-local',
                data: { conflicting: conflictInfo.conflictingKeys.length },
                level: 'warning',
            })
            onKeepLocal()
            onClose()
        }

        const handleUseCloud = (): void => {
            Sentry.addBreadcrumb({
                category: 'sync',
                message: 'conflict-resolved: use-cloud',
                data: { conflicting: conflictInfo.conflictingKeys.length },
                level: 'warning',
            })
            onUseCloud()
            onClose()
        }

        return (
            <>
                <ConfirmDialog
                    open={isKeepLocalConfirmOpen}
                    onOpenChange={setIsKeepLocalConfirmOpen}
                    title={t('settingsView.data.sync.keepLocal')}
                    description={t('settingsView.data.sync.keepLocalConfirm')}
                    confirmLabel={t('settingsView.data.sync.keepLocal')}
                    cancelLabel={t('common.cancel')}
                    confirmVariant="destructive"
                    onConfirm={handleKeepLocal}
                />
                <ConfirmDialog
                    open={isUseCloudConfirmOpen}
                    onOpenChange={setIsUseCloudConfirmOpen}
                    title={t('settingsView.data.sync.useCloud')}
                    description={t('settingsView.data.sync.useCloudConfirm')}
                    confirmLabel={t('settingsView.data.sync.useCloud')}
                    cancelLabel={t('common.cancel')}
                    confirmVariant="destructive"
                    onConfirm={handleUseCloud}
                />

                <Dialog
                    open={open}
                    onOpenChange={(o) => {
                        if (!o) onClose()
                    }}
                >
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-amber-400">
                                <PhosphorIcons.Warning className="h-5 w-5" />
                                {t('settingsView.data.sync.conflictTitle')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('settingsView.data.sync.conflictDescription')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-2">
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
                                    <p className="text-2xl font-bold text-blue-300">
                                        {conflictInfo.localOnlyChanges}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {t('settingsView.data.sync.localChanges', {
                                            count: conflictInfo.localOnlyChanges,
                                        })}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-3">
                                    <p className="text-2xl font-bold text-purple-300">
                                        {conflictInfo.remoteOnlyChanges}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {t('settingsView.data.sync.remoteChanges', {
                                            count: conflictInfo.remoteOnlyChanges,
                                        })}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                                    <p className="text-2xl font-bold text-amber-300">
                                        {conflictInfo.conflictingKeys.length}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {t('settingsView.data.sync.conflictingItems', {
                                            count: conflictInfo.conflictingKeys.length,
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                <Button
                                    onClick={handleMerge}
                                    className="flex-1 justify-center bg-green-600 hover:bg-green-700"
                                >
                                    <PhosphorIcons.ShareNetwork className="mr-2 h-4 w-4" />
                                    {t('settingsView.data.sync.merge')}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => setIsKeepLocalConfirmOpen(true)}
                                    className="flex-1 justify-center"
                                >
                                    {t('settingsView.data.sync.keepLocal')}
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setIsUseCloudConfirmOpen(true)}
                                    className="flex-1 justify-center"
                                >
                                    {t('settingsView.data.sync.useCloud')}
                                </Button>
                            </div>

                            {conflictInfo.conflictingKeys.length > 0 && (
                                <button
                                    type="button"
                                    className="text-sm text-slate-400 hover:text-slate-200 underline"
                                    onClick={() => setShowDetails(!showDetails)}
                                >
                                    {t('settingsView.data.sync.viewDetails')}{' '}
                                    {showDetails
                                        ? String.fromCharCode(9650)
                                        : String.fromCharCode(9660)}
                                </button>
                            )}

                            {showDetails && conflictInfo.conflictingKeys.length > 0 && (
                                <div className="rounded-lg bg-slate-800/50 p-3 max-h-40 overflow-y-auto">
                                    <ul className="text-xs text-slate-300 space-y-1">
                                        {conflictInfo.conflictingKeys.map((key) => (
                                            <li key={key} className="font-mono truncate">
                                                {key}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        )
    },
)
SyncConflictModal.displayName = 'SyncConflictModal'

export { SyncConflictModal }
