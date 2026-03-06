import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/CannaGuide-2025/',
  plugins: [
    react({
      // React 19 Compiler – automatically memoises components and hooks
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    VitePWA({
      // Keep our hand-crafted sw.js; only inject the precache asset manifest.
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      // Don't let the plugin re-generate manifest.json – we manage it in public/.
      manifest: false,
      // Re-use the existing register-sw.js / usePwaInstall hook.
      registerType: 'prompt',
      injectManifest: {
        // Glob patterns for build assets that should be precached.
        globPatterns: ['**/*.{js,css,html,ico,svg,png,webp,woff2}'],
        // Do NOT inject anything for assets already >4 MB (audio, large images, etc.)
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      devOptions: {
        // Keep dev working without the plugin intercepting the manual sw.js.
        enabled: false,
      },
    }),
  ],
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:; font-src 'self' https://fonts.gstatic.com https: data:; img-src 'self' data: blob: https:; connect-src 'self' https:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self';",
      'Permissions-Policy': 'accelerometer=(), ambient-light-sensor=(), autoplay=(self), bluetooth=(self), camera=(self), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), magnetometer=(), microphone=(self), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), screen-wake-lock=(self), usb=(), xr-spatial-tracking=(), gyroscope=()',
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy': "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:; font-src 'self' https://fonts.gstatic.com https: data:; img-src 'self' data: blob: https:; connect-src 'self' https:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self';",
      'Permissions-Policy': 'accelerometer=(), ambient-light-sensor=(), autoplay=(self), bluetooth=(self), camera=(self), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), magnetometer=(), microphone=(self), midi=(), payment=(), picture-in-picture=(self), publickey-credentials-get=(), screen-wake-lock=(self), usb=(), xr-spatial-tracking=(), gyroscope=()',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('/react/') || id.includes('react-dom') || id.includes('react-redux')) {
            return 'react'
          }

          if (id.includes('@reduxjs/toolkit')) {
            return 'redux'
          }

          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n'
          }

          if (id.includes('d3')) {
            return 'charts'
          }

          if (id.includes('@google/genai')) {
            return 'ai'
          }

          if (id.includes('jspdf') || id.includes('jspdf-autotable')) {
            return 'pdf-export'
          }

          if (id.includes('html2canvas')) {
            return 'image-export'
          }

          if (id.includes('@radix-ui')) {
            return 'radix-ui'
          }

          return undefined
        },
      },
    },
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
    },
  },
})