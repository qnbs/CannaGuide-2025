import { expect, test } from '@playwright/test'

type SwRegistrationSnapshot = {
    scope: string
    scriptURL: string | null
    state: string | null
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
    // SW registration on live GitHub Pages CDN can be slow on cold start.
    // The test needs enough budget to cover:
    //   1) CDN page delivery (variable, 2-15s)
    //   2) React hydration + JS execution (~3-5s)
    //   3) window.load event fires -> registerServiceWorker() called
    //   4) sw.js fetch + parse + install + activate (5-30s on cold CDN)
    // Total budget: 90s with the evaluate() internal deadline at 60s.
    test.setTimeout(90_000)

    const resolvedBaseUrl = baseURL || 'https://qnbs.github.io/CannaGuide-2025/'
    const base = new URL(resolvedBaseUrl)
    const expectedPathPrefix = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`

    // Step 1: Navigate and wait for full page load (not just networkidle).
    // The SW registration is triggered by the 'load' event listener in
    // index.tsx, so we must ensure load has fired before we start waiting
    // for registration. Using 'load' waitUntil guarantees this.
    await page.goto(resolvedBaseUrl, { waitUntil: 'load' })

    // Step 2: Dismiss onboarding if it blocks the UI (does not affect SW).
    await closeOnboardingIfVisible(page)

    // Step 3: Verify the browser supports service workers.
    await page.waitForFunction(() => 'serviceWorker' in navigator, undefined, { timeout: 5_000 })

    // Step 4: Wait for the SW to reach 'activated' state. This is the
    // real fix -- instead of polling getRegistrations() in a busy loop,
    // we use the browser's native 'ready' promise which resolves when the
    // SW controlling this page is active. If the page already has an
    // active controller from a previous visit (cache), this resolves
    // instantly. On first visit, it waits for install -> activate.
    //
    // Fallback: if 'ready' does not resolve within 60s (e.g. the SW
    // failed to install), we fall back to snapshot whatever registrations
    // exist so the error message is informative.
    const registrations = (await page.evaluate(async () => {
        const DEADLINE = 60_000

        try {
            // navigator.serviceWorker.ready resolves when an active SW
            // controls the page. This is the canonical way to wait for SW.
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<null>((resolve) => setTimeout(() => resolve(null), DEADLINE)),
            ])

            if (registration) {
                const sw = registration.active || registration.waiting || registration.installing
                return [
                    {
                        scope: registration.scope,
                        scriptURL: sw?.scriptURL ?? null,
                        state: sw?.state ?? null,
                    },
                ]
            }
        } catch {
            // ready promise rejected -- fall through to manual polling
        }

        // Fallback: snapshot whatever registrations exist for diagnostics
        const entries = await navigator.serviceWorker.getRegistrations()
        return entries.map((r) => {
            const sw = r.active || r.waiting || r.installing
            return {
                scope: r.scope,
                scriptURL: sw?.scriptURL ?? null,
                state: sw?.state ?? null,
            }
        })
    })) as SwRegistrationSnapshot[]

    // Step 5: Assertions
    expect(
        registrations.length,
        `Expected at least one SW registration. Got 0. ` +
            `The service worker at ${expectedPathPrefix}sw.js may have failed to install. ` +
            `Check the deploy build output and sw.js precache manifest.`,
    ).toBeGreaterThan(0)

    const targetRegistration = registrations.find((registration) => {
        const scopeUrl = new URL(registration.scope)
        return (
            scopeUrl.pathname === expectedPathPrefix ||
            scopeUrl.pathname.startsWith(expectedPathPrefix)
        )
    })

    expect(
        targetRegistration,
        `No SW registration matched scope prefix "${expectedPathPrefix}". ` +
            `Found scopes: ${registrations.map((r) => r.scope).join(', ')}`,
    ).toBeDefined()

    expect(targetRegistration?.state).toMatch(/activated|activating|installed|installing/)

    const scriptPathname = targetRegistration?.scriptURL
        ? new URL(targetRegistration.scriptURL).pathname
        : ''
    expect(scriptPathname).toContain(`${expectedPathPrefix}sw.js`)
})
