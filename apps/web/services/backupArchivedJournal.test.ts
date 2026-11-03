import { describe, expect, it, vi } from 'vitest'

import type { JournalEntry } from '@/types'

import {
    archivedEntriesOf,
    assertArchivedJournalComplete,
    combineDependentWrites,
    mergeArchivedJournals,
    parseArchivedJournal,
    serializeArchivedJournal,
} from '@/services/backupArchivedJournal'

/** A dependent write that records what happened to it, in order. */
const recordedWrite = (name: string, log: string[], failOn?: 'apply' | 'revert') => ({
    apply: vi.fn(() => {
        log.push(`apply ${name}`)
        return failOn === 'apply' ? Promise.reject(new Error(`${name} apply`)) : Promise.resolve()
    }),
    revert: vi.fn(() => {
        log.push(`revert ${name}`)
        return failOn === 'revert' ? Promise.reject(new Error(`${name} revert`)) : Promise.resolve()
    }),
})

describe('parseArchivedJournal', () => {
    it('reads the versioned envelope back into a map of plant id to entry lists', () => {
        const archive = parseArchivedJournal('{"version":1,"journals":{"p1":[{"id":"a"}],"p2":[]}}')

        expect(archive).toEqual({ p1: [{ id: 'a' }], p2: [] })
    })

    it('reads what serializeArchivedJournal wrote', () => {
        const archive = { p1: [{ id: 'a', details: { imageId: 'photo-1' } }], p2: [{ id: 'b' }] }

        expect(parseArchivedJournal(serializeArchivedJournal(archive))).toEqual(archive)
    })

    it.each([
        ['text that is not JSON', '{nope'],
        ['a bare array', '[]'],
        ['null', 'null'],
        ['a map without the envelope', '{"p1":[{"id":"a"}]}'],
        ['a version this build does not know', '{"version":2,"journals":{}}'],
        ['a missing version', '{"journals":{}}'],
        ['missing journals', '{"version":1}'],
        ['a plant whose entries are not a list', '{"version":1,"journals":{"p1":"x"}}'],
        ['an entry that is not an object', '{"version":1,"journals":{"p1":[1]}}'],
        ['an empty object as an entry', '{"version":1,"journals":{"p1":[{}]}}'],
        ['an entry without an id', '{"version":1,"journals":{"p1":[{"notes":"x"}]}}'],
        ['an entry whose id is not a string', '{"version":1,"journals":{"p1":[{"id":5}]}}'],
        ['an entry that is null', '{"version":1,"journals":{"p1":[null]}}'],
    ])('rejects %s', (_label, raw) => {
        expect(() => parseArchivedJournal(raw)).toThrow()
    })
})

describe('assertArchivedJournalComplete', () => {
    it('lets an older backup through that declares nothing, with or without a file', () => {
        const olderBackup: { archivedJournalEntryCount?: number } = {}

        expect(() =>
            assertArchivedJournalComplete(olderBackup.archivedJournalEntryCount),
        ).not.toThrow()
        expect(() =>
            assertArchivedJournalComplete(olderBackup.archivedJournalEntryCount, {
                p1: [{ id: 'a' }],
            }),
        ).not.toThrow()
    })

    it('accepts a declared zero next to no archive or an archive without entries', () => {
        expect(() => assertArchivedJournalComplete(0)).not.toThrow()
        expect(() => assertArchivedJournalComplete(0, { p1: [] })).not.toThrow()
    })

    it('refuses a declared zero next to a file that holds entries', () => {
        expect(() => assertArchivedJournalComplete(0, { p1: [{ id: 'a' }] })).toThrow(
            'missing or incomplete',
        )
    })

    it.each([
        ['a string', 'many'],
        ['a numeric string', '3'],
        ['a negative number', -1],
        ['a fraction', 1.5],
        ['NaN', Number.NaN],
        ['Infinity', Number.POSITIVE_INFINITY],
        ['null', null],
        ['an object', { count: 3 }],
    ])(
        'refuses a declaration that is %s, instead of reading it as nothing declared',
        (_l, declared) => {
            expect(() => assertArchivedJournalComplete(declared, { p1: [{ id: 'a' }] })).toThrow(
                'not valid',
            )
        },
    )

    it('accepts an archive with exactly the declared number of entries', () => {
        expect(() =>
            assertArchivedJournalComplete(3, { p1: [{ id: 'a' }, { id: 'b' }], p2: [{ id: 'c' }] }),
        ).not.toThrow()
    })

    it('refuses a declared archive that is missing', () => {
        expect(() => assertArchivedJournalComplete(3)).toThrow('missing or incomplete')
    })

    it('refuses an archive with fewer or more entries than declared', () => {
        expect(() => assertArchivedJournalComplete(3, { p1: [{ id: 'a' }] })).toThrow()
        expect(() => assertArchivedJournalComplete(1, { p1: [{ id: 'a' }, { id: 'b' }] })).toThrow()
    })
})

