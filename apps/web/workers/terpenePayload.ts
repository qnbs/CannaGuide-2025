/**
 * Structural checks for terpene-worker messages.
 *
 * The worker used to cast `payload: unknown` and then read nested fields.
 * A batch entry of `null`, or a profile value that is not a finite number,
 * threw inside the handler and left the caller without a normal error
 * response. These readers reject that shape before any handler runs.
 * Missing chemistry stays omitted: a cultivar with no reported THC is still
 * a valid chemovar request.
 */

import type { CannabinoidProfile, EffectTag, Strain, TerpeneProfile } from '@/types'
import { ALL_TERPENE_NAMES, CANNABINOID_DATABASE } from '@/data/terpeneDatabase'

const TERPENE_NAMES: ReadonlySet<string> = new Set(ALL_TERPENE_NAMES)
const CANNABINOID_NAMES: ReadonlySet<string> = new Set(Object.keys(CANNABINOID_DATABASE))

export interface NamedTerpeneStrain {
    id: string
    name: string
    terpeneProfile: TerpeneProfile
}

export interface FindSimilarPayload {
    referenceProfile: TerpeneProfile
    strains: NamedTerpeneStrain[]
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
    strains: NamedTerpeneStrain[]
    desiredEffects: EffectTag[]
    limit?: number
}

export interface AnalyzeEntouragePayload {
    terpeneProfile: TerpeneProfile
    cannabinoidProfile: CannabinoidProfile
}

const EFFECT_TAGS: ReadonlySet<string> = new Set([
    'Relaxing',
    'Sedating',
    'Uplifting',
    'Energizing',
    'Focusing',
    'Creative',
    'Euphoric',
    'Pain Relief',
    'Anti-Anxiety',
    'Anti-Inflammatory',
    'Appetite Stimulating',
    'Appetite Suppressing',
    'Neuroprotective',
    'Antiemetic',
    'Antispasmodic',
])

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

const optionalFinite = (record: Record<string, unknown>, key: string): boolean => {
    const value = record[key]
    return value === undefined || isFiniteNumber(value)
}

/** A reported percent: finite, and inside 0 through 100. */
const isPercentAmount = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100

/** Known compound names only, each with a percent in range. */
const isAllowlistedProfile = (value: unknown, names: ReadonlySet<string>): boolean =>
    isRecord(value) &&
    Object.entries(value).every(([key, amount]) => names.has(key) && isPercentAmount(amount))

/** A terpene map: known names, each value from 0 through 100. */
export const isPercentProfile = (value: unknown): value is TerpeneProfile =>
    isAllowlistedProfile(value, TERPENE_NAMES)

const isCannabinoidProfile = (value: unknown): value is CannabinoidProfile =>
    isAllowlistedProfile(value, CANNABINOID_NAMES)

const isStringList = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string')

const isEffectTag = (value: unknown): value is EffectTag =>
    typeof value === 'string' && EFFECT_TAGS.has(value)

/**
 * Keep rows that have a valid profile. A row with no profile is unknown and
 * is skipped. A null row, a bad id, or a profile that fails the allowlist
 * rejects the whole request.
 */
const readNamedStrains = (values: unknown[]): NamedTerpeneStrain[] | undefined => {
    const accepted: NamedTerpeneStrain[] = []
    for (const value of values) {
        if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
            return undefined
        }
        if (value.terpeneProfile === undefined) continue
        if (!isPercentProfile(value.terpeneProfile)) return undefined
        accepted.push({
            id: value.id,
            name: value.name,
            terpeneProfile: value.terpeneProfile,
        })
    }
    return accepted
}

/**
 * Identity plus the nested fields the chemovar builder reads.
 * Optional chemistry may be absent. A present field must be the right shape,
 * so `[null]` and `{ terpeneProfile: { Myrcene: 'high' } }` are rejected.
 */
