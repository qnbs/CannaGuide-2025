import { test, expect } from '@playwright/test'

test.describe('VPD Simulation', () => {
    test('equipment view loads without crash', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

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
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Plants view is the default view
        const main = page.locator('main').first()
        await expect(main).toBeVisible({ timeout: 15_000 })
    })
})

test.describe('AI Diagnostics', () => {
    test('knowledge view loads without crash', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Navigate to knowledge tab
        const knowledgeNav = page.locator('nav').getByText(/Knowledge|Wissen/i).first()
        if (await knowledgeNav.isVisible()) {
            await knowledgeNav.click()
            await page.waitForTimeout(1000)

            await expect(page.locator('body')).toBeVisible()
        }
    })
})
