import React, { lazy, memo, Suspense, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { exportAllData, resetAllData, resetSliceData } from '@/stores/slices/settingsSlice'
import { clearArchives } from '@/stores/slices/archivesSlice'
import { setSimulationState } from '@/stores/slices/simulationSlice'
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
import { addNotification } from '@/stores/slices/uiSlice'
import { dbService } from '@/services/dbService'
import { selectSettings, selectSimulation } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { CommunitySharePanel } from './CommunitySharePanel'
const CloudSyncPanel = lazy(() => import('./CloudSyncPanel'))
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

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
                        usage: estimate.usage || 0,
                        quota: estimate.quota || 0,
                    })
                    setIsLoading(false)
                })
                .catch((err) => {
                    console.error('[DataManagementTab] Storage estimate failed:', err)
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

const DataManagementTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const simulationState = useAppSelector(selectSimulation)
    const settings = useAppSelector(selectSettings)
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false)
    const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false)
    const [fileToImport, setFileToImport] = useState<string | null>(null)
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
    const [isCleanupRunning, setIsCleanupRunning] = useState(false)
    const [storageRefreshTick, setStorageRefreshTick] = useState(0)
    const [resetConfirmText, setResetConfirmText] = useState('')
    const [sliceToReset, setSliceToReset] = useState<VersionedSliceName | null>(null)
    const [isClearArchivesConfirmOpen, setIsClearArchivesConfirmOpen] = useState(false)
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
                        const parsed = JSON.parse(content)
                        if (parsed && typeof parsed.version === 'number') {
                            setFileToImport(content)
                            setIsImportConfirmOpen(true)
                        } else {
                            throw new Error('Invalid file structure')
                        }
                    } catch {
                        dispatch(
                            addNotification({
                                type: 'error',
                                message: String(t('settingsView.data.importError')),
                            }),
                        )
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
            dispatch(
                addNotification({
                    type: 'success',
                    message: String(t('settingsView.data.importSuccess')),
                }),
            )
            setTimeout(() => globalThis.location.reload(), 1000)
        }
    }

    const handleResetAll = () => {
        dispatch(resetAllData())
        setIsResetConfirmOpen(false)
    }

    const handleRunStorageCleanup = async () => {
        setIsCleanupRunning(true)
        try {
            const optimizedSimulation =
                await dbService.optimizeSimulationForPersistence(simulationState)
            if (optimizedSimulation !== simulationState) {
                dispatch(setSimulationState(optimizedSimulation))
            }

            const deletedImages = await dbService.pruneOldImages(80)
            setStorageRefreshTick((prev) => prev + 1)

            dispatch(
                addNotification({
                    type: 'success',
                    message: String(
                        t('settingsView.data.cleanupSuccess', { count: deletedImages }),
                    ),
                }),
            )
        } catch (error) {
            console.error('[DataManagement] Storage cleanup failed:', error)
            dispatch(
                addNotification({
                    type: 'error',
                    message: String(t('settingsView.data.cleanupError')),
                }),
            )
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

            <Card>
                <FormSection
                    title={t('settingsView.data.storageInsights')}
                    icon={<PhosphorIcons.ChartPieSlice />}
                    defaultOpen
                >
                    <StorageInfo refreshTick={storageRefreshTick} />
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
        </div>
    )
}

const DataManagementTabMemo = memo(DataManagementTab)
DataManagementTabMemo.displayName = 'DataManagementTab'
export default DataManagementTabMemo
