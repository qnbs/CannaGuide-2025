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

// Ceiling for ANY single emitted asset, whatever its extension.
//
// The per-chunk budgets above only ever looked at `.js`, so `.wasm`, `.css`,
// fonts and images were unbudgeted -- and that is not a theoretical gap. ONNX
// Runtime's `ort-wasm-simd-threaded.jsep.wasm` shipped at 25.6 MiB and no gate
// looked at it, because it is not a JS chunk. It took Cloudflare Pages rejecting
// the file at deploy time to surface it, which is the worst possible detector:
// late, host-specific, and previously swallowed by continue-on-error.
//
// 20 MiB deliberately sits BELOW Cloudflare's hard 25 MiB per-file limit, so an
// oversized asset fails here -- in the build, naming the file -- rather than at a
// deploy that only one of three hosts performs.
const MAX_ASSET_MIB = 20

async function checkAssetCeiling(distDir) {
    let entries
    try {
        entries = await readdir(distDir)
    } catch {
        console.error(`[FAIL] Cannot read ${distDir} to check asset sizes.`)
        return 1
    }

    const oversized = []
    for (const name of entries) {
        const full = join(distDir, name)
        let buf
        try {
            buf = await readFile(full)
        } catch {
            // Directories and unreadable entries are not assets; skip quietly.
            continue
        }
        const mib = buf.length / 1024 / 1024
        if (mib > MAX_ASSET_MIB) {
            oversized.push({ name, mib })
        }
    }

    if (oversized.length > 0) {
        console.error(`\n[FAIL] ${oversized.length} asset(s) exceed ${MAX_ASSET_MIB} MiB:`)
        for (const { name, mib } of oversized.sort((a, b) => b.mib - a.mib)) {
            console.error(`       ${mib.toFixed(1)} MiB  ${name}`)
        }
        console.error('')
        console.error('  A single file this large is a problem before it is a budget question:')
        console.error('  Cloudflare Pages rejects anything over 25 MiB outright.')
        console.error('  Prefer serving it from a CDN over shipping it in the bundle.')
        return 1
    }

    console.log(`[OK] No single asset exceeds ${MAX_ASSET_MIB} MiB.`)
    return 0
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

    const ceilingFailed = await checkAssetCeiling(DIST_DIR)
    if (ceilingFailed) {
        process.exit(1)
    }

    console.log('[PASS] All chunks within budget (gzip + brotli), no oversized assets.')
}

main().catch((err) => {
    console.error('[FAIL] Budget check error:', err.message)
    process.exit(1)
})
