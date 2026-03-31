import { expect, test } from '@playwright/test'
import { closeOnboardingIfVisible, seedLegalGateState } from './helpers'

const expectNoCrashPatterns = async (page: import('@playwright/test').Page) => {
    await expect(page.getByRole('heading', { name: /Something went wrong\./i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Reload Application/i })).toHaveCount(0)
}

const waitForVisibleNavigation = async (page: import('@playwright/test').Page) => {
    await page.waitForSelector('[data-view-id]', { state: 'attached', timeout: 60_000 })
    const navButtons = page.locator('[data-view-id]:visible')
    await expect.poll(async () => navButtons.count(), { timeout: 30_000 }).toBeGreaterThan(0)
    return navButtons
}

test('deploy smoke: shell, assets and main navigation render without crash', async ({
    page,
    request,
    baseURL,
}) => {
    await seedLegalGateState(page)
    await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', {
        waitUntil: 'networkidle',
    })
    await closeOnboardingIfVisible(page)

    await expect(page).toHaveTitle(/CannaGuide|Cannaguide/i)
    await expectNoCrashPatterns(page)

    const navButtons = await waitForVisibleNavigation(page)
    await expect(navButtons.first()).toBeVisible()

    await navButtons.first().focus()
    await page.keyboard.press('Enter')
    const currentAfterKeyboard = page.locator('[data-view-id]:visible[aria-current="page"]').first()
    await expect(currentAfterKeyboard).toBeVisible()

    await navButtons.first().click()
    await expectNoCrashPatterns(page)

    // Resolve asset URLs relative to the actual page origin + base path,
    // not just baseURL (which may lack the Vite base prefix like /CannaGuide-2025/).
    const pageOrigin = new URL(page.url()).origin
    const pagePath = new URL(page.url()).pathname.replace(/\/[^/]*$/, '/')
    const manifestUrl = `${pageOrigin}${pagePath}manifest.json`
    const swUrl = `${pageOrigin}${pagePath}sw.js`

    const [manifestResponse, swResponse] = await Promise.all([
        request.get(manifestUrl),
        request.get(swUrl),
    ])
    expect(manifestResponse.ok()).toBeTruthy()
    expect(swResponse.ok()).toBeTruthy()
})

test('deploy smoke: app starts without Web Speech API support', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
        try {
            Object.defineProperty(window, 'speechSynthesis', {
                configurable: true,
                value: undefined,
            })
        } catch {
            // no-op: best-effort for locked browser implementations
        }

        try {
            Object.defineProperty(window, 'SpeechSynthesisUtterance', {
                configurable: true,
                value: undefined,
            })
        } catch {
            // no-op: best-effort for locked browser implementations
        }
    })

    await seedLegalGateState(page)
    await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', {
        waitUntil: 'networkidle',
    })
    await closeOnboardingIfVisible(page)

    await expect(page).toHaveTitle(/CannaGuide|Cannaguide/i)
    await expectNoCrashPatterns(page)

    const navButtons = await waitForVisibleNavigation(page)
    await expect(navButtons.first()).toBeVisible()
})

test('deploy smoke: app starts without SpeechRecognition support', async ({ page, baseURL }) => {
    await page.addInitScript(() => {
        try {
            Object.defineProperty(window, 'SpeechRecognition', {
                configurable: true,
                value: undefined,
            })
        } catch {
            // no-op: best-effort for locked browser implementations
        }

        try {
            Object.defineProperty(window, 'webkitSpeechRecognition', {
                configurable: true,
                value: undefined,
            })
        } catch {
            // no-op: best-effort for locked browser implementations
        }
    })

    await seedLegalGateState(page)
    await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', {
        waitUntil: 'networkidle',
    })
    await closeOnboardingIfVisible(page)

    await expect(page).toHaveTitle(/CannaGuide|Cannaguide/i)
    await expectNoCrashPatterns(page)

    const navButtons = await waitForVisibleNavigation(page)
    await expect(navButtons.first()).toBeVisible()
})
