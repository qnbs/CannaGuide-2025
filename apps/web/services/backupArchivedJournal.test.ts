import { describe, expect, it, vi } from 'vitest'

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
        ['an entry that is null', '{"version":1,"journals":{"p1":[null]}}'],
    ])('rejects %s', (_label, raw) => {
        expect(() => parseArchivedJournal(raw)).toThrow()
    })
})

describe('assertArchivedJournalComplete', () => {
    it.each([
        ['an older backup that declares nothing', undefined],
        ['a declared zero', 0],
        ['a declaration that is not a number', 'many'],
    ])('lets through %s', (_label, declared) => {
        expect(() => assertArchivedJournalComplete(declared, undefined)).not.toThrow()
    })

    it('accepts an archive with exactly the declared number of entries', () => {
        expect(() =>
            assertArchivedJournalComplete(3, { p1: [{ id: 'a' }, { id: 'b' }], p2: [{ id: 'c' }] }),
        ).not.toThrow()
    })

    it('refuses a declared archive that is missing', () => {
        expect(() => assertArchivedJournalComplete(3, undefined)).toThrow('missing or incomplete')
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
        const withoutId = { notes: 'no id', timestamp: 5 }
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
    })
})
