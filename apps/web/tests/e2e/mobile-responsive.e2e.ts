import { test, expect } from '@playwright/test'
import { bootFreshAppPastOnboarding, expectShellVisible } from './helpers'

// ---------------------------------------------------------------------------
// Mobile Responsiveness E2E Tests (U-03)
//
// Validates core mobile UX on Pixel 5 viewport (393x851):
// - Bottom navigation visible and functional
// - Side navigation hidden on mobile
// - Modal open/close on mobile viewport
// ---------------------------------------------------------------------------

test.describe('Mobile Responsive (Pixel 5)', () => {
    test.use({ viewport: { width: 393, height: 851 } })

    test.beforeEach(async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
    })

    test('bottom nav visible, side nav hidden on mobile viewport', async ({ page }) => {
        // BottomNav renders as a <nav> inside a fixed-positioned wrapper (no aside).
        // SideNav renders inside <aside class="hidden md:block">.
        // On mobile (< 640px) BottomNav is visible, SideNav is CSS-hidden.
        // Use :visible pseudo-selector to skip the hidden SideNav.
        const visibleNav = page.locator('nav[aria-label]:visible')
        await expect(visibleNav.first()).toBeVisible({ timeout: 10_000 })

        // At least one data-view-id button should be visible inside it
        const visibleButton = page.locator('[data-view-id]:visible')
        await expect(visibleButton.first()).toBeVisible({ timeout: 5_000 })

        // Side nav (aside) should be hidden on mobile
        const sideNav = page.locator('aside')
        if ((await sideNav.count()) > 0) {
            await expect(sideNav.first()).not.toBeVisible()
        }
    })

    test('bottom nav items are clickable and switch views', async ({ page }) => {
        const views = ['plants', 'strains', 'equipment', 'knowledge'] as const

        for (const viewId of views) {
            const navButton = page.locator(`[data-view-id="${viewId}"]:visible`)
            await expect(navButton.first()).toBeVisible({ timeout: 10_000 })
            await navButton.first().click()

            // Verify aria-current="page" is set on the clicked item
            await expect(navButton.first()).toHaveAttribute('aria-current', 'page', {
                timeout: 5_000,
            })

            // Main content area should remain visible after navigation
            await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        }
    })

    test('command palette opens and closes on mobile', async ({ page }) => {
        // Open command palette via keyboard shortcut (most reliable cross-platform)
        await page.keyboard.press('Meta+k')
        // Small wait for Radix dialog animation
        await page.waitForTimeout(500)

        // Radix renders dialog with data-state="open"; check DOM presence
        const dialog = page.locator('[cmdk-dialog][data-state="open"]')
        await expect(dialog).toHaveCount(1, { timeout: 10_000 })

        // Close via Escape
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        // Dialog should be closed (removed or data-state="closed")
        await expect(page.locator('[cmdk-dialog][data-state="open"]')).toHaveCount(0, {
            timeout: 5_000,
        })
    })
})
