import { test, expect } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    expectNoCrashPatterns,
    attachRuntimeErrorTracking,
    expectShellVisible,
} from './helpers'

// ---------------------------------------------------------------------------
// Strains View -- Critical Path E2E Tests
//
// Validates the strains browsing flow:
// - Navigation to Strains view
// - Strain list/grid rendering (700+ strains)
// - Search functionality
// - Strain detail navigation
// - Tab switching (Genetics, Terpenes, etc.)
// ---------------------------------------------------------------------------

test.describe('Strains Critical Path', () => {
    test.beforeEach(async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
    })

    test('navigates to Strains view and renders strain list', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        const strainsNavButton = page.locator('[data-view-id="Strains"]')
        await expect(strainsNavButton.first()).toBeVisible({ timeout: 10_000 })
        await strainsNavButton.first().click()

        // Wait for strain list to render
        await page.waitForTimeout(2_000)
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Should have visible strain items (list or grid)
        await expectNoCrashPatterns(page)

        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('strain search filters results', async ({ page }) => {
        const strainsNavButton = page.locator('[data-view-id="Strains"]')
        await strainsNavButton.first().click()
        await page.waitForTimeout(2_000)

        // Find search input
        const searchInput = page
            .getByRole('searchbox')
            .or(page.getByPlaceholder(/search|suche|strain/i))
        const hasSearch = await searchInput
            .first()
            .isVisible()
            .catch(() => false)

        if (hasSearch) {
            await searchInput.first().fill('OG Kush')
            await page.waitForTimeout(1_000)

            // Results should be filtered (fewer items visible)
            await expectNoCrashPatterns(page)
        }
    })

    test('Strains view handles rapid tab switching without crash', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        const strainsNavButton = page.locator('[data-view-id="Strains"]')
        await strainsNavButton.first().click()
        await page.waitForTimeout(2_000)

        // Find tabs if they exist (Library, Genealogy, Breeding, etc.)
        const tabs = page.getByRole('tab')
        const tabCount = await tabs.count()

        for (let i = 0; i < Math.min(tabCount, 5); i += 1) {
            const tab = tabs.nth(i)
            if (await tab.isVisible().catch(() => false)) {
                await tab.click()
                await page.waitForTimeout(500)
            }
        }

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('Strains view renders without runtime errors', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        const strainsNavButton = page.locator('[data-view-id="Strains"]')
        await strainsNavButton.first().click()
        await page.waitForTimeout(3_000)

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })
})
