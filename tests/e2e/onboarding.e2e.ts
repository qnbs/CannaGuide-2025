import { test, expect } from '@playwright/test'
import { bootFreshAppWithLegalGates, expectShellVisible } from './helpers'

test.describe('Onboarding Flow', () => {
    test('shows onboarding on first visit', async ({ page }) => {
        await bootFreshAppWithLegalGates(page)

        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 })
    })

    test('can navigate through app after load', async ({ page }) => {
        await bootFreshAppWithLegalGates(page)

        await expectShellVisible(page)
    })

    test('app renders navigation elements', async ({ page }) => {
        await bootFreshAppWithLegalGates(page)

        await expectShellVisible(page)
    })
})
