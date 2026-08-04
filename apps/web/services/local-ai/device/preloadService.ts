import type { LocalAiPreloadReport } from '../core/localAI'
import { probeGpuVram, isVramInsufficient } from './healthService'
import { setVramInsufficientOverride } from '../models/modelLoader'
import { applyAdaptiveMode, isEcoMode } from './ecoModeService'
import { isNetworkSuitableForBulkDownload } from '../models/preloadOrchestrator'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { getReduxSnapshot } from '@/services/uiStateBridge'
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const parsed = JSON.parse(raw) as Partial<LocalAiPreloadStatus>
        return { ...DEFAULT_STATUS, ...parsed }
    } catch {
        return DEFAULT_STATUS
    }
}

const writeStatus = (status: LocalAiPreloadStatus): LocalAiPreloadStatus => {
    localStorage.setItem(LOCAL_AI_PRELOAD_STATUS_KEY, JSON.stringify(status))
    // Notify same-tab listeners (the `storage` event only fires for OTHER
    // windows, so we need a CustomEvent for in-tab observers such as
    // `usePwaInstall`'s deferred Service-Worker activation).
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cg.localai.preloadStatusChange', { detail: status }))
    }
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
    const module = await import('../core/localAI')
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

/**
 * Thrown when a model download is requested while Local-Only Mode is active.
 *
 * A named class rather than a bare Error so the UI can distinguish "you turned
 * outbound traffic off" from a genuine download failure -- the two need different
 * messages, and conflating them would tell a user their network is broken when in
 * fact their own setting is working correctly.
 */
export class LocalOnlyModeError extends Error {
    constructor() {
        super('Local-Only Mode is active: model downloads are blocked.')
        this.name = 'LocalOnlyModeError'
    }
}

/**
 * Is the startup-preload opt-in still on, right now?
 *
 * Read through `uiStateBridge` rather than importing the store: this module is a
 * service, and the bridge is the sanctioned seam between Redux and services.
 *
 * Fails CLOSED. `getReduxSnapshot` throws when the bridge is not initialised, and
 * `localAi.autoPreloadOnStartup` defaults to false -- so "cannot determine" must
 * resolve to "do not download". Treating unknown as enabled would reintroduce the
 * unattended multi-hundred-megabyte fetch this whole path exists to prevent.
 */
const isStartupPreloadStillEnabled = (): boolean => {
    try {
        return getReduxSnapshot((s) => s.settings.settings.localAi?.autoPreloadOnStartup) === true
    } catch {
        return false
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

    /**
     * Schedule preloading during browser idle time via requestIdleCallback.
     * Falls back to setTimeout(5000) if requestIdleCallback is unavailable.
     * No-op if models are already preloaded.
     */
    scheduleIdlePreload(onProgress?: (loaded: number, total: number, label: string) => void): void {
        const current = readStatus()
        if (current.state === 'ready' || current.state === 'preloading') return

        // The metered/Data-Saver guard used to sit behind the `full` tier only --
        // a branch this automatic path never reaches -- so the default `standard`
        // tier pulled nine ONNX models over whatever connection happened to be
        // active. An explicit "Preload" from Settings is still honoured; this only
        // constrains the unattended one.
        if (!isNetworkSuitableForBulkDownload()) {
            console.debug('[LocalAI] Skipping idle preload: metered or slow connection.')
            return
        }

        const startPreload = () => {
            // Local-Only Mode forbids ALL outbound traffic, and the preload is
            // the largest outbound transfer in the app. Nothing stopped a user
            // from enabling Local-Only Mode and startup preloading together, in
            // which case this happily fetched model weights from the HuggingFace
            // CDN -- no attacker involved, just two settings that contradicted
            // each other and only one of them being enforced.
            if (isLocalOnlyMode()) {
                console.debug('[LocalAI] Skipping idle preload: Local-Only Mode is active.')
                return
            }

            // The opt-in itself is re-read here too, and for the same reason as the
            // network check below: this callback was QUEUED under conditions that
            // may no longer hold. postHydration reads
            // localAi.autoPreloadOnStartup once and schedules; the user can open
            // Settings and switch it off inside the idle window, and without this
            // the already-queued task would download anyway -- the opt-out ignored
            // until the next boot, which is exactly when a user would conclude the
            // toggle does nothing.
            if (!isStartupPreloadStillEnabled()) {
                console.debug(
                    '[LocalAI] Aborting idle preload: startup preload was switched off while queued.',
                )
                return
            }

            // Re-check at EXECUTION time, not just at scheduling time. This runs
            // from requestIdleCallback (up to a 10s timeout) or a 5s fallback, and
            // the user can move onto mobile data or enable Data Saver in between --
            // precisely the window in which starting a multi-hundred-megabyte
            // download is worst.
            if (!isNetworkSuitableForBulkDownload()) {
                console.debug('[LocalAI] Aborting idle preload: connection became metered or slow.')
                return
            }
            this.preloadOfflineModels(onProgress).catch((err) => {
                console.debug('[LocalAI] Idle preload failed:', err)
            })
        }

        if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(
                () => {
                    startPreload()
                },
                { timeout: 10_000 },
            )
        } else {
            setTimeout(startPreload, 5_000)
        }
    },

    async preloadOfflineModels(
        onProgress?: (loaded: number, total: number, label: string) => void,
    ): Promise<LocalAiPreloadStatus> {
        // Local-Only Mode is absolute: no outbound traffic, whoever asked.
        //
        // The guard used to sit only in `scheduleIdlePreload`, which covers the
        // automatic path. This is the *shared* entry point -- pressing "Preload"
        // in Settings reaches it directly -- so a user with Local-Only enabled
        // could still trigger several hundred megabytes from the HuggingFace CDN
        // by clicking a button. User intent to download does not override a
        // global "make no network connections" policy; if anything it is the case
        // where the promise most needs to hold, because the user believes it is.
        //
        // Throws rather than returning a status: a silent no-op would leave the UI
        // showing "preloading" and then "idle" with no explanation, which is its
        // own small dishonesty. The caller surfaces this as an error message.
        if (isLocalOnlyMode()) {
            throw new LocalOnlyModeError()
        }

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
