import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: ['*.e2e.ts'],
    testIgnore: ['*.deploy.e2e.ts'],
    timeout: process.env.CI ? 90_000 : 60_000,
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
        // Firefox and WebKit are unreliable in CI (timeouts, missing APIs).
        // Run locally with: npx playwright test --project=firefox --project=webkit
        ...(!process.env.CI
            ? [
                  {
                      name: 'firefox' as const,
                      use: { ...devices['Desktop Firefox'] },
                  },
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
