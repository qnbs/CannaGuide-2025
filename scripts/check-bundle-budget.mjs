#!/usr/bin/env node
/**
 * Bundle Budget Gate -- fails CI if any chunk exceeds its gzipped size limit.
 *
 * Usage:  node scripts/check-bundle-budget.mjs [distDir]
 *
 * Budget rules (gzipped KB):
 *   - Main/index chunk:   < 300 KB
 *   - Any vendor chunk:   < 500 KB
 *   - ai-runtime chunk:   exempt (lazy-loaded, never in critical path)
 *   - strains-data chunk: exempt (lazy-loaded dataset)
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST_DIR = process.argv[2] || 'apps/web/dist/assets'

// Budget limits in bytes (gzipped)
const MAIN_BUDGET_KB = 300
const VENDOR_BUDGET_KB = 500

// Chunks exempt from budget enforcement (lazy-loaded, not in critical path)
const EXEMPT_CHUNKS = ['ai-runtime', 'strains-data', 'three']

async function getJsFiles(dir) {
    try {
        const entries = await readdir(dir)
        return entries.filter((f) => f.endsWith('.js'))
    } catch {
        return []
    }
}

function isExempt(filename) {
    return EXEMPT_CHUNKS.some((chunk) => filename.includes(chunk))
}

function isMainChunk(filename) {
    // Vite names the entry chunk "index-<hash>.js"
    return filename.startsWith('index-') || filename.startsWith('index.')
}

async function main() {
    const files = await getJsFiles(DIST_DIR)
    if (files.length === 0) {
        console.error(`[FAIL] No JS files found in ${DIST_DIR}`)
        process.exit(1)
    }

    let failures = 0
    const results = []

    for (const file of files) {
        const filePath = join(DIST_DIR, file)
        const raw = await readFile(filePath)
        const gzipped = gzipSync(raw)
        const gzipKB = (gzipped.length / 1024).toFixed(1)
        const rawKB = (raw.length / 1024).toFixed(1)
        const exempt = isExempt(file)
        const isMain = isMainChunk(file)
        const budgetKB = isMain ? MAIN_BUDGET_KB : VENDOR_BUDGET_KB
        const overBudget = !exempt && gzipped.length > budgetKB * 1024

        results.push({ file, rawKB, gzipKB, budgetKB: exempt ? 'exempt' : budgetKB, overBudget })

        if (overBudget) {
            failures++
        }
    }

    // Print table
    console.log('\n--- Bundle Budget Report ---\n')
    console.log(
        'File'.padEnd(45) +
            'Raw (KB)'.padStart(10) +
            'Gzip (KB)'.padStart(11) +
            'Budget'.padStart(10) +
            'Status'.padStart(10),
    )
    console.log('-'.repeat(86))

    for (const r of results.sort((a, b) => parseFloat(b.gzipKB) - parseFloat(a.gzipKB))) {
        const status = r.overBudget ? '[OVER]' : '[OK]'
        console.log(
            r.file.slice(0, 44).padEnd(45) +
                r.rawKB.padStart(10) +
                r.gzipKB.padStart(11) +
                String(r.budgetKB).padStart(10) +
                status.padStart(10),
        )
    }

    console.log('')

    if (failures > 0) {
        console.error(`[FAIL] ${failures} chunk(s) exceed budget. Split or lazy-load them.`)
        process.exit(1)
    }

    console.log('[PASS] All chunks within budget.')
}

main().catch((err) => {
    console.error('[FAIL] Budget check error:', err.message)
    process.exit(1)
})
