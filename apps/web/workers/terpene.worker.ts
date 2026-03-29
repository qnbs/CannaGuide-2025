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
import type { TerpeneProfile, CannabinoidProfile, EffectTag, Strain } from '@/types'
import {
    findSimilarStrains,
    buildChemovarProfile,
    predictBreedingProfile,
    scoreStrainForEffects,
    analyzeEntourage,
} from '@/services/terpeneService'

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

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
    if (!isTrustedWorkerMessage(e)) return

    const { messageId, type, payload } = e.data

    try {
        switch (type) {
            case 'FIND_SIMILAR': {
                const p = payload as FindSimilarPayload
                if (!p?.referenceProfile || !Array.isArray(p.strains)) {
                    self.postMessage(workerErr(messageId, 'Invalid FIND_SIMILAR payload'))
                    return
                }
                const results = findSimilarStrains(
                    p.referenceProfile,
                    p.strains,
                    p.limit ?? 10,
                    p.minSimilarity ?? 0.1,
                )
                self.postMessage(workerOk(messageId, results))
                return
            }

            case 'BUILD_CHEMOVAR': {
                const p = payload as BuildChemovarPayload
                if (!p?.strain) {
                    self.postMessage(workerErr(messageId, 'Invalid BUILD_CHEMOVAR payload'))
                    return
                }
                const profile = buildChemovarProfile(p.strain)
                self.postMessage(workerOk(messageId, profile))
                return
            }

            case 'BATCH_CHEMOVAR': {
                const p = payload as BatchChemovarPayload
                if (!Array.isArray(p?.strains)) {
                    self.postMessage(workerErr(messageId, 'Invalid BATCH_CHEMOVAR payload'))
                    return
                }
                const profiles = p.strains.map((strain) => ({
                    strainId: strain.id,
                    profile: buildChemovarProfile(strain),
                }))
                self.postMessage(workerOk(messageId, profiles))
                return
            }

            case 'PREDICT_BREEDING': {
                const p = payload as PredictBreedingPayload
                if (!p?.parentA || !p?.parentB) {
                    self.postMessage(workerErr(messageId, 'Invalid PREDICT_BREEDING payload'))
                    return
                }
                const predicted = predictBreedingProfile(p.parentA, p.parentB, p.nameHash)
                self.postMessage(workerOk(messageId, predicted))
                return
            }

            case 'SCORE_EFFECTS': {
                const p = payload as ScoreEffectsPayload
                if (!Array.isArray(p?.strains) || !Array.isArray(p?.desiredEffects)) {
                    self.postMessage(workerErr(messageId, 'Invalid SCORE_EFFECTS payload'))
                    return
                }
                const scored = p.strains
                    .map((s) => ({
                        strainId: s.id,
                        strainName: s.name,
                        score: scoreStrainForEffects(s.terpeneProfile, p.desiredEffects),
                    }))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, p.limit ?? 20)
                self.postMessage(workerOk(messageId, scored))
                return
            }

            case 'ANALYZE_ENTOURAGE': {
                const p = payload as AnalyzeEntouragePayload
                if (!p?.terpeneProfile || !p?.cannabinoidProfile) {
                    self.postMessage(workerErr(messageId, 'Invalid ANALYZE_ENTOURAGE payload'))
                    return
                }
                const analysis = analyzeEntourage(p.terpeneProfile, p.cannabinoidProfile)
                self.postMessage(workerOk(messageId, analysis))
                return
            }

            default:
                self.postMessage(workerErr(messageId, `Unknown command: ${type}`))
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown worker error'
        self.postMessage(workerErr(messageId, message))
    }
}
