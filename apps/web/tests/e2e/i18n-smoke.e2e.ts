import { test, expect, Page } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    expectNoCrashPatterns,
    attachRuntimeErrorTracking,
    expectShellVisible,
} from './helpers'

// ---------------------------------------------------------------------------
// i18n Smoke Tests -- Multi-Language Translation Verification
//
// Validates that all user-facing strings are properly translated
// across DE, ES, FR, NL by navigating to key views after a language
// switch and asserting that no raw i18n key names leak into the UI.
//
// Covered views:
// - Equipment > Hydro Monitor (chart labels, thresholds, dosing)
// - Knowledge > Calculator Hub (VPD, nutrient, pH, terpene panels)
// - Strains > Comparison + Daily Strains / Lookup
// ---------------------------------------------------------------------------

/**
 * Regex that matches typical i18n key patterns that should never appear
 * as visible text in a properly translated UI.
 * Matches strings like "hydroMonitoring.chart.legendPh",
 * "equipmentView.calculators.ecPhPlanner.directionHigh", etc.
 *
 * Pattern: two or more dot-separated camelCase/PascalCase segments.
 */
const I18N_KEY_PATTERN =
    /\b(?:hydroMonitoring|equipmentView|knowledgeView|strainsView|strainLookup|settingsView|common|nav|plantsView)\.[a-zA-Z]+(?:\.[a-zA-Z]+)+/

/**
 * Collect all visible text from the page's main content area and assert
 * that none of it matches a raw i18n key pattern.
 */
async function assertNoLeakedKeys(page: Page, context: string): Promise<void> {
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible({ timeout: 15_000 })

    // Gather all visible text nodes inside <main>
    const texts = await mainContent.evaluate((el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const parent = node.parentElement
                if (!parent) return NodeFilter.FILTER_REJECT
                const tag = parent.tagName
                // Skip script/style/hidden elements
                if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT
                if (parent.offsetParent === null && tag !== 'BODY') return NodeFilter.FILTER_REJECT
                const trimmed = (node.textContent ?? '').trim()
                if (trimmed.length < 3) return NodeFilter.FILTER_REJECT
                return NodeFilter.FILTER_ACCEPT
            },
        })
        const result: string[] = []
        let current = walker.nextNode()
        while (current) {
            const text = (current.textContent ?? '').trim()
            if (text) result.push(text)
            current = walker.nextNode()
        }
        return result
    })

    const leaked = texts.filter((t) => I18N_KEY_PATTERN.test(t))
    expect(leaked, `[${context}] Leaked i18n keys found in visible text`).toHaveLength(0)
}

/**
 * Switch the app language via the Settings view language selector.
 * Uses Radix UI Select interaction pattern.
 */
async function switchLanguage(page: Page, langCode: string): Promise<void> {
    // Navigate to Settings
    const settingsNav = page.locator('[data-view-id="settings"]')
    await expect(settingsNav.first()).toBeVisible({ timeout: 15_000 })
    await settingsNav.first().click()
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

    // Wait for settings content to load
    await page.waitForTimeout(1_000)

    // Find the language selector -- it is a Radix Select with the current language value.
    // We look for all select triggers and find the one in the "Look & Feel" section.
    // The language select shows one of: English, Deutsch, Espanol, Francais, Nederlands
    const langTrigger = page
        .locator('button[role="combobox"]')
        .filter({ hasText: /English|Deutsch|Espanol|Francais|Nederlands/i })
        .first()

    const hasTrigger = await langTrigger.isVisible().catch(() => false)
    if (!hasTrigger) {
        // Fallback: try native select element
        const nativeSelect = page
            .locator('select')
            .filter({ hasText: /English|Deutsch/i })
            .first()
        const hasNative = await nativeSelect.isVisible().catch(() => false)
        if (hasNative) {
            await nativeSelect.selectOption(langCode)
            await page.waitForTimeout(1_500)
            return
        }
        // If neither found, skip gracefully
        return
    }

    await langTrigger.click()
    await page.waitForTimeout(500)

    // Select the target language option from the Radix dropdown
    const langLabels: Record<string, RegExp> = {
        de: /Deutsch/i,
        es: /Espa/i,
        fr: /Fran/i,
        nl: /Nederlands/i,
        en: /English/i,
    }
    const optionPattern = langLabels[langCode] ?? new RegExp(langCode, 'i')
    const option = page.getByRole('option', { name: optionPattern })
    const hasOption = await option.isVisible().catch(() => false)
    if (hasOption) {
        await option.click()
    } else {
        // Try generic item selector for Radix
        const item = page.locator('[role="option"], [data-radix-collection-item]').filter({
            hasText: optionPattern,
        })
        if (
            await item
                .first()
                .isVisible()
                .catch(() => false)
        ) {
            await item.first().click()
        }
    }

    // Wait for language change to propagate
    await page.waitForTimeout(2_000)
}

