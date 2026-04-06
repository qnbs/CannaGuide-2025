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
        // Bottom nav should be visible on mobile
        const bottomNav = page
            .locator('nav[aria-label]')
            .filter({ has: page.locator('[data-view-id]') })
        await expect(bottomNav.first()).toBeVisible({ timeout: 10_000 })

        // Side nav (aside or desktop nav) should be hidden on mobile
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
        // Open command palette via the header button
        const openButton = page.getByRole('button', { name: /command/i })
        if ((await openButton.count()) === 0) {
            // Fallback: try keyboard shortcut
            await page.keyboard.press('Meta+k')
        } else {
            await openButton.first().click()
        }

        // Command palette dialog should appear
        const dialog = page.getByRole('dialog')
        await expect(dialog.first()).toBeVisible({ timeout: 10_000 })

        // Close via the close button inside the dialog
        const closeButton = dialog.getByRole('button', { name: /close|schlie/i })
        if ((await closeButton.count()) > 0) {
            await closeButton.first().click()
        } else {
            // Fallback: press Escape
            await page.keyboard.press('Escape')
        }

        // Dialog should be gone
        await expect(dialog).not.toBeVisible({ timeout: 5_000 })
    })
})
