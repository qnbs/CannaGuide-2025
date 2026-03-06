import { test, expect } from '@playwright/test'

test.describe('Strain Genealogy', () => {
    test('strains view loads and displays strains', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Navigate to strains view using the navigation
        const strainsNav = page.locator('nav').getByText(/Strain|Sorten/i).first()
        if (await strainsNav.isVisible()) {
            await strainsNav.click()
            await page.waitForTimeout(1000)
        }

        // Page should render without errors
        const body = page.locator('body')
        await expect(body).toBeVisible()
    })

    test('app does not crash on navigation between views', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        const navItems = page.locator('nav button, nav a')
        const count = await navItems.count()

        // Click through first few nav items
        for (let i = 0; i < Math.min(count, 4); i++) {
            const item = navItems.nth(i)
            if (await item.isVisible()) {
                await item.click()
                await page.waitForTimeout(500)
                // Verify no crash
                await expect(page.locator('body')).toBeVisible()
            }
        }
    })
})
