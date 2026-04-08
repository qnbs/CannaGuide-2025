// ---------------------------------------------------------------------------
// dailyStrainsService.ts -- 4:20 Daily Drop
//
// Smart daily strain picks from the 776-strain local catalog.
// Uses a seeded PRNG (date-based) so every user sees the same daily drop.
// Diversity scoring ensures category rotation across days.
// AI search supplements local catalog results.
// ---------------------------------------------------------------------------

import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { allStrainsData } from '@/data/strains/index'
import { createStrainObject } from '@/services/strainFactory'
import type { Strain, StrainType } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiscoveredStrain {
    id: string
    name: string
    breeder: string
    type: string
    floweringType: string
    thc: number
    cbd: number
    description: string
    genetics: string
    source: 'daily-pick' | 'ai-lookup' | 'local-catalog'
    sourceUrl: string
    discoveredAt: string
    /** Why this strain was picked today */
    pickReason?: string | undefined
    /** Category tag for diversity rotation */
    pickCategory?: string | undefined
}

export interface DailyStrainsFeed {
    generatedAt: string
    dateKey: string
    stats: {
        totalPicks: number
        categories: string[]
        existingCatalogSize: number
    }
    strains: DiscoveredStrain[]
}

export type FeedStatus = 'idle' | 'loading' | 'loaded' | 'error'

export interface ScoredStrain extends DiscoveredStrain {
    /** 0-100 relevance score based on user preferences. */
    relevanceScore: number
}

