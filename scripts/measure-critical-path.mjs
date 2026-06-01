#!/usr/bin/env node
/**
 * Measures approximate initial-load JS size (critical path chunks).
 *
 * Advisory by default — prints metrics and exits 0.
 * Set CRITICAL_PATH_STRICT=1 to fail when brotli exceeds CRITICAL_PATH_BROTLI_KB (default 1500).
 *
 * Usage: node scripts/measure-critical-path.mjs [distAssetsDir]
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'node:zlib'

const DIST_DIR = process.argv[2] || 'apps/web/dist/assets'
const STRICT = process.env.CRITICAL_PATH_STRICT === '1'
const BROTLI_BUDGET_KB = Number(process.env.CRITICAL_PATH_BROTLI_KB || '1500')
const RAW_BUDGET_KB = Number(process.env.CRITICAL_PATH_RAW_KB || '4096')

/** Chunks loaded on first paint (heuristic — index + shared vendor, not lazy AI/3D/locales). */
const CRITICAL_PATTERN = /^(index-|vendor-|redux-|react-|i18n-core|i18n\.|main-)/i

const EXCLUDE_PATTERN = /(ai-runtime|strains-data|three|locale-(de|es|fr|nl))/i

function brotliSync(buf) {
    return brotliCompressSync(buf, {
        params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
    })
}

async function getJsFiles(dir) {
    try {
        const entries = await readdir(dir)
        return entries.filter((f) => f.endsWith('.js'))
    } catch {
        return []
    }
}

async function main() {
    const files = await getJsFiles(DIST_DIR)
    if (files.length === 0) {
        console.error(`[WARN] No JS files in ${DIST_DIR} — run pnpm run build first`)
        process.exit(STRICT ? 1 : 0)
    }

    const rows = []
    let totalRaw = 0
    let totalGzip = 0
    let totalBrotli = 0

    for (const file of files) {
        if (EXCLUDE_PATTERN.test(file)) continue
        if (!CRITICAL_PATTERN.test(file) && !file.startsWith('index-')) continue

        const raw = await readFile(join(DIST_DIR, file))
        const gz = gzipSync(raw)
        const br = brotliSync(raw)
        totalRaw += raw.length
        totalGzip += gz.length
        totalBrotli += br.length
        rows.push({
            file,
            rawKB: raw.length / 1024,
            gzipKB: gz.length / 1024,
            brotliKB: br.length / 1024,
        })
    }

    rows.sort((a, b) => b.brotliKB - a.brotliKB)

    const report = {
        measuredAt: new Date().toISOString(),
        distDir: DIST_DIR,
        chunkCount: rows.length,
        totals: {
            rawKB: totalRaw / 1024,
            gzipKB: totalGzip / 1024,
            brotliKB: totalBrotli / 1024,
        },
        budgets: {
            brotliKB: BROTLI_BUDGET_KB,
            rawKB: RAW_BUDGET_KB,
            strict: STRICT,
        },
        chunks: rows.map((r) => ({
            file: r.file,
            rawKB: +r.rawKB.toFixed(1),
            gzipKB: +r.gzipKB.toFixed(1),
            brotliKB: +r.brotliKB.toFixed(1),
        })),
    }

    console.log('\nCRITICAL PATH (advisory)')
    console.log('========================')
    for (const r of rows.slice(0, 12)) {
        console.log(
            `  ${r.file.padEnd(44)} raw ${r.rawKB.toFixed(1).padStart(7)} KB  brotli ${r.brotliKB.toFixed(1).padStart(7)} KB`,
        )
    }
    if (rows.length > 12) console.log(`  ... +${rows.length - 12} more chunks`)
    console.log('')
    console.log(
        `  TOTAL: raw ${(totalRaw / 1024).toFixed(1)} KB | gzip ${(totalGzip / 1024).toFixed(1)} KB | brotli ${(totalBrotli / 1024).toFixed(1)} KB`,
    )
    console.log(`  Budget (relaxed): brotli < ${BROTLI_BUDGET_KB} KB, raw < ${RAW_BUDGET_KB} KB`)
    console.log('')

    const artifactsDir = 'artifacts'
    await mkdir(artifactsDir, { recursive: true })
    const outPath = join(artifactsDir, 'critical-path-latest.json')
    await writeFile(outPath, JSON.stringify(report, null, 2) + '\n')
    console.log(`[OK] Wrote ${outPath}`)

    const overBrotli = totalBrotli / 1024 > BROTLI_BUDGET_KB
    const overRaw = totalRaw / 1024 > RAW_BUDGET_KB
    if (overBrotli || overRaw) {
        console.log('[WARN] Critical path exceeds relaxed budget (informational only)')
        if (STRICT) {
            console.error('[FAIL] CRITICAL_PATH_STRICT=1 — gate failed')
            process.exit(1)
        }
    } else {
        console.log('[OK] Within relaxed critical-path budget')
    }

    process.exit(0)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
