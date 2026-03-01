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
        manualChunks: {
          react: ['react', 'react-dom', 'react-redux'],
          redux: ['@reduxjs/toolkit'],
          i18n: ['i18next', 'react-i18next'],
          charts: ['d3', 'd3-hierarchy'],
          ai: ['@google/genai'],
          export: ['jspdf', 'jspdf-autotable'],
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