import { test, expect } from '@playwright/test'
import { bootFreshAppPastOnboarding, expectShellVisible } from './helpers'

/**
 * Stable selectors: Settings → Data tab → CloudSyncPanel (GitHub Gist sync).
 * Conflict-resolution UI is covered in unit tests (SyncConflictModal); full
 * multi-device conflict E2E requires mocked GitHub API — tracked separately.
 */
test.describe('Cloud sync panel', () => {
    test.beforeEach(async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
    })

    test('Settings Data tab shows cloud sync panel', async ({ page }) => {
        await page.locator('[data-view-id="settings"]').first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        await page.locator('[data-tab-id="data"]').click({ timeout: 15_000 })

        await expect(page.getByTestId('cloud-sync-panel')).toBeVisible({ timeout: 25_000 })
    })

    test('conflict modal is not shown without a detected divergence', async ({ page }) => {
        await page.locator('[data-view-id="settings"]').first().click()
        await page.locator('[data-tab-id="data"]').click({ timeout: 15_000 })
        await expect(page.getByTestId('cloud-sync-panel')).toBeVisible({ timeout: 25_000 })

        await expect(page.getByTestId('sync-conflict-modal')).toHaveCount(0)
    })
})
