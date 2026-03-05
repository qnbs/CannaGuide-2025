import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/CannaGuide-2025/',
  plugins: [react()],
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
    setupFiles: './vitest.setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      'tests/e2e/**',
    ],
  },
})