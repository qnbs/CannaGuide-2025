/**
 * Terpene Analysis Worker -- offloads heavy computations from the main thread.
 *
 * Protocol: WorkerBus (messageId-correlated request/response)
 *
 * Supported commands:
 *   FIND_SIMILAR   -- Find strains with similar terpene profiles
 *   BUILD_CHEMOVAR -- Build full chemovar profile for a strain
 *   BATCH_CHEMOVAR -- Build chemovar profiles for multiple strains
 *   PREDICT_BREEDING -- Predict offspring terpene profile
 *   SCORE_EFFECTS  -- Score strains against desired effects
 *   ANALYZE_ENTOURAGE -- Full entourage effect analysis
 */

import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'
import { initAbortHandler, checkAborted, clearAborted } from '@/utils/workerAbort'
import type { TerpeneProfile, CannabinoidProfile, EffectTag, Strain } from '@/types'
import {
    findSimilarStrains,
    buildChemovarProfile,
    predictBreedingProfile,
    scoreStrainForEffects,
    analyzeEntourage,
} from '@/services/terpeneService'
import { hasReportedChemovarInput } from '@/services/strainSimulationProfile'

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

export interface FindSimilarPayload {
    referenceProfile: TerpeneProfile
    strains: Array<{ id: string; name: string; terpeneProfile: TerpeneProfile }>
    limit?: number
    minSimilarity?: number
}

export interface BuildChemovarPayload {
    strain: Strain
}

export interface BatchChemovarPayload {
    strains: Strain[]
}

export interface PredictBreedingPayload {
    parentA: TerpeneProfile
    parentB: TerpeneProfile
    nameHash?: number
}

export interface ScoreEffectsPayload {
    strains: Array<{ id: string; name: string; terpeneProfile: TerpeneProfile }>
    desiredEffects: EffectTag[]
    limit?: number
}

export interface AnalyzeEntouragePayload {
    terpeneProfile: TerpeneProfile
    cannabinoidProfile: CannabinoidProfile
}

// ---------------------------------------------------------------------------
// Security: origin validation
// ---------------------------------------------------------------------------

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean => {
    return !event.origin || event.origin === self.location.origin
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

type WorkerHandler = (messageId: string, payload: unknown) => void

const rejectPayload = (messageId: string, message: string): void => {
    self.postMessage(workerErr(messageId, message))
}

const chemovarOrNull = (strain: Strain) =>
    hasReportedChemovarInput(strain) ? (buildChemovarProfile(strain) ?? null) : null

const orNumber = (value: number | undefined, fallback: number): number => value ?? fallback

const invalidSimilar = (request: FindSimilarPayload): boolean =>
    !request?.referenceProfile || !Array.isArray(request.strains)

const handleFindSimilar: WorkerHandler = (messageId, payload) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const request = payload as FindSimilarPayload
    if (invalidSimilar(request)) {
        rejectPayload(messageId, 'Invalid FIND_SIMILAR payload')
        return
    }
    const results = findSimilarStrains(
        request.referenceProfile,
        request.strains,
        orNumber(request.limit, 10),
        orNumber(request.minSimilarity, 0.1),
    )
    self.postMessage(workerOk(messageId, results))
}

const handleBuildChemovar: WorkerHandler = (messageId, payload) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const request = payload as BuildChemovarPayload
    if (!request?.strain) {
        rejectPayload(messageId, 'Invalid BUILD_CHEMOVAR payload')
        return
    }
    self.postMessage(workerOk(messageId, chemovarOrNull(request.strain)))
}

const handleBatchChemovar: WorkerHandler = (messageId, payload) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const request = payload as BatchChemovarPayload
    if (!Array.isArray(request?.strains)) {
        rejectPayload(messageId, 'Invalid BATCH_CHEMOVAR payload')
        return
    }
    const profiles: Array<{
        strainId: string
        profile: ReturnType<typeof buildChemovarProfile> | null
    }> = []
    for (const strain of request.strains) {
        checkAborted(messageId)
        profiles.push({ strainId: strain.id, profile: chemovarOrNull(strain) })
    }
    clearAborted(messageId)
    self.postMessage(workerOk(messageId, profiles))
}

const handlePredictBreeding: WorkerHandler = (messageId, payload) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const request = payload as PredictBreedingPayload
    if (!request?.parentA || !request?.parentB) {
        rejectPayload(messageId, 'Invalid PREDICT_BREEDING payload')
        return
    }
    self.postMessage(
        workerOk(
            messageId,
            predictBreedingProfile(request.parentA, request.parentB, request.nameHash),
        ),
    )
}

const invalidScore = (request: ScoreEffectsPayload): boolean =>
    !Array.isArray(request?.strains) || !Array.isArray(request?.desiredEffects)

const handleScoreEffects: WorkerHandler = (messageId, payload) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const request = payload as ScoreEffectsPayload
    if (invalidScore(request)) {
        rejectPayload(messageId, 'Invalid SCORE_EFFECTS payload')
        return
    }
    const scored = request.strains
        .map((strain) => ({
            strainId: strain.id,
            strainName: strain.name,
            score: scoreStrainForEffects(strain.terpeneProfile, request.desiredEffects),
        }))
        .sort((left, right) => right.score - left.score)
        .slice(0, orNumber(request.limit, 20))
    self.postMessage(workerOk(messageId, scored))
}

const handleAnalyzeEntourage: WorkerHandler = (messageId, payload) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const request = payload as AnalyzeEntouragePayload
    if (!request?.terpeneProfile || !request?.cannabinoidProfile) {
        rejectPayload(messageId, 'Invalid ANALYZE_ENTOURAGE payload')
        return
    }
    self.postMessage(
        workerOk(messageId, analyzeEntourage(request.terpeneProfile, request.cannabinoidProfile)),
    )
}

const WORKER_COMMANDS: readonly string[] = [
    'FIND_SIMILAR',
    'BUILD_CHEMOVAR',
    'BATCH_CHEMOVAR',
    'PREDICT_BREEDING',
    'SCORE_EFFECTS',
    'ANALYZE_ENTOURAGE',
]

const WORKER_HANDLERS: Record<string, WorkerHandler> = {
    FIND_SIMILAR: handleFindSimilar,
    BUILD_CHEMOVAR: handleBuildChemovar,
    BATCH_CHEMOVAR: handleBatchChemovar,
    PREDICT_BREEDING: handlePredictBreeding,
    SCORE_EFFECTS: handleScoreEffects,
    ANALYZE_ENTOURAGE: handleAnalyzeEntourage,
}

const dispatchWorkerMessage = (messageId: string, type: string, payload: unknown): void => {
    if (!WORKER_COMMANDS.includes(type)) {
        rejectPayload(messageId, `Unknown command: ${type}`)
        return
    }
    if (!Object.prototype.hasOwnProperty.call(WORKER_HANDLERS, type)) {
        rejectPayload(messageId, `Unknown command: ${type}`)
        return
    }
    const handler = WORKER_HANDLERS[type]
    if (handler === undefined) return
    handler(messageId, payload)
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    if (!isTrustedWorkerMessage(event)) return
    const { messageId, type, payload } = event.data
    try {
        dispatchWorkerMessage(messageId, type, payload)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown worker error'
        rejectPayload(messageId, message)
    }
}

// W-02.1: Install cooperative abort handler (must be after self.onmessage)
initAbortHandler()
