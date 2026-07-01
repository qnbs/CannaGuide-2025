/**
 * @file dbService.ts
 * @description IndexedDB persistence facade for CannaGuide 2025.
 * Implementation split across `services/db/*` modules; this file preserves the public API.
 */

export type { CalculatorHistoryEntry } from './db/types'

import { getStorageEstimateSnapshot } from './db/storageHelpers'
import { metadataStore } from './db/metadataStore'
import { strainStore } from './db/strainStore'
import { imageStore } from './db/imageStore'
import { searchIndexStore } from './db/searchIndexStore'
import { offlineActionsStore } from './db/offlineActionsStore'
import { simulationPersistence } from './db/simulationPersistence'
import { calculatorHistoryStore } from './db/calculatorHistoryStore'

export const dbService = {
    getStorageEstimate: getStorageEstimateSnapshot,
    ...metadataStore,
    ...strainStore,
    ...imageStore,
    ...searchIndexStore,
    ...offlineActionsStore,
    ...simulationPersistence,
    ...calculatorHistoryStore,
}
