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

/** What in `state` is newer than this build, or null when nothing is. */
const newerThanThisBuild = (
    state: unknown,
): { storedVersion: number | null; newerSlices: string[] } | null => {
    if (!isRecord(state)) return null
    const storedVersion = isNewerVersion(state.version, APP_VERSION) ? state.version : null
    const sliceVersions = state._sliceVersions
    const newerSlices = isRecord(sliceVersions)
        ? Object.entries(SLICE_SCHEMA_VERSIONS)
              .filter(([name, current]) => isNewerVersion(sliceVersions[name], current))
              .map(([name]) => name)
        : []
    return storedVersion !== null || newerSlices.length > 0 ? { storedVersion, newerSlices } : null
}

/** True when `state` was written by a newer build than this one. */
export const isNewerThanThisBuild = (state: unknown): boolean => newerThanThisBuild(state) !== null

/** Throws NewerSnapshotError when `state` was written by a newer build. */
export const assertNotNewerSnapshot = (state: unknown): void => {
    const newer = newerThanThisBuild(state)
    if (newer) throw new NewerSnapshotError(newer.storedVersion, newer.newerSlices)
}

const comparable = (stored: unknown): stored is number =>
    typeof stored === 'number' && Number.isFinite(stored)

/**
 * True when `candidate` was written under a newer state or slice schema version than
 * `reference`. Only versions both sides carry as numbers are compared, so a very old
 * snapshot without `_sliceVersions` never looks older than it is.
 */
export const isSnapshotNewerThan = (candidate: unknown, reference: unknown): boolean => {
    if (!isRecord(candidate) || !isRecord(reference)) return false
    if (
        comparable(candidate.version) &&
        comparable(reference.version) &&
        candidate.version > reference.version
    ) {
        return true
    }
    const candidateSlices = candidate._sliceVersions
    const referenceSlices = reference._sliceVersions
    if (!isRecord(candidateSlices) || !isRecord(referenceSlices)) return false
    return Object.keys(SLICE_SCHEMA_VERSIONS).some((name) => {
        const newer = candidateSlices[name]
        const older = referenceSlices[name]
        return comparable(newer) && comparable(older) && newer > older
    })
}
