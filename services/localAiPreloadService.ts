import type { LocalAiPreloadReport } from './localAI'

export type LocalAiPreloadState = 'idle' | 'preloading' | 'ready' | 'partial' | 'error'

export interface LocalAiPreloadStatus {
    state: LocalAiPreloadState
    lastAttemptAt: number | null
    readyAt: number | null
    persistentStorageGranted: boolean | null
    textModelReady: boolean
    visionModelReady: boolean
    webLlmReady: boolean
    details: string | null
}

const LOCAL_AI_PRELOAD_STATUS_KEY = 'cg.localai.preload_status'

const DEFAULT_STATUS: LocalAiPreloadStatus = {
    state: 'idle',
    lastAttemptAt: null,
    readyAt: null,
    persistentStorageGranted: null,
    textModelReady: false,
    visionModelReady: false,
    webLlmReady: false,
    details: null,
}

const readStatus = (): LocalAiPreloadStatus => {
    try {
        const raw = localStorage.getItem(LOCAL_AI_PRELOAD_STATUS_KEY)
        if (!raw) return DEFAULT_STATUS
        const parsed = JSON.parse(raw) as Partial<LocalAiPreloadStatus>
        return { ...DEFAULT_STATUS, ...parsed }
    } catch {
        return DEFAULT_STATUS
    }
}

const writeStatus = (status: LocalAiPreloadStatus): LocalAiPreloadStatus => {
    localStorage.setItem(LOCAL_AI_PRELOAD_STATUS_KEY, JSON.stringify(status))
    return status
}

const getPersistentStorageAccess = async (): Promise<boolean | null> => {
    if (typeof navigator === 'undefined' || !('storage' in navigator)) {
        return null
    }

    try {
        const persisted = await navigator.storage.persist?.()
        return typeof persisted === 'boolean' ? persisted : null
    } catch {
        return null
    }
}

const formatReportDetails = (report: LocalAiPreloadReport): string => {
    const segments = [
        `text=${report.textModelReady ? 'ready' : 'missing'}`,
        `vision=${report.visionModelReady ? 'ready' : 'missing'}`,
        `webLlm=${report.webLlmReady ? 'ready' : 'skipped'}`,
    ]

    if (report.errorCount > 0) {
        segments.push(`errors=${report.errorCount}`)
    }

    return segments.join(', ')
}

const getLocalAiService = async () => {
    const module = await import('./localAI')
    return module.localAiService
}

export const localAiPreloadService = {
    getStatus(): LocalAiPreloadStatus {
        return readStatus()
    },

    /** Returns true when at least the text model is preloaded and ready. */
    isReady(): boolean {
        const status = readStatus()
        return status.state === 'ready' || (status.state === 'partial' && status.textModelReady)
    },

    async preloadOfflineModels(
        onProgress?: (loaded: number, total: number, label: string) => void,
    ): Promise<LocalAiPreloadStatus> {
        const startedAt = Date.now()
        const persisted = await getPersistentStorageAccess()
        const inProgress = writeStatus({
            ...readStatus(),
            state: 'preloading',
            lastAttemptAt: startedAt,
            persistentStorageGranted: persisted,
            details: 'warming-runtime',
        })

        try {
            const localAiService = await getLocalAiService()
            const report = await localAiService.preloadOfflineAssets(false, onProgress)
            const finalStatus: LocalAiPreloadStatus = {
                state: report.textModelReady && report.visionModelReady ? 'ready' : 'partial',
                lastAttemptAt: startedAt,
                readyAt: report.textModelReady && report.visionModelReady ? Date.now() : null,
                persistentStorageGranted: persisted,
                textModelReady: report.textModelReady,
                visionModelReady: report.visionModelReady,
                webLlmReady: report.webLlmReady,
                details: formatReportDetails(report),
            }

            return writeStatus(finalStatus)
        } catch (error) {
            const failureStatus: LocalAiPreloadStatus = {
                ...inProgress,
                state: 'error',
                details: error instanceof Error ? error.message : 'preload-failed',
            }
            return writeStatus(failureStatus)
        }
    },
}
