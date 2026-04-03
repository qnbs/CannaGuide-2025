/**
 * Baseline provenance enrichment for the strain catalog.
 *
 * Adds a minimal DataProvenance entry (provider: 'local', labVerified: false)
 * to every strain in strains.json that does not yet have one.
 *
 * This establishes provenance transparency as a baseline; strains enriched
 * via the strainHydration worker or external APIs can append additional
 * DataProvenance records on top.
 *
 * Usage:
 *   node scripts/enrich-provenance.mjs
 *   node scripts/enrich-provenance.mjs --dry-run   (print stats only, no writes)
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const strainsJsonPath = path.join(repoRoot, 'apps', 'web', 'data', 'strains', 'strains.json')

const DATA_VERSION = '2026.1'
const PROVIDER_LOCAL = 'local'

const isDryRun = process.argv.includes('--dry-run')

const run = async () => {
    const raw = await fs.readFile(strainsJsonPath, 'utf8')
    const strains = JSON.parse(raw)

    if (!Array.isArray(strains)) {
        console.error('[enrich-provenance] FAIL: strains.json is not a JSON array.')
        process.exit(1)
    }

    const fetchedAt = new Date().toISOString()
    let enrichedCount = 0
    let alreadyHadProvenance = 0

    for (const strain of strains) {
        if (!strain || typeof strain !== 'object') continue

        if (Array.isArray(strain.dataProvenance) && strain.dataProvenance.length > 0) {
            alreadyHadProvenance++
            continue
        }

        strain.dataProvenance = [
            {
                provider: PROVIDER_LOCAL,
                fetchedAt,
                externalId: strain.id ?? null,
                labVerified: false,
                confidence: 0.5,
                sourceUrl: null,
                dataVersion: DATA_VERSION,
            },
        ]
        enrichedCount++
    }

    console.log(`[enrich-provenance] Total strains: ${strains.length}`)
    console.log(`[enrich-provenance] Already had provenance: ${alreadyHadProvenance}`)
    console.log(`[enrich-provenance] Enriched with baseline provenance: ${enrichedCount}`)

    if (isDryRun) {
        console.log('[enrich-provenance] Dry-run mode -- no files written.')
        return
    }

    if (enrichedCount === 0) {
        console.log('[enrich-provenance] Nothing to update.')
        return
    }

    await fs.writeFile(strainsJsonPath, `${JSON.stringify(strains, null, 4)}\n`, 'utf8')
    console.log(`[enrich-provenance] [OK] Written ${path.relative(repoRoot, strainsJsonPath)}`)
}

run().catch((error) => {
    console.error('[enrich-provenance] FAIL:', error)
    process.exit(1)
})
