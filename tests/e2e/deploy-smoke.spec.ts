import { expect, test } from '@playwright/test'

const crashPatterns = [/Something went wrong\./i, /An unexpected error occurred\./i, /Application Error/i]

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

const expectNoCrashPatterns = async (page: import('@playwright/test').Page) => {
  for (const pattern of crashPatterns) {
    await expect(page.getByText(pattern)).toHaveCount(0)
  }
}

const waitForVisibleNavigation = async (page: import('@playwright/test').Page) => {
  await page.waitForSelector('[data-view-id]', { state: 'attached' })
  const navButtons = page.locator('[data-view-id]:visible')
  await expect
    .poll(async () => navButtons.count(), { timeout: 10_000 })
    .toBeGreaterThan(0)
  return navButtons
}

test('deploy smoke: shell, assets and main navigation render without crash', async ({ page, request, baseURL }) => {
  await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', { waitUntil: 'networkidle' })
  await closeOnboardingIfVisible(page)

  await expect(page).toHaveTitle(/CannaGuide|Cannaguide/i)
  await expectNoCrashPatterns(page)

  const navButtons = await waitForVisibleNavigation(page)
  await expect(navButtons.first()).toBeVisible()

  const count = await navButtons.count()

  await navButtons.first().focus()
  await page.keyboard.press('Enter')
  const currentAfterKeyboard = page.locator('[data-view-id]:visible[aria-current="page"]').first()
  await expect(currentAfterKeyboard).toBeVisible()

  for (let index = 0; index < count; index += 1) {
    await navButtons.nth(index).click()
    await expectNoCrashPatterns(page)
  }

  const manifestUrl = new URL('manifest.json', baseURL).toString()
  const swUrl = new URL('sw.js', baseURL).toString()

  const [manifestResponse, swResponse] = await Promise.all([request.get(manifestUrl), request.get(swUrl)])
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

  await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', { waitUntil: 'networkidle' })
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

  await page.goto(baseURL || 'https://qnbs.github.io/CannaGuide-2025/', { waitUntil: 'networkidle' })
  await closeOnboardingIfVisible(page)

  await expect(page).toHaveTitle(/CannaGuide|Cannaguide/i)
  await expectNoCrashPatterns(page)

  const navButtons = await waitForVisibleNavigation(page)
  await expect(navButtons.first()).toBeVisible()
})
