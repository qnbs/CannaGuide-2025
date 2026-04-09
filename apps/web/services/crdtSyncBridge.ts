import * as Y from 'yjs'
import type { AppStore, RootState } from '@/stores/store'
import type { Plant } from '@/types'
import { crdtService, CrdtError, CrdtErrorCode } from './crdtService'
import {
    plantToYMap,
    yMapToPlant,
    nutrientEntryToYMap,
    yMapToNutrientEntry,
    ecPhReadingToYMap,
    yMapToEcPhReading,
} from './crdtAdapters'
import {
    addPlant,
    updatePlant,
    upsertPlant,
    removePlant,
    addJournalEntry,
} from '@/stores/slices/simulationSlice'
import {
    addReading,
    updateScheduleEntry,
    upsertScheduleEntry,
    removeScheduleEntry,
    upsertReading,
} from '@/stores/slices/nutrientPlannerSlice'
import type { TypedStartListening } from '@reduxjs/toolkit'
import type { AppDispatch } from '@/stores/store'
import { isAnyOf } from '@reduxjs/toolkit'
import * as Sentry from '@sentry/react'

/**
 * Origin tag used when the bridge writes to Y.Doc from Redux changes.
 * The CRDT->Redux observer filters out updates with this origin to
 * prevent infinite feedback loops.
 */
const BRIDGE_ORIGIN = 'redux-bridge'

type AppStartListening = TypedStartListening<RootState, AppDispatch>

// ---------------------------------------------------------------------------
// CRDT Telemetry accumulator (fire-and-forget into WorkerBus W-03)
// ---------------------------------------------------------------------------

interface CrdtTelemetryState {
    divergenceCount: number
    syncPayloadBytes: number
    conflictsResolved: number
    lastSyncMs: number
}

const crdtTelemetry: CrdtTelemetryState = {
    divergenceCount: 0,
    syncPayloadBytes: 0,
    conflictsResolved: 0,
    lastSyncMs: 0,
}

/**
 * Record a sync event in the CRDT telemetry accumulator and
 * push the snapshot to WorkerBus (async import to avoid circular deps).
 */
export function reportCrdtTelemetry(update: Partial<CrdtTelemetryState>): void {
    if (update.divergenceCount !== undefined)
        crdtTelemetry.divergenceCount += update.divergenceCount
    if (update.syncPayloadBytes !== undefined)
        crdtTelemetry.syncPayloadBytes += update.syncPayloadBytes
    if (update.conflictsResolved !== undefined)
        crdtTelemetry.conflictsResolved += update.conflictsResolved
    if (update.lastSyncMs !== undefined) crdtTelemetry.lastSyncMs = update.lastSyncMs

    // Fire-and-forget push to WorkerBus telemetry
    void import('./workerBus').then(({ workerBus }) => {
        workerBus.setCrdtMetrics({ ...crdtTelemetry })
    })
}

/** Read the current CRDT telemetry state (for testing). */
export function _getCrdtTelemetryState(): CrdtTelemetryState {
    return { ...crdtTelemetry }
}

/** Reset CRDT telemetry (for testing). */
export function _resetCrdtTelemetry(): void {
    crdtTelemetry.divergenceCount = 0
    crdtTelemetry.syncPayloadBytes = 0
    crdtTelemetry.conflictsResolved = 0
    crdtTelemetry.lastSyncMs = 0
}

// ---------------------------------------------------------------------------
// Bridge loop detector (safety circuit breaker)
// ---------------------------------------------------------------------------

const LOOP_THRESHOLD = 50
const LOOP_WINDOW_MS = 100
const LOOP_COOLDOWN_MS = 5000

let recentDispatchCount = 0
let bridgeDisabled = false
let loopCooldownTimer: ReturnType<typeof setTimeout> | null = null

