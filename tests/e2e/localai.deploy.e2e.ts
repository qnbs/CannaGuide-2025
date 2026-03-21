import { expect, test } from '@playwright/test'
import { closeOnboardingIfVisible, seedLegalGateState } from './helpers'

test('settings expose the local AI offline cache section', async ({ page, baseURL }) => {
  await seedLegalGateState(page)
  await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', { waitUntil: 'networkidle' })
  await closeOnboardingIfVisible(page)

  await page.getByRole('button', { name: /settings/i }).click().catch(() => {})
  await expect(page.getByText(/Local AI Offline Cache|Lokaler KI-Offline-Cache/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /Preload Offline Models|Offline-Modelle vorladen/i })).toBeVisible()
})
