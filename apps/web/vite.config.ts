import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import { fileURLToPath } from 'url'
import type { PluginOption } from 'vite'

const __webRoot = path.dirname(fileURLToPath(import.meta.url))
import { CSP, DEV_CSP, PERMISSIONS_POLICY, COEP, HSTS, REFERRER_POLICY } from './securityHeaders'

// ML packages that may not be installed (they live in @cannaguide/ai-core optionalDeps).
// When missing, dynamic imports at runtime will fail gracefully — the app guards these.
const OPTIONAL_ML_EXTERNALS = [
    '@tensorflow/tfjs',
    '@xenova/transformers',
    '@mlc-ai/web-llm',
    'onnxruntime-web',
    '@picovoice/porcupine-web',
    '@picovoice/web-voice-processor',
]

// Tauri packages that are only available in the desktop workspace.
// When building/testing the web app, these need stubs.
const OPTIONAL_TAURI_EXTERNALS = [
    '@tauri-apps/plugin-notification',
    '@tauri-apps/plugin-dialog',
    '@tauri-apps/api/core',
]

// Resolve which optional modules are actually missing so we can stub them at build time.
function resolveMissingMlModules(): string[] {
    const all = [...OPTIONAL_ML_EXTERNALS, ...OPTIONAL_TAURI_EXTERNALS]
    const missing: string[] = []
    for (const mod of all) {
        try {
            require.resolve(mod)
        } catch {
            missing.push(mod)
        }
    }
    return missing
}

// Vite plugin that stubs missing optional modules with a throw at runtime.
// This allows the build to succeed when heavy ML deps or Tauri plugins are not installed.
function optionalMlPlugin(): PluginOption {
    const missing = resolveMissingMlModules()
    if (missing.length === 0) return null
    return {
        name: 'optional-ml-stub',
        enforce: 'pre',
        resolveId(source) {
            if (missing.includes(source)) return `\0stub:${source}`
            return null
        },
        load(id) {
            if (id.startsWith('\0stub:')) {
                const mod = id.slice(6)
                return `throw new Error('[CannaGuide] Optional module "${mod}" is not installed.');`
            }
            return null
        },
    }
}

const base = process.env.BUILD_BASE_PATH ?? '/CannaGuide-2025/'

// In dev mode the restrictive CSP meta tag in index.html blocks Vite's inline
// HMR preamble script.  Strip it so only the relaxed HTTP header (DEV_CSP) applies.
function devCspPlugin(): PluginOption {
    let isDev = false
    return {
        name: 'dev-strip-csp-meta',
        configResolved(config) {
            isDev = config.command === 'serve'
        },
        transformIndexHtml(html) {
            if (!isDev) return html
            return html.replace(
                /<meta\s+http-equiv="Content-Security-Policy"[^>]*>/i,
                '<!-- CSP meta stripped in dev — HTTP header provides relaxed policy -->',
            )
        },
    }
}

// ── Manual Chunk Groups – declarative vendor split registry ─────────────
// NOTE: React, Redux, Radix UI, and other core framework libraries are
// intentionally NOT listed here.  Rollup's automatic splitting handles
// their execution order correctly and avoids circular chunk dependencies
// that break module-level React hook access (e.g. useLayoutEffect in
// react-redux).  Only truly isolated, lazy-loaded vendor bundles belong here.
const CHUNK_GROUPS: ReadonlyArray<{ name: string; patterns: string[] }> = [
    { name: 'charts-d3', patterns: ['d3-', '/d3/'] },
    { name: 'charts-recharts', patterns: ['recharts', 'victory-vendor'] },
    { name: 'ai', patterns: ['@google/genai'] },
    {
        name: 'ai-runtime',
        patterns: [
            '@xenova/transformers',
            'onnxruntime-web',
            'onnxruntime-node',
            '@mlc-ai/web-llm',
        ],
    },
    { name: 'pdf-export', patterns: ['jspdf', 'jspdf-autotable'] },
    { name: 'image-export', patterns: ['html2canvas'] },
    { name: 'image-compress', patterns: ['browser-image-compression'] },
    { name: 'three', patterns: ['three'] },
    { name: 'sync', patterns: ['yjs', 'y-indexeddb', 'lib0'] },
]