export interface UserStrainProfile {
    strainCount: number
    preferredTypes: Record<string, number>
    avgThc: number
    avgCbd: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAILY_PICK_COUNT = 5
const STORAGE_KEY = 'cg.daily-drop.feed'
const DISMISSED_KEY = 'cg.daily-drop.dismissed'

/** Categories for diversity rotation. Each day emphasises a different one. */
const PICK_CATEGORIES = [
    'high-thc',
    'balanced-cbd',
    'autoflower',
    'classic-indica',
    'classic-sativa',
    'beginner-friendly',
    'terpene-rich',
] as const

type PickCategory = (typeof PICK_CATEGORIES)[number]

// ---------------------------------------------------------------------------
// Seeded PRNG (Mulberry32) -- deterministic daily picks
// ---------------------------------------------------------------------------

/** Create a seeded PRNG from a date string like '2025-01-15'. */
export function createSeededRng(dateKey: string): () => number {
    let h = 0
    for (let i = 0; i < dateKey.length; i++) {
        h = Math.imul(31, h) + dateKey.charCodeAt(i)
        h |= 0
    }
    // Mulberry32
    return (): number => {
        h |= 0
        h = (h + 0x6d2b79f5) | 0
        let t = Math.imul(h ^ (h >>> 15), 1 | h)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 0x100000000
    }
}

/** Get today's date key in YYYY-MM-DD format. */
export function getTodayKey(): string {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

// ---------------------------------------------------------------------------
// Category filters
// ---------------------------------------------------------------------------

function matchesCategory(strain: Strain, category: PickCategory): boolean {
    switch (category) {
        case 'high-thc':
            return strain.thc >= 20
        case 'balanced-cbd':
            return strain.cbd >= 1
        case 'autoflower':
            return strain.floweringType === 'Autoflower'
        case 'classic-indica':
            return strain.type === 'Indica' && strain.floweringType === 'Photoperiod'
        case 'classic-sativa':
            return strain.type === 'Sativa' && strain.floweringType === 'Photoperiod'
        case 'beginner-friendly':
            return strain.agronomic.difficulty === 'Easy'
        case 'terpene-rich':
            return (strain.dominantTerpenes?.length ?? 0) >= 2
    }
}

function getPickReason(category: PickCategory): string {
    switch (category) {
        case 'high-thc':
            return 'High THC powerhouse'
        case 'balanced-cbd':
            return 'CBD-balanced for wellness'
        case 'autoflower':
            return 'Easy autoflower grow'
        case 'classic-indica':
            return 'Classic Indica relaxation'
        case 'classic-sativa':
            return 'Uplifting Sativa energy'
        case 'beginner-friendly':
            return 'Perfect for beginners'
        case 'terpene-rich':
            return 'Rich terpene profile'
    }
}

// ---------------------------------------------------------------------------
// Daily pick engine
// ---------------------------------------------------------------------------

function strainToDiscovered(strain: Strain, category: PickCategory): DiscoveredStrain {
    return {
        id: strain.id,
        name: strain.name,
        breeder: strain.lineage?.breeder ?? 'Community',
        type: strain.type,
        floweringType: strain.floweringType,
        thc: strain.thc,
        cbd: strain.cbd,
        description: strain.description ?? '',
        genetics: strain.genetics ?? '',
        source: 'daily-pick',
        sourceUrl: '',
        discoveredAt: new Date().toISOString(),
        pickReason: getPickReason(category),
        pickCategory: category,
    }
}

/**
 * Generate deterministic daily picks from the local catalog.
 * Uses seeded PRNG so all users see the same strains on the same day.
 * Rotates through categories for diversity.
 */
export function generateDailyPicks(dateKey?: string): DiscoveredStrain[] {
    const key = dateKey ?? getTodayKey()
    const rng = createSeededRng(key)

    // Pick today's primary category based on day-of-year
    const parts = key.split('-').map(Number)
    const dayOfYear = Math.floor(
        (Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!) - Date.UTC(parts[0]!, 0, 0)) / 86400000,
    )
    const primaryCategoryIndex = dayOfYear % PICK_CATEGORIES.length
    const picks: DiscoveredStrain[] = []
    const usedIds = new Set<string>()

    // 2 picks from primary category
    const primaryCategory = PICK_CATEGORIES[primaryCategoryIndex]!
    const primaryPool = allStrainsData.filter((s) => matchesCategory(s, primaryCategory))
    pickFromPool(primaryPool, 2, primaryCategory, rng, picks, usedIds)

    // 1 pick each from 3 other rotating categories
    for (let i = 1; i <= 3; i++) {
        const catIndex = (primaryCategoryIndex + i) % PICK_CATEGORIES.length
        const cat = PICK_CATEGORIES[catIndex]!
        const pool = allStrainsData.filter((s) => matchesCategory(s, cat))
        pickFromPool(pool, 1, cat, rng, picks, usedIds)
    }

    // Fill remaining slots with random picks
    if (picks.length < DAILY_PICK_COUNT) {
        const remaining = allStrainsData.filter((s) => !usedIds.has(s.id))
        const needed = DAILY_PICK_COUNT - picks.length
        for (let i = 0; i < needed && remaining.length > 0; i++) {
            const idx = Math.floor(rng() * remaining.length)
            const strain = remaining.splice(idx, 1)[0]!
            usedIds.add(strain.id)
            picks.push(strainToDiscovered(strain, primaryCategory))
        }
    }

    return picks
}

function pickFromPool(
    pool: Strain[],
    count: number,
    category: PickCategory,
    rng: () => number,
    picks: DiscoveredStrain[],
    usedIds: Set<string>,
): void {
    const available = pool.filter((s) => !usedIds.has(s.id))
    // Fisher-Yates partial shuffle
    const arr = [...available]
    const n = Math.min(count, arr.length)
    for (let i = 0; i < n; i++) {
        const j = i + Math.floor(rng() * (arr.length - i))
        ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
        const strain = arr[i]!
        usedIds.add(strain.id)
        picks.push(strainToDiscovered(strain, category))
    }
}

// ---------------------------------------------------------------------------
// Local storage persistence
// ---------------------------------------------------------------------------

function saveFeedToStorage(feed: DailyStrainsFeed): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(feed))
    } catch {
        // Storage full -- ignore
    }
}

function loadFeedFromStorage(): DailyStrainsFeed | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- localStorage JSON boundary
        return JSON.parse(raw) as DailyStrainsFeed
    } catch {
        return null
    }
}

function getDismissedIds(): Set<string> {
    try {
        const raw = localStorage.getItem(DISMISSED_KEY)
        if (!raw) return new Set()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- localStorage JSON boundary
        const arr = JSON.parse(raw) as string[]
        return new Set(arr)
    } catch {
        return new Set()
    }
}

function dismissStrainId(id: string): void {
    const dismissed = getDismissedIds()
    dismissed.add(id)
    // Keep only last 500 dismissals
    const arr = [...dismissed].slice(-500)
    try {
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(arr))
    } catch {
        /* ignore */
    }
}

// ---------------------------------------------------------------------------
// AI-powered strain search
// ---------------------------------------------------------------------------

