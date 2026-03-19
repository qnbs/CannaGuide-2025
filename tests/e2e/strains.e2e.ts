import { expect, test } from '@playwright/test'
import {
    attachRuntimeErrorTracking,
    corruptIndexedDbStrains,
    bootFreshAppPastOnboarding,
    expectShellVisible,
    expectNoCrashPatterns,
} from './helpers'

const navigateToStrains = async (page: import('@playwright/test').Page) => {
    const strainsNav = page.getByRole('navigation').getByRole('button', { name: /Sorten|Strains/i }).first()
    await expect(strainsNav).toBeVisible({ timeout: 10_000 })
    await strainsNav.click()
    await page.waitForLoadState('networkidle')
}

test.describe('Strains page crash detection', () => {
    test('loads strains content without runtime errors', async ({ page }) => {
        const runtimeErrors = attachRuntimeErrorTracking(page)

        try {
            await bootFreshAppPastOnboarding(page)
            await expectShellVisible(page)
            await navigateToStrains(page)

            await expectNoCrashPatterns(page)
            await expect(page.getByRole('button', { name: /All Strains|Alle Sorten/i }).first()).toBeVisible({ timeout: 15_000 })
            await expect(page.getByRole('button', { name: /My Strains|Meine Sorten/i }).first()).toBeVisible({ timeout: 15_000 })
            await expect(runtimeErrors.messages, runtimeErrors.messages.join('\n')).toHaveLength(0)
        } finally {
            runtimeErrors.detach()
        }
    })

    test('switching strains tabs does not crash', async ({ page }) => {
        const runtimeErrors = attachRuntimeErrorTracking(page)

        try {
            await bootFreshAppPastOnboarding(page)
            await expectShellVisible(page)
            await navigateToStrains(page)

            const tabButtons = page.getByRole('button', { name: /All Strains|Alle Sorten|My Strains|Meine Sorten|Favorites|Favoriten|Genealogy|Breeding Lab|Exports|Tips/i })
            const count = await tabButtons.count()

            for (let index = 0; index < Math.min(count, 6); index += 1) {
                const button = tabButtons.nth(index)
                if (await button.isVisible()) {
                    await button.click()
                    await page.waitForLoadState('networkidle')
                    await expectNoCrashPatterns(page)
                }
            }

            await expect(runtimeErrors.messages, runtimeErrors.messages.join('\n')).toHaveLength(0)
        } finally {
            runtimeErrors.detach()
        }
    })

    test('survives corrupted persisted strain records', async ({ page }) => {
        const runtimeErrors = attachRuntimeErrorTracking(page)

        try {
            await bootFreshAppPastOnboarding(page)
            await expectShellVisible(page)
            await corruptIndexedDbStrains(page)

            await page.reload({ waitUntil: 'networkidle' })
            await expectShellVisible(page)
            await navigateToStrains(page)

            await expectNoCrashPatterns(page)
            await expect(page.getByRole('button', { name: /All Strains|Alle Sorten/i }).first()).toBeVisible({ timeout: 15_000 })
            await expect(runtimeErrors.messages, runtimeErrors.messages.join('\n')).toHaveLength(0)
        } finally {
            runtimeErrors.detach()
        }
    })
})
