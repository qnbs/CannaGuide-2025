import { test, expect } from '@playwright/test'
import { bootFreshAppPastOnboarding, expectShellVisible } from './helpers'

// ---------------------------------------------------------------------------
// Mobile No-Overflow / No-Clipping E2E Tests
//
// Validates that key views render without horizontal overflow or content
// clipping on mobile viewport sizes (iPhone SE, iPhone 14, Galaxy S21).
// ---------------------------------------------------------------------------

const MOBILE_VIEWPORTS = [
    { name: 'iPhone SE', width: 375, height: 667 },
    // Additional viewports run locally; CI uses single viewport for speed
    ...(!process.env.CI
        ? [
              { name: 'iPhone 14', width: 390, height: 844 },
              { name: 'Galaxy S21', width: 360, height: 800 },
          ]
        : []),
] as const

const VIEWS_TO_TEST = ['plants', 'strains', 'knowledge', 'settings'] as const

for (const viewport of MOBILE_VIEWPORTS) {
    test.describe(`Mobile ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
        test.use({ viewport: { width: viewport.width, height: viewport.height } })

        test.beforeEach(async ({ page }) => {
            await bootFreshAppPastOnboarding(page)
            await expectShellVisible(page)
        })

        for (const viewId of VIEWS_TO_TEST) {
            test(`${viewId} view has no horizontal overflow`, async ({ page }) => {
                const navButton = page.locator(`[data-view-id="${viewId}"]:visible`)
                if ((await navButton.count()) > 0) {
                    await navButton.first().click()
                    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
                }

                // Assert no horizontal scrollbar (body scrollWidth <= clientWidth)
                const hasOverflow = await page.evaluate(() => {
                    return (
                        document.documentElement.scrollWidth > document.documentElement.clientWidth
                    )
                })
                expect(hasOverflow).toBe(false)

                // Assert no element extends beyond the viewport
                // Exclude decorative orbs and accessibility skip-links (intentionally off-screen)
                const IGNORE_PATTERNS = ['app-shell__orb', 'skip-link']
                const overflowingElements = await page.evaluate(
                    ({ ignorePatterns }) => {
                        const vw = document.documentElement.clientWidth
                        const elements = document.querySelectorAll('*')
                        const overflowing: string[] = []
                        for (const el of elements) {
                            const rect = el.getBoundingClientRect()
                            if (rect.right > vw + 1 || rect.left < -1) {
                                const tag = el.tagName.toLowerCase()
                                const cls = el.className?.toString().slice(0, 60) ?? ''
                                const id = `${tag}.${cls}`
                                if (
                                    ignorePatterns.some(
                                        (p: string) =>
                                            cls.includes(p) ||
                                            (tag === 'a' && cls.includes('skip')),
                                    )
                                ) {
                                    continue
                                }
                                overflowing.push(id)
                            }
                        }
                        return overflowing.slice(0, 5)
                    },
                    { ignorePatterns: IGNORE_PATTERNS },
                )
                expect(
                    overflowingElements,
                    `Elements overflow viewport: ${overflowingElements.join(', ')}`,
                ).toHaveLength(0)
            })
        }

        // --- Dialog / overlay clipping assertions -------------------------
        test('command palette dialog does not clip on mobile', async ({ page }) => {
            // Open command palette via header button (keyboard shortcut unreliable on mobile emulation)
            const openBtn = page.locator('button[aria-label*="ommand"]')
            await openBtn.click()
            // cmdk library sets visibility:hidden on [cmdk-dialog]; check DOM presence instead
            const dialog = page.locator('[cmdk-dialog][data-state="open"]')
            await expect(dialog).toHaveCount(1, { timeout: 10_000 })

            const overflows = await page.evaluate(() => {
                const vw = document.documentElement.clientWidth
                const vh = document.documentElement.clientHeight
                const dialogs = document.querySelectorAll('[cmdk-dialog], [role="dialog"]')
                const issues: string[] = []
                for (const el of dialogs) {
                    const rect = el.getBoundingClientRect()
                    if (rect.right > vw + 1) issues.push(`right-clip: ${rect.right - vw}px`)
                    if (rect.bottom > vh + 1) issues.push(`bottom-clip: ${rect.bottom - vh}px`)
                    if (rect.left < -1) issues.push(`left-clip: ${rect.left}px`)
                }
                return issues
            })
            expect(overflows, `Dialog overflows viewport: ${overflows.join(', ')}`).toHaveLength(0)

            await page.keyboard.press('Escape')
        })

        test('settings modal content does not overflow on mobile', async ({ page }) => {
            // Navigate to settings
            const settingsNav = page.locator('[data-view-id="settings"]:visible')
            if ((await settingsNav.count()) > 0) {
                await settingsNav.first().click()
                await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
            }

            // Check that no settings content overflows
            const hasOverflow = await page.evaluate(() => {
                return document.documentElement.scrollWidth > document.documentElement.clientWidth
            })
            expect(hasOverflow).toBe(false)
        })
    })
}
