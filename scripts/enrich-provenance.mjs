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
 *   node scripts/enrich-provenance.mjs --report    (print confidence histogram)
 *   node scripts/enrich-provenance.mjs --min-confidence=0.4 (gate, fails on <)
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
const isReport = process.argv.includes('--report')
const minConfidenceArg = process.argv.find((a) => a.startsWith('--min-confidence='))
const minConfidence = minConfidenceArg
    ? Number.parseFloat(minConfidenceArg.split('=')[1])
    : null

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

    // Confidence histogram + gate.
    if (isReport || minConfidence !== null) {
        const buckets = { '0.0-0.2': 0, '0.2-0.4': 0, '0.4-0.6': 0, '0.6-0.8': 0, '0.8-1.0': 0 }
        let belowGate = 0
        let strainsWithProvenance = 0
        for (const strain of strains) {
            if (!Array.isArray(strain.dataProvenance) || strain.dataProvenance.length === 0) {
                continue
            }
            strainsWithProvenance++
            const maxConf = strain.dataProvenance.reduce(
                (max, p) => Math.max(max, typeof p.confidence === 'number' ? p.confidence : 0),
                0,
            )
            if (maxConf < 0.2) buckets['0.0-0.2']++
            else if (maxConf < 0.4) buckets['0.2-0.4']++
            else if (maxConf < 0.6) buckets['0.4-0.6']++
            else if (maxConf < 0.8) buckets['0.6-0.8']++
            else buckets['0.8-1.0']++
            if (minConfidence !== null && maxConf < minConfidence) belowGate++
        }
        console.log('[enrich-provenance] Confidence histogram (max-confidence per strain):')
        for (const [range, count] of Object.entries(buckets)) {
            console.log(`  ${range}: ${count}`)
        }
        console.log(`[enrich-provenance] Strains with provenance: ${strainsWithProvenance}`)
        if (minConfidence !== null) {
            console.log(
                `[enrich-provenance] Strains below confidence gate (${minConfidence}): ${belowGate}`,
            )
            if (belowGate > 0) {
                console.error(
                    `[enrich-provenance] FAIL: ${belowGate} strains have max-confidence < ${minConfidence}.`,
                )
                process.exit(1)
            }
        }
    }

    if (isDryRun || isReport) {
        console.log('[enrich-provenance] Dry-run/report mode -- no files written.')
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
