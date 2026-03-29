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
import { getUISnapshot } from '@/stores/useUIStore'
import { syncService } from '@/services/syncService'
import { generateSyncEncryptionKey } from '@/services/syncEncryptionService'
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
    const isLocalOnly = settings.privacy.localOnlyMode

    const [isPushing, setIsPushing] = useState(false)
    const [isPulling, setIsPulling] = useState(false)
    const [pullGistInput, setPullGistInput] = useState('')
    const [isPullConfirmOpen, setIsPullConfirmOpen] = useState(false)
    const [showEncryptionKey, setShowEncryptionKey] = useState(false)

    const isSyncEnabled = cloudSync.provider === 'gist'
    const hasEncryptionKey = Boolean(cloudSync.encryptionKeyBase64)

    const handleGenerateEncryptionKey = async (): Promise<void> => {
        const key = await generateSyncEncryptionKey()
        dispatch(setSetting({ path: 'data.cloudSync.encryptionKeyBase64', value: key }))
        getUISnapshot().addNotification({
            type: 'success',
            message: String(t('settingsView.data.sync.e2ee.keyGenerated')),
        })
    }
    const browserWindow = typeof window === 'undefined' ? null : window

    const handleCopyEncryptionKey = async (): Promise<void> => {
        if (!cloudSync.encryptionKeyBase64) return
        await navigator.clipboard.writeText(cloudSync.encryptionKeyBase64)
        getUISnapshot().addNotification({
            type: 'success',
            message: String(t('settingsView.data.sync.e2ee.keyCopied')),
        })
    }

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
        if (isPushing) return
        setIsPushing(true)
        try {
            const stateJson = await indexedDBStorage.getItem(REDUX_STATE_KEY)
            if (!stateJson) {
                getUISnapshot().addNotification({ type: 'error', message: 'No state to sync.' })
                return
            }

            const result = await syncService.pushToGist(
                stateJson,
                cloudSync.gistId,
                cloudSync.encryptionKeyBase64,
            )
            dispatch(setSetting({ path: 'data.cloudSync.gistId', value: result.gistId }))
            dispatch(setSetting({ path: 'data.cloudSync.lastSyncAt', value: result.syncedAt }))
            getUISnapshot().addNotification({
                type: 'success',
                message: String(t('settingsView.data.sync.pushSuccess')),
            })
        } catch (error) {
            console.error('[CloudSync] Push failed:', error)
            getUISnapshot().addNotification({
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : String(t('settingsView.data.sync.pushFailed', { status: 'unknown' })),
            })
        } finally {
            setIsPushing(false)
        }
    }

    const handlePullConfirm = async (): Promise<void> => {
        if (isPulling) return
        setIsPulling(true)
        setIsPullConfirmOpen(false)
        try {
            const gistRef = pullGistInput.trim() || cloudSync.gistId
            if (!gistRef) return

            const result = await syncService.pullFromGist(gistRef, cloudSync.encryptionKeyBase64)
            await indexedDBStorage.setItem(REDUX_STATE_KEY, result.state)
            getUISnapshot().addNotification({
                type: 'success',
                message: String(t('settingsView.data.sync.pullSuccess')),
            })
            if (browserWindow) {
                setTimeout(() => browserWindow.location.reload(), 1000)
            }
        } catch (error) {
            console.error('[CloudSync] Pull failed:', error)
            getUISnapshot().addNotification({
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : String(t('settingsView.data.sync.pullFailed', { status: 'unknown' })),
            })
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

                {isLocalOnly && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-900/10 p-3 text-sm text-amber-300">
                        <PhosphorIcons.Warning className="h-4 w-4 shrink-0" />
                        {t('settingsView.data.sync.blockedByLocalOnly')}
                    </div>
                )}

                {isSyncEnabled && (
                    <div className="space-y-4">
                        {/* E2EE Encryption */}
                        <div className="rounded-lg border border-primary-500/20 bg-primary-900/10 p-3 space-y-3">
                            <div className="flex items-center gap-2">
                                <PhosphorIcons.Lock className="h-4 w-4 text-primary-400" />
                                <span className="text-sm font-medium text-primary-300">
                                    {t('settingsView.data.sync.e2ee.title')}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                {t('settingsView.data.sync.e2ee.description')}
                            </p>
                            {hasEncryptionKey ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-green-400">
                                        <PhosphorIcons.ShieldCheck className="h-3.5 w-3.5" />
                                        {t('settingsView.data.sync.e2ee.active')}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setShowEncryptionKey((v) => !v)}
                                        >
                                            {showEncryptionKey
                                                ? t('settingsView.data.sync.e2ee.hideKey')
                                                : t('settingsView.data.sync.e2ee.showKey')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleCopyEncryptionKey}
                                        >
                                            {t('settingsView.data.sync.e2ee.copyKey')}
                                        </Button>
                                    </div>
                                    {showEncryptionKey && (
                                        <code className="block break-all rounded bg-slate-800 p-2 text-xs text-slate-200 font-mono">
                                            {cloudSync.encryptionKeyBase64}
                                        </code>
                                    )}
                                </div>
                            ) : (
                                <Button size="sm" onClick={handleGenerateEncryptionKey}>
                                    <PhosphorIcons.Key className="mr-2 h-3.5 w-3.5" />
                                    {t('settingsView.data.sync.e2ee.generateKey')}
                                </Button>
                            )}
                        </div>

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
                                disabled={isPushing || isPulling || isLocalOnly}
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
                                    isLocalOnly ||
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

const CloudSyncPanelMemo = memo(CloudSyncPanel)
CloudSyncPanelMemo.displayName = 'CloudSyncPanel'
export default CloudSyncPanelMemo