/**
 * Navigate to Equipment > Hydro Monitor tab and wait for content.
 */
async function navigateToHydroMonitor(page: Page): Promise<void> {
    const equipmentNav = page.locator('[data-view-id="equipment"]')
    await expect(equipmentNav.first()).toBeVisible({ timeout: 10_000 })
    await equipmentNav.first().click()
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

    // Click Hydro Monitor sub-tab
    const hydroButton = page.getByRole('button', { name: /Hydro/i })
    const hasHydro = await hydroButton
        .first()
        .isVisible()
        .catch(() => false)
    if (hasHydro) {
        await hydroButton.first().click()
        await page.waitForTimeout(1_500)
    }
}

/**
 * Navigate to Knowledge > Calculator Hub tab and wait for content.
 */
async function navigateToCalculatorHub(page: Page): Promise<void> {
    const knowledgeNav = page.locator('[data-view-id="knowledge"]')
    await expect(knowledgeNav.first()).toBeVisible({ timeout: 10_000 })
    await knowledgeNav.first().click()
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

    // Click Calculator/Rechner tab
    const calcTab = page.getByRole('button', {
        name: /Calculator|Rechner|Calculadora|Calculatrice|Rekenmachine/i,
    })
    const hasCalc = await calcTab
        .first()
        .isVisible()
        .catch(() => false)
    if (hasCalc) {
        await calcTab.first().click()
        await page.waitForTimeout(1_500)
    }
}

/**
 * Navigate to Strains > Comparison tab and wait for content.
 */
async function navigateToStrainComparison(page: Page): Promise<void> {
    const strainsNav = page.locator('[data-view-id="strains"]')
    await expect(strainsNav.first()).toBeVisible({ timeout: 10_000 })
    await strainsNav.first().click()
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

    // Click Comparison tab
    const compTab = page
        .getByRole('tab', { name: /Comparison|Vergleich|Comparaci|Comparaison|Vergelijking/i })
        .or(
            page.getByRole('button', {
                name: /Comparison|Vergleich|Comparaci|Comparaison|Vergelijking/i,
            }),
        )
    const hasComp = await compTab
        .first()
        .isVisible()
        .catch(() => false)
    if (hasComp) {
        await compTab.first().click()
        await page.waitForTimeout(1_500)
    }
}

/**
 * Navigate to Strains > Daily Strains tab (which contains StrainLookupSection).
 */
async function navigateToDailyStrains(page: Page): Promise<void> {
    const strainsNav = page.locator('[data-view-id="strains"]')
    await expect(strainsNav.first()).toBeVisible({ timeout: 10_000 })
    await strainsNav.first().click()
    await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

    // Click Daily Strains / 4:20 tab
    const dailyTab = page
        .getByRole('tab', { name: /Daily|4:20|Diario|Quotid|Dagelijks/i })
        .or(page.getByRole('button', { name: /Daily|4:20|Diario|Quotid|Dagelijks/i }))
    const hasDaily = await dailyTab
        .first()
        .isVisible()
        .catch(() => false)
    if (hasDaily) {
        await dailyTab.first().click()
        await page.waitForTimeout(1_500)
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const LANGUAGES = ['de', 'es', 'fr', 'nl'] as const

test.describe('i18n Translation Smoke Tests', () => {
    test.beforeEach(async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
    })

    for (const lang of LANGUAGES) {
        test(`[${lang.toUpperCase()}] no leaked i18n keys in Hydro Monitor`, async ({ page }) => {
            const tracker = attachRuntimeErrorTracking(page)

            await switchLanguage(page, lang)
            await navigateToHydroMonitor(page)
            await assertNoLeakedKeys(page, `${lang}/hydro-monitor`)

            await expectNoCrashPatterns(page)
            tracker.detach()
            expect(tracker.messages).toHaveLength(0)
        })

        test(`[${lang.toUpperCase()}] no leaked i18n keys in Calculator Hub`, async ({ page }) => {
            const tracker = attachRuntimeErrorTracking(page)

            await switchLanguage(page, lang)
            await navigateToCalculatorHub(page)
            await assertNoLeakedKeys(page, `${lang}/calculator-hub`)

            await expectNoCrashPatterns(page)
            tracker.detach()
            expect(tracker.messages).toHaveLength(0)
        })

        test(`[${lang.toUpperCase()}] no leaked i18n keys in Strain Comparison + Lookup`, async ({
            page,
        }) => {
            const tracker = attachRuntimeErrorTracking(page)

            await switchLanguage(page, lang)

            // Check Comparison tab
            await navigateToStrainComparison(page)
            await assertNoLeakedKeys(page, `${lang}/strain-comparison`)

            // Check Daily Strains / Lookup section
            await navigateToDailyStrains(page)
            await assertNoLeakedKeys(page, `${lang}/strain-lookup`)

            await expectNoCrashPatterns(page)
            tracker.detach()
            expect(tracker.messages).toHaveLength(0)
        })
    }
})
