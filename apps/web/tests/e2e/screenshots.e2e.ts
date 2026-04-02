/**
 * AUTO-GENERATED SCREENSHOT WALKTHROUGH
 * Captures every main screen of CannaGuide in desktop and mobile viewports.
 * Run: npx playwright test screenshots.e2e.ts --project=chromium
 */
import { test, Page } from '@playwright/test'

const DESKTOP = { width: 1280, height: 800 }
const MOBILE = { width: 375, height: 812 }

const VIEWPORTS = [
    { name: 'desktop', ...DESKTOP },
    { name: 'mobile', ...MOBILE },
] as const

/** Dismiss age gate + onboarding if present */
async function dismissBootScreens(page: Page): Promise<void> {
    // Age gate
    const ageBtn = page.locator('button:has-text("18"), button:has-text("Yes")')
    if ((await ageBtn.count()) > 0) {
        await ageBtn.first().click()
        await page.waitForTimeout(500)
    }
    // Onboarding -- click skip/close if present
    const skipBtn = page.locator(
        'button:has-text("Skip"), button:has-text("Weiter"), button:has-text("Fertig"), button[aria-label="Close"]',
    )
    for (let i = 0; i < 10; i++) {
        if ((await skipBtn.count()) > 0) {
            await skipBtn.first().click()
            await page.waitForTimeout(300)
        } else {
            break
        }
    }
    await page.waitForTimeout(500)
}

/** Navigate to a main view by clicking footer nav */
async function navigateToView(page: Page, viewName: string): Promise<void> {
    // Main nav buttons use aria-label or text
    const navBtn = page.locator(`nav button, nav a, [role="tablist"] button`).filter({
        hasText: new RegExp(viewName, 'i'),
    })
    if ((await navBtn.count()) > 0) {
        await navBtn.first().click()
        await page.waitForTimeout(800)
    }
}

/** Click a sub-tab within a view */
async function clickSubTab(page: Page, tabText: string): Promise<void> {
    const tab = page
        .locator('button[role="tab"], [role="tablist"] button, nav button')
        .filter({ hasText: new RegExp(`^${tabText}$`, 'i') })
    if ((await tab.count()) > 0) {
        await tab.first().click()
        await page.waitForTimeout(600)
    }
}

/** Take a screenshot with a descriptive filename */
async function snap(page: Page, viewport: string, category: string, name: string): Promise<void> {
    const filename = `${viewport}--${category}--${name}.png`
    await page.screenshot({
        path: `tests/e2e/__app-screenshots__/${filename}`,
        fullPage: false,
    })
}

