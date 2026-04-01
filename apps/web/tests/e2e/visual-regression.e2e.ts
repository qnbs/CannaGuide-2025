import { test, expect } from '@playwright/test'
import { bootFreshAppPastOnboarding, expectShellVisible } from './helpers'

// ---------------------------------------------------------------------------
// Visual Regression Tests
//
// Captures baseline screenshots for critical views across two themes
// (midnight = default, forest = alternate). Run with --update-snapshots
// to regenerate baselines after intentional UI changes.
//
// CI stores snapshot diffs as artifacts on failure for manual review.
// ---------------------------------------------------------------------------

const themes = ['midnight', 'forest'] as const

for (const theme of themes) {
    test.describe(`Visual Regression (${theme})`, () => {
        test.beforeEach(async ({ page }) => {
            await bootFreshAppPastOnboarding(page)
            await expectShellVisible(page)

            // Apply theme via class on <html>
            await page.evaluate((t) => {
                const html = document.documentElement
                // Remove any existing theme classes
                html.className = html.className.replace(/theme-\S+/g, '')
                html.classList.add('dark', `theme-${t}`)
            }, theme)
            // Let theme repaint settle
            await page.waitForTimeout(500)
        })

        test(`Plants dashboard -- ${theme}`, async ({ page }) => {
            const plantsNav = page.locator('[data-view-id="plants"]')
            await expect(plantsNav.first()).toBeVisible({ timeout: 10_000 })
            await plantsNav.first().click()
            await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
            await page.waitForTimeout(1_000)

            await expect(page).toHaveScreenshot(`plants-dashboard-${theme}.png`, {
                fullPage: false,
            })
        })

        test(`Strains list -- ${theme}`, async ({ page }) => {
            const strainsNav = page.locator('[data-view-id="strains"]')
            await expect(strainsNav.first()).toBeVisible({ timeout: 10_000 })
            await strainsNav.first().click()
            await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
            await page.waitForTimeout(1_000)

            await expect(page).toHaveScreenshot(`strains-list-${theme}.png`, {
                fullPage: false,
            })
        })

        test(`Knowledge AI view -- ${theme}`, async ({ page }) => {
            const knowledgeNav = page.locator('[data-view-id="knowledge"]')
            await expect(knowledgeNav.first()).toBeVisible({ timeout: 10_000 })
            await knowledgeNav.first().click()
            await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
            await page.waitForTimeout(1_000)

            await expect(page).toHaveScreenshot(`knowledge-ai-${theme}.png`, {
                fullPage: false,
            })
        })
    })
}
