import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'

const DOC_NAME = 'cannaguide-crdt-v1'

// ---------------------------------------------------------------------------
// Sync protocol types
// ---------------------------------------------------------------------------

export interface DivergenceInfo {
    localOnlyChanges: number
    remoteOnlyChanges: number
    conflictingKeys: string[]
}

export type CrdtSyncResult =
    | { status: 'merged' }
    | { status: 'conflict'; info: DivergenceInfo }
    | { status: 'no-change' }
    | { status: 'migrated' }
    | { status: 'error'; error: string }

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

    // -- Sync transport -------------------------------------------------------

    /**
     * Encode the full Y.Doc state as a base64 string for Gist storage.
     * This is the complete state, not a diff.
     */
    encodeSyncPayload(): string {
        const update = Y.encodeStateAsUpdate(this.getDoc())
        return uint8ArrayToBase64(update)
    }

    /**
     * Decode a base64 sync payload and apply it to the local Y.Doc.
     * The CRDT merge is always lossless -- both local and remote changes
     * are preserved.
     */
    applySyncPayload(base64: string): void {
        const update = base64ToUint8Array(base64)
        Y.applyUpdate(this.getDoc(), update)
    }

    /**
     * Detect semantic divergence between local state and a remote update.
     *
     * Algorithm:
     * 1. Create a temporary Y.Doc and apply the remote update
     * 2. Compute local-only diff (state in local but not in remote)
     * 3. Compute remote-only diff (state in remote but not in local)
     * 4. After merging both into a comparison doc, iterate shared maps
     *    to find keys where the final merged value differs from local
     */
    detectDivergence(remoteUpdate: Uint8Array): DivergenceInfo {
        const localDoc = this.getDoc()

        // Build a doc representing only the remote state
        const remoteDoc = new Y.Doc()
        Y.applyUpdate(remoteDoc, remoteUpdate)

        const localSv = Y.encodeStateVector(localDoc)
        const remoteSv = Y.encodeStateVector(remoteDoc)

        // Diffs: what each side has that the other does not
        const localOnlyDiff = Y.encodeStateAsUpdate(localDoc, remoteSv)
        const remoteOnlyDiff = Y.encodeStateAsUpdate(remoteDoc, localSv)

        // Use byte length as a proxy for change count (Yjs update header is ~4 bytes)
        const EMPTY_UPDATE_SIZE = 4
        const localOnlyChanges = Math.max(0, localOnlyDiff.byteLength - EMPTY_UPDATE_SIZE)
        const remoteOnlyChanges = Math.max(0, remoteOnlyDiff.byteLength - EMPTY_UPDATE_SIZE)

        // Detect conflicting keys by merging into a temporary doc and comparing
        const conflictingKeys: string[] = []

        if (localOnlyChanges > 0 && remoteOnlyChanges > 0) {
            // Build merged doc from both updates
            const mergedDoc = new Y.Doc()
            Y.applyUpdate(mergedDoc, Y.encodeStateAsUpdate(localDoc))
            Y.applyUpdate(mergedDoc, remoteUpdate)

            // Compare plants and schedule maps for field-level conflicts
            const mapNames = ['plants', 'nutrient-schedule', 'nutrient-readings']
            for (const mapName of mapNames) {
                const localMap = localDoc.getMap(mapName) as Y.Map<Y.Map<unknown>>
                const mergedMap = mergedDoc.getMap(mapName) as Y.Map<Y.Map<unknown>>

                localMap.forEach((_value, key) => {
                    const localEntry = localMap.get(key)
                    const mergedEntry = mergedMap.get(key)
                    if (!localEntry || !mergedEntry) return

                    const localJson = JSON.stringify(localEntry.toJSON())
                    const mergedJson = JSON.stringify(mergedEntry.toJSON())
                    if (localJson !== mergedJson) {
                        conflictingKeys.push(key)
                    }
                })

                // Keys only in remote (added remotely)
                mergedMap.forEach((_value, key) => {
                    if (!localMap.has(key) && !conflictingKeys.includes(key)) {
                        conflictingKeys.push(key)
                    }
                })
            }

            mergedDoc.destroy()
        }

        remoteDoc.destroy()

        return { localOnlyChanges, remoteOnlyChanges, conflictingKeys }
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

// ---------------------------------------------------------------------------
// Base64 <-> Uint8Array helpers (sync transport encoding)
// ---------------------------------------------------------------------------

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i] as number)
    }
    return btoa(binary)
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

export { uint8ArrayToBase64, base64ToUint8Array }
