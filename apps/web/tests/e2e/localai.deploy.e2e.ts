import { expect, test } from '@playwright/test'
import { closeOnboardingIfVisible, seedLegalGateState } from './helpers'

test('settings expose the local AI offline cache section', async ({ page, baseURL }) => {
    await seedLegalGateState(page)
    await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', {
        waitUntil: 'networkidle',
    })
    await closeOnboardingIfVisible(page)

    // Wait for navigation to render, then click Settings
    const settingsButton = page
        .getByRole('button', { name: /settings/i })
        .or(page.locator('[data-view-id="settings"]'))
    await settingsButton.first().click({ timeout: 30_000 })

    // Switch to the AI tab (default tab is "plants")
    const aiTab = page.locator('[data-tab="ai"]')
    await aiTab.click({ timeout: 15_000 })

    await expect(page.getByText(/Local AI Offline Cache|Lokaler KI-Offline-Cache/i)).toBeVisible()
    await expect(
        page.getByRole('button', { name: /Preload Offline Models|Offline-Modelle vorladen/i }),
    ).toBeVisible()
})
