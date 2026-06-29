import { useState, useCallback, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { exportAllData, resetAllData, resetSliceData } from '@/stores/slices/settingsSlice'
import { clearArchives } from '@/stores/slices/archivesSlice'
import { setSimulationState } from '@/stores/slices/simulationSlice'
import { addGrow } from '@/stores/slices/growsSlice'
import { indexedDBStorage } from '@/stores/indexedDBStorage'
import { REDUX_STATE_KEY } from '@/constants'
import type { VersionedSliceName } from '@/constants'
import { getUISnapshot } from '@/stores/useUIStore'
import { dbService } from '@/services/dbService'
import { selectSimulation } from '@/stores/selectors'
import { selectActiveGrow, selectActiveGrowPlants } from '@/stores/selectors'
import type { GrowExportData } from '@/types'
import {
    eraseAllData,
    exportAllUserData,
    eraseSingleDatabase,
    getKnownDatabaseNames,
} from '@/services/privacyService'
import * as Sentry from '@sentry/react'
import { pruneOnQuotaThreshold } from '@/services/indexedDbPruneService'

export function useDataManagementActions() {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const simulationState = useAppSelector(selectSimulation)
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
    const knownDatabases = getKnownDatabaseNames()

    const handleImportClick = () => {
        document.getElementById('import-file-input')?.click()
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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
        (e: ChangeEvent<HTMLInputElement>) => {
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

    const handleConfirmExportAll = () => {
        dispatch(exportAllData())
        setIsExportConfirmOpen(false)
    }

    const handleClearArchives = () => {
        dispatch(clearArchives())
        setIsClearArchivesConfirmOpen(false)
    }

    const handleConfirmSliceReset = () => {
        if (sliceToReset) dispatch(resetSliceData(sliceToReset))
    }

    return {
        t,
        activeGrow,
        activeGrowPlants,
        knownDatabases,
        storageRefreshTick,
        isImportConfirmOpen,
        setIsImportConfirmOpen,
        isExportConfirmOpen,
        setIsExportConfirmOpen,
        isResetConfirmOpen,
        setIsResetConfirmOpen,
        isCleanupRunning,
        resetConfirmText,
        setResetConfirmText,
        sliceToReset,
        setSliceToReset,
        isClearArchivesConfirmOpen,
        setIsClearArchivesConfirmOpen,
        isEraseConfirmOpen,
        setIsEraseConfirmOpen,
        eraseConfirmText,
        setEraseConfirmText,
        isErasing,
        isExportingAll,
        erasePhrase,
        isEraseDisabled,
        resetPhrase,
        isResetDisabled,
        handleImportClick,
        handleFileChange,
        confirmImport,
        handleExportGrow,
        handleImportGrow,
        handleGrowFileChange,
        handleResetAll,
        handleEraseAll,
        handleExportAllUserData,
        handleEraseSingleDb,
        handleRunStorageCleanup,
        handleConfirmExportAll,
        handleClearArchives,
        handleConfirmSliceReset,
    }
}
