import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'

const DOC_NAME = 'cannaguide-crdt-v1'

/**
 * Central CRDT service managing the Y.Doc lifecycle and IndexedDB persistence.
 *
 * IMPORTANT: This module must be dynamically imported to keep Yjs out of the
 * initial bundle. The `sync` Vite chunk isolates Yjs + y-indexeddb + lib0.
 *
 * Boot order guarantee:
 *   1. Redux hydrates from IndexedDB (CannaGuideStateDB)
 *   2. crdtService.initialize() attaches to a separate Yjs IndexedDB
 *   3. crdtSyncBridge wires bidirectional Redux <-> Y.Doc sync
 *
 * If initialization fails, the app continues without CRDT -- all public
 * methods guard against uninitialized state.
 */
class CrdtService {
    private doc: Y.Doc | null = null
    private persistence: IndexeddbPersistence | null = null
    private initialized = false

    /**
     * Initialize the Y.Doc and IndexedDB persistence provider.
     * Resolves once the local Yjs IndexedDB has been read into the doc.
     */
    async initialize(): Promise<void> {
        if (this.initialized) return

        try {
            this.doc = new Y.Doc()
            this.persistence = new IndexeddbPersistence(DOC_NAME, this.doc)

            await this.persistence.whenSynced
            this.initialized = true
        } catch (error) {
            // Clean up partial init
            this.doc?.destroy()
            this.doc = null
            this.persistence = null
            throw error
        }
    }

    /** Whether the service has been successfully initialized. */
    isInitialized(): boolean {
        return this.initialized
    }

    /** Get the underlying Y.Doc. Throws if not initialized. */
    getDoc(): Y.Doc {
        if (!this.doc) {
            throw new Error('[CrdtService] Not initialized -- call initialize() first')
        }
        return this.doc
    }

    // -- Typed map accessors --------------------------------------------------

    /** Map<plantId, PlantData> */
    getPlantsMap(): Y.Map<Y.Map<unknown>> {
        return this.getDoc().getMap('plants') as Y.Map<Y.Map<unknown>>
    }

    /** Map<scheduleId, NutrientScheduleEntry> */
    getNutrientScheduleMap(): Y.Map<Y.Map<unknown>> {
        return this.getDoc().getMap('nutrient-schedule') as Y.Map<Y.Map<unknown>>
    }

    /** Map<readingId, EcPhReading> */
    getNutrientReadingsMap(): Y.Map<Y.Map<unknown>> {
        return this.getDoc().getMap('nutrient-readings') as Y.Map<Y.Map<unknown>>
    }

    /** Map<settingKey, value> */
    getSettingsMap(): Y.Map<unknown> {
        return this.getDoc().getMap('settings')
    }

    // -- State vector for sync protocol ---------------------------------------

    /** Encode the current state vector (compact clock summary). */
    getStateVector(): Uint8Array {
        return Y.encodeStateVector(this.getDoc())
    }

    /** Encode state as update, optionally relative to a remote state vector. */
    encodeStateAsUpdate(stateVector?: Uint8Array): Uint8Array {
        return Y.encodeStateAsUpdate(this.getDoc(), stateVector)
    }

    /** Apply a remote update to the local doc. */
    applyUpdate(update: Uint8Array): void {
        Y.applyUpdate(this.getDoc(), update)
    }

    // -- Observation ----------------------------------------------------------

    /**
     * Subscribe to doc-level updates.
     * Returns an unsubscribe function.
     */
    onUpdate(callback: (update: Uint8Array, origin: unknown) => void): () => void {
        const doc = this.getDoc()
        doc.on('update', callback)
        return () => {
            doc.off('update', callback)
        }
    }

    // -- Lifecycle ------------------------------------------------------------

    /** Destroy the Y.Doc and IndexedDB persistence provider. */
    async destroy(): Promise<void> {
        if (this.persistence) {
            await this.persistence.destroy()
            this.persistence = null
        }
        if (this.doc) {
            this.doc.destroy()
            this.doc = null
        }
        this.initialized = false
    }
}

export const crdtService = new CrdtService()
