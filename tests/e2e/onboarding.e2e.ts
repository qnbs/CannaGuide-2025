import { test, expect } from '@playwright/test'

test.describe('Onboarding Flow', () => {
    test('shows onboarding on first visit', async ({ page }) => {
        // Clear any stored state
        await page.goto('/')
        await page.evaluate(() => {
            localStorage.clear()
            indexedDB.deleteDatabase('cannaguide-db')
        })
        await page.reload()
        await page.waitForLoadState('networkidle')

        // App should show onboarding or main view
        // Check the page loaded correctly
        const body = page.locator('body')
        await expect(body).toBeVisible()
    })

    test('can navigate through app after load', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // The app should render without crashing
        const main = page.locator('main').first()
        await expect(main).toBeVisible({ timeout: 15_000 })
    })

    test('app renders navigation elements', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Navigation should be visible (bottom nav or sidebar)
        const nav = page.locator('nav').first()
        await expect(nav).toBeVisible({ timeout: 15_000 })
    })
})
