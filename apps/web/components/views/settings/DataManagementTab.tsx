import React, { lazy, memo, Suspense, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { exportAllData, resetAllData, resetSliceData } from '@/stores/slices/settingsSlice'
import { clearArchives } from '@/stores/slices/archivesSlice'
import { setSimulationState } from '@/stores/slices/simulationSlice'
import { addGrow } from '@/stores/slices/growsSlice'
import { Card } from '@/components/common/Card'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { FormSection } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_KEY } from '@/constants'
import type { VersionedSliceName } from '@/constants'
import { getUISnapshot } from '@/stores/useUIStore'
import { dbService } from '@/services/dbService'
import { selectSettings, selectSimulation } from '@/stores/selectors'
import { selectActiveGrow, selectActiveGrowPlants } from '@/stores/selectors'
import type { GrowExportData } from '@/types'
import { setSetting } from '@/stores/slices/settingsSlice'
import {
    eraseAllData,
    exportAllUserData,
    eraseSingleDatabase,
    getKnownDatabaseNames,
} from '@/services/privacyService'
import * as Sentry from '@sentry/react'
import { getDbStats, type DbStoreStats } from '@/services/indexedDbMonitorService'
import { pruneOnQuotaThreshold } from '@/services/indexedDbPruneService'
import { CommunitySharePanel } from './CommunitySharePanel'
const CloudSyncPanel = lazy(() => import('./CloudSyncPanel'))
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const DbStoreBreakdown: React.FC<{ refreshTick: number }> = memo(({ refreshTick }) => {
    const { t } = useTranslation()
    const [stats, setStats] = useState<DbStoreStats[] | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        getDbStats()
            .then((s) => {
                setStats(s)
                setIsLoading(false)
            })
            .catch((err) => {
                console.debug('[DataManagementTab] DbStoreBreakdown failed:', err)
                setIsLoading(false)
            })
    }, [refreshTick])

    if (isLoading) {
        return <p className="text-xs text-slate-400">{t('settingsView.data.dbStore.loading')}</p>
    }

    if (!stats || stats.length === 0) {
        return <p className="text-xs text-slate-400">{t('settingsView.data.dbStore.empty')}</p>
    }

    // Group rows by db name
    const grouped: Record<string, DbStoreStats[]> = {}
    for (const row of stats) {
        const group = grouped[row.db]
        if (group) {
            group.push(row)
        } else {
            grouped[row.db] = [row]
        }
    }

    return (
        <div className="mt-3 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                {t('settingsView.data.dbStore.title')}
            </h4>
            {Object.entries(grouped).map(([db, rows]) => (
                <div key={db} className="bg-slate-800/50 rounded-md px-3 py-2">
                    <p className="text-xs font-mono text-slate-400 mb-1">{db}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                        {rows.map((row) => (
                            <div key={row.store} className="flex justify-between text-xs">
                                <span className="text-slate-400 truncate">{row.store}</span>
                                <span className="text-slate-200 font-mono ml-2">{row.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
})
DbStoreBreakdown.displayName = 'DbStoreBreakdown'

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const StorageInfo: React.FC<{ refreshTick: number }> = memo(({ refreshTick }) => {
    const { t } = useTranslation()
    const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setIsLoading(true)
        if (navigator.storage?.estimate) {
            navigator.storage
                .estimate()
                .then((estimate) => {
                    setStorage({
                        usage: estimate.usage ?? 0,
                        quota: estimate.quota ?? 0,
                    })
                    setIsLoading(false)
                })
                .catch((err) => {
                    console.debug('[DataManagementTab] Storage estimate failed:', err)
                    setIsLoading(false)
                })
        } else {
            setIsLoading(false)
        }
    }, [refreshTick])

    if (isLoading) {
        return (
            <p className="text-sm text-center text-slate-400">
                {t('settingsView.data.storageCalculating')}
            </p>
        )
    }

    if (!storage || !storage.quota) {
        return (
            <p className="text-sm text-center text-slate-400">
                {t('settingsView.data.storageUnavailable')}
            </p>
        )
    }

    const usagePercent = ((storage.usage / storage.quota) * 100).toFixed(1)

    const usageRatio = storage.quota > 0 ? storage.usage / storage.quota : 0
    const isWarning = usageRatio >= 0.8 && usageRatio < 0.9
    const isCritical = usageRatio >= 0.9

    return (
        <div className="space-y-3">
            <progress
                className="w-full h-4 overflow-hidden rounded-full [&::-moz-progress-bar]:bg-primary-500 [&::-webkit-progress-bar]:bg-slate-700 [&::-webkit-progress-value]:bg-primary-500"
                value={Number.parseFloat(usagePercent)}
                max={100}
                aria-label={t('settingsView.data.storageUsage')}
            />
            <div className="text-center text-sm text-slate-300 font-mono">
                {formatBytes(storage.usage)} / {formatBytes(storage.quota)} ({usagePercent}%)
            </div>
            {isWarning && (
                <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md p-2">
                    <strong>{t('settingsView.data.storageWarningTitle')}</strong>{' '}
                    {t('settingsView.data.storageWarningBody')}
                </p>
            )}
            {isCritical && (
                <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-md p-2">
                    <strong>{t('settingsView.data.storageCriticalTitle')}</strong>{' '}
                    {t('settingsView.data.storageCriticalBody')}
                </p>
            )}
        </div>
    )
})
StorageInfo.displayName = 'StorageInfo'

const CrdtStorageInfo: React.FC = memo(() => {
    const { t } = useTranslation()
    const [crdtSize, setCrdtSize] = useState<number | null>(null)

    useEffect(() => {
        let cancelled = false
        import('@/services/crdtService')
            .then(({ crdtService }) => {
                if (cancelled) return
                if (crdtService.isInitialized()) {
                    setCrdtSize(crdtService.getDocSizeBytes())
                } else if (crdtService.isFallbackMode()) {
                    setCrdtSize(-1) // sentinel for fallback
                }
            })
            .catch(() => {
                // CRDT not available
            })
        return () => {
            cancelled = true
        }
    }, [])

    if (crdtSize === null) return null

    if (crdtSize === -1) {
        return (
            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
                <p className="text-xs text-amber-300">
                    {t('settingsView.data.crdtFallback', 'CRDT sync in fallback mode (LWW). Offline merge disabled.')}
                </p>
            </div>
        )
    }

    return (
        <div className="mt-3 p-2 bg-slate-800/50 rounded-md">
            <div className="flex justify-between text-xs">
                <span className="text-slate-400">
                    {t('settingsView.data.crdtDocSize', 'CRDT Document')}
                </span>
                <span className="text-slate-200 font-mono">{formatBytes(crdtSize)}</span>
            </div>
            {crdtSize > 1_048_576 && (
                <p className="text-xs text-amber-300 mt-1">
                    {t('settingsView.data.crdtSizeWarning', 'CRDT document exceeds 1 MB. Consider running storage cleanup.')}
                </p>
            )}
        </div>
    )
})
CrdtStorageInfo.displayName = 'CrdtStorageInfo'

const DataManagementTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const simulationState = useAppSelector(selectSimulation)
    const settings = useAppSelector(selectSettings)
    const activeGrow = useAppSelector(selectActiveGrow)
    const activeGrowPlants = useAppSelector(selectActiveGrowPlants)
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false)
    const [fileToImport, setFileToImport] = useState<string | null>(null)
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
    const [isCleanupRunning, setIsCleanupRunning] = useState(false)
    const [storageRefreshTick, setStorageRefreshTick] = useState(0)
    const [resetConfirmText, setResetConfirmText] = useState('')
    const [sliceToReset, setSliceToReset] = useState<VersionedSliceName | null>(null)
    const [isClearArchivesConfirmOpen, setIsClearArchivesConfirmOpen] = useState(false)
    const [isEraseConfirmOpen, setIsEraseConfirmOpen] = useState(false)
    const [eraseConfirmText, setEraseConfirmText] = useState('')
    const [isErasing, setIsErasing] = useState(false)
    const [isExportingAll, setIsExportingAll] = useState(false)
    const erasePhrase = 'DELETE ALL'
    const isEraseDisabled = eraseConfirmText !== erasePhrase
    const resetPhrase = String(t('settingsView.data.resetAllConfirmPhrase'))
    const isResetDisabled = resetConfirmText.toLowerCase() !== resetPhrase

    const handleImportClick = () => {
        document.getElementById('import-file-input')?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                const content = event.target?.result
                if (typeof content === 'string') {
                    try {
                        const parsed: unknown = JSON.parse(content)
                        if (
                            typeof parsed === 'object' &&
                            parsed !== null &&
                            typeof (parsed as { version?: unknown }).version === 'number'
                        ) {
                            setFileToImport(content)
                            setIsImportConfirmOpen(true)
                        } else {
                            throw new Error('Invalid file structure')
                        }
                    } catch {
                        getUISnapshot().addNotification({
                            type: 'error',
                            message: String(t('settingsView.data.importError')),
                        })
                    }
                }
            }
            reader.readAsText(file)
        }
        e.target.value = ''
    }

    const confirmImport = async () => {
        if (fileToImport) {
            await indexedDBStorage.setItem(REDUX_STATE_KEY, fileToImport)
            setIsImportConfirmOpen(false)
            setFileToImport(null)
            getUISnapshot().addNotification({
                type: 'success',
                message: String(t('settingsView.data.importSuccess')),
            })
            setTimeout(() => globalThis.location.reload(), 1000)
        }
    }

    const handleExportGrow = useCallback(() => {
        if (!activeGrow) return
        const exportData: GrowExportData = {
            version: '2.0',
            exportedAt: Date.now(),
            grow: activeGrow,
            plants: activeGrowPlants,
        }
        const json = JSON.stringify(exportData, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const safeName = activeGrow.name.replaceAll(/[^\w-]/g, '_')
        a.download = `cannaguide-grow-${safeName}-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
    }, [activeGrow, activeGrowPlants])

    const handleImportGrow = useCallback(() => {
        document.getElementById('import-grow-file-input')?.click()
    }, [])

    const handleGrowFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (event) => {
                const content = event.target?.result
                if (typeof content !== 'string') return
                try {
                    const parsed = JSON.parse(content) as unknown
                    if (
                        typeof parsed !== 'object' ||
                        parsed === null ||
                        (parsed as { version?: unknown }).version !== '2.0' ||
                        !(parsed as { grow?: unknown }).grow ||
                        !Array.isArray((parsed as { plants?: unknown }).plants)
                    ) {
                        throw new Error('Invalid grow export format')
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    const data = parsed as GrowExportData
                    dispatch(addGrow(data.grow))
                    getUISnapshot().addNotification({
                        type: 'success',
                        message: String(
                            t('settingsView.data.growImportSuccess', {
                                name: data.grow.name,
                            }),
                        ),
                    })
                } catch {
                    getUISnapshot().addNotification({
                        type: 'error',
                        message: String(t('settingsView.data.growImportError')),
                    })
                }
            }
            reader.readAsText(file)
            e.target.value = ''
        },
        [dispatch, t],
    )

    const handleResetAll = () => {
        dispatch(resetAllData())
        setIsResetConfirmOpen(false)
    }

    const handleEraseAll = useCallback(async () => {
        setIsErasing(true)
        const ok = await eraseAllData()
        if (ok) {
            globalThis.location.reload()
        } else {
            setIsErasing(false)
            getUISnapshot().addNotification({
                type: 'error',
                message: 'Data erasure failed. Please try again.',
            })
        }
    }, [])

    const handleExportAllUserData = useCallback(async () => {
        setIsExportingAll(true)
        try {
            const json = await exportAllUserData()
            const blob = new Blob([json], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `cannaguide-full-export-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
            URL.revokeObjectURL(url)
        } finally {
            setIsExportingAll(false)
        }
    }, [])

    const knownDatabases = getKnownDatabaseNames()

    const handleEraseSingleDb = useCallback(
        async (dbName: string) => {
            const ok = await eraseSingleDatabase(dbName)
            Sentry.withScope((scope) => {
                scope.setTag('database', dbName)
                scope.setTag('success', String(ok))
                Sentry.captureMessage('gdpr.single_db_delete', 'info')
            })
            if (ok) {
                getUISnapshot().addNotification({
                    type: 'success',
                    message: t('settingsView.data.singleDbDeleteSuccess', {
                        db: dbName,
                        defaultValue: `${dbName} deleted. Reloading...`,
                    }),
                })
                // Invalidate in-memory state to prevent Redux/Zustand from
                // writing the deleted data back on visibilitychange or save-tick.
                globalThis.setTimeout(() => globalThis.location.reload(), 600)
            } else {
                getUISnapshot().addNotification({
                    type: 'error',
                    message: t('settingsView.data.singleDbDeleteFail', {
                        db: dbName,
                        defaultValue: `Failed to delete ${dbName}.`,
                    }),
                })
            }
        },
        [t],
    )

    const handleRunStorageCleanup = async () => {
        setIsCleanupRunning(true)
        try {
            const optimizedSimulation =
                await dbService.optimizeSimulationForPersistence(simulationState)
            if (optimizedSimulation !== simulationState) {
                dispatch(setSimulationState(optimizedSimulation))
            }

            const deletedImages = await dbService.pruneOldImages(80)

            const pruneResult = await pruneOnQuotaThreshold()
            const totalPruned = deletedImages + pruneResult.prunedEntries

            setStorageRefreshTick((prev) => prev + 1)

            getUISnapshot().addNotification({
                type: 'success',
                message: String(t('settingsView.data.cleanupSuccess', { count: totalPruned })),
            })
        } catch (error) {
            console.debug('[DataManagement] Storage cleanup failed:', error)
            getUISnapshot().addNotification({
                type: 'error',
                message: String(t('settingsView.data.cleanupError')),
            })
        } finally {
            setIsCleanupRunning(false)
        }
    }

    return (
        <div className="space-y-6">
            <ConfirmDialog
                open={isClearArchivesConfirmOpen}
                onOpenChange={setIsClearArchivesConfirmOpen}
                title={t('settingsView.data.clearArchives')}
                description={t('settingsView.data.clearArchivesConfirm')}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                onConfirm={() => {
                    dispatch(clearArchives())
                    setIsClearArchivesConfirmOpen(false)
                }}
            />
            <ConfirmDialog
                open={isExportConfirmOpen}
                onOpenChange={setIsExportConfirmOpen}
                title={t('common.confirm')}
                description={t('common.exportConfirm')}
                confirmLabel={t('settingsView.data.exportAll')}
                cancelLabel={t('common.cancel')}
                confirmVariant="secondary"
                onConfirm={() => {
                    dispatch(exportAllData())
                    setIsExportConfirmOpen(false)
                }}
            />

            <Dialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {String(t('settingsView.data.importConfirmTitle'))}
                        </DialogTitle>
                        <DialogDescription>
                            {t('settingsView.data.importConfirmText')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-2">
                        <Button variant="secondary" onClick={() => setIsImportConfirmOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={confirmImport}>
                            {t('settingsView.data.importConfirmButton')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{String(t('settingsView.data.resetAll'))}</DialogTitle>
                        <DialogDescription>
                            {t('settingsView.data.resetAllConfirm')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30 space-y-3">
                        <h4 className="font-bold text-red-300">
                            {t('settingsView.data.resetAll')}
                        </h4>
                        <p className="text-sm text-slate-300">
                            {t('settingsView.data.resetAllConfirmInput', { phrase: resetPhrase })}
                        </p>
                        <Input
                            type="text"
                            value={resetConfirmText}
                            onChange={(e) => setResetConfirmText(e.target.value)}
                            placeholder={resetPhrase}
                            autoFocus
                        />
                        <Button
                            variant="destructive"
                            onClick={handleResetAll}
                            disabled={isResetDisabled}
                            className="w-full justify-center"
                        >
                            {t('settingsView.data.resetAll')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <input
                type="file"
                id="import-file-input"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
            />

            <Card>
                <FormSection
                    title={t('settingsView.data.persistenceTitle')}
                    icon={<PhosphorIcons.Database />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-100">
                                {t('settingsView.data.autoBackup')}
                            </label>
                            <Select
                                value={settings.data.autoBackup}
                                onValueChange={(value) =>
                                    dispatch(setSetting({ path: 'data.autoBackup', value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="off">
                                        {t('settingsView.data.backupOptions.off')}
                                    </SelectItem>
                                    <SelectItem value="daily">
                                        {t('settingsView.data.backupOptions.daily')}
                                    </SelectItem>
                                    <SelectItem value="weekly">
                                        {t('settingsView.data.backupOptions.weekly')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-100">
                                {t('settingsView.data.persistenceInterval')}
                            </label>
                            <Select
                                value={String(settings.data.persistenceIntervalMs)}
                                onValueChange={(value) =>
                                    dispatch(
                                        setSetting({
                                            path: 'data.persistenceIntervalMs',
                                            value: Number(value),
                                        }),
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="500">
                                        {t('settingsView.data.persistenceOptions.fast')}
                                    </SelectItem>
                                    <SelectItem value="1500">
                                        {t('settingsView.data.persistenceOptions.balanced')}
                                    </SelectItem>
                                    <SelectItem value="5000">
                                        {t('settingsView.data.persistenceOptions.batterySaver')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </FormSection>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.data.backupAndRestore')}
                    icon={<PhosphorIcons.ArchiveBox />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                onClick={() => setIsExportConfirmOpen(true)}
                                className="flex-1 justify-center"
                            >
                                <PhosphorIcons.DownloadSimple className="mr-2" />
                                {t('settingsView.data.exportAll')}
                            </Button>
                            <Button
                                onClick={handleImportClick}
                                variant="secondary"
                                className="flex-1 justify-center"
                            >
                                <PhosphorIcons.UploadSimple className="mr-2" />
                                {t('settingsView.data.importData')}
                            </Button>
                        </div>
                        <p className="text-xs text-slate-400">
                            {t('settingsView.data.importDataDesc')}
                        </p>
                    </div>
                </FormSection>
            </Card>

            {activeGrow ? (
                <Card>
                    <FormSection
                        title={t('settingsView.data.growExportTitle')}
                        icon={<PhosphorIcons.Plant />}
                        defaultOpen
                    >
                        <div className="sm:col-span-2 space-y-4">
                            <p className="text-sm text-slate-300">
                                {t('settingsView.data.growExportDesc', {
                                    name: activeGrow.name,
                                    count: activeGrowPlants.length,
                                })}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    onClick={handleExportGrow}
                                    className="flex-1 justify-center"
                                >
                                    <PhosphorIcons.DownloadSimple className="mr-2" />
                                    {t('settingsView.data.exportGrow')}
                                </Button>
                                <Button
                                    onClick={handleImportGrow}
                                    variant="secondary"
                                    className="flex-1 justify-center"
                                >
                                    <PhosphorIcons.UploadSimple className="mr-2" />
                                    {t('settingsView.data.importGrow')}
                                </Button>
                            </div>
                            <p className="text-xs text-slate-400">
                                {t('settingsView.data.growImportDesc')}
                            </p>
                            <input
                                type="file"
                                id="import-grow-file-input"
                                accept=".json"
                                className="hidden"
                                onChange={handleGrowFileChange}
                            />
                        </div>
                    </FormSection>
                </Card>
            ) : null}

            <Card>
                <FormSection
                    title={t('settingsView.data.storageInsights')}
                    icon={<PhosphorIcons.ChartPieSlice />}
                    defaultOpen
                >
                    <StorageInfo refreshTick={storageRefreshTick} />
                    <CrdtStorageInfo />
                    <DbStoreBreakdown refreshTick={storageRefreshTick} />
                    <div className="mt-4 pt-4 border-t border-slate-700/50 flex flex-col gap-2">
                        <p className="text-sm text-slate-400">
                            {t('settingsView.data.runCleanupDesc')}
                        </p>
                        <Button
                            onClick={handleRunStorageCleanup}
                            disabled={isCleanupRunning}
                            className="justify-center"
                        >
                            <PhosphorIcons.Broom className="mr-2" />
                            {isCleanupRunning
                                ? t('settingsView.data.cleanupRunning')
                                : t('settingsView.data.runCleanup')}
                        </Button>
                    </div>
                </FormSection>
            </Card>

            <Suspense fallback={null}>
                <CloudSyncPanel />
            </Suspense>

            <CommunitySharePanel />

            <Dialog
                open={!!sliceToReset}
                onOpenChange={(open) => {
                    if (!open) setSliceToReset(null)
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {t('settingsView.data.sliceReset.confirmTitle', {
                                slice: sliceToReset
                                    ? t(`settingsView.data.sliceReset.slices.${sliceToReset}`)
                                    : '',
                            })}
                        </DialogTitle>
                        <DialogDescription>
                            {t('settingsView.data.sliceReset.confirmText', {
                                slice: sliceToReset
                                    ? t(`settingsView.data.sliceReset.slices.${sliceToReset}`)
                                    : '',
                            })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-2">
                        <Button variant="secondary" onClick={() => setSliceToReset(null)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (sliceToReset) dispatch(resetSliceData(sliceToReset))
                            }}
                        >
                            {t('settingsView.data.sliceReset.confirmButton')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card>
                <FormSection
                    title={t('settingsView.data.sliceReset.title')}
                    icon={<PhosphorIcons.ArrowClockwise />}
                >
                    <div className="sm:col-span-2">
                        <p className="text-sm text-slate-400 mb-4">
                            {t('settingsView.data.sliceReset.desc')}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {(
                                [
                                    'simulation',
                                    'genealogy',
                                    'sandbox',
                                    'favorites',
                                    'notes',
                                    'archives',
                                    'savedItems',
                                    'knowledge',
                                    'breeding',
                                    'userStrains',
                                ] as const
                            ).map((slice) => (
                                <Button
                                    key={slice}
                                    variant="secondary"
                                    size="sm"
                                    className="justify-center text-xs"
                                    onClick={() => setSliceToReset(slice)}
                                >
                                    {t(`settingsView.data.sliceReset.slices.${slice}`)}
                                </Button>
                            ))}
                        </div>
                    </div>
                </FormSection>
            </Card>

            <Card className="border border-red-500/30 bg-red-900/10">
                <FormSection
                    title={t('settingsView.data.dangerZone')}
                    icon={<PhosphorIcons.WarningCircle />}
                    defaultOpen
                >
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                            <div>
                                <h4 className="font-bold text-slate-100">
                                    {t('settingsView.data.clearArchives')}
                                </h4>
                                <p className="text-sm text-slate-400">
                                    {t('settingsView.data.clearArchivesDesc')}
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsClearArchivesConfirmOpen(true)}
                            >
                                {t('common.delete')}
                            </Button>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                            <div>
                                <h4 className="font-bold text-slate-100">
                                    {t('settingsView.data.resetAll')}
                                </h4>
                                <p className="text-sm text-slate-400">
                                    {t('settingsView.data.resetAllConfirm')}
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsResetConfirmOpen(true)}
                            >
                                {t('common.delete')}
                            </Button>
                        </div>
                    </div>
                </FormSection>
            </Card>

            {/* DSGVO / GDPR -- Right to be Forgotten */}
            <Card className="p-4 space-y-4 border-red-700/40">
                <FormSection title={t('settingsView.data.gdprTitle', 'Privacy (GDPR/DSGVO)')}>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                            <div>
                                <h4 className="font-bold text-slate-100">
                                    {t('settingsView.data.gdprExport', 'Export All Personal Data')}
                                </h4>
                                <p className="text-sm text-slate-400">
                                    {t(
                                        'settingsView.data.gdprExportDesc',
                                        'Download a complete copy of all data (Art. 20 GDPR).',
                                    )}
                                </p>
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={isExportingAll}
                                onClick={handleExportAllUserData}
                            >
                                {isExportingAll
                                    ? t('common.loading')
                                    : t('common.export', 'Export')}
                            </Button>
                        </div>
                        {/* Individual DB Deletion (Art. 17 partial) */}
                        <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
                            <h4 className="font-bold text-slate-100">
                                {t(
                                    'settingsView.data.gdprSelectiveDelete',
                                    'Selective Database Deletion',
                                )}
                            </h4>
                            <p className="text-sm text-slate-400">
                                {t(
                                    'settingsView.data.gdprSelectiveDeleteDesc',
                                    'Delete individual databases instead of all data at once (Art. 17 GDPR partial erasure).',
                                )}
                            </p>
                            <div className="grid grid-cols-1 gap-1 mt-2">
                                {knownDatabases.map((dbName) => (
                                    <div
                                        key={dbName}
                                        className="flex justify-between items-center py-1.5 px-2 rounded bg-slate-900/40"
                                    >
                                        <span className="text-xs font-mono text-slate-300">
                                            {dbName}
                                        </span>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleEraseSingleDb(dbName)}
                                        >
                                            {t('common.delete')}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-red-900/30 rounded-lg border border-red-800/40">
                            <div>
                                <h4 className="font-bold text-red-300">
                                    {t('settingsView.data.gdprErase', 'Erase All Data')}
                                </h4>
                                <p className="text-sm text-red-400/80">
                                    {t(
                                        'settingsView.data.gdprEraseDesc',
                                        'Permanently delete ALL data from this device (Art. 17 GDPR). This cannot be undone.',
                                    )}
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsEraseConfirmOpen(true)}
                            >
                                {t('common.delete')}
                            </Button>
                        </div>
                    </div>
                </FormSection>
            </Card>

            {/* GDPR Erase Confirmation Dialog */}
            <Dialog open={isEraseConfirmOpen} onOpenChange={setIsEraseConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('settingsView.data.gdprErase', 'Erase All Data')}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                'settingsView.data.gdprEraseWarning',
                                'This will permanently delete ALL databases, local storage, caches, and service workers. Type DELETE ALL to confirm.',
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={eraseConfirmText}
                        onChange={(e) => setEraseConfirmText(e.target.value)}
                        placeholder={t(
                            'settingsView.data.gdprEraseConfirmPlaceholder',
                            'DELETE ALL',
                        )}
                        className="font-mono"
                    />
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEraseConfirmOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={isEraseDisabled || isErasing}
                            onClick={handleEraseAll}
                        >
                            {isErasing
                                ? t('common.loading')
                                : t('settingsView.data.gdprErase', 'Erase All Data')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

const DataManagementTabMemo = memo(DataManagementTab)
DataManagementTabMemo.displayName = 'DataManagementTab'
export default DataManagementTabMemo
