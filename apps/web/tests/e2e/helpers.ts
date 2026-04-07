import { expect, Page } from '@playwright/test'
import { APP_VERSION, REDUX_STATE_KEY } from '@/constants'
import { defaultSettings } from '@/stores/slices/settingsSlice'

/**
 * Set the GDPR consent cookie (v2) directly via browser context.
 * This is the primary check path in consentService.hasConsent(), making
 * tests independent of localStorage migration timing issues.
 */
const seedConsentCookie = async (page: Page) => {
    await page.context().addCookies([
        {
            name: 'cg.gdpr.consent.v2',
            value: '1',
            domain: 'localhost',
            path: '/',
        },
    ])
}

export const seedLegalGateState = async (page: Page) => {
    await page.addInitScript(() => {
        window.localStorage.setItem('cg.gdpr.consent.v1', '1')
        window.localStorage.setItem('cg.ageVerified.v1', '1')
    })
}

export const resetAppStateKeepingLegalGates = async (page: Page) => {
    // Set consent cookie directly (primary check path in consentService)
    await seedConsentCookie(page)
    await page.addInitScript(() => {
        window.localStorage.clear()
        window.sessionStorage.clear()
        window.localStorage.setItem('cg.gdpr.consent.v1', '1')
        window.localStorage.setItem('cg.ageVerified.v1', '1')
        window.localStorage.setItem('cg.geoLegal.dismissed.v1', '1')
    })
}

export const deleteAppDatabases = async (page: Page) => {
    await page.evaluate(async () => {
        const databaseNames = [
            'CannaGuideStateDB',
            'CannaGuideDB',
            'CannaGuideSecureDB',
            'CannaGuideReminderDB',
            'cannaguide-db',
        ]
        await Promise.all(
            databaseNames.map(
                (name) =>
                    new Promise<void>((resolve) => {
                        const request = indexedDB.deleteDatabase(name)
                        request.onsuccess = () => resolve()
                        request.onerror = () => resolve()
                        request.onblocked = () => resolve()
                    }),
            ),
        )
    })
}

export const seedPostOnboardingState = async (page: Page) => {
    const persistedState = {
        version: APP_VERSION,
        settings: {
            version: APP_VERSION,
            settings: {
                ...defaultSettings,
                onboardingCompleted: true,
            },
        },
        ui: {
            lastActiveView: defaultSettings.general.defaultView,
            onboardingStep: 8,
            equipmentViewTab: 'Configurator',
            knowledgeViewTab: 'Mentor',
        },
    }

    await page.evaluate(
        async ({ reduxStateKey, state }) => {
            const dbName = 'CannaGuideStateDB'
            const storeName = 'zustand_state'

            const database = await new Promise<IDBDatabase>((resolve, reject) => {
                const request = indexedDB.open(dbName, 1)

                request.onupgradeneeded = (event) => {
                    const database = (event.target as IDBOpenDBRequest).result
                    if (!database.objectStoreNames.contains(storeName)) {
                        database.createObjectStore(storeName)
                    }
                }

                request.onsuccess = (event) => {
                    resolve((event.target as IDBOpenDBRequest).result)
                }

                request.onerror = () => reject(request.error)
            })

            await new Promise<void>((resolve, reject) => {
                const transaction = database.transaction(storeName, 'readwrite')
                const store = transaction.objectStore(storeName)
                const request = store.put(JSON.stringify(state), reduxStateKey)

                request.onerror = () => reject(request.error)
                transaction.oncomplete = () => resolve()
                transaction.onabort = () =>
                    reject(transaction.error ?? new Error('IndexedDB transaction aborted'))
                transaction.onerror = () =>
                    reject(transaction.error ?? new Error('IndexedDB transaction failed'))
            })

            database.close()
        },
        { reduxStateKey: REDUX_STATE_KEY, state: persistedState },
    )
}