describe('mergeArchivedJournals', () => {
    it('keeps the stored entries and appends the new ones', () => {
        expect(
            mergeArchivedJournals({ p1: [{ id: 'a' }] }, { p1: [{ id: 'b' }], p2: [{ id: 'c' }] }),
        ).toEqual({ p1: [{ id: 'a' }, { id: 'b' }], p2: [{ id: 'c' }] })
    })

    it('keeps the stored entry when the id is already there', () => {
        expect(
            mergeArchivedJournals(
                { p1: [{ id: 'a', notes: 'stored' }] },
                { p1: [{ id: 'a', notes: 'new' }] },
            ),
        ).toEqual({ p1: [{ id: 'a', notes: 'stored' }] })
    })

    it('keeps plants the backup does not mention', () => {
        expect(mergeArchivedJournals({ p9: [{ id: 'z' }] }, { p1: [{ id: 'a' }] })).toEqual({
            p9: [{ id: 'z' }],
            p1: [{ id: 'a' }],
        })
    })

    it('does not add the same entry twice, with or without an id', () => {
        const withId = { id: 'a' }
        const withoutId = { notes: 'no id', createdAt: 5 }
        const once = mergeArchivedJournals({}, { p1: [withId, withoutId] })
        const twice = mergeArchivedJournals(once, { p1: [withId, { ...withoutId }] })

        expect(twice).toEqual({ p1: [withId, withoutId] })
    })

    it('does not change its inputs', () => {
        const existing = { p1: [{ id: 'a' }] }
        const incoming = { p1: [{ id: 'b' }] }

        mergeArchivedJournals(existing, incoming)

        expect(existing).toEqual({ p1: [{ id: 'a' }] })
        expect(incoming).toEqual({ p1: [{ id: 'b' }] })
    })
})

describe('archivedEntriesOf', () => {
    it('lists the entries of every plant', () => {
        expect(archivedEntriesOf({ p1: [{ id: 'a' }], p2: [{ id: 'b' }, { id: 'c' }] })).toEqual([
            { id: 'a' },
            { id: 'b' },
            { id: 'c' },
        ])
    })
})

describe('combineDependentWrites', () => {
    it('has nothing to do when there is no write', () => {
        expect(combineDependentWrites([undefined, undefined])).toBeUndefined()
        expect(combineDependentWrites([])).toBeUndefined()
    })

    it('returns a single write as it is', () => {
        const write = recordedWrite('a', [])

        expect(combineDependentWrites([undefined, write])).toBe(write)
    })

    it('applies in order and reverts in the opposite order', async () => {
        const log: string[] = []
        const combined = combineDependentWrites([recordedWrite('a', log), recordedWrite('b', log)])

        await combined?.apply()
        await combined?.revert()

        expect(log).toEqual(['apply a', 'apply b', 'revert b', 'revert a'])
    })

    it('undoes the earlier writes when a later apply fails, then passes the error on', async () => {
        const log: string[] = []
        const combined = combineDependentWrites([
            recordedWrite('a', log),
            recordedWrite('b', log, 'apply'),
        ])

        await expect(combined?.apply()).rejects.toThrow('b apply')

        expect(log).toEqual(['apply a', 'apply b', 'revert a'])
    })

    it('does not revert a write whose apply never ran', async () => {
        const log: string[] = []
        const combined = combineDependentWrites([
            recordedWrite('a', log, 'apply'),
            recordedWrite('b', log),
        ])

        await expect(combined?.apply()).rejects.toThrow('a apply')

        expect(log).toEqual(['apply a'])
    })

    it('tries every revert even when one fails, and reports the first failure', async () => {
        const log: string[] = []
        const combined = combineDependentWrites([
            recordedWrite('a', log),
            recordedWrite('b', log, 'revert'),
            recordedWrite('c', log),
        ])

        await combined?.apply()
        await expect(combined?.revert()).rejects.toThrow('b revert')

        expect(log).toEqual(['apply a', 'apply b', 'apply c', 'revert c', 'revert b', 'revert a'])
    })

    it('still reports the original error when undoing the earlier writes also fails', async () => {
        const log: string[] = []
        const combined = combineDependentWrites([
            recordedWrite('a', log, 'revert'),
            recordedWrite('b', log, 'apply'),
        ])

        await expect(combined?.apply()).rejects.toThrow('b apply')

        // The undo of "a" was tried, although it failed; "b" never applied.
        expect(log).toEqual(['apply a', 'apply b', 'revert a'])
    })
})

