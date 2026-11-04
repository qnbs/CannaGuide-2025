import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { createAppStoreSync } from '@/stores/store'
import { addGrow } from '@/stores/slices/growsSlice'
import { setSetting } from '@/stores/slices/settingsSlice'
import { parseAndMigratePersistedSnapshot } from '@/services/migration/persistedSnapshot'
import { buildPersistedSnapshot } from './persistedSnapshotFormat'

// A synthetic canary, never a real key (#654).
const CANARY = 'sk_canary_0000000000000000000000000000'

/** The check the JSON import applies before it restores a file. */
const passesImportCheck = (json: string): boolean => {
    const parsed: unknown = JSON.parse(json)
    return (
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof (parsed as { version?: unknown }).version === 'number'
    )
}

const storeWithGrow = () => {
    const store = createAppStoreSync()
    store.dispatch(addGrow({ id: 'grow-tent', name: 'Tent', isActive: true }))
    return store
}

describe('JSON export format (persisted snapshot)', () => {
    it('can be imported again and restores the grows', () => {
        const state = storeWithGrow().getState()

        const json = JSON.stringify(buildPersistedSnapshot(state, state.simulation))

        expect(passesImportCheck(json)).toBe(true)
        const restored = parseAndMigratePersistedSnapshot(json)
        expect(restored.grows?.grows.ids).toContain('grow-tent')
    })

    it('fixes the old export, which the import refused (whole Redux state, no version)', () => {
        const state = storeWithGrow().getState()

        expect(passesImportCheck(JSON.stringify(state))).toBe(false)
    })

    it('keeps credentials out of the file', () => {
        const store = storeWithGrow()
        store.dispatch(setSetting({ path: 'tts.cloudTtsApiKey', value: CANARY }))
        const state = store.getState()

        const json = JSON.stringify(buildPersistedSnapshot(state, state.simulation))

        expect(json).not.toContain(CANARY)
    })
})
