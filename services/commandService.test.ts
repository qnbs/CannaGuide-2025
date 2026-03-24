import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    getRecentCommands,
    recordCommandUsage,
    groupAndSortCommands,
    scoreCommand,
    searchAndRankCommands,
} from '@/services/commandService'
import type { Command } from '@/types'

const makeCommand = (overrides: Partial<Command> = {}): Command => ({
    id: 'test-cmd',
    title: 'Test Command',
    group: 'General',
    action: () => {},
    icon: () => null,
    ...overrides,
})

describe('commandService', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    describe('getRecentCommands', () => {
        it('returns empty array when no commands stored', () => {
            expect(getRecentCommands()).toEqual([])
        })

        it('returns stored commands', () => {
            const entries = [{ id: 'cmd-1', ts: 1000, count: 2 }]
            localStorage.setItem('cannaguide_recent_commands', JSON.stringify(entries))
            expect(getRecentCommands()).toEqual(entries)
        })

        it('returns empty array on malformed JSON', () => {
            localStorage.setItem('cannaguide_recent_commands', 'not-json')
            expect(getRecentCommands()).toEqual([])
        })
    })

    describe('recordCommandUsage', () => {
        it('records a new command', () => {
            recordCommandUsage('nav-plants')
            const recent = getRecentCommands()
            expect(recent).toHaveLength(1)
            expect(recent[0]!.id).toBe('nav-plants')
            expect(recent[0]!.count).toBe(1)
        })

        it('increments count on repeated usage', () => {
            recordCommandUsage('nav-plants')
            recordCommandUsage('nav-plants')
            const recent = getRecentCommands()
            expect(recent).toHaveLength(1)
            expect(recent[0]!.count).toBe(2)
        })

        it('caps at MAX_RECENT (5)', () => {
            for (let i = 0; i < 7; i += 1) {
                recordCommandUsage(`cmd-${i}`)
            }
            expect(getRecentCommands()).toHaveLength(5)
        })

        it('sorts by timestamp descending', () => {
            vi.spyOn(Date, 'now')
                .mockReturnValueOnce(100)
                .mockReturnValueOnce(300)
                .mockReturnValueOnce(200)
            recordCommandUsage('old')
            recordCommandUsage('newest')
            recordCommandUsage('middle')
            const recent = getRecentCommands()
            expect(recent[0]!.id).toBe('newest')
            expect(recent[1]!.id).toBe('middle')
            expect(recent[2]!.id).toBe('old')
            vi.restoreAllMocks()
        })
    })

    describe('groupAndSortCommands', () => {
        it('returns empty for empty input', () => {
            expect(groupAndSortCommands([])).toEqual([])
        })

        it('returns empty for null-ish input', () => {
            expect(groupAndSortCommands(null as unknown as Command[])).toEqual([])
        })

        it('groups commands and inserts headers', () => {
            const commands = [
                makeCommand({ id: 'a', title: 'Alpha', group: 'Navigation' }),
                makeCommand({ id: 'b', title: 'Beta', group: 'Strains' }),
            ]
            const result = groupAndSortCommands(commands)
            expect(result[0]!.isHeader).toBe(true)
            expect(result[0]!.group).toBe('Navigation')
            expect(result[1]!.id).toBe('a')
            expect(result[2]!.isHeader).toBe(true)
            expect(result[2]!.group).toBe('Strains')
            expect(result[3]!.id).toBe('b')
        })

        it('sorts within groups by priority desc then title asc', () => {
            const commands = [
                makeCommand({ id: 'c', title: 'Charlie', group: 'AI', priority: 1 }),
                makeCommand({ id: 'a', title: 'Alpha', group: 'AI', priority: 5 }),
                makeCommand({ id: 'b', title: 'Beta', group: 'AI', priority: 1 }),
            ]
            const result = groupAndSortCommands(commands)
            const items = result.filter((r) => !r.isHeader)
            expect(items[0]!.id).toBe('a')
            expect(items[1]!.id).toBe('b')
            expect(items[2]!.id).toBe('c')
        })

        it('follows canonical group order', () => {
            const commands = [
                makeCommand({ id: 'z', title: 'Z', group: 'General' }),
                makeCommand({ id: 'a', title: 'A', group: 'Navigation' }),
            ]
            const result = groupAndSortCommands(commands)
            const headers = result.filter((r) => r.isHeader)
            expect(headers[0]!.group).toBe('Navigation')
            expect(headers[1]!.group).toBe('General')
        })
    })

    describe('scoreCommand', () => {
        it('returns 0 for empty query', () => {
            expect(scoreCommand(makeCommand(), '', [])).toBe(0)
            expect(scoreCommand(makeCommand(), '   ', [])).toBe(0)
        })

        it('scores higher for title prefix match', () => {
            const cmd = makeCommand({ title: 'Navigate Plants' })
            const prefixScore = scoreCommand(cmd, 'nav', [])
            const containsScore = scoreCommand(cmd, 'plants', [])
            expect(prefixScore).toBeGreaterThan(containsScore)
        })

        it('scores keyword matches', () => {
            const cmd = makeCommand({ title: 'Foo', keywords: 'search filter' })
            expect(scoreCommand(cmd, 'filter', [])).toBeGreaterThan(0)
        })

        it('scores group matches', () => {
            const cmd = makeCommand({ title: 'Foo', group: 'Strains' })
            expect(scoreCommand(cmd, 'strain', [])).toBeGreaterThan(0)
        })

        it('adds frecency bonus for recent commands', () => {
            const cmd = makeCommand({ title: 'Foo Bar' })
            const recent = [{ id: 'test-cmd', ts: Date.now(), count: 3 }]
            const withRecent = scoreCommand(cmd, 'foo', recent)
            const withoutRecent = scoreCommand(cmd, 'foo', [])
            expect(withRecent).toBeGreaterThan(withoutRecent)
        })

        it('limits fuzzy match to 64 chars', () => {
            const cmd = makeCommand({ title: 'Short' })
            const longQuery = 'a'.repeat(65)
            expect(scoreCommand(cmd, longQuery, [])).toBe(0)
        })
    })

    describe('searchAndRankCommands', () => {
        it('returns matching commands sorted by score', () => {
            const commands = [
                makeCommand({ id: 'nav', title: 'Navigate' }),
                makeCommand({ id: 'nav-plants', title: 'Navigate Plants' }),
                makeCommand({ id: 'unrelated', title: 'Settings' }),
            ]
            const results = searchAndRankCommands(commands, 'navigate')
            expect(results.length).toBe(2)
            expect(results.every((r) => r.title.includes('Navigate'))).toBe(true)
        })

        it('returns empty for no matches', () => {
            const commands = [makeCommand({ title: 'Plants' })]
            expect(searchAndRankCommands(commands, 'xyznonexistent')).toEqual([])
        })
    })
})