export const bootFreshAppWithLegalGates = async (page: Page) => {
    await resetAppStateKeepingLegalGates(page)
    // Load a minimal page on the correct origin so IndexedDB operations work
    // without the app holding open database connections.
    await page.route('**/*', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }),
    )
    await page.goto('./')
    await deleteAppDatabases(page)
    await page.unroute('**/*')
    // Now load the real app with clean databases
    await page.goto('./', { waitUntil: 'load' })
    await page.waitForLoadState('domcontentloaded')
}

export const bootFreshAppPastOnboarding = async (page: Page) => {
    await resetAppStateKeepingLegalGates(page)
    // Load a minimal page on the correct origin so IndexedDB operations work
    // without the app holding open database connections.
    await page.route('**/*', (route) =>
        route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }),
    )
    await page.goto('./')
    await deleteAppDatabases(page)
    await seedPostOnboardingState(page)
    await page.unroute('**/*')
    // Now load the real app with seeded state
    await page.goto('./', { waitUntil: 'load' })
    await closeOnboardingIfVisible(page)
}

export const expectShellVisible = async (page: Page) => {
    await closeConsentGateIfVisible(page)
    await closeOnboardingIfVisible(page)
    await closeLegalNoticeIfVisible(page)
    await expect(page.locator('main').first()).toBeVisible({ timeout: 30_000 })
    // Desktop sidebar nav is hidden on mobile viewports
    const vw = page.viewportSize()?.width ?? 1280
    if (vw >= 768) {
        await expect(page.locator('nav').first()).toBeVisible({ timeout: 30_000 })
    }
}

export const closeConsentGateIfVisible = async (page: Page) => {
    // The BootstrapConsentGate renders a <dialog open> with "I understand and consent" button.
    // Must be dismissed before <main> can appear.
    const consentBtn = page.getByRole('button', { name: /I understand and consent/i })
    const visible = await consentBtn.isVisible().catch(() => false)
    if (visible) {
        await consentBtn.click()
        await page.waitForTimeout(500)
    }
}

export const closeLegalNoticeIfVisible = async (page: Page) => {
    const btn = page.getByRole('button', { name: /I understand/i })
    const visible = await btn.isVisible().catch(() => false)
    if (visible) {
        await btn.click()
        await page.waitForTimeout(300)
    }
}

export const closeOnboardingIfVisible = async (page: Page) => {
    const onboardingDialog = page.getByRole('dialog')
    let isVisible = await onboardingDialog.isVisible().catch(() => false)

    for (let attempt = 0; attempt < 20 && !isVisible; attempt += 1) {
        await page.waitForTimeout(200)
        isVisible = await onboardingDialog.isVisible().catch(() => false)
    }

    if (!isVisible) {
        return
    }

    // Skip if the visible dialog is the Consent gate (not onboarding)
    const isConsentDialog = await page
        .locator('#consent-title')
        .isVisible()
        .catch(() => false)
    if (isConsentDialog) {
        return
    }

    // Select language (step 0 → 1) — do NOT return, continue through wizard
    const englishButton = onboardingDialog.getByRole('button', { name: /^English$/i })
    if (await englishButton.isVisible().catch(() => false)) {
        await englishButton.click()
        await page.waitForTimeout(300)
    } else {
        const germanButton = onboardingDialog.getByRole('button', { name: /^Deutsch$/i })
        if (await germanButton.isVisible().catch(() => false)) {
            await germanButton.click()
            await page.waitForTimeout(300)
        }
    }

    // Click through remaining wizard steps (up to 10)
    for (let step = 0; step < 10; step += 1) {
        const stillVisible = await onboardingDialog.isVisible().catch(() => false)
        if (!stillVisible) {
            break
        }

        const actionButton = onboardingDialog.locator('button').last()
        if (await actionButton.isVisible().catch(() => false)) {
            await actionButton.click()
        }
        await page.waitForTimeout(300)
    }
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
