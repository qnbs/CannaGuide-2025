import React, { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { setSetting } from '@/stores/slices/settingsSlice'
import { selectSettings } from '@/stores/selectors'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { addNotification } from '@/stores/slices/uiSlice'
import { syncService } from '@/services/syncService'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_KEY } from '@/constants'

const formatSyncDate = (ts: number | null, t: (key: string) => string): string => {
    if (!ts) return t('settingsView.data.sync.never')
    return new Date(ts).toLocaleString()
}

const CloudSyncPanel: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const { cloudSync } = settings.data

    const [isPushing, setIsPushing] = useState(false)
    const [isPulling, setIsPulling] = useState(false)
    const [pullGistInput, setPullGistInput] = useState('')
    const [isPullConfirmOpen, setIsPullConfirmOpen] = useState(false)

    const isSyncEnabled = cloudSync.provider === 'gist'

    const handleToggleSync = (): void => {
        if (isSyncEnabled) {
            dispatch(setSetting({ path: 'data.cloudSync.provider', value: 'none' }))
            dispatch(setSetting({ path: 'data.cloudSync.enabled', value: false }))
        } else {
            dispatch(setSetting({ path: 'data.cloudSync.provider', value: 'gist' }))
            dispatch(setSetting({ path: 'data.cloudSync.enabled', value: true }))
        }
    }

    const handlePush = async (): Promise<void> => {
        setIsPushing(true)
        try {
            const stateJson = await indexedDBStorage.getItem(REDUX_STATE_KEY)
            if (!stateJson) {
                dispatch(addNotification({ type: 'error', message: 'No state to sync.' }))
                return
            }

            const result = await syncService.pushToGist(stateJson, cloudSync.gistId)
            dispatch(setSetting({ path: 'data.cloudSync.gistId', value: result.gistId }))
            dispatch(setSetting({ path: 'data.cloudSync.lastSyncAt', value: result.syncedAt }))
            dispatch(
                addNotification({
                    type: 'success',
                    message: String(t('settingsView.data.sync.pushSuccess')),
                }),
            )
        } catch (error) {
            console.error('[CloudSync] Push failed:', error)
            dispatch(
                addNotification({
                    type: 'error',
                    message:
                        error instanceof Error
                            ? error.message
                            : String(t('settingsView.data.sync.pushFailed', { status: 'unknown' })),
                }),
            )
        } finally {
            setIsPushing(false)
        }
    }

    const handlePullConfirm = async (): Promise<void> => {
        setIsPulling(true)
        setIsPullConfirmOpen(false)
        try {
            const gistRef = pullGistInput.trim() || cloudSync.gistId
            if (!gistRef) return

            const result = await syncService.pullFromGist(gistRef)
            await indexedDBStorage.setItem(REDUX_STATE_KEY, result.state)
            dispatch(
                addNotification({
                    type: 'success',
                    message: String(t('settingsView.data.sync.pullSuccess')),
                }),
            )
            setTimeout(() => window.location.reload(), 1000)
        } catch (error) {
            console.error('[CloudSync] Pull failed:', error)
            dispatch(
                addNotification({
                    type: 'error',
                    message:
                        error instanceof Error
                            ? error.message
                            : String(t('settingsView.data.sync.pullFailed', { status: 'unknown' })),
                }),
            )
            setIsPulling(false)
        }
    }

    const handlePullClick = (): void => {
        setIsPullConfirmOpen(true)
    }

    return (
        <>
            <ConfirmDialog
                open={isPullConfirmOpen}
                onOpenChange={setIsPullConfirmOpen}
                title={String(t('settingsView.data.sync.confirmPullTitle'))}
                description={String(t('settingsView.data.sync.confirmPull'))}
                confirmLabel={String(t('settingsView.data.sync.pullButton'))}
                cancelLabel={String(t('common.cancel'))}
                onConfirm={handlePullConfirm}
            />

            {/* Local-Only Badge */}
            <Card className="border border-green-500/30 bg-green-900/10">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-green-500/20 p-2">
                        <PhosphorIcons.ShieldCheck className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                            {t('settingsView.data.localOnlyBadge')}
                        </h3>
                        <p className="text-sm text-slate-300 mt-1">
                            {t('settingsView.data.localOnlyDesc')}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Cloud Sync Card */}
            <Card>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="text-xl font-bold font-display text-primary-400 flex items-center gap-2">
                        <PhosphorIcons.CloudArrowUp />
                        {t('settingsView.data.sync.title')}
                    </h3>
                    <Button
                        variant={isSyncEnabled ? 'default' : 'secondary'}
                        size="sm"
                        className="shrink-0"
                        onClick={handleToggleSync}
                    >
                        {isSyncEnabled
                            ? t('settingsView.data.sync.disableSync')
                            : t('settingsView.data.sync.enableSync')}
                    </Button>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                    {t('settingsView.data.sync.description')}
                </p>

                {isSyncEnabled && (
                    <div className="space-y-4">
                        {/* Status */}
                        <div className="flex items-center justify-between text-sm bg-slate-800/50 rounded-lg p-3">
                            <span className="text-slate-300">
                                {t('settingsView.data.sync.lastSynced')}
                            </span>
                            <span className="text-slate-100 font-mono text-xs">
                                {formatSyncDate(cloudSync.lastSyncAt, (k) => String(t(k)))}
                            </span>
                        </div>

                        {cloudSync.gistId && (
                            <div className="flex items-center justify-between text-sm bg-slate-800/50 rounded-lg p-3">
                                <span className="text-slate-300">
                                    {t('settingsView.data.sync.gistIdLabel')}
                                </span>
                                <code className="text-xs text-primary-300 font-mono">
                                    {cloudSync.gistId.slice(0, 12)}…
                                </code>
                            </div>
                        )}

                        {/* Push / Pull */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                onClick={handlePush}
                                disabled={isPushing || isPulling}
                                className="flex-1 justify-center"
                            >
                                <PhosphorIcons.CloudArrowUp className="mr-2" />
                                {isPushing
                                    ? t('settingsView.data.sync.syncing')
                                    : t('settingsView.data.sync.pushButton')}
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handlePullClick}
                                disabled={
                                    isPushing ||
                                    isPulling ||
                                    (!pullGistInput.trim() && !cloudSync.gistId)
                                }
                                className="flex-1 justify-center"
                            >
                                <PhosphorIcons.CloudArrowDown className="mr-2" />
                                {isPulling
                                    ? t('settingsView.data.sync.syncing')
                                    : t('settingsView.data.sync.pullButton')}
                            </Button>
                        </div>

                        {/* Pull from specific Gist */}
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">
                                {t('settingsView.data.sync.gistIdPlaceholder')}
                            </label>
                            <Input
                                value={pullGistInput}
                                onChange={(e) => setPullGistInput(e.target.value)}
                                placeholder={t('settingsView.data.sync.gistIdPlaceholder')}
                                className="font-mono text-xs"
                            />
                        </div>
                    </div>
                )}
            </Card>
        </>
    )
}

export default memo(CloudSyncPanel)
