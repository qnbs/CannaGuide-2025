import { describe, expect, it, vi } from 'vitest'

import {
    archivedEntriesOf,
    combineDependentWrites,
    parseArchivedJournal,
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
    it('reads a map of plant id to entry lists', () => {
        const archive = parseArchivedJournal('{"p1":[{"id":"a"}],"p2":[]}')

        expect(archive).toEqual({ p1: [{ id: 'a' }], p2: [] })
    })

    it.each([
        ['text that is not JSON', '{nope'],
        ['an array', '[]'],
        ['null', 'null'],
        ['a plant whose entries are not a list', '{"p1":"x"}'],
        ['an entry that is not an object', '{"p1":[1]}'],
        ['an entry that is null', '{"p1":[null]}'],
    ])('rejects %s', (_label, raw) => {
        expect(() => parseArchivedJournal(raw)).toThrow()
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
