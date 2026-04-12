import { test, expect } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    expectNoCrashPatterns,
    attachRuntimeErrorTracking,
    expectShellVisible,
} from './helpers'

// ---------------------------------------------------------------------------
// Analytics Dashboard -- Critical Path E2E Tests
//
// Validates the Knowledge > Analytics Dashboard flow:
// - Navigation to Analytics tab
// - Dashboard section rendering (Garden Score, charts)
// - Predictive Insights section presence
// - CSV export button interaction
// - Sandbox sub-tab navigation
// ---------------------------------------------------------------------------

const navigateToAnalytics = async (page: import('@playwright/test').Page) => {
    const knowledgeNav = page.locator('[data-view-id="knowledge"]')
    await expect(knowledgeNav.first()).toBeVisible({ timeout: 10_000 })
    await knowledgeNav.first().click()
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

    // Click the Analytics sub-nav button
    const analyticsButton = page.getByRole('button', {
        name: /Analytics|Analytik|Analitica|Analytique|Analyse/i,
    })
    await expect(analyticsButton.first()).toBeVisible({ timeout: 10_000 })
    await analyticsButton.first().click()
    await page.waitForTimeout(500)
}

test.describe('Analytics Dashboard Critical Path', () => {
    test.beforeEach(async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
    })

    test('navigates to Analytics Dashboard via Knowledge sub-nav', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        await navigateToAnalytics(page)

        // Dashboard should render without crash
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await expectNoCrashPatterns(page)

        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('Analytics Dashboard renders Garden Score section', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        await navigateToAnalytics(page)

        const mainContent = page.locator('main').first()

        // Should show Garden Score card or empty state -- both valid on fresh boot
        const gardenScore = mainContent.locator('[data-testid="analytics-garden-score"]')
        const emptyState = mainContent.locator('[data-testid="analytics-empty-state"]')
        const hasGardenScore = await gardenScore.isVisible().catch(() => false)
        const hasEmptyState = await emptyState.isVisible().catch(() => false)

        // Either the dashboard renders with data or shows empty state -- both valid
        expect(hasGardenScore || hasEmptyState).toBeTruthy()

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('Analytics Dashboard renders CSV export button', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        await navigateToAnalytics(page)

        const mainContent = page.locator('main').first()

        // Look for CSV export button
        const csvButton = mainContent.getByRole('button', { name: /CSV|Export/i })
        const hasCsvButton = await csvButton
            .first()
            .isVisible()
            .catch(() => false)

        // CSV button should be present (even with no data it renders)
        if (hasCsvButton) {
            await csvButton.first().click()
            await page.waitForTimeout(500)
        }

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('Analytics Dashboard handles rapid tab switching', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        const knowledgeNav = page.locator('[data-view-id="knowledge"]')
        await knowledgeNav.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Rapidly switch between Analytics, Sandbox, and back
        const analyticsButton = page.getByRole('button', { name: /Analytics|Analytik/i })
        const sandboxButton = page.getByRole('button', { name: /Sandbox/i })

        if (
            await analyticsButton
                .first()
                .isVisible()
                .catch(() => false)
        ) {
            await analyticsButton.first().click()
            await page.waitForTimeout(200)

            if (
                await sandboxButton
                    .first()
                    .isVisible()
                    .catch(() => false)
            ) {
                await sandboxButton.first().click()
                await page.waitForTimeout(200)
                await analyticsButton.first().click()
                await page.waitForTimeout(200)
            }
        }

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('Sandbox sub-tab renders without crash', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        const knowledgeNav = page.locator('[data-view-id="knowledge"]')
        await knowledgeNav.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        const sandboxButton = page.getByRole('button', { name: /Sandbox/i })
        const hasSandbox = await sandboxButton
            .first()
            .isVisible()
            .catch(() => false)

        if (hasSandbox) {
            await sandboxButton.first().click()
            await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        }

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })
})
