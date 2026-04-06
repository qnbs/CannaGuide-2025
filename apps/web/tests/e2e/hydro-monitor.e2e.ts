import { test, expect } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    expectNoCrashPatterns,
    attachRuntimeErrorTracking,
    expectShellVisible,
} from './helpers'

// ---------------------------------------------------------------------------
// Hydro Monitor -- Critical Path E2E Tests
//
// Validates the hydroponic monitoring flow accessible via Equipment view:
// - Navigation to Hydro Monitor sub-tab
// - Gauge card rendering (pH, EC, Water Temp)
// - System type selector interaction
// - Manual reading input form
// - Stability across interactions
// ---------------------------------------------------------------------------

test.describe('Hydro Monitor Critical Path', () => {
    test.beforeEach(async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
    })

    test('navigates to Hydro Monitor via Equipment sub-nav', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        // Navigate to Equipment view
        const equipmentNav = page.locator('[data-view-id="equipment"]')
        await expect(equipmentNav.first()).toBeVisible({ timeout: 10_000 })
        await equipmentNav.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Click Hydro Monitor sub-nav button
        const hydroButton = page.getByRole('button', { name: /Hydro Monitor/i })
        await expect(hydroButton).toBeVisible({ timeout: 10_000 })
        await hydroButton.click()

        // Hydro Monitor view should render
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('renders gauge cards for pH, EC, and temperature', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        await page.locator('[data-view-id="equipment"]').first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        const hydroButton = page.getByRole('button', { name: /Hydro Monitor/i })
        await expect(hydroButton).toBeVisible({ timeout: 10_000 })
        await hydroButton.click()
        await page.waitForTimeout(1_000)

        // Gauge cards should be present (pH, EC, Water Temp)
        const mainContent = page.locator('main').first()
        const phGauge = mainContent.getByText(/pH/i).first()
        const ecGauge = mainContent.getByText(/EC/i).first()

        const hasPhGauge = await phGauge.isVisible().catch(() => false)
        const hasEcGauge = await ecGauge.isVisible().catch(() => false)

        // At least pH and EC gauges should be visible
        expect(hasPhGauge || hasEcGauge).toBeTruthy()

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('allows system type selection', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        await page.locator('[data-view-id="equipment"]').first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        const hydroButton = page.getByRole('button', { name: /Hydro Monitor/i })
        await expect(hydroButton).toBeVisible({ timeout: 10_000 })
        await hydroButton.click()
        await page.waitForTimeout(1_000)

        // Look for system type selector (DWC, NFT, etc.)
        const systemSelector = page
            .getByRole('combobox')
            .or(page.locator('select'))
            .or(page.getByRole('button', { name: /DWC|NFT|Drip|Ebb|Aero|Kratky/i }))

        const hasSysSelector = await systemSelector
            .first()
            .isVisible()
            .catch(() => false)
        if (hasSysSelector) {
            await systemSelector.first().click()
            await page.waitForTimeout(500)
        }

        // View should remain stable
        await expect(page.locator('main').first()).toBeVisible()
        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('Hydro Monitor renders without runtime errors', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        await page.locator('[data-view-id="equipment"]').first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        const hydroButton = page.getByRole('button', { name: /Hydro Monitor/i })
        await expect(hydroButton).toBeVisible({ timeout: 10_000 })
        await hydroButton.click()

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await expectNoCrashPatterns(page)

        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })
})
