#!/usr/bin/env node
/**
 * Bundle Budget Gate -- fails CI if any chunk exceeds its size limit.
 *
 * Usage:  node scripts/check-bundle-budget.mjs [distDir]
 *
 * Budget rules:
 *   Gzip:   Main < 300 KB | Vendor < 500 KB
 *   Brotli: Main < 280 KB | Vendor < 450 KB
 *   Exempt: ai-runtime, strains-data, three, locale-* (lazy-loaded)
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'node:zlib'

const DIST_DIR = process.argv[2] || 'apps/web/dist/assets'

// Budget limits (KB)
const MAIN_BUDGET_GZIP_KB = 300
const VENDOR_BUDGET_GZIP_KB = 500
const MAIN_BUDGET_BROTLI_KB = 280
const VENDOR_BUDGET_BROTLI_KB = 450

// Chunks exempt from budget enforcement (lazy-loaded, not in critical path)
const EXEMPT_CHUNKS = ['ai-runtime', 'strains-data', 'three', 'locale-']

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

function brotliSync(buf) {
    return brotliCompressSync(buf, {
        params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
    })
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
        const brotli = brotliSync(raw)
        const rawKB = (raw.length / 1024).toFixed(1)
        const gzipKB = (gzipped.length / 1024).toFixed(1)
        const brotliKB = (brotli.length / 1024).toFixed(1)
        const exempt = isExempt(file)
        const isMain = isMainChunk(file)

        const gzipBudgetKB = isMain ? MAIN_BUDGET_GZIP_KB : VENDOR_BUDGET_GZIP_KB
        const brotliBudgetKB = isMain ? MAIN_BUDGET_BROTLI_KB : VENDOR_BUDGET_BROTLI_KB
        const overGzip = !exempt && gzipped.length > gzipBudgetKB * 1024
        const overBrotli = !exempt && brotli.length > brotliBudgetKB * 1024
        const overBudget = overGzip || overBrotli

        results.push({
            file,
            rawKB,
            gzipKB,
            brotliKB,
            gzipBudgetKB: exempt ? 'exempt' : gzipBudgetKB,
            brotliBudgetKB: exempt ? 'exempt' : brotliBudgetKB,
            overBudget,
            overGzip,
            overBrotli,
        })

        if (overBudget) {
            failures++
        }
    }

    // Print table
    console.log('\n--- Bundle Budget Report ---\n')
    console.log(
        'File'.padEnd(45) +
            'Raw'.padStart(8) +
            'Gzip'.padStart(8) +
            'Brotli'.padStart(8) +
            'Gz Lim'.padStart(8) +
            'Br Lim'.padStart(8) +
            'Status'.padStart(8),
    )
    console.log('-'.repeat(93))

    for (const r of results.sort((a, b) => parseFloat(b.gzipKB) - parseFloat(a.gzipKB))) {
        const status = r.overBudget ? '[OVER]' : '[OK]'
        console.log(
            r.file.slice(0, 44).padEnd(45) +
                r.rawKB.padStart(8) +
                r.gzipKB.padStart(8) +
                r.brotliKB.padStart(8) +
                String(r.gzipBudgetKB).padStart(8) +
                String(r.brotliBudgetKB).padStart(8) +
                status.padStart(8),
        )
    }

    console.log('')

    if (failures > 0) {
        console.error(`[FAIL] ${failures} chunk(s) exceed budget.`)
        console.error('')
        console.error('  Suggestions:')
        console.error('    1. Run: pnpm --filter @cannaguide/web build:analyze')
        console.error('       to inspect the treemap and find large dependencies.')
        console.error('    2. Consider dynamic import() to lazy-load heavy modules.')
        console.error('    3. Check for accidental barrel re-exports pulling in unused code.')
        process.exit(1)
    }

    console.log('[PASS] All chunks within budget (gzip + brotli).')
}

main().catch((err) => {
    console.error('[FAIL] Budget check error:', err.message)
    process.exit(1)
})
