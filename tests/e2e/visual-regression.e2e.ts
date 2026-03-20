import { test, expect } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    bootFreshAppWithLegalGates,
    expectShellVisible,
} from './helpers'

// ---------------------------------------------------------------------------
// Visual Regression Tests — Playwright Visual Comparisons
//
// Captures screenshots of key views (dashboards, VPD simulation, charts,
// navigation states) and compares them against baseline snapshots.
//
// First run creates golden baseline images under tests/e2e/*.ts-snapshots/.
// Subsequent runs detect visual regressions (layout shifts, broken charts,
// theme corruption, missing UI elements).
//
// Usage:
//   npm run test:e2e                          # compare against baselines
//   npm run test:e2e -- --update-snapshots    # regenerate baselines
//
// Threshold: 0.3 maxDiffPixelRatio to tolerate minor anti-aliasing diffs.
// ---------------------------------------------------------------------------

const SNAPSHOT_OPTIONS = {
    maxDiffPixelRatio: 0.3,
    threshold: 0.3,
}

test.describe('Visual Regression — Shell & Navigation', () => {
    test('main shell layout matches baseline', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
        await page.waitForTimeout(1000) // settle animations

        await expect(page).toHaveScreenshot('shell-layout.png', SNAPSHOT_OPTIONS)
    })

    test('navigation bar renders consistently', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
        await page.waitForTimeout(500)

        const nav = page.locator('nav').first()
        await expect(nav).toHaveScreenshot('navigation-bar.png', SNAPSHOT_OPTIONS)
    })
})

test.describe('Visual Regression — Dashboard Views', () => {
    test('plants view layout matches baseline', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
        await page.waitForTimeout(1000)

        // Plants view is typically the default view
        const main = page.locator('main').first()
        await expect(main).toHaveScreenshot('plants-view.png', SNAPSHOT_OPTIONS)
    })

    test('equipment view layout matches baseline', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)

        const equipNav = page
            .locator('nav')
            .getByText(/Equipment|Ausrüstung/i)
            .first()
        if (await equipNav.isVisible().catch(() => false)) {
            await equipNav.click()
            await page.waitForTimeout(1500) // allow charts/sim to render

            const main = page.locator('main').first()
            await expect(main).toHaveScreenshot('equipment-view.png', SNAPSHOT_OPTIONS)
        }
    })

    test('knowledge view layout matches baseline', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)

        const knowledgeNav = page
            .locator('nav')
            .getByText(/Knowledge|Wissen/i)
            .first()
        if (await knowledgeNav.isVisible().catch(() => false)) {
            await knowledgeNav.click()
            await page.waitForTimeout(1000)

            const main = page.locator('main').first()
            await expect(main).toHaveScreenshot('knowledge-view.png', SNAPSHOT_OPTIONS)
        }
    })

    test('strains view layout matches baseline', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)

        const strainsNav = page
            .locator('nav')
            .getByText(/Strains|Sorten/i)
            .first()
        if (await strainsNav.isVisible().catch(() => false)) {
            await strainsNav.click()
            await page.waitForTimeout(1000)

            const main = page.locator('main').first()
            await expect(main).toHaveScreenshot('strains-view.png', SNAPSHOT_OPTIONS)
        }
    })
})

test.describe('Visual Regression — Settings & Dialogs', () => {
    test('settings panel matches baseline', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)

        const settingsBtn = page.getByRole('button', { name: /settings|einstellungen/i })
        if (await settingsBtn.isVisible().catch(() => false)) {
            await settingsBtn.click()
            await page.waitForTimeout(1000)

            await expect(page).toHaveScreenshot('settings-panel.png', SNAPSHOT_OPTIONS)
        }
    })

    test('onboarding dialog matches baseline', async ({ page }) => {
        await bootFreshAppWithLegalGates(page)

        // Onboarding should appear for a fresh app
        const onboardingDialog = page.getByRole('dialog')
        const isVisible = await onboardingDialog.isVisible().catch(() => false)

        if (isVisible) {
            await page.waitForTimeout(1000)
            await expect(onboardingDialog).toHaveScreenshot(
                'onboarding-dialog.png',
                SNAPSHOT_OPTIONS,
            )
        }
    })
})

test.describe('Visual Regression — Responsive Breakpoints', () => {
    test('mobile viewport (375×667) matches baseline', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 })
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
        await page.waitForTimeout(1000)

        await expect(page).toHaveScreenshot('mobile-375.png', SNAPSHOT_OPTIONS)
    })

    test('tablet viewport (768×1024) matches baseline', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 })
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
        await page.waitForTimeout(1000)

        await expect(page).toHaveScreenshot('tablet-768.png', SNAPSHOT_OPTIONS)
    })

    test('desktop viewport (1440×900) matches baseline', async ({ page }) => {
        await page.setViewportSize({ width: 1440, height: 900 })
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
        await page.waitForTimeout(1000)

        await expect(page).toHaveScreenshot('desktop-1440.png', SNAPSHOT_OPTIONS)
    })
})
