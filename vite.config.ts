import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // FIX: Replaced `__dirname` which is not available in ES modules. 
      // `path.resolve('./')` correctly resolves to the project root directory.
      '@': path.resolve('./'),
    },
  },
})