function checkLoopDetector(): boolean {
    if (bridgeDisabled) return true
    recentDispatchCount++
    setTimeout(() => {
        recentDispatchCount = Math.max(0, recentDispatchCount - 1)
    }, LOOP_WINDOW_MS)
    if (recentDispatchCount > LOOP_THRESHOLD) {
        bridgeDisabled = true
        const err = new CrdtError(
            'CRDT bridge loop detected -- temporarily disabled',
            CrdtErrorCode.BRIDGE_LOOP_DETECTED,
            crdtService.getDocSizeBytes(),
            recentDispatchCount,
        )
        Sentry.captureException(err, {
            tags: {
                feature: 'crdt-sync',
                'crdt.errorCode': CrdtErrorCode.BRIDGE_LOOP_DETECTED,
            },
            extra: {
                'crdt.docSizeBytes': err.docSizeBytes,
                'crdt.pendingOps': err.pendingOps,
            },
        })
        loopCooldownTimer = setTimeout(() => {
            bridgeDisabled = false
            recentDispatchCount = 0
            loopCooldownTimer = null
        }, LOOP_COOLDOWN_MS)
        return true
    }
    return false
}

/** Test-only: read loop detector internal state. */
export function _getLoopDetectorState(): {
    recentDispatchCount: number
    bridgeDisabled: boolean
} {
    return { recentDispatchCount, bridgeDisabled }
}

/** Test-only: reset loop detector to initial state. */
export function _resetLoopDetector(): void {
    recentDispatchCount = 0
    bridgeDisabled = false
    if (loopCooldownTimer !== null) {
        clearTimeout(loopCooldownTimer)
        loopCooldownTimer = null
    }
}

// ---------------------------------------------------------------------------
// Observer tracking for cleanup
// ---------------------------------------------------------------------------

type ObserverCleanup = () => void
const observerCleanups: ObserverCleanup[] = []

// ---------------------------------------------------------------------------
// Bridge batching: 100ms debounce for Redux -> Y.Doc writes
// ---------------------------------------------------------------------------

const BATCH_DEBOUNCE_MS = 100

/** Queued write operations to be flushed in a single Y.Doc transaction. */
const batchQueue: Array<() => void> = []
let batchTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Queue a Y.Doc write operation. All queued operations are flushed
 * together in a single Y.Doc.transact() after BATCH_DEBOUNCE_MS of
 * quiet time. This reduces Yjs update events from hundreds per second
 * (during AI spikes or multi-grow bulk edits) to one batched update.
 *
 * The fromCrdt check MUST happen before calling this -- only non-CRDT
 * actions should be queued.
 */
function enqueueBridgeWrite(op: () => void): void {
    batchQueue.push(op)

    if (batchTimer !== null) {
        clearTimeout(batchTimer)
    }

    batchTimer = setTimeout(() => {
        flushBridgeBatch()
    }, BATCH_DEBOUNCE_MS)
}

/**
 * Flush all queued bridge writes as a single Y.Doc transaction.
 */
function flushBridgeBatch(): void {
    batchTimer = null
    if (batchQueue.length === 0) return

    const ops = batchQueue.splice(0)

    if (!crdtService.isInitialized()) return

    try {
        const doc = crdtService.getDoc()
        doc.transact(() => {
            for (const op of ops) {
                try {
                    op()
                } catch (error) {
                    console.error('[CrdtBridge] Batched write failed:', error)
                }
            }
        }, BRIDGE_ORIGIN)
    } catch (error) {
        console.error('[CrdtBridge] Batch transaction failed:', error)
    }
}

/** Test-only: force-flush the pending batch immediately. */
export function _flushBridgeBatch(): void {
    if (batchTimer !== null) {
        clearTimeout(batchTimer)
    }
    flushBridgeBatch()
}

/** Test-only: get current batch queue length. */
export function _getBatchQueueLength(): number {
    return batchQueue.length
}

// ---------------------------------------------------------------------------
// Helper: write a plain record into a Y.Map
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helper: write a plain record into a Y.Map
// ---------------------------------------------------------------------------

function writeRecordToYMap(yMap: Y.Map<unknown>, record: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(record)) {
        yMap.set(key, value)
    }
}

// ---------------------------------------------------------------------------
// Redux -> CRDT listeners
// ---------------------------------------------------------------------------