const isWorkerStrain = (value: unknown): value is Strain => {
    if (!isRecord(value)) return false
    if (typeof value.id !== 'string' || typeof value.name !== 'string') return false
    if (value.type !== undefined && typeof value.type !== 'string') return false
    if (value.terpeneProfile !== undefined && !isPercentProfile(value.terpeneProfile)) return false
    if (value.cannabinoidProfile !== undefined && !isCannabinoidProfile(value.cannabinoidProfile)) {
        return false
    }
    if (value.dominantTerpenes !== undefined && !isStringList(value.dominantTerpenes)) return false
    return ['thc', 'cbd', 'cbg', 'thcv'].every((key) => optionalFinite(value, key))
}

const collect = <T>(values: unknown[], accept: (value: unknown) => value is T): T[] | undefined => {
    const accepted: T[] = []
    for (const value of values) {
        if (!accept(value)) return undefined
        accepted.push(value)
    }
    return accepted
}

const finiteAt = (record: Record<string, unknown>, key: string): number | undefined =>
    isFiniteNumber(record[key]) ? record[key] : undefined

export const readFindSimilar = (payload: unknown): FindSimilarPayload | undefined => {
    if (!isRecord(payload) || !isPercentProfile(payload.referenceProfile)) return undefined
    if (!Array.isArray(payload.strains)) return undefined
    const strains = readNamedStrains(payload.strains)
    if (strains === undefined) return undefined
    if (!optionalFinite(payload, 'limit') || !optionalFinite(payload, 'minSimilarity')) {
        return undefined
    }
    const limit = finiteAt(payload, 'limit')
    const minSimilarity = finiteAt(payload, 'minSimilarity')
    return {
        referenceProfile: payload.referenceProfile,
        strains,
        ...(limit === undefined ? {} : { limit }),
        ...(minSimilarity === undefined ? {} : { minSimilarity }),
    }
}

export const readBuildChemovar = (payload: unknown): BuildChemovarPayload | undefined => {
    if (!isRecord(payload) || !isWorkerStrain(payload.strain)) return undefined
    return { strain: payload.strain }
}

export const readBatchChemovar = (payload: unknown): BatchChemovarPayload | undefined => {
    if (!isRecord(payload) || !Array.isArray(payload.strains)) return undefined
    const strains = collect(payload.strains, isWorkerStrain)
    if (strains === undefined) return undefined
    return { strains }
}

export const readPredictBreeding = (payload: unknown): PredictBreedingPayload | undefined => {
    if (!isRecord(payload)) return undefined
    if (!isPercentProfile(payload.parentA) || !isPercentProfile(payload.parentB)) return undefined
    if (!optionalFinite(payload, 'nameHash')) return undefined
    const nameHash = finiteAt(payload, 'nameHash')
    return {
        parentA: payload.parentA,
        parentB: payload.parentB,
        ...(nameHash === undefined ? {} : { nameHash }),
    }
}

export const readScoreEffects = (payload: unknown): ScoreEffectsPayload | undefined => {
    if (!isRecord(payload)) return undefined
    if (!Array.isArray(payload.strains) || !Array.isArray(payload.desiredEffects)) return undefined
    const strains = readNamedStrains(payload.strains)
    const desiredEffects = collect(payload.desiredEffects, isEffectTag)
    if (strains === undefined || desiredEffects === undefined) return undefined
    if (!optionalFinite(payload, 'limit')) return undefined
    const limit = finiteAt(payload, 'limit')
    return { strains, desiredEffects, ...(limit === undefined ? {} : { limit }) }
}

export const readAnalyzeEntourage = (payload: unknown): AnalyzeEntouragePayload | undefined => {
    if (!isRecord(payload)) return undefined
    if (!isPercentProfile(payload.terpeneProfile)) return undefined
    if (!isCannabinoidProfile(payload.cannabinoidProfile)) return undefined
    return {
        terpeneProfile: payload.terpeneProfile,
        cannabinoidProfile: payload.cannabinoidProfile,
    }
}
