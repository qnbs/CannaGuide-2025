import type { JournalEntry } from '@/types'
import type { StorageEstimateSnapshot } from './types'
import {
    CRITICAL_JOURNAL_KEEP_PER_PLANT,
    DEFAULT_JOURNAL_KEEP_PER_PLANT,
    STORAGE_USAGE_CRITICAL_RATIO,
    STORAGE_USAGE_WARNING_RATIO,
    WARNING_JOURNAL_KEEP_PER_PLANT,
} from './types'

export const getStorageEstimateSnapshot = async (): Promise<StorageEstimateSnapshot> => {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
        return {
            usage: 0,
            quota: Number.MAX_SAFE_INTEGER,
            usageRatio: 0,
        }
    }

    try {
        const estimate = await navigator.storage.estimate()
        const usage = estimate.usage ?? 0
        const quota = estimate.quota ?? Number.MAX_SAFE_INTEGER
        const usageRatio = quota > 0 ? usage / quota : 0
        return { usage, quota, usageRatio }
    } catch (error) {
        console.debug(
            '[dbService] navigator.storage.estimate() failed, using fallback values.',
            error,
        )
        return {
            usage: 0,
            quota: Number.MAX_SAFE_INTEGER,
            usageRatio: 0,
        }
    }
}

export const compactArchivedEntry = (entry: JournalEntry): JournalEntry => {
    if (!entry.details) {
        return entry
    }

    const details = { ...entry.details } as Record<string, unknown>
    delete details.imageUrl

    return {
        ...entry,
        notes: typeof entry.notes === 'string' ? entry.notes.slice(0, 300) : entry.notes,
        details: details as JournalEntry['details'],
    }
}

export const chooseJournalRetentionLimit = (usageRatio: number): number => {
    if (usageRatio >= STORAGE_USAGE_CRITICAL_RATIO) {
        return CRITICAL_JOURNAL_KEEP_PER_PLANT
    }
    if (usageRatio >= STORAGE_USAGE_WARNING_RATIO) {
        return WARNING_JOURNAL_KEEP_PER_PLANT
    }
    return DEFAULT_JOURNAL_KEEP_PER_PLANT
}

export const isQuotaExceededError = (error: unknown): boolean => {
    if (!(error instanceof DOMException)) {
        return false
    }
    return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
}
