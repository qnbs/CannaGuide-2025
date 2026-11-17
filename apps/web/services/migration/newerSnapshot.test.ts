import { describe, expect, it } from 'vitest'
import { APP_VERSION, SLICE_SCHEMA_VERSIONS } from '@/constants'
import { assertNotNewerSnapshot, NewerSnapshotError } from './newerSnapshot'
import { migratePersistedSnapshot, parseAndMigratePersistedSnapshot } from './persistedSnapshot'

const caught = (run: () => void): unknown => {
    try {
        run()
    } catch (error) {
        return error
    }
    return undefined
}

/** A snapshot as a later build might write it: newer version, a field this build lacks. */
const newerSnapshot = (): string =>
    JSON.stringify({
        version: APP_VERSION + 1,
        settings: { version: APP_VERSION + 1, settings: { futureOption: true } },
        futureSlice: { kept: true },
    })

describe('snapshots written by a newer build (#666)', () => {
    it('reports a newer app version', () => {
        const error = caught(() => assertNotNewerSnapshot({ version: APP_VERSION + 1 }))
        expect(error).toBeInstanceOf(NewerSnapshotError)
        expect((error as NewerSnapshotError).storedVersion).toBe(APP_VERSION + 1)
        expect((error as NewerSnapshotError).newerSlices).toEqual([])
    })

    it('reports a newer slice schema under the current app version', () => {
        const error = caught(() =>
            assertNotNewerSnapshot({
                version: APP_VERSION,
                _sliceVersions: {
                    simulation: SLICE_SCHEMA_VERSIONS.simulation + 1,
                    grows: SLICE_SCHEMA_VERSIONS.grows,
                },
            }),
        )
        expect(error).toBeInstanceOf(NewerSnapshotError)
        expect((error as NewerSnapshotError).storedVersion).toBeNull()
        expect((error as NewerSnapshotError).newerSlices).toEqual(['simulation'])
    })

    it('accepts current and older versions and ignores values that are not version numbers', () => {
        const accepted: unknown[] = [
            {},
            { version: APP_VERSION },
            { version: 1 },
            { version: '99' },
            { version: Number.NaN },
            { version: Number.POSITIVE_INFINITY },
            { _sliceVersions: { simulation: SLICE_SCHEMA_VERSIONS.simulation - 1 } },
            { _sliceVersions: { simulation: '99' } },
            { _sliceVersions: { sliceThisBuildDoesNotKnow: 99 } },
            { _sliceVersions: null },
            null,
            [],
            'snapshot',
        ]
        for (const state of accepted) {
            expect(
                caught(() => assertNotNewerSnapshot(state)),
                JSON.stringify(state),
            ).toBeUndefined()
        }
    })

    it('is refused by the migration, so neither hydration nor an import downgrades it', () => {
        expect(caught(() => parseAndMigratePersistedSnapshot(newerSnapshot()))).toBeInstanceOf(
            NewerSnapshotError,
        )
        expect(caught(() => migratePersistedSnapshot(newerSnapshot()))).toBeInstanceOf(
            NewerSnapshotError,
        )
    })

    it('still migrates a snapshot of the current version', () => {
        const migrated = parseAndMigratePersistedSnapshot(
            JSON.stringify({ version: APP_VERSION, _sliceVersions: { ...SLICE_SCHEMA_VERSIONS } }),
        )
        expect(migrated.version).toBe(APP_VERSION)
    })
})
