import { APP_VERSION, SLICE_SCHEMA_VERSIONS } from '@/constants'

/**
 * A snapshot written by a newer CannaGuide build (#666). This build does not know the
 * newer format, so migrating it would relabel it with the older version, run the older
 * shape guards over it and save the result over the original: the newer fields would be
 * gone, and the newer build would later migrate the relabelled data a second time. Such
 * a snapshot is neither migrated nor replaced; the page stops saving and asks for a
 * reload, which normally brings the newer build.
 */
export class NewerSnapshotError extends Error {
    override readonly name = 'NewerSnapshotError'

    constructor(
        /** The snapshot's app version, when it is newer than this build's. */
        readonly storedVersion: number | null,
        /** Slices whose schema version is newer than this build's. */
        readonly newerSlices: readonly string[],
    ) {
        const details = [
            storedVersion === null ? null : `state version ${String(storedVersion)}`,
            newerSlices.length > 0 ? `newer slices: ${newerSlices.join(', ')}` : null,
        ].filter((detail) => detail !== null)
        super(
            `The saved data was written by a newer CannaGuide version (${details.join('; ')}; this build is version ${String(APP_VERSION)}). It is left unchanged.`,
        )
    }
}

/** Also matches an error from another copy of this module (code splitting, test resets). */
export const isNewerSnapshotError = (error: unknown): error is NewerSnapshotError =>
    error instanceof NewerSnapshotError ||
    (error instanceof Error && error.name === 'NewerSnapshotError')

const isNewerVersion = (stored: unknown, current: number): stored is number =>
    typeof stored === 'number' && Number.isFinite(stored) && stored > current

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

/** Throws NewerSnapshotError when `state` was written by a newer build. */
export const assertNotNewerSnapshot = (state: unknown): void => {
    if (!isRecord(state)) return
    const storedVersion = isNewerVersion(state.version, APP_VERSION) ? state.version : null
    const sliceVersions = state._sliceVersions
    const newerSlices = isRecord(sliceVersions)
        ? Object.entries(SLICE_SCHEMA_VERSIONS)
              .filter(([name, current]) => isNewerVersion(sliceVersions[name], current))
              .map(([name]) => name)
        : []
    if (storedVersion !== null || newerSlices.length > 0) {
        throw new NewerSnapshotError(storedVersion, newerSlices)
    }
}