/**
 * Register Redux action listeners that propagate state changes to the Y.Doc.
 * Actions originated from CRDT (meta.fromCrdt === true) are skipped.
 */
export function registerCrdtListeners(startAppListening: AppStartListening): void {
    if (!crdtService.isInitialized()) return

    // -- Plant actions --------------------------------------------------------

    startAppListening({
        actionCreator: addPlant,
        effect: (action) => {
            try {
                const plant = action.payload.plant
                enqueueBridgeWrite(() => {
                    const plantsMap = crdtService.getPlantsMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, plantToYMap(plant))
                    plantsMap.set(plant.id, yMap as Y.Map<unknown>)
                })
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync addPlant to CRDT:', error)
            }
        },
    })

    startAppListening({
        actionCreator: updatePlant,
        effect: (action) => {
            try {
                const { id, changes } = action.payload
                enqueueBridgeWrite(() => {
                    const plantsMap = crdtService.getPlantsMap()
                    const existing = plantsMap.get(id)
                    if (!existing) return
                    // Merge only changed fields
                    for (const [key, value] of Object.entries(changes)) {
                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                            existing.set(key, JSON.stringify(value))
                        } else if (Array.isArray(value)) {
                            existing.set(key, JSON.stringify(value))
                        } else {
                            existing.set(key, value)
                        }
                    }
                })
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync updatePlant to CRDT:', error)
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(upsertPlant),
        effect: (action) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            if ((action as { meta?: { fromCrdt?: boolean } }).meta?.fromCrdt) return
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                const plant = action.payload as Plant
                enqueueBridgeWrite(() => {
                    const plantsMap = crdtService.getPlantsMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, plantToYMap(plant))
                    plantsMap.set(plant.id, yMap as Y.Map<unknown>)
                })
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync upsertPlant to CRDT:', error)
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(removePlant),
        effect: (action) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            if ((action as { meta?: { fromCrdt?: boolean } }).meta?.fromCrdt) return
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                const plantId = action.payload as string
                enqueueBridgeWrite(() => {
                    crdtService.getPlantsMap().delete(plantId)
                })
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync removePlant to CRDT:', error)
            }
        },
    })

    startAppListening({
        actionCreator: addJournalEntry,
        effect: (action, listenerApi) => {
            try {
                const { plantId } = action.payload
                const state = listenerApi.getState() as RootState
                const plant = state.simulation.plants.entities[plantId]
                if (!plant) return
                enqueueBridgeWrite(() => {
                    const plantsMap = crdtService.getPlantsMap()
                    const existing = plantsMap.get(plantId)
                    if (existing) {
                        existing.set('journal', JSON.stringify(plant.journal))
                    }
                })
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync addJournalEntry to CRDT:', error)
            }
        },
    })

    // -- Nutrient schedule actions --------------------------------------------

    startAppListening({
        actionCreator: updateScheduleEntry,
        effect: (action, listenerApi) => {
            try {
                const { id } = action.payload
                const state = listenerApi.getState() as RootState
                const entry = state.nutrientPlanner.schedule.find((e) => e.id === id)
                if (!entry) return
                enqueueBridgeWrite(() => {
                    const scheduleMap = crdtService.getNutrientScheduleMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, nutrientEntryToYMap(entry))
                    scheduleMap.set(id, yMap as Y.Map<unknown>)
                })
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync updateScheduleEntry to CRDT:', error)
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(upsertScheduleEntry),
        effect: (action) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            if ((action as { meta?: { fromCrdt?: boolean } }).meta?.fromCrdt) return
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                const entry = action.payload as { id: string }
                enqueueBridgeWrite(() => {
                    const scheduleMap = crdtService.getNutrientScheduleMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(
                        yMap,
                        nutrientEntryToYMap(
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            action.payload as Parameters<typeof nutrientEntryToYMap>[0],
                        ),
                    )
                    scheduleMap.set(entry.id, yMap as Y.Map<unknown>)
                })
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync upsertScheduleEntry to CRDT:', error)
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(removeScheduleEntry),
        effect: (matchedAction) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            if ((matchedAction as { meta?: { fromCrdt?: boolean } }).meta?.fromCrdt) return
            try {
                enqueueBridgeWrite(() => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    crdtService.getNutrientScheduleMap().delete(matchedAction.payload as string)
                })
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync removeScheduleEntry to CRDT:', error)
            }
        },
    })

    // -- Nutrient reading actions ---------------------------------------------

    startAppListening({
        actionCreator: addReading,
        effect: (_action, listenerApi) => {
            try {
                // addReading generates id+timestamp in the reducer, so we read
                // the latest reading from state after the reducer ran.
                const state = listenerApi.getState() as RootState
                const readings = state.nutrientPlanner.readings
                const latest = readings[readings.length - 1]
                if (!latest) return
                enqueueBridgeWrite(() => {
                    const readingsMap = crdtService.getNutrientReadingsMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, ecPhReadingToYMap(latest))
                    readingsMap.set(latest.id, yMap as Y.Map<unknown>)
                })
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync addReading to CRDT:', error)
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(upsertReading),
        effect: (action) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            if ((action as { meta?: { fromCrdt?: boolean } }).meta?.fromCrdt) return
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                const reading = action.payload as Parameters<typeof ecPhReadingToYMap>[0]
                enqueueBridgeWrite(() => {
                    const readingsMap = crdtService.getNutrientReadingsMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, ecPhReadingToYMap(reading))
                    readingsMap.set(reading.id, yMap as Y.Map<unknown>)
                })
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync upsertReading to CRDT:', error)
            }
        },
    })
}

