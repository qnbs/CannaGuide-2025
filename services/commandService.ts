import { Command } from '@/types'

const RECENT_COMMANDS_KEY = 'cannaguide_recent_commands'
const MAX_RECENT = 5

/**
 * Frecency-based recent-command tracker.
 * Stores the last N command IDs with timestamps in localStorage.
 */
interface RecentEntry {
    id: string
    ts: number
    count: number
}

export const getRecentCommands = (): RecentEntry[] => {
    try {
        const raw = localStorage.getItem(RECENT_COMMANDS_KEY)
        if (!raw) return []
        return JSON.parse(raw) as RecentEntry[]
    } catch {
        return []
    }
}

export const recordCommandUsage = (commandId: string): void => {
    try {
        const recent = getRecentCommands()
        const existing = recent.find((r) => r.id === commandId)
        if (existing) {
            existing.ts = Date.now()
            existing.count += 1
        } else {
            recent.push({ id: commandId, ts: Date.now(), count: 1 })
        }
        // Keep sorted by timestamp desc, cap at MAX_RECENT
        recent.sort((a, b) => b.ts - a.ts)
        localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
    } catch {
        // localStorage may be unavailable
    }
}

/** Canonical group display order */
const GROUP_ORDER = [
    'Navigation',
    'Strains',
    'Plants',
    'Equipment',
    'Knowledge',
    'Appearance',
    'Accessibility',
    'AI',
    'General',
]

/**
 * Groups commands by their `group` property, inserts header entries,
 * and sorts alphabetically within each group.  Groups themselves
 * follow the canonical order defined in GROUP_ORDER.
 */
export const groupAndSortCommands = (commands: Command[]): Command[] => {
    if (!commands?.length) return []

    const grouped: Record<string, Command[]> = {}
    for (const command of commands) {
        if (!grouped[command.group]) {
            grouped[command.group] = []
        }
        grouped[command.group].push(command)
    }

    const sortedGroups = Object.keys(grouped).sort((a, b) => {
        const indexA = GROUP_ORDER.indexOf(a)
        const indexB = GROUP_ORDER.indexOf(b)
        if (indexA === -1 && indexB === -1) return a.localeCompare(b)
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
    })

    const result: Command[] = []
    for (const group of sortedGroups) {
        result.push({
            id: `header-${group}`,
            title: group,
            group,
            isHeader: true,
            action: () => {},
            icon: () => null,
        })
        // Sort by priority (descending) then title (ascending)
        result.push(
            ...grouped[group].sort((a, b) => {
                const pa = a.priority ?? 0
                const pb = b.priority ?? 0
                if (pa !== pb) return pb - pa
                return a.title.localeCompare(b.title)
            }),
        )
    }

    return result
}

/**
 * Escape special regex characters from a user-typed string.
 */
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Score a command against a search query.
 * Returns 0 for no match, higher for better matches.
 *
 * Scoring:
 * - Exact title prefix match: +100
 * - Title contains query:      +60
 * - Keyword contains query:    +40
 * - Group/subtitle match:      +20
 * - Fuzzy match:               +10
 * - Frecency bonus:            +0–15
 */
export const scoreCommand = (
    command: Command,
    query: string,
    recentEntries: RecentEntry[],
): number => {
    if (!query.trim()) return 0
    const lq = query.toLowerCase()
    const titleLower = command.title.toLowerCase()
    const keywordsLower = (command.keywords ?? '').toLowerCase()
    const groupLower = command.group.toLowerCase()
    const subtitleLower = (command.subtitle ?? '').toLowerCase()

    let score = 0

    // Exact prefix match on title is strongest signal
    if (titleLower.startsWith(lq)) {
        score += 100
    } else if (titleLower.includes(lq)) {
        score += 60
    }

    // Keywords match
    if (keywordsLower.includes(lq)) {
        score += 40
    }

    // Group / subtitle
    if (groupLower.includes(lq) || subtitleLower.includes(lq)) {
        score += 20
    }

    // Fuzzy (character-order) match as fallback
    if (score === 0) {
        const fuzzyPattern = lq.split('').map(escapeRegExp).join('.*?')
        const fuzzyRegex = new RegExp(fuzzyPattern, 'i')
        const allText = `${titleLower} ${keywordsLower} ${groupLower} ${subtitleLower}`
        if (fuzzyRegex.test(allText)) {
            score += 10
        }
    }

    // Frecency bonus
    const recentEntry = recentEntries.find((r) => r.id === command.id)
    if (recentEntry) {
        // Recency: max 10 points, decays over 24h
        const ageMs = Date.now() - recentEntry.ts
        const recencyScore = Math.max(0, 10 - (ageMs / (24 * 60 * 60 * 1000)) * 10)
        // Frequency: max 5 points
        const freqScore = Math.min(5, recentEntry.count)
        score += recencyScore + freqScore
    }

    return score
}

/**
 * Search and rank commands using the scoring system.
 * Returns filtered + sorted commands (without header entries).
 */
export const searchAndRankCommands = (commands: Command[], query: string): Command[] => {
    const recent = getRecentCommands()
    const scored = commands
        .map((cmd) => ({ cmd, score: scoreCommand(cmd, query, recent) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
    return scored.map(({ cmd }) => cmd)
}
