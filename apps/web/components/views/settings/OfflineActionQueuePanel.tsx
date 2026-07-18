import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { getUISnapshot } from '@/stores/useUIStore'
import {
    offlineActionQueueService,
    type OfflineActionRecord,
} from '@/services/offlineActionQueueService'

const OfflineActionQueuePanel: React.FC = () => {
    const { t } = useTranslation()
    const [actions, setActions] = useState<OfflineActionRecord[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isClearOpen, setIsClearOpen] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const refreshGenerationRef = useRef(0)

    const refresh = useCallback(async () => {
        const generation = ++refreshGenerationRef.current
        setIsLoading(true)
        try {
            const queued = await offlineActionQueueService.list()
            if (generation === refreshGenerationRef.current) {
                setActions(queued)
            }
        } catch (err) {
            console.debug('[OfflineActionQueuePanel] load failed:', err)
            if (generation === refreshGenerationRef.current) {
                setActions([])
            }
        } finally {
            if (generation === refreshGenerationRef.current) {
                setIsLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        void refresh()
        const onOnline = () => {
            void refresh()
        }
        window.addEventListener('online', onOnline)
        return () => window.removeEventListener('online', onOnline)
    }, [refresh])

    const handleRequestSync = async (): Promise<void> => {
        setIsSyncing(true)
        try {
            const registered = await offlineActionQueueService.requestBackgroundSync()
            getUISnapshot().addNotification({
                type: registered ? 'success' : 'info',
                message: registered
                    ? t('settingsView.data.offlineQueue.syncRequested')
                    : t('settingsView.data.offlineQueue.syncUnavailable'),
            })
            if (registered) {
                await refresh()
            }
        } finally {
            setIsSyncing(false)
        }
    }

    const handleClear = async (): Promise<void> => {
        try {
            await offlineActionQueueService.clear()
            setActions([])
            getUISnapshot().addNotification({
                type: 'success',
                message: t('settingsView.data.offlineQueue.clearSuccess'),
            })
        } catch (err) {
            console.debug('[OfflineActionQueuePanel] clear failed:', err)
            getUISnapshot().addNotification({
                type: 'error',
                message: t('settingsView.data.offlineQueue.clearError'),
            })
        } finally {
            setIsClearOpen(false)
        }
    }

    return (
        <Card>
            <div className="flex items-start gap-3 mb-3">
                <PhosphorIcons.ListChecks className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                        {t('settingsView.data.offlineQueue.title')}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {t('settingsView.data.offlineQueue.description')}
                    </p>
                </div>
            </div>

            {isLoading ? (
                <p className="text-xs text-slate-400">{t('settingsView.data.offlineQueue.loading')}</p>
            ) : (
                <p className="text-sm text-slate-300">
                    {t('settingsView.data.offlineQueue.count', { count: actions.length })}
                </p>
            )}

            {!isLoading && actions.length > 0 && (
                <ul className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                    {actions.map((action, index) => {
                        const key =
                            action.idempotencyKey ??
                            (action.id !== undefined ? String(action.id) : `row-${index}`)
                        const actionKey = offlineActionQueueService.describeAction(action)
                        const label =
                            actionKey === 'journalEntry'
                                ? t('settingsView.data.offlineQueue.actionJournal')
                                : actionKey
                        return (
                            <li
                                key={key}
                                className="flex justify-between gap-2 text-xs bg-slate-800/50 rounded px-2 py-1.5 font-mono"
                            >
                                <span className="text-slate-300 truncate">{label}</span>
                                {typeof action.queuedAt === 'number' && (
                                    <span className="text-muted shrink-0">
                                        {new Date(action.queuedAt).toLocaleString()}
                                    </span>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void refresh()}
                    disabled={isLoading}
                >
                    <PhosphorIcons.ArrowClockwise className="mr-2" />
                    {t('settingsView.data.offlineQueue.refresh')}
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleRequestSync()}
                    disabled={isSyncing || actions.length === 0}
                >
                    <PhosphorIcons.CloudArrowUp className="mr-2" />
                    {isSyncing
                        ? t('settingsView.data.offlineQueue.syncing')
                        : t('settingsView.data.offlineQueue.retrySync')}
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsClearOpen(true)}
                    disabled={actions.length === 0}
                >
                    {t('settingsView.data.offlineQueue.clear')}
                </Button>
            </div>

            <ConfirmDialog
                open={isClearOpen}
                onOpenChange={setIsClearOpen}
                title={t('settingsView.data.offlineQueue.clearConfirmTitle')}
                description={t('settingsView.data.offlineQueue.clearConfirmText')}
                confirmLabel={t('settingsView.data.offlineQueue.clearConfirmButton')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => void handleClear()}
            />
        </Card>
    )
}

export default memo(OfflineActionQueuePanel)
