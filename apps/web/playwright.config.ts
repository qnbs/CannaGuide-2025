import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: ['*.e2e.ts'],
    testIgnore: ['*.deploy.e2e.ts'],
    timeout: 60_000,
    expect: {
        timeout: 10_000,
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.01,
            animations: 'disabled',
        },
    },
    snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
    retries: process.env.CI ? 2 : 0,
    reporter: [['list']],
    use: {
        baseURL: 'http://localhost:4173',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        // WebKit headless is unreliable in CI (app never boots).
        // Run locally with: npx playwright test --project=webkit
        ...(!process.env.CI
            ? [
                  {
                      name: 'webkit' as const,
                      use: {
                          ...devices['Desktop Safari'],
                          actionTimeout: 30_000,
                          navigationTimeout: 90_000,
                      },
                      timeout: 120_000,
                  },
              ]
            : []),
    ],
    webServer: {
        command: 'npm run preview',
        port: 4173,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
})
