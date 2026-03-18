import { expect, Page } from '@playwright/test'

export const seedLegalGateState = async (page: Page) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('cg.gdpr.consent.v1', '1')
        window.localStorage.setItem('cg.ageVerified.v1', '1')
    })
}

export const resetAppStateKeepingLegalGates = async (page: Page) => {
    await page.addInitScript(() => {
        window.localStorage.clear()
        window.sessionStorage.clear()
        window.localStorage.setItem('cg.gdpr.consent.v1', '1')
        window.localStorage.setItem('cg.ageVerified.v1', '1')
    })
}

export const deleteAppDatabases = async (page: Page) => {
    await page.evaluate(async () => {
        const databaseNames = ['CannaGuideStateDB', 'CannaGuideDB', 'CannaGuideSecureDB', 'CannaGuideReminderDB', 'cannaguide-db']
        await Promise.all(
            databaseNames.map(
                (name) =>
                    new Promise<void>((resolve) => {
                        const request = indexedDB.deleteDatabase(name)
                        request.onsuccess = () => resolve()
                        request.onerror = () => resolve()
                        request.onblocked = () => resolve()
                    }),
            ),
        )
    })
}

export const bootFreshAppWithLegalGates = async (page: Page) => {
    await resetAppStateKeepingLegalGates(page)
    await page.goto('/')
    await deleteAppDatabases(page)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForLoadState('networkidle')
}

export const expectShellVisible = async (page: Page) => {
    await closeOnboardingIfVisible(page)
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 15_000 })
}

export const closeOnboardingIfVisible = async (page: Page) => {
    const onboardingDialog = page.getByRole('dialog')
    if (!(await onboardingDialog.isVisible().catch(() => false))) {
        return
    }

    for (let step = 0; step < 10; step += 1) {
        const isVisible = await onboardingDialog.isVisible().catch(() => false)
        if (!isVisible) {
            break
        }

        const actionButton = onboardingDialog.locator('button').last()
        await actionButton.click()
        await page.waitForTimeout(150)
    }
}