export async function searchStrainsWithAI(query: string): Promise<DiscoveredStrain[]> {
    if (!query || query.length < 2) return []

    // Always search local catalog first
    const localResults = searchLocalCatalog(query)

    // In local-only mode, return local results only
    if (isLocalOnlyMode()) return localResults

    try {
        const { aiService, getAiMode } = await import('@/services/aiFacade')
        const mode = getAiMode()
        if (mode === 'eco') return localResults

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- DOM lang attr
        const lang = (document.documentElement.lang as 'en' | 'de') || 'en'
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- minimal stub
        const plantStub = { id: 'strain-lookup', name: query } as Parameters<
            typeof aiService.getMentorResponse
        >[0]
        const response = await aiService.getMentorResponse(
            plantStub,
            buildStrainLookupPrompt(query, lang),
            lang,
        )

        if (response?.content) {
            const aiStrains = parseAIStrainResponse(response.content)
            const seenIds = new Set(localResults.map((s) => s.id))
            const merged = [...localResults]
            for (const strain of aiStrains) {
                if (!seenIds.has(strain.id)) {
                    seenIds.add(strain.id)
                    merged.push(strain)
                }
            }
            return merged.slice(0, 30)
        }
    } catch {
        // AI unavailable
    }

    return localResults
}

function searchLocalCatalog(query: string): DiscoveredStrain[] {
    const q = query.toLowerCase()
    return allStrainsData
        .filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                (s.genetics?.toLowerCase().includes(q) ?? false) ||
                (s.description?.toLowerCase().includes(q) ?? false),
        )
        .slice(0, 20)
        .map((s) => ({
            id: s.id,
            name: s.name,
            breeder: s.lineage?.breeder ?? 'Catalog',
            type: s.type,
            floweringType: s.floweringType,
            thc: s.thc,
            cbd: s.cbd,
            description: s.description ?? '',
            genetics: s.genetics ?? '',
            source: 'local-catalog' as const,
            sourceUrl: '',
            discoveredAt: new Date().toISOString(),
        }))
}

function buildStrainLookupPrompt(query: string, lang: string): string {
    const isDE = lang === 'de'
    return isDE
        ? `Ich suche Informationen ueber die Cannabis-Sorte "${query}". ` +
              'Bitte gib mir fuer jede passende Sorte (maximal 5) folgende Daten im JSON-Array-Format: ' +
              '[{"name": "...", "breeder": "...", "type": "Indica|Sativa|Hybrid", ' +
              '"floweringType": "Photoperiod|Autoflower", "thc": <number>, "cbd": <number>, ' +
              '"description": "...", "genetics": "Parent1 x Parent2"}]. ' +
              'Nur echte, verifizierte Sorten. Keine erfundenen Daten.'
        : `I am looking for information about the cannabis strain "${query}". ` +
              'Please provide for each matching strain (max 5) the following data in JSON array format: ' +
              '[{"name": "...", "breeder": "...", "type": "Indica|Sativa|Hybrid", ' +
              '"floweringType": "Photoperiod|Autoflower", "thc": <number>, "cbd": <number>, ' +
              '"description": "...", "genetics": "Parent1 x Parent2"}]. ' +
              'Only real, verified strains. No fabricated data.'
}

function parseAIStrainResponse(text: string): DiscoveredStrain[] {
    const results: DiscoveredStrain[] = []
    const jsonMatch = text.match(/\[[\s\S]*?\]/)?.[0]
    if (!jsonMatch) return results

    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON parse boundary
        const parsed = JSON.parse(jsonMatch) as Array<Record<string, unknown>>
        if (!Array.isArray(parsed)) return results

        for (const item of parsed) {
            if (!item || typeof item !== 'object') continue
            const name = String(item.name ?? '').trim()
            if (!name) continue

            const id = `ai-${name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/-+$/, '')}`
            const rawType = String(item.type ?? '').toLowerCase()
            const type = rawType.includes('indica')
                ? 'Indica'
                : rawType.includes('sativa')
                  ? 'Sativa'
                  : 'Hybrid'

            results.push({
                id,
                name,
                breeder: String(item.breeder ?? 'Unknown'),
                type,
                floweringType:
                    String(item.floweringType ?? '') === 'Autoflower'
                        ? 'Autoflower'
                        : 'Photoperiod',
                thc: parseFloat(String(item.thc ?? 0)) || 0,
                cbd: parseFloat(String(item.cbd ?? 0)) || 0,
                description: String(item.description ?? '').slice(0, 300),
                genetics: String(item.genetics ?? ''),
                source: 'ai-lookup',
                sourceUrl: '',
                discoveredAt: new Date().toISOString(),
            })
        }
    } catch {
        // JSON parse failed
    }

    return results
}

// ---------------------------------------------------------------------------
// Recommendation scoring
// ---------------------------------------------------------------------------

/**
 * Build a preference profile from the user's library strains.
 */
