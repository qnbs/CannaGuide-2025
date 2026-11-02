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
import type { Strain } from '@/types'
import {
    findSimilarStrains,
    buildChemovarProfile,
    predictBreedingProfile,
    scoreStrainForEffects,
    analyzeEntourage,
} from '@/services/terpeneService'
import { hasReportedChemovarInput } from '@/services/strainSimulationProfile'
import {
    readAnalyzeEntourage,
    readBatchChemovar,
    readBuildChemovar,
    readFindSimilar,
    readPredictBreeding,
    readScoreEffects,
} from '@/workers/terpenePayload'

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

const handleFindSimilar: WorkerHandler = (messageId, payload) => {
    const request = readFindSimilar(payload)
    if (request === undefined) {
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
    const request = readBuildChemovar(payload)
    if (request === undefined) {
        rejectPayload(messageId, 'Invalid BUILD_CHEMOVAR payload')
        return
    }
    self.postMessage(workerOk(messageId, chemovarOrNull(request.strain)))
}

const handleBatchChemovar: WorkerHandler = (messageId, payload) => {
    const request = readBatchChemovar(payload)
    if (request === undefined) {
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
    const request = readPredictBreeding(payload)
    if (request === undefined) {
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

const handleScoreEffects: WorkerHandler = (messageId, payload) => {
    const request = readScoreEffects(payload)
    if (request === undefined) {
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
    const request = readAnalyzeEntourage(payload)
    if (request === undefined) {
        rejectPayload(messageId, 'Invalid ANALYZE_ENTOURAGE payload')
        return
    }
    self.postMessage(
        workerOk(messageId, analyzeEntourage(request.terpeneProfile, request.cannabinoidProfile)),
    )
}

const dispatchWorkerMessage = (messageId: string, type: string, payload: unknown): void => {
    switch (type) {
        case 'FIND_SIMILAR':
            handleFindSimilar(messageId, payload)
            return
        case 'BUILD_CHEMOVAR':
            handleBuildChemovar(messageId, payload)
            return
        case 'BATCH_CHEMOVAR':
            handleBatchChemovar(messageId, payload)
            return
        case 'PREDICT_BREEDING':
            handlePredictBreeding(messageId, payload)
            return
        case 'SCORE_EFFECTS':
            handleScoreEffects(messageId, payload)
            return
        case 'ANALYZE_ENTOURAGE':
            handleAnalyzeEntourage(messageId, payload)
            return
        default:
            rejectPayload(messageId, `Unknown command: ${type}`)
    }
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
