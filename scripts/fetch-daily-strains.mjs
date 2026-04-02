#!/usr/bin/env node
// ---------------------------------------------------------------------------
// fetch-daily-strains.mjs -- DEPRECATED (SeedFinder API dead since mid-2024)
//
// This script was used to fetch new strain data from SeedFinder.eu API.
// It has been replaced by the strains:extract / strains:generate pipeline.
// Kept for historical reference only.
//
// Usage: node scripts/fetch-daily-strains.mjs
// Env:   VITE_SEEDFINDER_API_KEY (optional -- uses public endpoints)
// ---------------------------------------------------------------------------

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ARTIFACTS_DIR = join(ROOT, 'artifacts')
const FEED_PATH = join(ARTIFACTS_DIR, 'daily-strains-feed.json')
const STRAINS_DATA_DIR = join(ROOT, 'apps', 'web', 'data', 'strains')
const PENDING_DIR = join(ROOT, 'apps', 'web', 'data', 'strains', 'pending')

const SEEDFINDER_BASE = 'https://en.seedfinder.eu/api/json'
const API_KEY = process.env.VITE_SEEDFINDER_API_KEY || ''

// SeedFinder strain list categories to scan
const STRAIN_LISTS = [
    'strain-new', // Newly added strains
    'strain-popular', // Currently popular strains
    'strain-updated', // Recently updated strains
]

const FETCH_TIMEOUT_MS = 15_000

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchJson(url) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    } finally {
        clearTimeout(timer)
    }
}

async function fetchSeedFinderList(listType) {
    const keyParam = API_KEY ? `&ac=${API_KEY}` : ''
    const url = `${SEEDFINDER_BASE}/lst/${listType}/?lang=en${keyParam}`
    console.log(
        `[fetch] ${listType}: ${SEEDFINDER_BASE}/lst/${listType}/?lang=en${API_KEY ? '&ac=***' : ''}`,
    )
    return fetchJson(url)
}

async function fetchStrainDetails(breederId, strainId) {
    const keyParam = API_KEY ? `&ac=${API_KEY}` : ''
    const url = `${SEEDFINDER_BASE}/strain-info/${strainId}/${breederId}/?lang=en${keyParam}`
    return fetchJson(url)
}

// ---------------------------------------------------------------------------
// Existing strain ID set (for duplicate detection)
// ---------------------------------------------------------------------------

function loadExistingStrainIds() {
    const ids = new Set()
    const files = [
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'q',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z',
        'numeric',
    ]

    for (const letter of files) {
        const filePath = join(STRAINS_DATA_DIR, `${letter}.ts`)
        if (!existsSync(filePath)) continue
        const content = readFileSync(filePath, 'utf-8')
        // Extract strain IDs from createStrainObject({ id: '...' })
        const idPattern = /id:\s*['"]([^'"]+)['"]/g
        let match
        while ((match = idPattern.exec(content)) !== null) {
            ids.add(match[1])
        }
    }

    // Also check pending directory
    if (existsSync(PENDING_DIR)) {
        const pendingFiles = ['pending-strains.json']
        for (const f of pendingFiles) {
            const p = join(PENDING_DIR, f)
            if (!existsSync(p)) continue
            try {
                const data = JSON.parse(readFileSync(p, 'utf-8'))
                if (Array.isArray(data)) {
                    data.forEach((s) => {
                        if (s.id) ids.add(s.id)
                    })
                }
            } catch {
                /* skip corrupt files */
            }
        }
    }

    return ids
}

// ---------------------------------------------------------------------------
// Normalize SeedFinder data to our strain format
// ---------------------------------------------------------------------------

function normalizeStrainType(sfType) {
    if (!sfType) return 'Hybrid'
    const lower = String(sfType).toLowerCase()
    if (lower.includes('indica')) return 'Indica'
    if (lower.includes('sativa')) return 'Sativa'
    return 'Hybrid'
}

function normalizeFloweringType(sfData) {
    if (!sfData) return 'Photoperiod'
    const auto = sfData.autoflowering || sfData.auto
    if (auto === true || auto === 1 || auto === 'Yes') return 'Autoflower'
    return 'Photoperiod'
}

