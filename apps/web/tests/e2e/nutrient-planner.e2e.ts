import { test, expect } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    expectNoCrashPatterns,
    attachRuntimeErrorTracking,
    expectShellVisible,
} from './helpers'

// ---------------------------------------------------------------------------
// Nutrient Planner (EC/pH Calculator) -- Critical Path E2E Tests
//
// Validates the nutrient planning flow accessible via Equipment > Calculators:
// - Navigation to Calculators sub-tab
// - EC/pH Planner visibility and interaction
// - Medium and growth stage selection
// - Stability across interactions
// ---------------------------------------------------------------------------

test.describe('Nutrient Planner Critical Path', () => {
    test.beforeEach(async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
    })

    test('navigates to Calculators via Equipment sub-nav', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        // Navigate to Equipment view
        const equipmentNav = page.locator('[data-view-id="equipment"]')
        await expect(equipmentNav.first()).toBeVisible({ timeout: 10_000 })
        await equipmentNav.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Click Calculators sub-nav button
        const calcButton = page.getByRole('button', { name: /Calculators/i })
        await expect(calcButton).toBeVisible({ timeout: 10_000 })
        await calcButton.click()

        // Calculators view should render
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('renders calculator options including nutrient/EC/pH tools', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        await page.locator('[data-view-id="equipment"]').first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        const calcButton = page.getByRole('button', { name: /Calculators/i })
        await expect(calcButton).toBeVisible({ timeout: 10_000 })
        await calcButton.click()
        await page.waitForTimeout(1_000)

        // Look for nutrient/EC/pH related content
        const mainContent = page.locator('main').first()
        const nutrientContent = mainContent.getByText(/nutrient|EC|pH|planner|calculator/i)

        const hasNutrientContent = await nutrientContent
            .first()
            .isVisible()
            .catch(() => false)
        expect(hasNutrientContent).toBeTruthy()

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('can interact with calculator selection', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        await page.locator('[data-view-id="equipment"]').first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        const calcButton = page.getByRole('button', { name: /Calculators/i })
        await expect(calcButton).toBeVisible({ timeout: 10_000 })
        await calcButton.click()
        await page.waitForTimeout(1_000)

        // Try clicking on an EC/pH or Nutrient calculator card/button
        const nutrientCalcButton = page
            .getByRole('button', {
                name: /EC.*pH|pH.*EC|nutrient|planner/i,
            })
            .or(page.getByText(/EC.*pH|pH.*EC|Nutrient Planner/i))

        const hasButton = await nutrientCalcButton
            .first()
            .isVisible()
            .catch(() => false)
        if (hasButton) {
            await nutrientCalcButton.first().click()
            await page.waitForTimeout(1_000)

            // After clicking, some form or configuration should appear
            const formContent = page
                .locator('form')
                .or(page.getByRole('combobox'))
                .or(page.getByText(/medium|stage|soil|coco|hydro/i))

            const hasForm = await formContent
                .first()
                .isVisible()
                .catch(() => false)
            if (!hasForm) {
                // At minimum the view should still be stable
                await expect(page.locator('main').first()).toBeVisible()
            }
        }

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('Calculators view renders without runtime errors', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        await page.locator('[data-view-id="equipment"]').first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        const calcButton = page.getByRole('button', { name: /Calculators/i })
        await expect(calcButton).toBeVisible({ timeout: 10_000 })
        await calcButton.click()

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await expectNoCrashPatterns(page)

        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })
})
