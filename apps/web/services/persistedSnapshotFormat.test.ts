import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createAppStoreSync } from '@/stores/store'
import { addGrow } from '@/stores/slices/growsSlice'
import { setSetting } from '@/stores/slices/settingsSlice'
import { parseAndMigratePersistedSnapshot } from '@/services/migration/persistedSnapshot'
import {
    buildPersistedSnapshot,
    isImportableSnapshot,
    redactForExport,
} from './persistedSnapshotFormat'

// A synthetic canary, never a real key (#654).
const CANARY = 'sk_canary_0000000000000000000000000000'

const passesImportCheck = (json: string): boolean => isImportableSnapshot(JSON.parse(json))

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

    it('leaves the app PIN and the sync encryption key out of an exported file', () => {
        const store = storeWithGrow()
        store.dispatch(setSetting({ path: 'privacy.pin', value: '4711' }))
        store.dispatch(
            setSetting({
                path: 'data.cloudSync.encryptionKeyBase64',
                value: 'canary_sync_key_0000000000',
            }),
        )
        const state = store.getState()

        const json = JSON.stringify(
            redactForExport(buildPersistedSnapshot(state, state.simulation)),
        )

        expect(json).not.toContain('4711')
        expect(json).not.toContain('canary_sync_key_0000000000')
        expect(passesImportCheck(json)).toBe(true)
    })
})

describe('persisted snapshot inputs (CodeAnt on #878)', () => {
    it('follow the state a save writes and ignore the rest', async () => {
        const { persistedSnapshotInputs, sameSnapshotInputs } =
            await import('./persistedSnapshotFormat')
        const store = createAppStoreSync()
        const before = persistedSnapshotInputs(store.getState())
        expect(sameSnapshotInputs(before, persistedSnapshotInputs(store.getState()))).toBe(true)
        // State the snapshot leaves out does not make a save "unsettled".
        const withRuntimeOnly = { ...store.getState(), runtimeOnly: { tick: 1 } }
        expect(
            sameSnapshotInputs(
                before,
                persistedSnapshotInputs(withRuntimeOnly as typeof withRuntimeOnly),
            ),
        ).toBe(true)
        store.dispatch(setSetting({ path: 'privacy.clearAiHistoryOnExit', value: true }))
        expect(sameSnapshotInputs(before, persistedSnapshotInputs(store.getState()))).toBe(false)
    })

    it('cover every state path buildPersistedSnapshot reads', () => {
        const source = readFileSync(
            resolve(process.cwd(), 'services/persistedSnapshotFormat.ts'),
            'utf8',
        )
        const body = (name: string) => {
            const start = source.indexOf(`export const ${name} = `)
            expect(start).toBeGreaterThan(-1)
            const next = source.indexOf('\nexport const ', start + 1)
            return source.slice(start, next === -1 ? undefined : next)
        }
        const paths = (text: string, pattern: RegExp) =>
            [...text.matchAll(pattern)].map((match) => match[1] as string)
        const builder = body('buildPersistedSnapshot')
        const inputs = body('persistedSnapshotInputs')
        const inputPaths = paths(inputs, /state\.([\w.]+)/g)
        for (const path of paths(builder, /state\.([\w.]+)/g)) {
            const covered = inputPaths.some(
                (input) => path === input || path.startsWith(`${input}.`),
            )
            expect(covered, `state.${path} is written but not compared`).toBe(true)
        }
        const uiInputs = paths(inputs, /ui\.(\w+)/g)
        for (const field of paths(builder, /getUISnapshot\(\)\.(\w+)/g)) {
            expect(uiInputs, `ui.${field} is written but not compared`).toContain(field)
        }
    })
})
