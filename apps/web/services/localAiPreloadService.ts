import type { LocalAiPreloadReport } from './localAI'
import { probeGpuVram, isVramInsufficient } from './localAiHealthService'
import { setVramInsufficientOverride } from './localAIModelLoader'
import { applyAdaptiveMode, isEcoMode } from './aiEcoModeService'
import { secureRandom } from '@/utils/random'

export type LocalAiPreloadState = 'idle' | 'preloading' | 'ready' | 'partial' | 'error'

export interface LocalAiPreloadStatus {
    state: LocalAiPreloadState
    lastAttemptAt: number | null
    readyAt: number | null
    persistentStorageGranted: boolean | null
    textModelReady: boolean
    visionModelReady: boolean
    webLlmReady: boolean
    embeddingModelReady: boolean
    sentimentModelReady: boolean
    summarizationModelReady: boolean
    zeroShotTextModelReady: boolean
    languageDetectionReady: boolean
    imageSimilarityReady: boolean
    details: string | null
}

const LOCAL_AI_PRELOAD_STATUS_KEY = 'cg.localai.preload_status'
const PRELOAD_MAX_RETRIES = 2

const DEFAULT_STATUS: LocalAiPreloadStatus = {
    state: 'idle',
    lastAttemptAt: null,
    readyAt: null,
    persistentStorageGranted: null,
    textModelReady: false,
    visionModelReady: false,
    webLlmReady: false,
    embeddingModelReady: false,
    sentimentModelReady: false,
    summarizationModelReady: false,
    zeroShotTextModelReady: false,
    languageDetectionReady: false,
    imageSimilarityReady: false,
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

/**
 * Proactively request persistent storage to prevent browser eviction of
 * cached AI models in IndexedDB. Retries once with a delay if the first
 * attempt is denied, as some browsers grant on second interaction.
 * Also triggers VRAM profiling to inform adaptive model selection.
 */
export const ensurePersistentStorage = async (): Promise<boolean | null> => {
    if (typeof navigator === 'undefined' || !('storage' in navigator)) {
        return null
    }

    try {
        // Check if already persisted
        const alreadyPersisted = await navigator.storage.persisted?.()
        if (alreadyPersisted) return true

        // First attempt
        const granted = await navigator.storage.persist?.()
        if (granted) {
            console.debug('[LocalAI] Persistent storage granted on first request.')
            return true
        }

        // Single retry after short delay (some browsers grant after user interaction)
        await new Promise((r) => setTimeout(r, 2000))
        const retryGranted = await navigator.storage.persist?.()
        if (retryGranted) {
            console.debug('[LocalAI] Persistent storage granted on retry.')
            return true
        }

        console.debug(
            '[LocalAI] Persistent storage denied by browser. Model caches may be evicted.',
        )
        return false
    } catch {
        return null
    }
}

const formatReportDetails = (report: LocalAiPreloadReport): string => {
    const formatReadiness = (
        ready: boolean,
        unavailableLabel: 'missing' | 'skipped' | 'unavailable' = 'missing',
    ): string => (ready ? 'ready' : unavailableLabel)

    const segments = [
        `text=${formatReadiness(report.textModelReady)}`,
        `vision=${formatReadiness(report.visionModelReady)}`,
        `webLlm=${formatReadiness(report.webLlmReady, 'skipped')}`,
        `embedding=${formatReadiness(report.embeddingModelReady)}`,
        `sentiment=${formatReadiness(report.sentimentModelReady)}`,
        `summarization=${formatReadiness(report.summarizationModelReady)}`,
        `zeroShot=${formatReadiness(report.zeroShotTextModelReady)}`,
        `langDetect=${formatReadiness(report.languageDetectionReady)}`,
        `imgSimilarity=${formatReadiness(report.imageSimilarityReady)}`,
        `imageGen=${formatReadiness(report.imageGenerationReady, 'unavailable')}`,
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

const waitForRetryBackoff = async (attempt: number): Promise<void> => {
    const jitter = secureRandom() * 500
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1) + jitter))
}

const buildFinalPreloadStatus = (
    startedAt: number,
    persistentStorageGranted: boolean | null,
    report: LocalAiPreloadReport,
    ecoActive: boolean,
): LocalAiPreloadStatus => {
    const coreReady = ecoActive
        ? report.textModelReady
        : report.textModelReady && report.visionModelReady

    return {
        state: coreReady ? 'ready' : 'partial',
        lastAttemptAt: startedAt,
        readyAt: coreReady ? Date.now() : null,
        persistentStorageGranted,
        textModelReady: report.textModelReady,
        visionModelReady: report.visionModelReady,
        webLlmReady: report.webLlmReady,
        embeddingModelReady: report.embeddingModelReady,
        sentimentModelReady: report.sentimentModelReady,
        summarizationModelReady: report.summarizationModelReady,
        zeroShotTextModelReady: report.zeroShotTextModelReady,
        languageDetectionReady: report.languageDetectionReady,
        imageSimilarityReady: report.imageSimilarityReady,
        details: formatReportDetails(report),
    }
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

        // Run adaptive mode detection, VRAM probe, and persistent storage in parallel
        const [persisted] = await Promise.all([
            ensurePersistentStorage(),
            applyAdaptiveMode(),
            probeGpuVram().then(() => {
                // Apply VRAM-based WASM override to model loader
                if (isVramInsufficient()) {
                    setVramInsufficientOverride(true)
                    console.debug(
                        '[LocalAI] VRAM insufficient — forcing WASM backend for all pipelines.',
                    )
                }
            }),
        ])
        const inProgress = writeStatus({
            ...readStatus(),
            state: 'preloading',
            lastAttemptAt: startedAt,
            persistentStorageGranted: persisted,
            details: 'warming-runtime',
        })
        let lastError: unknown = null

        for (let attempt = 0; attempt <= PRELOAD_MAX_RETRIES; attempt++) {
            try {
                const localAiService = await getLocalAiService()
                const ecoActive = isEcoMode()
                const report = await localAiService.preloadOfflineAssets(
                    false,
                    onProgress,
                    ecoActive,
                )
                return writeStatus(buildFinalPreloadStatus(startedAt, persisted, report, ecoActive))
            } catch (error) {
                lastError = error
                if (attempt < PRELOAD_MAX_RETRIES) {
                    writeStatus({ ...inProgress, details: `retry-${attempt + 1}` })
                    await waitForRetryBackoff(attempt)
                }
            }
        }

        const failureStatus: LocalAiPreloadStatus = {
            ...inProgress,
            state: 'error',
            details: lastError instanceof Error ? lastError.message : 'preload-failed',
        }
        return writeStatus(failureStatus)
    },
}
