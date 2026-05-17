import { defineConfig, devices } from '@playwright/test'

const deployBaseUrl = process.env.DEPLOY_BASE_URL || 'https://qnbs.github.io/CannaGuide-2025/'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['*.deploy.e2e.ts'],
  timeout: 90_000,
  expect: {
    timeout: 30_000,
  },
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: deployBaseUrl,
    navigationTimeout: 60_000,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
