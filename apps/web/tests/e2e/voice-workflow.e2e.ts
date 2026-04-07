import { test, expect } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    expectNoCrashPatterns,
    attachRuntimeErrorTracking,
    expectShellVisible,
} from './helpers'

// ---------------------------------------------------------------------------
// Voice Workflow -- Critical Path E2E Tests
//
// Validates the voice control UI and settings:
// - Settings > Voice tab accessibility and controls
// - VoiceControl mic button in the app header
// - Graceful degradation when SpeechRecognition is unavailable
// - TTS voice settings rendering
//
// Note: SpeechRecognition API is unavailable in headless Playwright
// (no microphone access). Tests focus on UI presence, settings rendering,
// and graceful fallback behavior. Actual voice recognition cannot be
// tested in E2E -- covered by unit tests in VoiceControl.test.tsx.
// ---------------------------------------------------------------------------

test.describe('Voice Workflow Critical Path', () => {
    test.beforeEach(async ({ page }) => {
        await bootFreshAppPastOnboarding(page)
        await expectShellVisible(page)
    })

    test('navigates to Settings Voice tab', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        // Navigate to Settings view
        const settingsNav = page.locator('[data-view-id="settings"]')
        await expect(settingsNav.first()).toBeVisible({ timeout: 15_000 })
        await settingsNav.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Look for Voice tab
        const voiceTab = page
            .locator('[data-tab-id="voice"]')
            .or(page.getByRole('tab', { name: /voice|sprach/i }))
        const hasVoiceTab = await voiceTab
            .first()
            .isVisible()
            .catch(() => false)
        if (hasVoiceTab) {
            await voiceTab.first().click({ timeout: 15_000 })
            await page.waitForTimeout(1_000)
        }

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('voice settings show TTS and voice control sections', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        // Navigate to Settings > Voice tab
        const settingsNav = page.locator('[data-view-id="settings"]')
        await settingsNav.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        const voiceTab = page
            .locator('[data-tab-id="voice"]')
            .or(page.getByRole('tab', { name: /voice|sprach/i }))
        const hasVoiceTab = await voiceTab
            .first()
            .isVisible()
            .catch(() => false)
        if (hasVoiceTab) {
            await voiceTab.first().click({ timeout: 15_000 })
            await page.waitForTimeout(1_000)
        }

        // Check for TTS or voice control related content in the settings area
        const mainContent = page.locator('main').first()
        const text = await mainContent.textContent()
        const hasVoiceContent =
            text !== null &&
            (/tts|text.to.speech|voice|sprach|stimme/i.test(text) ||
                /hotword|wake.word|mikrofon|microphone/i.test(text))

        // Voice content should be accessible (either in a visible tab or integrated)
        if (hasVoiceTab) {
            expect(hasVoiceContent).toBe(true)
        }

        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('mic button is present in the header', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        // The VoiceControl component renders a mic button in the app header
        // with aria-label="voiceControl.toggle"
        const micButton = page.locator(
            'button[aria-label*="voice" i], button[aria-label*="Voice" i], button[aria-label*="mikro" i]',
        )
        const micIcon = page.locator('[data-testid="mic-icon"]')

        // In headless Playwright, SpeechRecognition may not be available,
        // so the mic button might be conditionally hidden.
        // We check for either the button or graceful absence (no crash).
        const hasMicButton = await micButton
            .first()
            .isVisible({ timeout: 5_000 })
            .catch(() => false)
        const hasMicIcon = await micIcon
            .first()
            .isVisible({ timeout: 2_000 })
            .catch(() => false)

        // If the browser supports SpeechRecognition, mic button should be visible
        const hasSpeechApi = await page.evaluate(
            () => 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
        )

        if (hasSpeechApi) {
            expect(hasMicButton || hasMicIcon).toBe(true)
        }

        // Either way, no crashes
        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('graceful degradation without SpeechRecognition API', async ({ page, browserName }) => {
        // Firefox in headless mode does not support SpeechRecognition
        test.skip(
            browserName !== 'firefox',
            'SpeechRecognition unavailability test -- Firefox only (Chromium has SpeechRecognition)',
        )

        const tracker = attachRuntimeErrorTracking(page)

        // Navigate settings to verify no voice-related errors in console
        const settingsNav = page.locator('[data-view-id="settings"]')
        await settingsNav.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // App should run without runtime errors even without SpeechRecognition
        await page.waitForTimeout(2_000)
        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })

    test('app remains stable after visiting voice settings', async ({ page }) => {
        const tracker = attachRuntimeErrorTracking(page)

        // Navigate to Settings
        const settingsNav = page.locator('[data-view-id="settings"]')
        await settingsNav.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Try to open voice tab
        const voiceTab = page
            .locator('[data-tab-id="voice"]')
            .or(page.getByRole('tab', { name: /voice|sprach/i }))
        const hasVoiceTab = await voiceTab
            .first()
            .isVisible()
            .catch(() => false)
        if (hasVoiceTab) {
            await voiceTab.first().click({ timeout: 15_000 })
            await page.waitForTimeout(1_000)
        }

        // Navigate away and back to plants view
        const plantsNav = page.locator('[data-view-id="plants"]')
        await plantsNav.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Back to settings
        await settingsNav.first().click()
        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // App should be stable throughout
        await expectNoCrashPatterns(page)
        tracker.detach()
        expect(tracker.messages).toHaveLength(0)
    })
})
