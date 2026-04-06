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
    // SW registration on cold CDN can take 30-60s. Use a generous timeout.
    test.setTimeout(90_000)
    const resolvedBaseUrl = baseURL || 'https://qnbs.github.io/CannaGuide-2025/'
    const base = new URL(resolvedBaseUrl)
    const expectedPathPrefix = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`

    await page.goto(resolvedBaseUrl, { waitUntil: 'networkidle' })
    await closeOnboardingIfVisible(page)

    await page.waitForFunction(() => 'serviceWorker' in navigator)

    // Atomically wait for SW registrations AND snapshot them in a single
    // evaluate call. This avoids the TOCTOU race where a separate
    // waitForFunction sees registrations > 0 but a subsequent evaluate
    // returns 0 because the SW transitioned between calls.
    const registrations = (await page.evaluate(async () => {
        const deadline = Date.now() + 75_000
        const poll = 500

        while (true) {
            const entries = await navigator.serviceWorker.getRegistrations()
            if (entries.length > 0) {
                return entries.map((registration) => ({
                    scope: registration.scope,
                    scriptURL:
                        registration.active?.scriptURL ||
                        registration.waiting?.scriptURL ||
                        registration.installing?.scriptURL ||
                        null,
                    hasActiveOrWaiting: Boolean(registration.active || registration.waiting),
                }))
            }
            if (Date.now() >= deadline) return []
            await new Promise((r) => setTimeout(r, poll))
        }
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
