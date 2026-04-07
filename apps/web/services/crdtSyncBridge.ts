import * as Y from 'yjs'
import type { AppStore, RootState } from '@/stores/store'
import type { Plant } from '@/types'
import { crdtService } from './crdtService'
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

/**
 * Origin tag used when the bridge writes to Y.Doc from Redux changes.
 * The CRDT->Redux observer filters out updates with this origin to
 * prevent infinite feedback loops.
 */
const BRIDGE_ORIGIN = 'redux-bridge'

type AppStartListening = TypedStartListening<RootState, AppDispatch>

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

    const doc = crdtService.getDoc()

    // -- Plant actions --------------------------------------------------------

    startAppListening({
        actionCreator: addPlant,
        effect: (action) => {
            try {
                const plant = action.payload.plant
                doc.transact(() => {
                    const plantsMap = crdtService.getPlantsMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, plantToYMap(plant))
                    plantsMap.set(plant.id, yMap as Y.Map<unknown>)
                }, BRIDGE_ORIGIN)
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
                doc.transact(() => {
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
                }, BRIDGE_ORIGIN)
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync updatePlant to CRDT:', error)
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(upsertPlant),
        effect: (action) => {
            if ((action as { meta?: { fromCrdt?: boolean } }).meta?.fromCrdt) return
            try {
                const plant = action.payload as Plant
                doc.transact(() => {
                    const plantsMap = crdtService.getPlantsMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, plantToYMap(plant))
                    plantsMap.set(plant.id, yMap as Y.Map<unknown>)
                }, BRIDGE_ORIGIN)
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync upsertPlant to CRDT:', error)
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(removePlant),
        effect: (action) => {
            if ((action as { meta?: { fromCrdt?: boolean } }).meta?.fromCrdt) return
            try {
                const plantId = action.payload as string
                doc.transact(() => {
                    crdtService.getPlantsMap().delete(plantId)
                }, BRIDGE_ORIGIN)
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
                doc.transact(() => {
                    const plantsMap = crdtService.getPlantsMap()
                    const existing = plantsMap.get(plantId)
                    if (existing) {
                        existing.set('journal', JSON.stringify(plant.journal))
                    }
                }, BRIDGE_ORIGIN)
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
                doc.transact(() => {
                    const scheduleMap = crdtService.getNutrientScheduleMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, nutrientEntryToYMap(entry))
                    scheduleMap.set(id, yMap as Y.Map<unknown>)
                }, BRIDGE_ORIGIN)
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync updateScheduleEntry to CRDT:', error)
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(upsertScheduleEntry),
        effect: (action) => {
            if ((action as { meta?: { fromCrdt?: boolean } }).meta?.fromCrdt) return
            try {
                const entry = action.payload as { id: string }
                doc.transact(() => {
                    const scheduleMap = crdtService.getNutrientScheduleMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(
                        yMap,
                        nutrientEntryToYMap(
                            action.payload as Parameters<typeof nutrientEntryToYMap>[0],
                        ),
                    )
                    scheduleMap.set(entry.id, yMap as Y.Map<unknown>)
                }, BRIDGE_ORIGIN)
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync upsertScheduleEntry to CRDT:', error)
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(removeScheduleEntry),
        effect: (matchedAction) => {
            if ((matchedAction as { meta?: { fromCrdt?: boolean } }).meta?.fromCrdt) return
            try {
                doc.transact(() => {
                    crdtService.getNutrientScheduleMap().delete(matchedAction.payload as string)
                }, BRIDGE_ORIGIN)
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
                doc.transact(() => {
                    const readingsMap = crdtService.getNutrientReadingsMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, ecPhReadingToYMap(latest))
                    readingsMap.set(latest.id, yMap as Y.Map<unknown>)
                }, BRIDGE_ORIGIN)
            } catch (error) {
                console.error('[CrdtBridge] Failed to sync addReading to CRDT:', error)
            }
        },
    })

    startAppListening({
        matcher: isAnyOf(upsertReading),
        effect: (action) => {
            if ((action as { meta?: { fromCrdt?: boolean } }).meta?.fromCrdt) return
            try {
                const reading = action.payload as Parameters<typeof ecPhReadingToYMap>[0]
                doc.transact(() => {
                    const readingsMap = crdtService.getNutrientReadingsMap()
                    const yMap = new Y.Map<unknown>()
                    writeRecordToYMap(yMap, ecPhReadingToYMap(reading))
                    readingsMap.set(reading.id, yMap as Y.Map<unknown>)
                }, BRIDGE_ORIGIN)
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
        crdtService.getPlantsMap().observe((event) => {
            if (event.transaction.origin === BRIDGE_ORIGIN) return

            event.changes.keys.forEach((change, key) => {
                try {
                    if (change.action === 'add' || change.action === 'update') {
                        const yMap = crdtService.getPlantsMap().get(key)
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
        })
    } catch (error) {
        console.error('[CrdtBridge] Failed to attach plants observer:', error)
    }

    // -- Nutrient schedule observer -------------------------------------------

    try {
        crdtService.getNutrientScheduleMap().observe((event) => {
            if (event.transaction.origin === BRIDGE_ORIGIN) return

            event.changes.keys.forEach((change, key) => {
                try {
                    if (change.action === 'add' || change.action === 'update') {
                        const yMap = crdtService.getNutrientScheduleMap().get(key)
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
        })
    } catch (error) {
        console.error('[CrdtBridge] Failed to attach nutrient schedule observer:', error)
    }

    // -- Nutrient readings observer -------------------------------------------

    try {
        crdtService.getNutrientReadingsMap().observe((event) => {
            if (event.transaction.origin === BRIDGE_ORIGIN) return

            event.changes.keys.forEach((change, key) => {
                try {
                    if (change.action === 'add' || change.action === 'update') {
                        const yMap = crdtService.getNutrientReadingsMap().get(key)
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
        })
    } catch (error) {
        console.error('[CrdtBridge] Failed to attach nutrient readings observer:', error)
    }
}
