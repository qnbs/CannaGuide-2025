#!/usr/bin/env node
/**
 * Remove onnxruntime-web's bundled `.wasm` from dist/.
 *
 * Why this is deletion of dead weight rather than a workaround
 * -----------------------------------------------------------
 * Every ORT entry point in this app goes through `@cannaguide/ai-core/ml`, and
 * both loaders there set the wasm path to jsDelivr:
 *
 *   loadOnnxRuntime()  -> ort.env.wasm.wasmPaths            = ORT_WASM_CDN_BASE
 *   loadTransformers() -> env.backends.onnx.wasm.wasmPaths  = ORT_WASM_CDN_BASE
 *
 * So the copy Vite emits is never fetched. It is emitted only because ORT's JS
 * references it statically (the hashed filename -- ort-wasm-...-DC5y_g6C.wasm --
 * is the giveaway that Rollup resolved it at build time), and a runtime setting
 * cannot retract a static reference.
 *
 * Why it matters beyond size
 * --------------------------
 * `ort-wasm-simd-threaded.jsep.wasm` is 25.6 MiB. Cloudflare Pages rejects any
 * single file over 25 MiB, so while this shipped, that deploy could not succeed
 * at all -- it had been failing silently behind `continue-on-error` (see #488).
 *
 * Runs after the build, outside the cached turbo task, for the same reason the
 * metadata stamper does: a cache hit replays dist/** verbatim, so anything that
 * must be true of every build has to happen here rather than inside `vite build`.
 *
 * Usage:  node scripts/prune-bundled-ort-wasm.mjs [--dry-run]
 */

import { readdir, stat, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = path.resolve(import.meta.dirname, '..')
const ASSETS = path.join(ROOT, 'apps', 'web', 'dist', 'assets')

// Matches ORT's emitted binaries, hashed or not: ort-wasm*.wasm.
// Deliberately narrow -- this must never match an application asset.
const ORT_WASM_RE = /^ort-wasm[A-Za-z0-9._-]*\.wasm$/

const dryRun = process.argv.includes('--dry-run')

if (!existsSync(ASSETS)) {
    // Not an error: a build that produced no assets dir has bigger problems, and
    // this script is not the place to report them.
    console.log('[skip] no dist/assets -- nothing to prune.')
    process.exit(0)
}

const entries = await readdir(ASSETS)
const targets = entries.filter((name) => ORT_WASM_RE.test(name))

if (targets.length === 0) {
    console.log('[OK] No bundled onnxruntime-web wasm in dist (already served from the CDN).')
    process.exit(0)
}

let freed = 0
for (const name of targets) {
    const full = path.join(ASSETS, name)
    const { size } = await stat(full)
    freed += size
    if (dryRun) {
        console.log(`[dry-run] would remove ${name} (${(size / 1048576).toFixed(1)} MiB)`)
    } else {
        await unlink(full)
        console.log(`[OK] Removed ${name} (${(size / 1048576).toFixed(1)} MiB)`)
    }
}

console.log(
    `[OK] ${dryRun ? 'Would free' : 'Freed'} ${(freed / 1048576).toFixed(1)} MiB. ` +
        'onnxruntime-web loads its wasm from cdn.jsdelivr.net (see ORT_WASM_CDN_BASE).',
)
