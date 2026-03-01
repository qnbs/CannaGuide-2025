import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

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

test('a11y: no serious/critical axe violations in shell landmarks', async ({ page, baseURL }) => {
  await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', { waitUntil: 'networkidle' })
  await closeOnboardingIfVisible(page)

  await expect(page.locator('header')).toBeVisible()
  await expect(page.locator('main')).toBeVisible()

  const accessibilityScanResults = await new AxeBuilder({ page })
    .include('header')
    .include('main')
    .analyze()

  const seriousOrCriticalViolations = accessibilityScanResults.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact || ''),
  )

  expect(seriousOrCriticalViolations).toEqual([])
})
