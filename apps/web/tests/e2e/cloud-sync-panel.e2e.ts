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

    // Gist sync is disabled (CLOUD_SYNC_DISABLED in constants.ts): syncService
    // never sends an Authorization header and the production CSP does not allow
    // api.github.com, so every push/pull would fail immediately. This asserts
    // the honest-unavailable state rather than a working feature.
    //
    // Push/Pull only render once cloudSync.provider === 'gist' (isSyncEnabled),
    // and a fresh session starts with sync off -- CLOUD_SYNC_DISABLED also
    // blocks newly turning it on, so those buttons are never in the DOM here.
    // The reachable assertion for a fresh install is the disabled toggle plus
    // the explanation banner; push/pull staying disabled for a user who
    // already has sync enabled from before this shipped is exercised by the
    // `disabled={... || CLOUD_SYNC_DISABLED}` unit-level wiring, not this E2E.
    test('cloud sync toggle is disabled while unavailable, with an honest explanation', async ({
        page,
    }) => {
        await page.locator('[data-view-id="settings"]').first().click()
        await page.locator('[data-tab-id="data"]').click({ timeout: 15_000 })
        await expect(page.getByTestId('cloud-sync-panel')).toBeVisible({ timeout: 25_000 })

        await expect(page.getByTestId('cloud-sync-toggle')).toBeDisabled()
        await expect(page.getByTestId('cloud-sync-unavailable-banner')).toBeVisible()
    })
})
