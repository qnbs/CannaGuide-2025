import { expect, Page } from '@playwright/test'

/**
 * Legacy helper kept for deploy-smoke and accessibility tests.
 * With gates removed, this is a no-op.
 */
export const seedLegalGateState = async (_page: Page) => {
    // No-op: consent and age gates auto-granted at boot
}

/**
 * Boot the app with a fresh browser context (Playwright default).
 * No database or localStorage seeding needed -- each test context is clean.
 * The app boots directly (consent auto-granted, no age gate).
 */
export const bootFreshAppWithLegalGates = async (page: Page) => {
    await page.goto('/', { waitUntil: 'networkidle' })
}

/**
 * Boot the app and dismiss the onboarding wizard so tests start at the shell.
 * Uses the same simple-navigation pattern as the passing screenshot tests.
 */
export const bootFreshAppPastOnboarding = async (page: Page) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await closeOnboardingIfVisible(page)
}

export const expectShellVisible = async (page: Page) => {
    await closeOnboardingIfVisible(page)
    await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 })
    // Desktop sidebar nav is hidden on mobile viewports
    const vw = page.viewportSize()?.width ?? 1280
    if (vw >= 768) {
        await expect(page.locator('nav').first()).toBeVisible({ timeout: 30_000 })
    }
    // Wait for at least one navigation button to be attached (app fully rendered)
    await page.waitForSelector('[data-view-id]', { state: 'attached', timeout: 30_000 })
}

export const closeOnboardingIfVisible = async (page: Page) => {
    const onboardingDialog = page.getByRole('dialog')
    let isVisible = await onboardingDialog.isVisible().catch(() => false)

    for (let attempt = 0; attempt < 20 && !isVisible; attempt += 1) {
        await page.waitForTimeout(200)
        isVisible = await onboardingDialog.isVisible().catch(() => false)
    }

    if (!isVisible) {
        return
    }

    // Select language (step 0 -> 1) -- do NOT return, continue through wizard
    const englishButton = onboardingDialog.getByRole('button', { name: /^English$/i })
    if (await englishButton.isVisible().catch(() => false)) {
        await englishButton.click()
        await page.waitForTimeout(300)
    } else {
        const germanButton = onboardingDialog.getByRole('button', { name: /^Deutsch$/i })
        if (await germanButton.isVisible().catch(() => false)) {
            await germanButton.click()
            await page.waitForTimeout(300)
        }
    }

    // Click through remaining wizard steps (up to 10)
    for (let step = 0; step < 10; step += 1) {
        const stillVisible = await onboardingDialog.isVisible().catch(() => false)
        if (!stillVisible) {
            break
        }

        const actionButton = onboardingDialog.locator('button').last()
        if (await actionButton.isVisible().catch(() => false)) {
            await actionButton.click()
        }
        await page.waitForTimeout(300)
    }
}

export const expectNoCrashPatterns = async (page: Page) => {
    await expect(page.getByRole('heading', { name: /Something went wrong\./i })).toHaveCount(0)
    await expect(
        page.getByRole('button', { name: /Reload Application|App neu laden/i }),
    ).toHaveCount(0)
}

export const attachRuntimeErrorTracking = (page: Page) => {
    const messages: string[] = []
    const ignoredPatterns = [
        /frame-ancestors' is ignored when delivered via a <meta> element/i,
        /The Content Security Policy directive 'frame-ancestors' is ignored/i,
        /Failed to load resource: the server responded with a status of [45]\d{2}/i,
        /Content Security Policy directive/i,
    ]

    const shouldIgnore = (message: string) =>
        ignoredPatterns.some((pattern) => pattern.test(message))

    const onPageError = (error: Error) => {
        if (!shouldIgnore(error.message)) {
            messages.push(error.message)
        }
    }

    const onConsole = (message: { type: () => string; text: () => string }) => {
        if (message.type() === 'error') {
            const text = message.text()
            if (!shouldIgnore(text)) {
                messages.push(text)
            }
        }
    }

    page.on('pageerror', onPageError)
    page.on('console', onConsole)

    return {
        messages,
        detach: () => {
            page.off('pageerror', onPageError)
            page.off('console', onConsole)
        },
    }
}
