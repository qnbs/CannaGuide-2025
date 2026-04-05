import { expect, test } from '@playwright/test'

type SwRegistrationSnapshot = {
    scope: string
    scriptURL: string | null
    hasActiveOrWaiting: boolean
}

const closeOnboardingIfVisible = async (page: import('@playwright/test').Page) => {
    const onboardingDialog = page.getByRole('dialog')
    if (!(await onboardingDialog.isVisible().catch(() => false))) {
        return
    }

    for (let step = 0; step < 6; step += 1) {
        const isVisible = await onboardingDialog.isVisible().catch(() => false)
        if (!isVisible) {
            break
        }

        const actionButton = onboardingDialog.locator('button').last()
        await actionButton.click()
        await page.waitForTimeout(150)
    }
}

test('pwa update: service worker registers with GitHub Pages subpath scope', async ({
    page,
    baseURL,
}) => {
    const resolvedBaseUrl = baseURL || 'https://qnbs.github.io/CannaGuide-2025/'
    const base = new URL(resolvedBaseUrl)
    const expectedPathPrefix = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`

    await page.goto(resolvedBaseUrl, { waitUntil: 'networkidle' })
    await closeOnboardingIfVisible(page)

    await page.waitForFunction(() => 'serviceWorker' in navigator)

    // Wait for at least one SW registration to appear (async registration may take time in CI)
    await page.waitForFunction(
        async () => {
            const entries = await navigator.serviceWorker.getRegistrations()
            return entries.length > 0
        },
        { timeout: 30_000 },
    )

    const registrations = (await page.evaluate(async () => {
        const entries = await navigator.serviceWorker.getRegistrations()

        return entries.map((registration) => ({
            scope: registration.scope,
            scriptURL:
                registration.active?.scriptURL ||
                registration.waiting?.scriptURL ||
                registration.installing?.scriptURL ||
                null,
            hasActiveOrWaiting: Boolean(registration.active || registration.waiting),
        }))
    })) as SwRegistrationSnapshot[]

    expect(registrations.length).toBeGreaterThan(0)

    const targetRegistration = registrations.find((registration) => {
        const scopeUrl = new URL(registration.scope)
        return (
            scopeUrl.pathname === expectedPathPrefix ||
            scopeUrl.pathname.startsWith(expectedPathPrefix)
        )
    })

    expect(targetRegistration).toBeDefined()
    expect(targetRegistration?.hasActiveOrWaiting).toBeTruthy()

    const scriptPathname = targetRegistration?.scriptURL
        ? new URL(targetRegistration.scriptURL).pathname
        : ''
    expect(scriptPathname).toContain(`${expectedPathPrefix}sw.js`)
})
