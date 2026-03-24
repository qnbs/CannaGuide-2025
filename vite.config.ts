import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'
import type { PluginOption } from 'vite'
import { CSP, PERMISSIONS_POLICY } from './securityHeaders'

// Tauri v2 sets TAURI_ENV_PLATFORM during builds; Docker sets BUILD_BASE_PATH=/
const base = process.env.TAURI_ENV_PLATFORM
    ? '/'
    : (process.env.BUILD_BASE_PATH ?? '/CannaGuide-2025/')

// ── Manual Chunk Groups – declarative vendor split registry ─────────────
const CHUNK_GROUPS: ReadonlyArray<{ name: string; patterns: string[] }> = [
    { name: 'react', patterns: ['/react/', 'react-dom', 'react-redux'] },
    { name: 'redux', patterns: ['@reduxjs/toolkit', 'immer', 'reselect'] },
    { name: 'i18n', patterns: ['i18next', 'react-i18next'] },
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
    { name: 'radix-ui', patterns: ['@radix-ui'] },
    { name: 'sanitizer', patterns: ['dompurify'] },
    { name: 'zod', patterns: ['zod'] },
    { name: 'cmdk', patterns: ['cmdk'] },
]

function resolveManualChunk(id: string): string | undefined {
    if (id.includes('/data/strains/') && !id.endsWith('index.ts')) return 'strains-data'
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
            registerType: 'autoUpdate',
            showMaximumFileSizeToCacheInBytesWarning: false,
            injectManifest: {
                globPatterns: ['**/*.{js,css,html,ico,svg,png,webp,woff2}'],
                maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
            },
            devOptions: { enabled: false },
        }),
        // Bundle analyzer – run  ANALYZE=1 npm run build  to generate stats.html
        ...(process.env.ANALYZE
            ? [
                  visualizer({
                      filename: 'dist/stats.html',
                      open: true,
                      gzipSize: true,
                      brotliSize: true,
                      template: 'treemap',
                  }) as PluginOption,
              ]
            : []),
    ],
    server: {
        headers: { 'Content-Security-Policy': CSP, 'Permissions-Policy': PERMISSIONS_POLICY },
    },
    preview: {
        headers: { 'Content-Security-Policy': CSP, 'Permissions-Policy': PERMISSIONS_POLICY },
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
        // Local AI runtime bundles are intentionally large and loaded on demand.
        // Keep the warning threshold high enough to avoid noise from these lazy chunks.
        chunkSizeWarningLimit: 8000,
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
            '@': path.resolve('./'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        maxWorkers: 1,
        setupFiles: './vitest.setup.ts',
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
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
                lines: 25,
                functions: 25,
            },
        },
    },
})