describe('mergeArchivedJournals keeps entries oldest first', () => {
    // Typed with the real entry type, so a renamed field breaks the typecheck
    // instead of leaving the ordering tests passing on a field nothing writes.
    const at = (id: string, createdAt: number): Pick<JournalEntry, 'id' | 'createdAt'> => ({
        id,
        createdAt,
    })

    it('places older backup entries before newer stored ones', () => {
        const merged = mergeArchivedJournals(
            { p1: [at('new-1', 100), at('new-2', 101)] },
            { p1: [at('old-1', 1), at('old-2', 2)] },
        )

        expect(merged.p1?.map((entry) => (entry as { id: string }).id)).toEqual([
            'old-1',
            'old-2',
            'new-1',
            'new-2',
        ])
    })

    it('lets the next trim from the front drop the oldest entries, not the newer stored ones', () => {
        // services/db/simulationPersistence.ts appends and keeps the last N.
        const keepLast = 3
        const merged = mergeArchivedJournals(
            { p1: [at('new-1', 100), at('new-2', 101)] },
            { p1: [at('old-1', 1), at('old-2', 2)] },
        )

        const afterTrim = [...(merged.p1 ?? []), at('newest', 200)].slice(-keepLast)

        expect(afterTrim.map((entry) => (entry as { id: string }).id)).toEqual([
            'new-1',
            'new-2',
            'newest',
        ])
    })

    it('leaves the stored list exactly as it is when the backup adds nothing', () => {
        const stored = [at('b', 5), at('a', 1)]

        const merged = mergeArchivedJournals({ p1: stored }, { p1: [at('a', 1)] })

        expect(merged.p1).toEqual([at('b', 5), at('a', 1)])
    })

    it('keeps entries without a usable createdAt after the dated ones, in their order', () => {
        const merged = mergeArchivedJournals(
            { p1: [at('dated', 50)] },
            { p1: [{ id: 'no-time-1' }, at('older', 10), { id: 'no-time-2', createdAt: 'x' }] },
        )

        expect(merged.p1?.map((entry) => (entry as { id: string }).id)).toEqual([
            'older',
            'dated',
            'no-time-1',
            'no-time-2',
        ])
    })

    it('adds an entry that appears twice in the backup only once', () => {
        const merged = mergeArchivedJournals({}, { p1: [at('a', 1), at('a', 1), at('b', 2)] })

        expect(merged.p1).toEqual([at('a', 1), at('b', 2)])
    })
})

describe('a plant id that is also an object property name', () => {
    const journalsWithProtoKey = () =>
        parseArchivedJournal(
            '{"version":1,"journals":{"__proto__":[{"id":"a"}],"p1":[{"id":"b"}]}}',
        )

    it('is kept as an own entry when the file is parsed', () => {
        const archive = journalsWithProtoKey()

        expect(Object.keys(archive).sort()).toEqual(['__proto__', 'p1'])
        expect(Object.getPrototypeOf(archive)).toBe(Object.prototype)
        expect(Object.getOwnPropertyDescriptor(archive, '__proto__')?.value).toEqual([{ id: 'a' }])
    })

    it('is kept through a merge, from either side', () => {
        const stored = journalsWithProtoKey()

        const merged = mergeArchivedJournals(
            stored,
            parseArchivedJournal(
                '{"version":1,"journals":{"__proto__":[{"id":"c"}],"constructor":[{"id":"d"}]}}',
            ),
        )

        expect(Object.getOwnPropertyDescriptor(merged, '__proto__')?.value).toEqual([
            { id: 'a' },
            { id: 'c' },
        ])
        expect(Object.getOwnPropertyDescriptor(merged, 'constructor')?.value).toEqual([{ id: 'd' }])
        expect(Object.getPrototypeOf(merged)).toBe(Object.prototype)
    })

    it('does not touch Object.prototype', () => {
        mergeArchivedJournals({}, journalsWithProtoKey())

        expect(({} as Record<string, unknown>)['id']).toBeUndefined()
        expect(Object.keys(Object.prototype)).toEqual([])
    })
})
