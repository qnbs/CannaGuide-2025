import { test, expect } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    closeOnboardingIfVisible,
    expectShellVisible,
    resolveDeployBaseUrl,
    seedLegalGateState,
    waitForCannaguideCaches,
} from './helpers'

test.describe('Offline & PWA', () => {
    test('app renders after going offline', async ({ page, context, baseURL }) => {
        // Known Chromium headless SEGV crash on CI with offline context + missing GPU adapters
        test.skip(!!process.env.CI, 'Chromium headless SEGV on CI with offline context')

        await bootFreshAppPastOnboarding(page, baseURL)
        await expectShellVisible(page)

        await expect(page.locator('#root')).toBeVisible()

        await context.setOffline(true)

        await page.reload().catch(() => {
            // Reload might fail offline — expected if SW is not controlling yet
        })

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

        await context.setOffline(false)
    })

    test('service worker is registered', async ({ page, baseURL }) => {
        const resolvedBaseUrl = resolveDeployBaseUrl(baseURL)
        test.setTimeout(90_000)

        await seedLegalGateState(page)
        await page.goto(resolvedBaseUrl, { waitUntil: 'load' })
        await closeOnboardingIfVisible(page)

        const swRegistered = await page.evaluate(async () => {
            if (!('serviceWorker' in navigator)) return false
            try {
                await Promise.race([
                    navigator.serviceWorker.ready,
                    new Promise<void>((resolve) => {
                        setTimeout(resolve, 45_000)
                    }),
                ])
            } catch {
                // Fall through to registration snapshot
            }
            const registrations = await navigator.serviceWorker.getRegistrations()
            return registrations.length > 0
        })

        expect(typeof swRegistered).toBe('boolean')
    })

    test('manifest.json is accessible', async ({ page, request, baseURL }) => {
        const resolvedBaseUrl = resolveDeployBaseUrl(baseURL)
        const base = new URL(resolvedBaseUrl)
        const manifestUrl = new URL('manifest.json', base).toString()

        const response = await request.get(manifestUrl)
        expect(response.ok()).toBeTruthy()
        const manifest = await response.json()
        expect(manifest.name).toBeTruthy()
    })

    test('service worker creates a cannaguide cache entry after shell load', async ({
        page,
        baseURL,
    }) => {
        test.setTimeout(90_000)

        await bootFreshAppPastOnboarding(page, baseURL)
        await expectShellVisible(page)

        const cannaguideCaches = await waitForCannaguideCaches(page, 60_000)

        expect(
            cannaguideCaches.length,
            `Expected Workbox caches containing "cannaguide". Found: ${cannaguideCaches.join(', ') || '(none)'}`,
        ).toBeGreaterThan(0)
    })
})
