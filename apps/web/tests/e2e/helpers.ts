import { expect, Page } from '@playwright/test'

const DEFAULT_DEPLOY_BASE_URL = 'https://qnbs.github.io/CannaGuide-2025/'

const isGithubPagesHost = (hostname: string) =>
    hostname === 'github.io' || hostname.endsWith('.github.io')

const isCloudflarePagesHost = (hostname: string) =>
    hostname.endsWith('.pages.dev')

/** True when tests target a live GitHub Pages / preview deployment. */
export const isDeployedTarget = (baseURL?: string) => {
    if (process.env.DEPLOY_BASE_URL) return true
    if (!baseURL) return false
    try {
        const { hostname } = new URL(baseURL)
        return isGithubPagesHost(hostname) || isCloudflarePagesHost(hostname)
    } catch {
        return false
    }
}

export const resolveDeployBaseUrl = (baseURL?: string) =>
    baseURL || process.env.DEPLOY_BASE_URL || DEFAULT_DEPLOY_BASE_URL

/**
 * Seed legal gate state (age verification + GDPR consent) so the
 * onboarding wizard skips the legal step automatically.
 * Must be called BEFORE page.goto() to set localStorage/cookies before hydration.
 */
export const seedLegalGateState = async (page: Page) => {
    await page.addInitScript(() => {
        localStorage.setItem('cg.ageVerified.v1', '1')
        localStorage.setItem('cg.geoLegal.dismissed.v1', '1')
        // Grant GDPR consent via cookie (matches consentService v2 format)
        document.cookie = 'cg.gdpr.consent.v2=1; Max-Age=31536000; Path=/; SameSite=Lax'
    })
}

/**
 * Boot the app with a fresh browser context (Playwright default).
 * Seeds legal gates so tests are not blocked by the age/consent step.
 */
export const bootFreshAppWithLegalGates = async (page: Page, baseURL?: string) => {
    await seedLegalGateState(page)
    const deployed = isDeployedTarget(baseURL)
    const url = deployed ? resolveDeployBaseUrl(baseURL) : '/'
    const waitUntil = deployed ? 'load' : 'domcontentloaded'
    await page.goto(url, { waitUntil })
}

/**
 * Boot the app and dismiss the onboarding wizard so tests start at the shell.
 * Deploy targets wait for `load` so SW registration and React hydration complete.
 */
export const bootFreshAppPastOnboarding = async (page: Page, baseURL?: string) => {
    await seedLegalGateState(page)
    const deployed = isDeployedTarget(baseURL)
    const url = deployed ? resolveDeployBaseUrl(baseURL) : '/'
    const waitUntil = deployed ? 'load' : 'domcontentloaded'
    await page.goto(url, { waitUntil })
    await waitForAppReady(page)
    await closeOnboardingIfVisible(page)
}

/** Post-hydration gate: shell is blocked until bootstrap finishes (see postHydration.ts). */
export const waitForAppReady = async (page: Page) => {
    await page.waitForSelector('#root', { state: 'attached', timeout: 60_000 })
    await page.waitForFunction(
        () => document.body.getAttribute('data-app-ready') === 'true',
        undefined,
        { timeout: 90_000 },
    )
}

export const waitForAppShell = async (page: Page) => {
    await waitForAppReady(page)
    await closeOnboardingIfVisible(page)
    await page.waitForSelector('[data-view-id]', { state: 'attached', timeout: 60_000 })
    await expect
        .poll(async () => page.locator('[data-view-id]').count(), { timeout: 60_000 })
        .toBeGreaterThan(0)
}

export const expectShellVisible = async (page: Page) => {
    await closeOnboardingIfVisible(page)
    await waitForAppShell(page)

    const main = page.locator('main').first()
    await expect
        .poll(async () => main.isVisible().catch(() => false), { timeout: 60_000 })
        .toBe(true)

    // Desktop sidebar nav is hidden on mobile viewports
    const vw = page.viewportSize()?.width ?? 1280
    if (vw >= 768) {
        await expect(page.locator('nav').first()).toBeVisible({ timeout: 30_000 })
    }
}

/** Wait for service worker + Workbox caches on deployed Pages (cold CDN tolerant). */
export const waitForCannaguideCaches = async (page: Page, deadlineMs = 60_000) => {
    await page.waitForFunction(() => 'serviceWorker' in navigator, undefined, { timeout: 10_000 })

    const cacheNames = await page.evaluate(async (timeoutMs) => {
        try {
            await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<void>((resolve) => {
                    setTimeout(resolve, timeoutMs)
                }),
            ])
        } catch {
            // Fall through to cache snapshot
        }

        const keys = await caches.keys()
        return keys.filter((key) => key.includes('cannaguide'))
    }, deadlineMs)

    return cacheNames
}

export const closeOnboardingIfVisible = async (page: Page) => {
    const onboardingDialog = page.getByRole('dialog')
    const dialogVisible = await onboardingDialog
        .waitFor({ state: 'visible', timeout: 15_000 })
        .then(() => true)
        .catch(() => false)

    if (!dialogVisible) {
        return
    }

    const nextButtonPattern = /^(Next|Weiter|Siguiente|Suivant|Volgende)$/i
    const finishButtonPattern = /perfect|let's grow|los geht's|fertig|finish|start grow|commençons/i

    // Step 1: language — changeAppLanguage is async; wait for feature slides before advancing.
    const englishButton = onboardingDialog.getByRole('button', { name: /^English$/i })
    if (await englishButton.isVisible().catch(() => false)) {
        await englishButton.click()
        await expect(onboardingDialog.getByRole('button', { name: nextButtonPattern })).toBeVisible({
            timeout: 30_000,
        })
    }

    for (let step = 0; step < 15; step += 1) {
        const stillVisible = await onboardingDialog.isVisible().catch(() => false)
        if (!stillVisible) {
            break
        }

        const finishButton = onboardingDialog.getByRole('button', { name: finishButtonPattern })
        if (await finishButton.isVisible().catch(() => false)) {
            await finishButton.click()
            break
        }

        const nextButton = onboardingDialog.getByRole('button', { name: nextButtonPattern })
        if (await nextButton.isVisible().catch(() => false)) {
            await nextButton.click()
            await page.waitForTimeout(250)
            continue
        }

        const actionButton = onboardingDialog.locator('button').last()
        if (await actionButton.isVisible().catch(() => false)) {
            await actionButton.click()
        }
        await page.waitForTimeout(250)
    }

    await expect(onboardingDialog).toBeHidden({ timeout: 30_000 })
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
