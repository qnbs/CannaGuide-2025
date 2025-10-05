import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // FIX: Replaced `__dirname` which is unavailable in ES modules and pointed to a non-existent `src` directory.
      // `path.resolve('./')` correctly resolves to the project root, matching the project's structure.
      '@': path.resolve('./'),
    },
  },
})