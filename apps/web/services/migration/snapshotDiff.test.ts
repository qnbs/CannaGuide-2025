import { describe, expect, it } from 'vitest'
import { createSnapshotDiff } from '@/services/migration/snapshotDiff'

describe('createSnapshotDiff', () => {
    it('returns empty diff for non-object inputs', () => {
        expect(createSnapshotDiff(null, { a: 1 })).toEqual({
            added: [],
            removed: [],
            changed: [],
        })
        expect(createSnapshotDiff({ a: 1 }, 'x')).toEqual({
            added: [],
            removed: [],
            changed: [],
        })
    })

    it('detects added, removed, and changed keys', () => {
        const diff = createSnapshotDiff(
            { kept: 1, removed: true, changed: 'old' },
            { kept: 1, added: 2, changed: 'new' },
        )
        expect(diff.added).toEqual(['added'])
        expect(diff.removed).toEqual(['removed'])
        expect(diff.changed).toEqual(['changed'])
    })
})
