#!/usr/bin/env node
/**
 * Bundle Budget Gate -- fails CI if any chunk exceeds its size limit.
 *
 * Usage:  node scripts/check-bundle-budget.mjs [distDir]
 *
 * Budget rules:
 *   Gzip:   Main < 300 KB | Vendor < 500 KB
 *   Brotli: Main < 280 KB | Vendor < 450 KB
 *   Lazy chunks: explicit per-chunk ceilings (see LAZY_BUDGETS_GZIP_KB)
 *
 * Why per-chunk ceilings instead of an exempt list: `ai-runtime` was exempt *by
 * name*, and grew to 6.74 MB raw / 2.29 MB gzip -- roughly 2.4x its size at the
 * previous audit -- while this gate printed [PASS] the whole time. A budget the
 * largest artifact is excused from is not a budget. Lazy chunks legitimately do
 * not belong under the vendor limit, so they get their own numbers rather than
 * a pass.
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

// Lazy-loaded chunks are not in the critical path, so the vendor limit does not
// apply -- but they are still bounded. Numbers are set just above the measured
// size at the time of writing, so growth has to be deliberate rather than silent.
// Raising one is a decision that shows up in review; it is not a config detail.
const LAZY_BUDGETS_GZIP_KB = {
    'ai-runtime': 2400, // measured 2293 KB gz -- WebLLM + tvmjs
    transformers: 240, // measured 216 KB gz
    'ort.bundle.min': 160,
    three: 160,
    'strains-data': 220,
    'locale-': 220,
}

function lazyBudgetFor(filename) {
    const hit = Object.keys(LAZY_BUDGETS_GZIP_KB).find((chunk) => filename.includes(chunk))
    return hit ? { chunk: hit, limit: LAZY_BUDGETS_GZIP_KB[hit] } : null
}

async function getJsFiles(dir) {
    try {
        const entries = await readdir(dir)
        return entries.filter((f) => f.endsWith('.js'))
    } catch {
        return []
    }
}

// Total bytes the service worker downloads at install, for every visitor, before
// any interaction. Nothing measured this before: the only precache constraint was
// workbox's per-file `maximumFileSizeToCacheInBytes`, an inclusion filter rather
// than a gate, with its size warning explicitly silenced. Measured 247 entries /
// 19.15 MiB, of which 8.57 MiB was lazily-imported AI runtime that the precache
// pulled in regardless. After excluding those: 243 entries / 10.57 MiB.
const PRECACHE_BUDGET_MIB = 12
const PRECACHE_ENTRY_RE = /\{"revision":(?:"[0-9a-f]*"|null),"url":"([^"]+)"\}/g

async function checkPrecacheBudget(distDir) {
    const swPath = join(distDir, '..', 'sw.js')
    let sw
    try {
        sw = await readFile(swPath, 'utf8')
    } catch {
        // Fails closed. A missing service worker used to return 0 here, so a
        // build that produced no sw.js at all reported "precache within budget"
        // after measuring nothing -- the exact fail-open this gate exists to
        // prevent, in the gate itself.
        console.error(`[FAIL] No service worker at ${swPath}.`)
        console.error('[FAIL] Cannot measure the precache, so cannot claim it is within budget.')
        return 1
    }

    const workboxUrls = [...sw.matchAll(PRECACHE_ENTRY_RE)].map((m) => m[1])
    if (workboxUrls.length === 0) {
        console.error('[FAIL] Could not parse the precache manifest from sw.js.')
        console.error('[FAIL] Refusing to pass a budget that measured nothing.')
        return 1
    }

    // The service worker installs `[...APP_SHELL_URLS, ...THIRD_PARTY_URLS,
    // ...workboxUrls]`, but only the workbox manifest was measured here. The app
    // shell was therefore downloaded on install and counted as zero, so the gate
    // could report the precache within 12 MiB while the real install payload was
    // larger -- under-measuring in the one direction a budget must never be wrong.
    //
    // Read from the SOURCE service worker, not the built one. VitePWA runs in
    // `injectManifest` mode with build.minify = 'esbuild', so the shipped sw.js is
    // bundled and its top-level identifiers are mangled -- `APP_SHELL_URLS` does
    // not survive as a name. The injected manifest does survive (it is data, not an
    // identifier), which is why the regex above can read the built file.
    //
    // Parsing the source keeps a single source of truth: a URL added to
    // APP_SHELL_URLS is measured without touching this script.
    const swSourcePath = join(distDir, '..', '..', 'public', 'sw.js')
    let swSource
    try {
        swSource = await readFile(swSourcePath, 'utf8')
    } catch {
        console.error(`[FAIL] No service worker source at ${swSourcePath}.`)
        console.error('[FAIL] The app shell is part of the install payload and must be measured.')
        return 1
    }
    const shellMatch = swSource.match(/const APP_SHELL_URLS\s*=\s*\[([^\]]*)\]/)
    if (!shellMatch) {
        // Fails closed, like every other unknown in this function. If the shell
        // list cannot be found, the measurement is incomplete by an unknown amount.
        console.error('[FAIL] Could not locate APP_SHELL_URLS in the service worker source.')
        console.error('[FAIL] The install payload includes it, so it must be measured.')
        return 1
    }
    const shellUrls = [...shellMatch[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map((m) => m[1] ?? m[2])

    // Dedupe the way the service worker does (`new Set()` over the concatenation),
    // after normalising './x' and '/x' to 'x' so the same file is not counted twice
    // when it appears in both lists under different spellings. './' is the
    // navigation entry, served by index.html.
    const normalise = (u) => u.replace(/^\.?\//, '') || 'index.html'
    const urls = [...new Set([...shellUrls, ...workboxUrls].map(normalise))]

    // THIRD_PARTY_URLS are remote and cannot be measured from dist/. They are
    // named here so the omission is a stated limitation rather than a silent one.
    if (/const THIRD_PARTY_URLS\s*=\s*\[\s*[^\]\s]/.test(swSource)) {
        console.log(
            '[INFO] THIRD_PARTY_URLS are installed but not measured (remote, not in dist/).',
        )
    }

    let total = 0
    const unresolved = []
    for (const url of urls) {
        try {
            const buf = await readFile(join(distDir, '..', url.replace(/^\//, '')))
            total += buf.length
        } catch {
            // Also fails closed. Silently skipping an unreadable entry means the
            // measured total is smaller than what the service worker will
            // actually download, so a partial measurement could pass a budget the
            // real install payload exceeds.
            unresolved.push(url)
        }
    }

    if (unresolved.length > 0) {
        console.error(`[FAIL] ${unresolved.length} precache entr(ies) could not be measured:`)
        for (const url of unresolved.slice(0, 10)) console.error(`       - ${url}`)
        if (unresolved.length > 10) console.error(`       ... and ${unresolved.length - 10} more`)
        console.error('[FAIL] A partial measurement cannot establish that the budget is met.')
        return 1
    }

    const mib = total / 1024 / 1024
    console.log(
        `\nPrecache: ${urls.length} entries, ${mib.toFixed(2)} MiB (budget ${PRECACHE_BUDGET_MIB} MiB)`,
    )

    if (mib > PRECACHE_BUDGET_MIB) {
        console.error(
            `[FAIL] Precache is ${mib.toFixed(2)} MiB, over the ${PRECACHE_BUDGET_MIB} MiB budget.`,
        )
        console.error('[FAIL] Every visitor downloads this at service-worker install.')
        console.error(
            '[FIX] Add the offending chunk to injectManifest.globIgnores in vite.config.ts',
        )
        console.error('      and let public/sw.js cache it on demand instead.')
        return 1
    }

    console.log('[OK] Precache within budget.')
    return 0
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
        const lazy = lazyBudgetFor(file)
        const isMain = isMainChunk(file)

        // Lazy chunks are bounded by their own gzip ceiling; brotli is not
        // separately budgeted for them, since gzip is the figure that moves.
        const gzipBudgetKB = lazy
            ? lazy.limit
            : isMain
              ? MAIN_BUDGET_GZIP_KB
              : VENDOR_BUDGET_GZIP_KB
        const brotliBudgetKB = lazy
            ? null
            : isMain
              ? MAIN_BUDGET_BROTLI_KB
              : VENDOR_BUDGET_BROTLI_KB

        const overGzip = gzipped.length > gzipBudgetKB * 1024
        const overBrotli = brotliBudgetKB !== null && brotli.length > brotliBudgetKB * 1024
        const overBudget = overGzip || overBrotli

        results.push({
            file,
            rawKB,
            gzipKB,
            brotliKB,
            gzipBudgetKB,
            brotliBudgetKB: brotliBudgetKB ?? 'lazy',
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

    // Runs regardless of per-chunk results: a per-file pass says nothing about
    // what the service worker actually makes every visitor download.
    failures += await checkPrecacheBudget(DIST_DIR)

    if (failures > 0) {
        console.error(`\n[FAIL] ${failures} budget violation(s).`)
        console.error('')
        console.error('  Suggestions:')
        console.error('    1. Run: pnpm --filter @cannaguide/web build:analyze')
        console.error('       to inspect the treemap and find large dependencies.')
        console.error('    2. Consider dynamic import() to lazy-load heavy modules.')
        console.error('    3. Check for accidental barrel re-exports pulling in unused code.')
        process.exit(1)
    }

    console.log('\n[PASS] All chunks and the precache are within budget.')
}

main().catch((err) => {
    console.error('[FAIL] Budget check error:', err.message)
    process.exit(1)
})
