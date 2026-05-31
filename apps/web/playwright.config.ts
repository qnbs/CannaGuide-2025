import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: ['*.e2e.ts'],
    testIgnore: ['*.deploy.e2e.ts'],
    timeout: process.env.CI ? 90_000 : 60_000,
    globalTimeout: process.env.CI ? 45 * 60_000 : 0,
    expect: {
        timeout: 10_000,
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.01,
            animations: 'disabled',
        },
    },
    snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : '50%',
    reporter: process.env.CI ? [['list'], ['github']] : [['list']],
    use: {
        baseURL: 'http://localhost:4173/CannaGuide-2025/',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        bypassCSP: true,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
            testMatch: ['mobile-*.e2e.ts', 'screenshots.e2e.ts', 'onboarding.e2e.ts'],
        },
        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox'],
                actionTimeout: 30_000,
                navigationTimeout: 90_000,
            },
            timeout: 120_000,
        },
        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari'],
                actionTimeout: 30_000,
                navigationTimeout: 90_000,
            },
            timeout: 120_000,
            grepInvert: /WebGPU|Bluetooth/,
        },
    ],
    webServer: {
        command: 'pnpm run preview',
        port: 4173,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
})
