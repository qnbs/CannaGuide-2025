import { test, expect } from '@playwright/test'
import { bootFreshAppWithLegalGates, expectShellVisible } from './helpers'

test.describe('Onboarding Flow', () => {
    test('shows onboarding dialog and app shell renders after dismissal', async ({ page }) => {
        await bootFreshAppWithLegalGates(page)

        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 })

        await expectShellVisible(page)
    })
})
