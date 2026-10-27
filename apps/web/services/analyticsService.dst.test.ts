import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { analyticsService } from '@/services/analyticsService'
import { lastLocalDayKeys, toLocalDayKey } from '@/utils/localDay'

// CG-AUD-20261027-N02: the 14-day trends stepped back in fixed 24 h units from
// "now", so across a DST change one calendar day fell out of the window (13
// buckets) for an hour each evening. CI runs in UTC and never saw it.
//
// Vitest runs these files in worker threads, where a runtime TZ change has no
// effect, so each time zone case runs utils/localDay.ts in a child process with
// its own TZ. That keeps the cases meaningful on a UTC CI runner too.

// Resolved from the vitest root (apps/web); import.meta.url is not a file: URL
// under the jsdom environment.
const LOCAL_DAY = path.resolve(process.cwd(), 'utils/localDay.ts')

/** lastLocalDayKeys(14) and the key of `entryIso`, evaluated at `iso` in time zone `tz`. */
function inTimeZone(tz: string, iso: string, entryIso = iso): { keys: string[]; entry: string } {
    const script = `
        const { lastLocalDayKeys, toLocalDayKey } = await import(${JSON.stringify(pathToFileURL(LOCAL_DAY).href)})
        const [iso, entryIso] = process.argv.slice(1)
        console.log(JSON.stringify({ keys: lastLocalDayKeys(14, new Date(iso)), entry: toLocalDayKey(new Date(entryIso)) }))
    `
    const out = execFileSync(
        process.execPath,
        ['--input-type=module', '-e', script, iso, entryIso],
        {
            env: { ...process.env, TZ: tz },
            encoding: 'utf8',
        },
    )
    return JSON.parse(out) as { keys: string[]; entry: string }
}

/** Days between two YYYY-MM-DD keys, computed in UTC so DST cannot interfere. */
const dayGap = (a: string, b: string) =>
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 864e5

const CASES: Array<[string, string, string]> = [
    // [time zone, instant, expected local "today"]
    ['Europe/Berlin', '2026-10-27T23:30:00+01:00', '2026-10-27'], // two days after the autumn change
    ['Europe/Berlin', '2026-10-25T23:30:00+01:00', '2026-10-25'], // evening of the change day
    ['Europe/Berlin', '2026-03-29T00:30:00+01:00', '2026-03-29'], // spring change night
    ['Europe/Berlin', '2026-03-30T23:30:00+02:00', '2026-03-30'], // day after the spring change
    ['America/New_York', '2026-11-02T23:30:00-05:00', '2026-11-02'], // New York autumn
    ['UTC', '2026-10-27T23:30:00Z', '2026-10-27'], // control
]

describe('analytics day buckets across DST changes', () => {
    it('finds the module it runs in other time zones', () => {
        expect(existsSync(LOCAL_DAY), LOCAL_DAY).toBe(true)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it.each(CASES)('%s at %s gives 14 consecutive days ending today', (tz, iso, today) => {
        const { keys } = inTimeZone(tz, iso)

        expect(keys).toHaveLength(14)
        expect(new Set(keys).size).toBe(14)
        expect(keys.at(-1)).toBe(today)
        for (let i = 1; i < keys.length; i++) {
            expect(dayGap(keys[i - 1] ?? '', keys[i] ?? '')).toBe(1)
        }
    })

    it('puts an entry made at 23:59 local time into today, not tomorrow', () => {
        const { keys, entry } = inTimeZone(
            'Europe/Berlin',
            '2026-10-27T23:59:30+01:00',
            '2026-10-27T23:59:00+01:00',
        )
        expect(entry).toBe('2026-10-27')
        expect(keys.at(-1)).toBe(entry)
    })

    it('compute() builds both 14-day trends from the same calendar days', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-10-27T22:30:00Z'))

        const trend = analyticsService.compute([]).journalActivityTrend

        expect(trend.map((d) => d.date)).toEqual(lastLocalDayKeys(14))
        expect(trend.at(-1)?.date).toBe(toLocalDayKey(new Date()))
    })
})
