import { defineConfig, devices } from '@playwright/experimental-ct-react'

export default defineConfig({
  testDir: './tests/ct',
  testMatch: ['*.ct.tsx'],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: 1,
  reporter: [['list']],
  use: {
    ctPort: 3100,
    ctViteConfig: {
      resolve: {
        alias: {
          '@': '.',
        },
      },
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
