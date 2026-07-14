import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { closeOnboardingIfVisible, seedLegalGateState } from './helpers'

const waitForVisibleNavigation = async (page: import('@playwright/test').Page) => {
    await page.waitForSelector('[data-view-id]', { state: 'attached', timeout: 60_000 })
    const navButtons = page.locator('[data-view-id]:visible')
    await expect.poll(async () => navButtons.count(), { timeout: 30_000 }).toBeGreaterThan(0)
}

test('a11y: no serious/critical axe violations in shell landmarks', async ({
    page,
    baseURL,
    browserName,
}) => {
    // WebKit JS engine is slower for initial parse + axe analysis
    if (browserName === 'webkit') test.slow()

    await seedLegalGateState(page)
    await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', {
        waitUntil: 'networkidle',
    })
    await closeOnboardingIfVisible(page)

    await expect(page.locator('main')).toBeVisible()
    await waitForVisibleNavigation(page)

    const accessibilityScanResults = await new AxeBuilder({ page }).include('main').analyze()

    const seriousOrCriticalViolations = accessibilityScanResults.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact || ''),
    )

    expect(seriousOrCriticalViolations).toEqual([])
})

// The shell scan above never leaves the landing view, so every other view -- including the
// ones that render charts -- went unscanned. Strains is the one view reachable from a cold
// deploy with no seeded user data.
test('a11y: no serious/critical axe violations in the strains view', async ({
    page,
    baseURL,
    browserName,
}) => {
    if (browserName === 'webkit') test.slow()

    await seedLegalGateState(page)
    await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', {
        waitUntil: 'networkidle',
    })
    await closeOnboardingIfVisible(page)
    await waitForVisibleNavigation(page)

    await page.locator('[data-view-id="strains"]:visible').first().click()
    await expect(page.locator('main')).toBeVisible()

    const results = await new AxeBuilder({ page }).include('main').analyze()

    const seriousOrCritical = results.violations.filter((violation) =>
        ['serious', 'critical'].includes(violation.impact || ''),
    )

    expect(seriousOrCritical).toEqual([])
})
