import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: ['*.e2e.ts'],
    timeout: 60_000,
    expect: { timeout: 10_000 },
    retries: 1,
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
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
    webServer: {
        command: 'npm run preview',
        port: 4173,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
})
