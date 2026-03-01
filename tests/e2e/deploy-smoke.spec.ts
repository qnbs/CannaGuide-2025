import { expect, test } from '@playwright/test'

const crashPatterns = [/Something went wrong\./i, /An unexpected error occurred\./i, /Application Error/i]

test('deploy smoke: shell, assets and main navigation render without crash', async ({ page, request, baseURL }) => {
  await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', { waitUntil: 'networkidle' })

  const onboardingDialog = page.getByRole('dialog')
  if (await onboardingDialog.isVisible().catch(() => false)) {
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

  await expect(page).toHaveTitle(/CannaGuide|Cannaguide/i)

  for (const pattern of crashPatterns) {
    await expect(page.getByText(pattern)).toHaveCount(0)
  }

  const navButtons = page.locator('[data-view-id]:visible')
  await expect(navButtons.first()).toBeVisible()

  const count = await navButtons.count()
  for (let index = 0; index < count; index += 1) {
    await navButtons.nth(index).click()
    for (const pattern of crashPatterns) {
      await expect(page.getByText(pattern)).toHaveCount(0)
    }
  }

  const manifestUrl = new URL('manifest.json', baseURL).toString()
  const swUrl = new URL('sw.js', baseURL).toString()

  const [manifestResponse, swResponse] = await Promise.all([request.get(manifestUrl), request.get(swUrl)])
  expect(manifestResponse.ok()).toBeTruthy()
  expect(swResponse.ok()).toBeTruthy()
})