export function buildUserProfile(
    strains: Array<{ type?: string; thc?: number; cbd?: number }>,
): UserStrainProfile {
    const preferredTypes: Record<string, number> = {}
    let thcSum = 0
    let cbdSum = 0
    let count = 0

    for (const s of strains) {
        if (s.type) {
            preferredTypes[s.type] = (preferredTypes[s.type] ?? 0) + 1
        }
        thcSum += s.thc ?? 0
        cbdSum += s.cbd ?? 0
        count++
    }

    return {
        preferredTypes,
        avgThc: count > 0 ? thcSum / count : 15,
        avgCbd: count > 0 ? cbdSum / count : 0.5,
        strainCount: count,
    }
}

function scoreStrain(strain: DiscoveredStrain, profile: UserStrainProfile): number {
    if (profile.strainCount === 0) return 50

    let score = 50

    const totalTyped = Object.values(profile.preferredTypes).reduce((a, b) => a + b, 0)
    if (totalTyped > 0) {
        const typeRatio = (profile.preferredTypes[strain.type] ?? 0) / totalTyped
        score += typeRatio * 25
    }

    if (strain.thc > 0 && profile.avgThc > 0) {
        const thcDiff = Math.abs(strain.thc - profile.avgThc)
        score += Math.max(0, 15 - thcDiff)
    }

    if (strain.cbd > 0 && profile.avgCbd > 0) {
        const cbdDiff = Math.abs(strain.cbd - profile.avgCbd)
        score += Math.max(0, 10 - cbdDiff * 5)
    }

    return Math.min(100, Math.max(0, Math.round(score)))
}

export function rankStrainsByRelevance(
    strains: DiscoveredStrain[],
    profile: UserStrainProfile,
): ScoredStrain[] {
    return strains
        .map((s) => ({ ...s, relevanceScore: scoreStrain(s, profile) }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

let cachedFeed: DailyStrainsFeed | null = null

export const dailyStrainsService = {
    /** Load today's 4:20 Daily Drop feed. */
    loadFeed(): DailyStrainsFeed {
        const todayKey = getTodayKey()

        // Return cached if same day
        if (cachedFeed?.dateKey === todayKey) {
            return cachedFeed
        }

        // Try localStorage
        const stored = loadFeedFromStorage()
        if (stored?.dateKey === todayKey) {
            cachedFeed = stored
            return stored
        }

        // Generate fresh daily picks
        const strains = generateDailyPicks(todayKey)
        const categories = [...new Set(strains.map((s) => s.pickCategory).filter(Boolean))]

        const feed: DailyStrainsFeed = {
            generatedAt: new Date().toISOString(),
            dateKey: todayKey,
            stats: {
                totalPicks: strains.length,
                categories: categories.filter((c): c is string => typeof c === 'string'),
                existingCatalogSize: allStrainsData.length,
            },
            strains,
        }

        cachedFeed = feed
        saveFeedToStorage(feed)
        return feed
    },

    /** Get non-dismissed daily picks. */
    getNewDiscoveries(): DiscoveredStrain[] {
        const feed = this.loadFeed()
        const dismissed = getDismissedIds()
        return feed.strains.filter((d) => !dismissed.has(d.id))
    },

    /** Get count of non-dismissed picks for badge display. */
    getNewCount(): number {
        return this.getNewDiscoveries().length
    },

    /** Dismiss a strain. */
    dismiss(strainId: string): void {
        dismissStrainId(strainId)
    },

    /** AI-powered strain search. */
    search: searchStrainsWithAI,

    /** Invalidate cache to force regeneration. */
    invalidate(): void {
        cachedFeed = null
    },
}

// ---------------------------------------------------------------------------
// DiscoveredStrain -> Strain conversion
// ---------------------------------------------------------------------------

/**
 * Resolve a DiscoveredStrain to a full Strain object.
 *
 * - For daily-pick and local-catalog sources, look up the original from
 *   allStrainsData (has all fields including agronomics, terpenes, etc.).
 * - For ai-lookup sources, build a Strain via createStrainObject with
 *   sensible defaults for the fields the AI did not provide.
 */
export function resolveDiscoveredToStrain(discovered: DiscoveredStrain): Strain {
    // Try direct catalog lookup first (daily-pick and local-catalog share IDs)
    const catalogMatch = allStrainsData.find((s) => s.id === discovered.id)
    if (catalogMatch) {
        return catalogMatch
    }

    // AI-lookup or unknown source -- build from partial data via factory
    return createStrainObject({
        id: discovered.id,
        name: discovered.name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- validated upstream
        type: discovered.type as StrainType,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- validated upstream
        floweringType: discovered.floweringType as Strain['floweringType'],
        thc: discovered.thc,
        cbd: discovered.cbd,
        description: discovered.description || undefined,
        genetics: discovered.genetics || undefined,
        lineage: discovered.breeder ? { parents: [], breeder: discovered.breeder } : undefined,
    })
}