// ---------------------------------------------------------------------------
// CRDT -> Redux observers
// ---------------------------------------------------------------------------

/**
 * Initialize the bidirectional CRDT <-> Redux sync bridge.
 * Call this AFTER crdtService.initialize() and after the Redux store is hydrated.
 *
 * On first boot (Y.Doc empty), seeds the Y.Doc from current Redux state.
 * On subsequent boots, CRDT state is already persisted in its own IndexedDB.
 */
export function initCrdtSyncBridge(store: AppStore): void {
    if (!crdtService.isInitialized()) return

    const dispatch = store.dispatch

    // -- Seed Y.Doc from Redux on first boot (Y.Doc empty) -------------------

    try {
        const plantsMap = crdtService.getPlantsMap()
        const state = store.getState() as RootState
        const doc = crdtService.getDoc()

        if (plantsMap.size === 0) {
            const plantEntities = state.simulation.plants.entities
            const plantIds = state.simulation.plants.ids as string[]

            doc.transact(() => {
                for (const id of plantIds) {
                    const plant = plantEntities[id]
                    if (plant) {
                        const yMap = new Y.Map<unknown>()
                        writeRecordToYMap(yMap, plantToYMap(plant))
                        plantsMap.set(id, yMap as Y.Map<unknown>)
                    }
                }
            }, BRIDGE_ORIGIN)
        }

        // Seed nutrient schedule
        const scheduleMap = crdtService.getNutrientScheduleMap()
        if (scheduleMap.size === 0) {
            doc.transact(() => {
                for (const entry of state.nutrientPlanner.schedule) {
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, nutrientEntryToYMap(entry))
                    scheduleMap.set(entry.id, yMap as Y.Map<unknown>)
                }
            }, BRIDGE_ORIGIN)
        }

        // Seed nutrient readings
        const readingsMap = crdtService.getNutrientReadingsMap()
        if (readingsMap.size === 0) {
            doc.transact(() => {
                for (const reading of state.nutrientPlanner.readings) {
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, ecPhReadingToYMap(reading))
                    readingsMap.set(reading.id, yMap as Y.Map<unknown>)
                }
            }, BRIDGE_ORIGIN)
        }
    } catch (error) {
        console.error('[CrdtBridge] Failed to seed Y.Doc from Redux:', error)
    }

    // -- Plants observer ------------------------------------------------------

    try {
        const plantsMap = crdtService.getPlantsMap()
        const plantsObserver = (event: Y.YMapEvent<Y.Map<unknown>>): void => {
            if (event.transaction.origin === BRIDGE_ORIGIN) return

            event.changes.keys.forEach((change, key) => {
                if (checkLoopDetector()) return
                try {
                    if (change.action === 'add' || change.action === 'update') {
                        const yMap = plantsMap.get(key)
                        if (!yMap) return
                        const plant = yMapToPlant(yMap.toJSON() as Record<string, unknown>)
                        if (plant) {
                            dispatch(upsertPlant(plant, { fromCrdt: true }))
                        }
                    } else if (change.action === 'delete') {
                        dispatch(removePlant(key, { fromCrdt: true }))
                    }
                } catch (error) {
                    console.error(`[CrdtBridge] Failed to sync plant ${key} to Redux:`, error)
                }
            })
        }
        plantsMap.observe(plantsObserver)
        observerCleanups.push(() => plantsMap.unobserve(plantsObserver))
    } catch (error) {
        console.error('[CrdtBridge] Failed to attach plants observer:', error)
    }

    // -- Nutrient schedule observer -------------------------------------------

    try {
        const scheduleMap = crdtService.getNutrientScheduleMap()
        const scheduleObserver = (event: Y.YMapEvent<Y.Map<unknown>>): void => {
            if (event.transaction.origin === BRIDGE_ORIGIN) return

            event.changes.keys.forEach((change, key) => {
                if (checkLoopDetector()) return
                try {
                    if (change.action === 'add' || change.action === 'update') {
                        const yMap = scheduleMap.get(key)
                        if (!yMap) return
                        const entry = yMapToNutrientEntry(yMap.toJSON() as Record<string, unknown>)
                        if (entry) {
                            dispatch(upsertScheduleEntry(entry, { fromCrdt: true }))
                        }
                    } else if (change.action === 'delete') {
                        dispatch(removeScheduleEntry(key, { fromCrdt: true }))
                    }
                } catch (error) {
                    console.error(
                        `[CrdtBridge] Failed to sync schedule entry ${key} to Redux:`,
                        error,
                    )
                }
            })
        }
        scheduleMap.observe(scheduleObserver)
        observerCleanups.push(() => scheduleMap.unobserve(scheduleObserver))
    } catch (error) {
        console.error('[CrdtBridge] Failed to attach nutrient schedule observer:', error)
    }

    // -- Nutrient readings observer -------------------------------------------

    try {
        const readingsMap = crdtService.getNutrientReadingsMap()
        const readingsObserver = (event: Y.YMapEvent<Y.Map<unknown>>): void => {
            if (event.transaction.origin === BRIDGE_ORIGIN) return

            event.changes.keys.forEach((change, key) => {
                if (checkLoopDetector()) return
                try {
                    if (change.action === 'add' || change.action === 'update') {
                        const yMap = readingsMap.get(key)
                        if (!yMap) return
                        const reading = yMapToEcPhReading(yMap.toJSON() as Record<string, unknown>)
                        if (reading) {
                            dispatch(upsertReading(reading, { fromCrdt: true }))
                        }
                    }
                    // Note: reading deletion not synced (removeReading is rare,
                    // and readings are append-only with FIFO capping)
                } catch (error) {
                    console.error(`[CrdtBridge] Failed to sync reading ${key} to Redux:`, error)
                }
            })
        }
        readingsMap.observe(readingsObserver)
        observerCleanups.push(() => readingsMap.unobserve(readingsObserver))
    } catch (error) {
        console.error('[CrdtBridge] Failed to attach nutrient readings observer:', error)
    }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/**
 * Destroy the CRDT<->Redux sync bridge by unobserving all Y.Map observers
 * and resetting the loop detector. Call on pagehide or before hot-reload.
 */
export function destroyCrdtSyncBridge(): void {
    for (const cleanup of observerCleanups) {
        try {
            cleanup()
        } catch {
            // observer may already be gone
        }
    }
    observerCleanups.length = 0
    _resetLoopDetector()
}
