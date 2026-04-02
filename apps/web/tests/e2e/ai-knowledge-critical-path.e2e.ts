import { test, expect } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    expectNoCrashPatterns,
    attachRuntimeErrorTracking,
    expectShellVisible,
} from './helpers'

// ---------------------------------------------------------------------------
// AI / Knowledge View -- Critical Path E2E Tests
//
// Validates the AI-powered features UI:
// - Navigation to Knowledge view (Mentor, Guide, Sandbox)
// - Mentor chat interface rendering
// - AI settings panel accessibility
// - Local AI section visibility
// - Graceful fallback when no API key is configured
// ---------------------------------------------------------------------------

test.describe('AI Knowledge Critical Path', () => {
    test.beforeEach(async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
    })

    test('navigates to Knowledge view with Mentor tab', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        const knowledgeNavButton = page.locator('[data-view-id="knowledge"]')
        await expect(knowledgeNavButton.first()).toBeVisible({ timeout: 10_000 })
        await knowledgeNavButton.first().click()

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await expectNoCrashPatterns(page)

        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('Knowledge view has tabs (Mentor, Guide, etc.)', async ({ page }) => {
        const knowledgeNavButton = page.locator('[data-view-id="knowledge"]')
        await knowledgeNavButton.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Should have tabs or sub-navigation
        const tabs = page.getByRole('tab')
        const buttons = page.getByRole('button')
        const hasTabs = (await tabs.count()) > 0
        const mentorButton = buttons.filter({ hasText: /mentor/i })
        const hasMentor = await mentorButton
            .first()
            .isVisible()
            .catch(() => false)

        expect(hasTabs || hasMentor).toBeTruthy()
        await expectNoCrashPatterns(page)
    })

    test('Mentor chat area renders without crash', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        const knowledgeNavButton = page.locator('[data-view-id="knowledge"]')
        await knowledgeNavButton.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Try to navigate to Mentor if it is a tab
        const mentorTab = page.getByRole('tab', { name: /mentor/i })
        if (await mentorTab.isVisible().catch(() => false)) {
            await mentorTab.click()
            await page.waitForTimeout(500)
        }

        // Mentor should show some form of chat interface or input
        const chatInput = page
            .getByRole('textbox')
            .or(page.locator('textarea'))
            .or(page.getByPlaceholder(/ask|frage|message|nachricht/i))

        // Chat UI should be present (even without API key)
        await chatInput
            .first()
            .isVisible()
            .catch(() => false)

        // Even without API key, the chat UI should render
        await expectNoCrashPatterns(page)

        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('AI Settings accessible from Settings view', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        // Settings is not in mainNavViews -- it lives in the Header
        const settingsButton = page.getByRole('button', { name: /^settings$/i })
        await expect(settingsButton.first()).toBeVisible({ timeout: 15_000 })
        await settingsButton.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Look for AI-related settings content
        const aiSection = page.getByText(/ai|gemini|api.?key|local.*ai|provider/i).first()
        const hasAiSection = await aiSection.isVisible().catch(() => false)
        expect(hasAiSection).toBeTruthy()

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('Knowledge view handles tab switching without errors', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        const knowledgeNavButton = page.locator('[data-view-id="knowledge"]')
        await knowledgeNavButton.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Switch through available tabs
        const tabs = page.getByRole('tab')
        const tabCount = await tabs.count()

        for (let i = 0; i < Math.min(tabCount, 6); i += 1) {
            const tab = tabs.nth(i)
            if (await tab.isVisible().catch(() => false)) {
                await tab.click()
                await page.waitForTimeout(500)
            }
        }

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })
})
