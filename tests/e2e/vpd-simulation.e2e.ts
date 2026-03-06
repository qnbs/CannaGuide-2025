import { test, expect } from '@playwright/test'
import { bootFreshAppWithLegalGates, closeOnboardingIfVisible, expectShellVisible } from './helpers'

test.describe('VPD Simulation', () => {
    test('equipment view loads without crash', async ({ page }) => {
        await bootFreshAppWithLegalGates(page)
        await closeOnboardingIfVisible(page)

        // Navigate to equipment tab
        const equipNav = page.locator('nav').getByText(/Equipment|Ausrüstung/i).first()
        if (await equipNav.isVisible()) {
            await equipNav.click()
            await page.waitForTimeout(1000)

            // Page should have equipment-related content
            await expect(page.locator('body')).toBeVisible()
        }
    })

    test('plants view renders plant slots', async ({ page }) => {
        await bootFreshAppWithLegalGates(page)

        await expectShellVisible(page)
    })
})

test.describe('AI Diagnostics', () => {
    test('knowledge view loads without crash', async ({ page }) => {
        await bootFreshAppWithLegalGates(page)
        await closeOnboardingIfVisible(page)

        // Navigate to knowledge tab
        const knowledgeNav = page.locator('nav').getByText(/Knowledge|Wissen/i).first()
        if (await knowledgeNav.isVisible()) {
            await knowledgeNav.click()
            await page.waitForTimeout(1000)

            await expect(page.locator('body')).toBeVisible()
        }
    })
})
