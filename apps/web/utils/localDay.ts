// Local calendar-day keys. Dependency-free on purpose: the DST tests import
// this file in child processes with a different TZ (worker threads ignore a
// runtime TZ change), which only works without path aliases.

/** Local calendar day of `d` as YYYY-MM-DD. */
export const toLocalDayKey = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/**
 * The last `days` local calendar days, oldest first, ending today.
 *
 * Steps by calendar day from local midnight rather than by 24 h from "now":
 * across a DST change a 24 h step lands on the same date twice or skips one,
 * which dropped a day from the 14-day trends for an hour each evening
 * (CG-AUD-20261027-N02).
 */
export const lastLocalDayKeys = (days: number, now: Date = new Date()): string[] => {
    const keys: string[] = []
    for (let i = days - 1; i >= 0; i--) {
        keys.push(toLocalDayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)))
    }
    return keys
}
