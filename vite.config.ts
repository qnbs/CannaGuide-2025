import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/CannaGuide-2025/',
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:; font-src 'self' https://fonts.gstatic.com https: data:; img-src 'self' data: blob: https:; connect-src 'self' https:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self';",
      'Permissions-Policy': 'geolocation=(), camera=(self), microphone=(self), bluetooth=(self), usb=(), payment=(), gyroscope=(), magnetometer=()',
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy': "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:; font-src 'self' https://fonts.gstatic.com https: data:; img-src 'self' data: blob: https:; connect-src 'self' https:; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self';",
      'Permissions-Policy': 'geolocation=(), camera=(self), microphone=(self), bluetooth=(self), usb=(), payment=(), gyroscope=(), magnetometer=()',
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
    minWorkers: 1,
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
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      all: true,
      include: ['services/**/*.ts', 'hooks/**/*.ts', 'stores/**/*.ts', 'components/**/*.tsx'],
      exclude: ['tests/**', '**/*.d.ts'],
    },
  },
})