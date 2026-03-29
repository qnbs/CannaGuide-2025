/**
 * Strain Data Hydration Worker
 *
 * Background worker for fetching, validating, and merging external strain data
 * from multiple providers. Runs off the main thread to avoid UI jank during
 * large batch operations.
 *
 * Protocol: WorkerBus (messageId-correlated request/response)
 *
 * Supported commands:
 *   HYDRATE_STRAIN  -- Enrich a single strain from all available providers
 *   BATCH_HYDRATE   -- Enrich multiple strains in sequence
 *   IMPORT_DATASET  -- Validate and import an external dataset
 *   FIND_DUPLICATES -- Detect duplicate strains by fuzzy name matching
 *   QUALITY_AUDIT   -- Compute data quality scores for a set of strains
 */

import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'
import type { Strain, StrainApiProvider } from '@/types'
import type { ValidatedExternalStrainData } from '@/types/strainSchemas'
import { externalStrainDataSchema } from '@/types/strainSchemas'
import {
    mergeExternalIntoStrain,
    assessDataQuality,
    findDuplicateStrains,
    estimateFlavonoidProfile,
} from '@/services/strainCurationService'

// ---------------------------------------------------------------------------
// Payload types
// ---------------------------------------------------------------------------

export interface HydrateStrainPayload {
    strain: Strain
    externalData: ValidatedExternalStrainData[]
}

export interface BatchHydratePayload {
    strains: Strain[]
    externalData: Array<{
        strainId: string
        data: ValidatedExternalStrainData[]
    }>
}

export interface ImportDatasetPayload {
    rawData: unknown[]
    provider: StrainApiProvider
    existingStrains: Strain[]
}

export interface FindDuplicatesPayload {
    strains: Array<{ id: string; name: string }>
}

export interface QualityAuditPayload {
    strains: Strain[]
}

// ---------------------------------------------------------------------------
// Security: origin validation
// ---------------------------------------------------------------------------

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean => {
    return !event.origin || event.origin === self.location.origin
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const hydrateOne = (strain: Strain, externalData: ValidatedExternalStrainData[]): Strain => {
    let result = { ...strain }
    for (const ext of externalData) {
        result = mergeExternalIntoStrain(result, ext)
    }
    // Estimate flavonoid profile if not yet present and we have terpene data
    if (!result.flavonoidProfile && result.terpeneProfile) {
        const nameHash = hashString(result.name)
        result.flavonoidProfile = estimateFlavonoidProfile(
            result.terpeneProfile,
            result.cannabinoidProfile,
            nameHash,
        )
    }
    result.dataQuality = assessDataQuality(result)
    return result
}

/** Simple string hash for deterministic pseudo-random offsets */
const hashString = (s: string): number => {
    let h = 0
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0
    }
    return Math.abs(h)
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
    if (!isTrustedWorkerMessage(e)) return

    const { messageId, type, payload } = e.data

    try {
        switch (type) {
            case 'HYDRATE_STRAIN': {
                const p = payload as HydrateStrainPayload
                if (!p?.strain || !Array.isArray(p?.externalData)) {
                    self.postMessage(workerErr(messageId, 'Invalid HYDRATE_STRAIN payload'))
                    return
                }
                const hydrated = hydrateOne(p.strain, p.externalData)
                self.postMessage(workerOk(messageId, hydrated))
                return
            }

            case 'BATCH_HYDRATE': {
                const p = payload as BatchHydratePayload
                if (!Array.isArray(p?.strains) || !Array.isArray(p?.externalData)) {
                    self.postMessage(workerErr(messageId, 'Invalid BATCH_HYDRATE payload'))
                    return
                }
                const dataMap = new Map(p.externalData.map((d) => [d.strainId, d.data]))
                const results = p.strains.map((strain) => {
                    const ext = dataMap.get(strain.id) ?? []
                    return hydrateOne(strain, ext)
                })
                self.postMessage(workerOk(messageId, results))
                return
            }

            case 'IMPORT_DATASET': {
                const p = payload as ImportDatasetPayload
                if (!Array.isArray(p?.rawData) || !p?.provider) {
                    self.postMessage(workerErr(messageId, 'Invalid IMPORT_DATASET payload'))
                    return
                }
                const validated: ValidatedExternalStrainData[] = []
                const errors: Array<{ index: number; message: string }> = []
                for (let i = 0; i < p.rawData.length; i++) {
                    const parseResult = externalStrainDataSchema.safeParse(p.rawData[i])
                    if (parseResult.success) {
                        validated.push(parseResult.data as ValidatedExternalStrainData)
                    } else {
                        errors.push({
                            index: i,
                            message: parseResult.error.issues
                                .map((iss) => `${iss.path.join('.')}: ${iss.message}`)
                                .join('; '),
                        })
                    }
                }
                self.postMessage(
                    workerOk(messageId, {
                        validated: validated.length,
                        rejected: errors.length,
                        errors: errors.slice(0, 50),
                        data: validated,
                    }),
                )
                return
            }

            case 'FIND_DUPLICATES': {
                const p = payload as FindDuplicatesPayload
                if (!Array.isArray(p?.strains)) {
                    self.postMessage(workerErr(messageId, 'Invalid FIND_DUPLICATES payload'))
                    return
                }
                const groups = findDuplicateStrains(p.strains)
                self.postMessage(workerOk(messageId, groups))
                return
            }

            case 'QUALITY_AUDIT': {
                const p = payload as QualityAuditPayload
                if (!Array.isArray(p?.strains)) {
                    self.postMessage(workerErr(messageId, 'Invalid QUALITY_AUDIT payload'))
                    return
                }
                const scores = p.strains.map((strain) => ({
                    strainId: strain.id,
                    strainName: strain.name,
                    quality: assessDataQuality(strain),
                }))
                self.postMessage(workerOk(messageId, scores))
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
