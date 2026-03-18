import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import viteImagemin from 'vite-plugin-imagemin'
import path from 'path'
import type { PluginOption } from 'vite'

const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://generativelanguage.googleapis.com https://api.openai.com https://api.x.ai https://api.anthropic.com https://huggingface.co https://cdn-lfs.huggingface.co https://huggingfaceusercontent.com; worker-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
const PERMISSIONS = 'accelerometer=(), ambient-light-sensor=(), autoplay=(self), bluetooth=(self), camera=(self), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), magnetometer=(), microphone=(self), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), screen-wake-lock=(self), usb=(), xr-spatial-tracking=(), gyroscope=()'

// Tauri v2 sets TAURI_ENV_PLATFORM during builds; Docker sets BUILD_BASE_PATH=/
const base = process.env.TAURI_ENV_PLATFORM
  ? '/'
  : (process.env.BUILD_BASE_PATH ?? '/CannaGuide-2025/')

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
    viteImagemin({
      verbose: false,
      webp: { quality: 82 },
      mozjpeg: { quality: 82 },
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
      ? [visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
        }) as PluginOption]
      : []),
  ],
  server: {
    headers: { 'Content-Security-Policy': CSP, 'Permissions-Policy': PERMISSIONS },
  },
  preview: {
    headers: { 'Content-Security-Policy': CSP, 'Permissions-Policy': PERMISSIONS },
  },

  // ── ESBuild Transform ───────────────────────────────────────────────
  esbuild: {
    drop: ['debugger'],
    pure: ['console.debug'],
  },

  // ── Build Optimisations ──────────────────────────────────────────────
  build: {
    // Target modern browsers – enables smaller output (top-level await, ??=, etc.)
    target: 'esnext',
    // Minify with esbuild (default, fastest)
    minify: 'esbuild',
    // Warn when a chunk exceeds 250 kB (gzip ~80 kB)
    chunkSizeWarningLimit: 250,
    rollupOptions: {
      output: {
        // ── Manual Chunks – isolate heavy / rarely-changing vendor libs ──
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          // React runtime core
          if (id.includes('/react/') || id.includes('react-dom') || id.includes('react-redux')) {
            return 'react'
          }
          // State management
          if (id.includes('@reduxjs/toolkit') || id.includes('immer') || id.includes('reselect')) {
            return 'redux'
          }
          // i18n runtime (translations are already code-split by locale)
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n'
          }
          // D3 suite – loaded only by chart / genealogy views (lazy)
          if (id.includes('d3-') || id.includes('/d3/')) {
            return 'charts-d3'
          }
          // Recharts – only used by VPDChart (lazy via PlantsView → DetailedPlantView)
          if (id.includes('recharts') || id.includes('victory-vendor')) {
            return 'charts-recharts'
          }
          // Google Generative AI SDK – dynamically imported in api.ts
          if (id.includes('@google/genai')) {
            return 'ai'
          }
          // Local AI runtime – keep browser model engines separate from the app shell
          if (id.includes('@xenova/transformers') || id.includes('onnxruntime-web') || id.includes('onnxruntime-node') || id.includes('@mlc-ai/web-llm')) {
            return 'ai-runtime'
          }
          // PDF export – on-demand only
          if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'pdf-export'
          }
          // Screenshot / image export – on-demand only
          if (id.includes('html2canvas')) {
            return 'image-export'
          }
          // Image compression – used in AI diagnostics modal
          if (id.includes('browser-image-compression')) {
            return 'image-compress'
          }
          // Radix UI primitives
          if (id.includes('@radix-ui')) {
            return 'radix-ui'
          }
          // DOMPurify – loaded with geminiService
          if (id.includes('dompurify')) {
            return 'sanitizer'
          }
          // Zod – schema validation
          if (id.includes('zod')) {
            return 'zod'
          }
          // Command palette (cmdk)
          if (id.includes('cmdk')) {
            return 'cmdk'
          }

          return undefined
        },
      },
    },
  },

  // ── Worker bundling ──────────────────────────────────────────────────
  worker: {
    format: 'es',
  },

  // ── Dependency pre-bundling hints ────────────────────────────────────
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit', 'i18next', 'react-i18next'],
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
      include: ['services/**/*.ts', 'hooks/**/*.ts', 'stores/**/*.ts', 'components/**/*.tsx'],
      exclude: ['tests/**', '**/*.d.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
})