function resolveManualChunk(id: string): string | undefined {
    if (id.includes('/data/strains/') && !id.endsWith('index.ts')) return 'strains-data'
    // Split locale bundles into per-language chunks (de.js, es.js, fr.js, nl.js)
    const localeMatch = id.match(/\/locales\/(de|es|fr|nl)\//)
    if (localeMatch) return `locale-${localeMatch[1]}`
    if (!id.includes('node_modules')) return undefined
    for (const group of CHUNK_GROUPS) {
        if (group.patterns.some((p) => id.includes(p))) return group.name
    }
    return undefined
}

// https://vitejs.dev/config/
export default defineConfig({
    base,
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
    },
    plugins: [
        optionalMlPlugin(),
        devCspPlugin(),
        react({
            // React 19 Compiler – automatically memoises components and hooks
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'public',
            filename: 'sw.js',
            manifest: false,
            registerType: 'prompt',
            showMaximumFileSizeToCacheInBytesWarning: false,
            injectManifest: {
                globPatterns: ['**/*.{js,css,html,ico,svg,png,webp,woff2}'],
                maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
            },
            devOptions: { enabled: false },
        }),
        // Bundle analyzer -- run  ANALYZE=1 pnpm run build  to generate stats.html
        ...(process.env.ANALYZE
            ? [
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- rollup-plugin-visualizer returns compatible PluginOption
                  visualizer({
                      filename: 'dist/stats.html',
                      open: true,
                      gzipSize: true,
                      brotliSize: true,
                      template: 'treemap',
                  }) as unknown as PluginOption,
              ]
            : []),
    ],
    server: {
        headers: {
            'Content-Security-Policy': DEV_CSP,
            'Permissions-Policy': PERMISSIONS_POLICY,
            'Cross-Origin-Embedder-Policy': COEP,
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Strict-Transport-Security': HSTS,
            'Referrer-Policy': REFERRER_POLICY,
            'X-DNS-Prefetch-Control': 'on',
        },
    },
    preview: {
        headers: {
            'Content-Security-Policy': CSP,
            'Permissions-Policy': PERMISSIONS_POLICY,
            'Cross-Origin-Embedder-Policy': COEP,
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Strict-Transport-Security': HSTS,
            'Referrer-Policy': REFERRER_POLICY,
            'X-DNS-Prefetch-Control': 'on',
        },
    },

    // ── ESBuild Transform ───────────────────────────────────────────────
    esbuild: {
        drop: ['debugger'],
        pure: ['console.debug', 'console.log'],
    },

    // ── Build Optimisations ──────────────────────────────────────────────
    build: {
        // Target modern browsers – enables smaller output (top-level await, ??=, etc.)
        target: 'esnext',
        // Minify with esbuild (default, fastest)
        minify: 'esbuild',
        // Local AI runtime bundles are lazy-loaded on demand.
        // Budget enforcement is handled by scripts/check-bundle-budget.mjs in CI.
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            onwarn(warning, warn) {
                if (
                    warning.code === 'EVAL' &&
                    typeof warning.id === 'string' &&
                    warning.id.includes('onnxruntime-web')
                ) {
                    return
                }

                warn(warning)
            },
            output: {
                manualChunks: resolveManualChunk,
            },
        },
    },

    // ── Worker bundling ──────────────────────────────────────────────────
    worker: {
        format: 'es',
    },

    // ── Dependency pre-bundling hints ────────────────────────────────────
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-redux',
            '@reduxjs/toolkit',
            'i18next',
            'react-i18next',
        ],
        exclude: ['@google/genai', '@xenova/transformers', '@mlc-ai/web-llm', 'onnxruntime-web'],
    },

    resolve: {
        alias: {
            '@': __webRoot,
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        pool: 'forks',
        maxWorkers: 1,
        testTimeout: 30_000,
        teardownTimeout: 3000,
        setupFiles: path.join(__webRoot, 'vitest.setup.ts'),
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/.stryker-tmp/**',
            'tests/e2e/**',
        ],
        coverage: {
            provider: 'v8' as const,
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: [
                'services/**/*.ts',
                'hooks/**/*.ts',
                'stores/**/*.ts',
                'components/**/*.tsx',
                'utils/**/*.ts',
                'lib/**/*.ts',
            ],
            exclude: ['tests/**', '**/*.d.ts'],
            thresholds: {
                lines: 30,
                functions: 25,
                branches: 15,
                statements: 25,
            },
        },
    },
})
