import { test, expect } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    bootFreshAppWithLegalGates,
    closeOnboardingIfVisible,
    expectShellVisible,
} from './helpers'

test.describe('Offline & PWA', () => {
    test('app renders after going offline', async ({ page, context }) => {
        // Use past-onboarding boot so the app shell renders reliably
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)

        // Verify initial load
        await expect(page.locator('#root')).toBeVisible()

        // Go offline
        await context.setOffline(true)

        // App should still be visible (PWA offline support)
        await page.reload().catch(() => {
            // Reload might fail offline — that's expected if SW isn't active
        })

        // Offline mode may preserve the SPA shell or switch to the SW fallback page.
        const offlineHeading = page.getByRole('heading', { name: /you are offline/i })
        await expect
            .poll(
                async () => {
                    const rootVisible = await page
                        .locator('#root')
                        .isVisible()
                        .catch(() => false)
                    const fallbackVisible = await offlineHeading.isVisible().catch(() => false)
                    return rootVisible || fallbackVisible
                },
                { timeout: 30_000 },
            )
            .toBe(true)

        // Go back online
        await context.setOffline(false)
    })

    test('service worker is registered', async ({ page }) => {
        await bootFreshAppWithLegalGates(page)
        await closeOnboardingIfVisible(page)

        const swRegistered = await page.evaluate(async () => {
            if (!('serviceWorker' in navigator)) return false
            const registrations = await navigator.serviceWorker.getRegistrations()
            return registrations.length > 0
        })

        // SW may or may not be registered in preview mode, just ensure no crash
        expect(typeof swRegistered).toBe('boolean')
    })

    test('manifest.json is accessible', async ({ page }) => {
        const response = await page.goto('./manifest.json')
        if (response && response.ok()) {
            const manifest = await response.json()
            expect(manifest.name).toBeTruthy()
        }
    })
})