for (const vp of VIEWPORTS) {
    test.describe(`App Screenshots [${vp.name}]`, () => {
        test.beforeEach(async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })
            await page.goto('/')
            await page.waitForLoadState('networkidle')
            await dismissBootScreens(page)
        })

        test('Plants view', async ({ page }) => {
            await navigateToView(page, 'Pflanzen|Plants')
            await snap(page, vp.name, 'plants', 'overview')
        })

        test('Strains view - All', async ({ page }) => {
            await navigateToView(page, 'Sorten|Strains')
            await snap(page, vp.name, 'strains', 'all')
        })

        test('Strains view - My Strains', async ({ page }) => {
            await navigateToView(page, 'Sorten|Strains')
            await clickSubTab(page, 'Meine Sorten|My Strains')
            await snap(page, vp.name, 'strains', 'my-strains')
        })

        test('Strains view - Favorites', async ({ page }) => {
            await navigateToView(page, 'Sorten|Strains')
            await clickSubTab(page, 'Favoriten|Favorites')
            await snap(page, vp.name, 'strains', 'favorites')
        })

        test('Strains view - Daily Strains', async ({ page }) => {
            await navigateToView(page, 'Sorten|Strains')
            await clickSubTab(page, 'Tages-Sorten|Daily Strains|Daily')
            await snap(page, vp.name, 'strains', 'daily-strains')
        })

        test('Strains view - Genealogy', async ({ page }) => {
            await navigateToView(page, 'Sorten|Strains')
            await clickSubTab(page, 'Genealogie|Genealogy')
            await snap(page, vp.name, 'strains', 'genealogy')
        })

        test('Strains view - Breeding Lab', async ({ page }) => {
            await navigateToView(page, 'Sorten|Strains')
            await clickSubTab(page, 'Zucht-Labor|Breeding')
            await snap(page, vp.name, 'strains', 'breeding-lab')
        })

        test('Strains view - Exports', async ({ page }) => {
            await navigateToView(page, 'Sorten|Strains')
            await clickSubTab(page, 'Exports|Export')
            await snap(page, vp.name, 'strains', 'exports')
        })

        test('Strains view - Tips', async ({ page }) => {
            await navigateToView(page, 'Sorten|Strains')
            await clickSubTab(page, 'Tipps|Tips')
            await snap(page, vp.name, 'strains', 'tips')
        })

        test('Strains view - Trends', async ({ page }) => {
            await navigateToView(page, 'Sorten|Strains')
            await clickSubTab(page, 'Trends')
            await snap(page, vp.name, 'strains', 'trends')
        })

        test('Equipment view - Configurator', async ({ page }) => {
            await navigateToView(page, 'Ausstattung|Equipment')
            await snap(page, vp.name, 'equipment', 'configurator')
        })

        test('Equipment view - Setups', async ({ page }) => {
            await navigateToView(page, 'Ausstattung|Equipment')
            await clickSubTab(page, 'Setups')
            await snap(page, vp.name, 'equipment', 'setups')
        })

        test('Equipment view - Calculators', async ({ page }) => {
            await navigateToView(page, 'Ausstattung|Equipment')
            await clickSubTab(page, 'Rechner|Calculators')
            await snap(page, vp.name, 'equipment', 'calculators')
        })

        test('Equipment view - Grow Shops', async ({ page }) => {
            await navigateToView(page, 'Ausstattung|Equipment')
            await clickSubTab(page, 'Grow Shops|Shops')
            await snap(page, vp.name, 'equipment', 'grow-shops')
        })

        test('Equipment view - Seedbanks', async ({ page }) => {
            await navigateToView(page, 'Ausstattung|Equipment')
            await clickSubTab(page, 'Seedbanks|Samenbanken')
            await snap(page, vp.name, 'equipment', 'seedbanks')
        })

        test('Equipment view - Grow Tech', async ({ page }) => {
            await navigateToView(page, 'Ausstattung|Equipment')
            await clickSubTab(page, 'Grow Tech')
            await snap(page, vp.name, 'equipment', 'grow-tech')
        })

        test('Equipment view - IoT Dashboard', async ({ page }) => {
            await navigateToView(page, 'Ausstattung|Equipment')
            await clickSubTab(page, 'IoT')
            await snap(page, vp.name, 'equipment', 'iot-dashboard')
        })

        test('Knowledge view - Mentor', async ({ page }) => {
            await navigateToView(page, 'Wissen|Knowledge')
            await snap(page, vp.name, 'knowledge', 'mentor')
        })

        test('Knowledge view - Guide', async ({ page }) => {
            await navigateToView(page, 'Wissen|Knowledge')
            await clickSubTab(page, 'Guide|Anleitung')
            await snap(page, vp.name, 'knowledge', 'guide')
        })

        test('Knowledge view - Archive', async ({ page }) => {
            await navigateToView(page, 'Wissen|Knowledge')
            await clickSubTab(page, 'Archiv|Archive')
            await snap(page, vp.name, 'knowledge', 'archive')
        })

        test('Knowledge view - Sandbox', async ({ page }) => {
            await navigateToView(page, 'Wissen|Knowledge')
            await clickSubTab(page, 'Sandbox')
            await snap(page, vp.name, 'knowledge', 'sandbox')
        })

        test('Settings view - General', async ({ page }) => {
            // Settings is usually in header, not footer nav
            const settingsBtn = page.locator(
                'button[aria-label*="Settings"], button[aria-label*="Einstellungen"], [data-testid="settings-button"]',
            )
            if ((await settingsBtn.count()) > 0) {
                await settingsBtn.first().click()
                await page.waitForTimeout(800)
            }
            await snap(page, vp.name, 'settings', 'general')
        })

        test('Settings view - AI', async ({ page }) => {
            const settingsBtn = page.locator(
                'button[aria-label*="Settings"], button[aria-label*="Einstellungen"], [data-testid="settings-button"]',
            )
            if ((await settingsBtn.count()) > 0) {
                await settingsBtn.first().click()
                await page.waitForTimeout(800)
            }
            await clickSubTab(page, 'AI|KI')
            await snap(page, vp.name, 'settings', 'ai')
        })

        test('Settings view - TTS', async ({ page }) => {
            const settingsBtn = page.locator(
                'button[aria-label*="Settings"], button[aria-label*="Einstellungen"], [data-testid="settings-button"]',
            )
            if ((await settingsBtn.count()) > 0) {
                await settingsBtn.first().click()
                await page.waitForTimeout(800)
            }
            await clickSubTab(page, 'TTS|Sprache')
            await snap(page, vp.name, 'settings', 'tts')
        })

        test('Settings view - Privacy', async ({ page }) => {
            const settingsBtn = page.locator(
                'button[aria-label*="Settings"], button[aria-label*="Einstellungen"], [data-testid="settings-button"]',
            )
            if ((await settingsBtn.count()) > 0) {
                await settingsBtn.first().click()
                await page.waitForTimeout(800)
            }
            await clickSubTab(page, 'Datenschutz|Privacy')
            await snap(page, vp.name, 'settings', 'privacy')
        })

        test('Settings view - About', async ({ page }) => {
            const settingsBtn = page.locator(
                'button[aria-label*="Settings"], button[aria-label*="Einstellungen"], [data-testid="settings-button"]',
            )
            if ((await settingsBtn.count()) > 0) {
                await settingsBtn.first().click()
                await page.waitForTimeout(800)
            }
            await clickSubTab(page, 'Info|About')
            await snap(page, vp.name, 'settings', 'about')
        })

        test('Help view - Manual', async ({ page }) => {
            const helpBtn = page.locator(
                'button[aria-label*="Help"], button[aria-label*="Hilfe"], [data-testid="help-button"]',
            )
            if ((await helpBtn.count()) > 0) {
                await helpBtn.first().click()
                await page.waitForTimeout(800)
            }
            await snap(page, vp.name, 'help', 'manual')
        })

        test('Help view - Lexicon', async ({ page }) => {
            const helpBtn = page.locator(
                'button[aria-label*="Help"], button[aria-label*="Hilfe"], [data-testid="help-button"]',
            )
            if ((await helpBtn.count()) > 0) {
                await helpBtn.first().click()
                await page.waitForTimeout(800)
            }
            await clickSubTab(page, 'Lexikon|Lexicon')
            await snap(page, vp.name, 'help', 'lexicon')
        })

        test('Help view - Guides', async ({ page }) => {
            const helpBtn = page.locator(
                'button[aria-label*="Help"], button[aria-label*="Hilfe"], [data-testid="help-button"]',
            )
            if ((await helpBtn.count()) > 0) {
                await helpBtn.first().click()
                await page.waitForTimeout(800)
            }
            await clickSubTab(page, 'Anleitungen|Guides')
            await snap(page, vp.name, 'help', 'guides')
        })

        test('Help view - FAQ', async ({ page }) => {
            const helpBtn = page.locator(
                'button[aria-label*="Help"], button[aria-label*="Hilfe"], [data-testid="help-button"]',
            )
            if ((await helpBtn.count()) > 0) {
                await helpBtn.first().click()
                await page.waitForTimeout(800)
            }
            await clickSubTab(page, 'FAQ')
            await snap(page, vp.name, 'help', 'faq')
        })
    })
}
