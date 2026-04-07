import { expect, test } from '@playwright/test'
import { bootFreshAppPastOnboarding } from './helpers'

test.describe('RTL Smoke Tests', () => {
    test('app renders correctly when dir="rtl" is set on documentElement', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)

        // Flip the document direction to RTL
        await page.evaluate(() => {
            document.documentElement.dir = 'rtl'
        })

        // Verify the computed direction is RTL
        const direction = await page.evaluate(
            () => window.getComputedStyle(document.documentElement).direction,
        )
        expect(direction).toBe('rtl')

        // Navigation should still be rendered (desktop sidebar or mobile bottom nav)
        const vw = page.viewportSize()?.width ?? 1280
        if (vw >= 768) {
            await expect(page.locator('nav').first()).toBeVisible({ timeout: 10_000 })
        } else {
            await expect(page.locator('[data-view-id]').first()).toBeVisible({ timeout: 10_000 })
        }

        // Main content area should be visible
        await expect(page.locator('main').first()).toBeVisible({ timeout: 10_000 })

        // No crash patterns
        await expect(page.getByRole('heading', { name: /Something went wrong\./i })).toHaveCount(0)
    })

    test('dir attribute defaults to ltr on page load', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)

        const dir = await page.evaluate(() => document.documentElement.dir)
        expect(dir).toBe('ltr')
    })
})