function normalizeStrain(raw, breederId) {
    const name = String(raw.name || raw.strainname || 'Unknown').trim()
    const id = `sf-${breederId}-${String(raw.id || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 60)}`

    return {
        id,
        name,
        breeder: String(raw.breedername || raw.breeder || breederId || 'Unknown'),
        type: normalizeStrainType(raw.genotype || raw.type),
        floweringType: normalizeFloweringType(raw),
        thc: parseFloat(raw.thc) || 0,
        cbd: parseFloat(raw.cbd) || 0,
        description: String(raw.descr || raw.description || '').slice(0, 500),
        genetics: String(raw.genetics || raw.parents || ''),
        source: 'seedfinder',
        sourceUrl: `https://en.seedfinder.eu/strain-info/${raw.id || ''}/${breederId || ''}/`,
        discoveredAt: new Date().toISOString(),
        raw: {
            flowering: raw.flowering || null,
            indoor: raw.indoor || null,
            outdoor: raw.outdoor || null,
        },
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    console.log('[daily-strains] Starting automated strain discovery...')
    console.log(
        `[daily-strains] API key: ${API_KEY ? 'configured' : 'not set (public endpoints only)'}`,
    )

    mkdirSync(ARTIFACTS_DIR, { recursive: true })
    mkdirSync(PENDING_DIR, { recursive: true })

    const existingIds = loadExistingStrainIds()
    console.log(`[daily-strains] Existing strains in catalog: ${existingIds.size}`)

    const discoveries = []
    const updates = []
    const errors = []

    for (const listType of STRAIN_LISTS) {
        try {
            const data = await fetchSeedFinderList(listType)
            if (!data || typeof data !== 'object') {
                console.log(`[daily-strains] No data for ${listType}`)
                continue
            }

            // SeedFinder returns { breederId: { strainId: strainData, ... }, ... }
            const breeders = typeof data === 'object' ? Object.entries(data) : []
            let listCount = 0

            for (const [breederId, strains] of breeders) {
                if (!strains || typeof strains !== 'object') continue
                const strainEntries = Object.entries(strains)

                for (const [strainId, strainData] of strainEntries) {
                    if (!strainData || typeof strainData !== 'object') continue

                    const normalized = normalizeStrain({ ...strainData, id: strainId }, breederId)

                    if (existingIds.has(normalized.id)) {
                        // Existing strain -- check for updates
                        updates.push({
                            ...normalized,
                            updateType: listType,
                        })
                    } else {
                        discoveries.push({
                            ...normalized,
                            discoverySource: listType,
                        })
                        existingIds.add(normalized.id) // prevent duplicates within run
                    }
                    listCount++
                }
            }

            console.log(`[daily-strains] ${listType}: processed ${listCount} entries`)
        } catch (err) {
            console.error(`[daily-strains] Error fetching ${listType}:`, err.message)
            errors.push({ list: listType, error: err.message })
        }
    }

    // Fetch additional details for top discoveries (limit to 10 to avoid rate limiting)
    const topDiscoveries = discoveries.slice(0, 10)
    for (const disc of topDiscoveries) {
        try {
            const details = await fetchStrainDetails(
                disc.breeder.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                disc.id.replace(/^sf-[^-]+-/, ''),
            )
            if (details && typeof details === 'object') {
                if (details.thc) disc.thc = parseFloat(details.thc) || disc.thc
                if (details.cbd) disc.cbd = parseFloat(details.cbd) || disc.cbd
                if (details.descr) disc.description = String(details.descr).slice(0, 500)
                if (details.genetics) disc.genetics = String(details.genetics)
            }
        } catch {
            /* skip detail fetch failures */
        }
    }

    // Build feed
    const feed = {
        version: 1,
        generatedAt: new Date().toISOString(),
        stats: {
            newStrains: discoveries.length,
            updatedStrains: updates.length,
            errors: errors.length,
            existingCatalogSize: existingIds.size,
        },
        discoveries: discoveries.slice(0, 50), // cap at 50 per run
        updates: updates.slice(0, 25),
        errors,
    }

    // Write feed artifact
    writeFileSync(FEED_PATH, JSON.stringify(feed, null, 2))
    console.log(`[daily-strains] Feed written to ${FEED_PATH}`)

    // Write pending strains for later integration
    if (discoveries.length > 0) {
        const pendingPath = join(PENDING_DIR, 'pending-strains.json')
        let existing = []
        try {
            existing = JSON.parse(readFileSync(pendingPath, 'utf-8'))
        } catch {
            /* file missing or corrupt -- start fresh */
        }
        const merged = [...existing, ...discoveries]
        // Keep only last 200 pending entries
        const capped = merged.slice(-200)
        writeFileSync(pendingPath, JSON.stringify(capped, null, 2))
        console.log(
            `[daily-strains] ${discoveries.length} new strains added to pending (${capped.length} total)`,
        )
    }

    // Summary
    console.log('\n[daily-strains] === Summary ===')
    console.log(`  New strains discovered: ${discoveries.length}`)
    console.log(`  Existing strains updated: ${updates.length}`)
    console.log(`  Errors: ${errors.length}`)
    console.log(`  Catalog size: ${existingIds.size}`)

    // Exit with error if all lists failed
    if (errors.length === STRAIN_LISTS.length && discoveries.length === 0) {
        console.error('[daily-strains] All API requests failed!')
        process.exit(1)
    }
}

main().catch((err) => {
    console.error('[daily-strains] Fatal error:', err)
    process.exit(1)
})
