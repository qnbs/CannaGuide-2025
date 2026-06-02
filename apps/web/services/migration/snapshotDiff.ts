import type { SnapshotDiff } from '@/services/migration/migrationTypes'

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value)

export const createSnapshotDiff = (before: unknown, after: unknown): SnapshotDiff => {
    if (!isPlainObject(before) || !isPlainObject(after)) {
        return { added: [], removed: [], changed: [] }
    }

    const beforeKeys = new Set(Object.keys(before))
    const afterKeys = new Set(Object.keys(after))

    return {
        added: [...afterKeys]
            .filter((key) => !beforeKeys.has(key))
            .toSorted((a, b) => a.localeCompare(b)),
        removed: [...beforeKeys]
            .filter((key) => !afterKeys.has(key))
            .toSorted((a, b) => a.localeCompare(b)),
        changed: [...beforeKeys]
            .filter(
                (key) =>
                    afterKeys.has(key) &&
                    JSON.stringify(before[key]) !== JSON.stringify(after[key]),
            )
            .toSorted((a, b) => a.localeCompare(b)),
    }
}
