/**
 * Same-origin hosting for the ONNX Runtime that `@xenova/transformers` bundles.
 *
 * transformers.js 2.17.2 depends on its own onnxruntime-web 1.14.0 (nested, not
 * the 1.30 direct dependency) and points that runtime at
 * `cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/` at module load. ORT
 * 1.14 builds its pthread worker and threaded glue from Blobs of bundled code,
 * so the only bytes it takes from that prefix are the `.wasm` binaries -- and it
 * took them from the CDN with no integrity check (GH #585, CG-AUD-20261008-045).
 *
 * ORT 1.14 has no `env.wasm.wasmBinary`, so the SRI technique used for the
 * direct runtime (#628) does not carry over. Instead the four binaries are
 * copied from the lockfile-resolved package into `dist/ort-1.14.0/` at build
 * time, each checked against the digest pinned below, and `loadTransformers`
 * points ORT at that same-origin directory. A missing, truncated, corrupted or
 * re-versioned binary fails the build before anything is uploaded.
 *
 * All four are needed: Cloudflare Pages and Vercel send COOP/COEP, so those
 * pages are cross-origin isolated and ORT picks the threaded variants there;
 * GitHub Pages is not isolated and gets the non-threaded ones.
 *
 * The digests equal the copies jsDelivr serves under @xenova/transformers@2.17.2,
 * so the bytes users run are unchanged -- only their origin is.
 */

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

export const TRANSFORMERS_ORT_VERSION = '1.14.0'

/** Directory under the app base. Must match TRANSFORMERS_ORT_WASM_DIR in ai-core's ml.ts. */
export const TRANSFORMERS_ORT_DIR = `ort-${TRANSFORMERS_ORT_VERSION}`

/** Pinned from onnxruntime-web@1.14.0/dist as resolved by pnpm-lock.yaml. */
export const TRANSFORMERS_ORT_WASM = Object.freeze({
    'ort-wasm.wasm': {
        size: 9223228,
        sha256: 'bbdcb6b3c7d294577d806077630460be4e13ca35a345acb5e81188e9649fa74a',
    },
    'ort-wasm-simd.wasm': {
        size: 10014674,
        sha256: '9bd07bababc65f53d061f457233eeae501be7ceb8a2adb9eef52d87fe776d865',
    },
    'ort-wasm-threaded.wasm': {
        size: 9149637,
        sha256: '2ee2f715093aaacc0344bfb1610313eb49a3474e8afde5e4635f30ddfc7615c8',
    },
    'ort-wasm-simd-threaded.wasm': {
        size: 9960821,
        sha256: 'ac23f2f3cbd519a65a0796f7c79eb34ead4c1f6f31eb06e14ed8a9579d697ef6',
    },
})

/**
 * The `dist/` of the onnxruntime-web that transformers.js itself resolves, or
 * null when transformers.js is not installed (lite installs stub it, see
 * optionalMlPlugin in vite.config.ts). Resolved from the transformers package,
 * not from the app, so the direct 1.30 dependency can never be picked up.
 */
export function resolveTransformersOrtPackageDir(fromFile) {
    const requireFromApp = createRequire(fromFile)
    let transformersEntry
    try {
        transformersEntry = requireFromApp.resolve('@xenova/transformers')
    } catch {
        return null
    }
    const requireFromTransformers = createRequire(transformersEntry)
    return path.dirname(requireFromTransformers.resolve('onnxruntime-web/package.json'))
}

/**
 * Read every pinned binary from `packageDir/dist` and verify version, size and
 * SHA-256. Throws on the first deviation; returns name -> bytes otherwise.
 */
export function readVerifiedTransformersOrtWasm(
    packageDir,
    manifest = TRANSFORMERS_ORT_WASM,
    version = TRANSFORMERS_ORT_VERSION,
) {
    const pkgFile = path.join(packageDir, 'package.json')
    if (!existsSync(pkgFile)) {
        throw new Error(`[transformers-ort] ${pkgFile} not found`)
    }
    const actualVersion = JSON.parse(readFileSync(pkgFile, 'utf8')).version
    if (actualVersion !== version) {
        throw new Error(
            `[transformers-ort] transformers.js resolves onnxruntime-web ${actualVersion}, pinned ${version}; ` +
                'update TRANSFORMERS_ORT_WASM and ai-core TRANSFORMERS_ORT_WASM_DIR together',
        )
    }
    const files = new Map()
    for (const [name, expected] of Object.entries(manifest)) {
        const file = path.join(packageDir, 'dist', name)
        if (!existsSync(file)) {
            throw new Error(`[transformers-ort] ${name} is missing from ${path.dirname(file)}`)
        }
        const bytes = readFileSync(file)
        if (bytes.length !== expected.size) {
            throw new Error(
                `[transformers-ort] ${name} is ${bytes.length} bytes, pinned ${expected.size}`,
            )
        }
        const digest = createHash('sha256').update(bytes).digest('hex')
        if (digest !== expected.sha256) {
            throw new Error(
                `[transformers-ort] ${name} sha256 ${digest} != pinned ${expected.sha256}`,
            )
        }
        files.set(name, bytes)
    }
    return files
}

/**
 * Emits the verified binaries as `<base>/ort-1.14.0/<name>` in production builds
 * and serves the same verified bytes from the dev server. Inert when
 * transformers.js is not installed.
 */
const DEV_PATH = new RegExp(
    `/${TRANSFORMERS_ORT_DIR.replaceAll('.', '\\.')}/(ort-wasm[\\w-]*\\.wasm)$`,
)

export function transformersOrtAssetsPlugin(fromFile) {
    let files = null
    let isBuild = false
    const load = () => {
        if (files) return files
        const packageDir = resolveTransformersOrtPackageDir(fromFile)
        files = packageDir ? readVerifiedTransformersOrtWasm(packageDir) : new Map()
        return files
    }
    return {
        name: 'transformers-ort-same-origin',
        configResolved(config) {
            isBuild = config.command === 'build'
        },
        buildStart() {
            // Verify up front so a bad binary stops the build before any output.
            // Dev and vitest stay lazy: they hash only when a binary is requested.
            if (isBuild) load()
        },
        generateBundle() {
            if (!isBuild) return
            for (const [name, bytes] of load()) {
                this.emitFile({
                    type: 'asset',
                    fileName: `${TRANSFORMERS_ORT_DIR}/${name}`,
                    source: bytes,
                })
            }
        },
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const match = DEV_PATH.exec(req.url?.split('?')[0] ?? '')
                const bytes = match ? load().get(match[1]) : undefined
                if (!bytes) return next()
                res.setHeader('Content-Type', 'application/wasm')
                res.end(bytes)
            })
        },
    }
}
