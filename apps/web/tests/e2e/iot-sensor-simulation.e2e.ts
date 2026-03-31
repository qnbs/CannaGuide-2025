import { test, expect, Page } from '@playwright/test'
import {
    bootFreshAppPastOnboarding,
    expectNoCrashPatterns,
    attachRuntimeErrorTracking,
} from './helpers'

// ---------------------------------------------------------------------------
// IoT / ESP32 Sensor Simulation E2E Tests
//
// Validates frontend resilience against edge-case sensor scenarios:
// - Mock ESP32 goes offline mid-stream
// - Packets arrive with absurd / out-of-range values
// - Sensor endpoint returns garbage or no data
// - Connection state transitions are correctly reflected in the UI
//
// Uses Playwright route interception to simulate the HTTP sensor polling
// endpoint (`/sensor`) that the ESP32 Mock normally serves.
// ---------------------------------------------------------------------------

interface MockSensorReading {
    temperature: number
    humidity: number
    timestamp: string
    phase: string
    device: string
}

/** Generate a normal sensor reading. */
function normalReading(): MockSensorReading {
    return {
        temperature: 24.5,
        humidity: 58.2,
        timestamp: new Date().toISOString(),
        phase: 'day',
        device: 'ESP32-Mock-E2E',
    }
}

/** Generate a reading with absurd / out-of-range values. */
function absurdReading(): MockSensorReading {
    return {
        temperature: 999,
        humidity: -50,
        timestamp: new Date().toISOString(),
        phase: 'day',
        device: 'ESP32-Mock-E2E',
    }
}

/**
 * Intercept HTTP poll to the ESP32 sensor endpoint and return mock data.
 * The `responder` callback controls what each request returns.
 */
async function interceptSensorEndpoint(
    page: Page,
    responder: () => { status: number; body: string } | 'abort',
): Promise<void> {
    await page.route('**/sensor', (route) => {
        const result = responder()
        if (result === 'abort') {
            return route.abort('connectionfailed')
        }
        return route.fulfill({
            status: result.status,
            contentType: 'application/json',
            body: result.body,
        })
    })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('IoT Sensor Simulation', () => {
    // IoT mock uses HTTP localhost:3001 -- Firefox blocks mixed-content
    // requests to loopback and WebKit times out. Chromium-only is sufficient
    // because IoT hardware integration is browser-agnostic.
    test.skip(
        ({ browserName }) => browserName !== 'chromium',
        'IoT mock uses HTTP localhost -- only testable in Chromium',
    )

    test('app survives ESP32 returning normal sensor data', async ({ page }) => {
        await interceptSensorEndpoint(page, () => ({
            status: 200,
            body: JSON.stringify(normalReading()),
        }))

        const tracker = attachRuntimeErrorTracking(page)
        await bootFreshAppPastOnboarding(page)

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await expectNoCrashPatterns(page)

        expect(tracker.messages).toHaveLength(0)
        tracker.detach()
    })

    test('app handles ESP32 going offline (connection refused)', async ({ page }) => {
        let requestCount = 0
        await interceptSensorEndpoint(page, () => {
            requestCount += 1
            // First 2 requests succeed, then endpoint goes "offline"
            if (requestCount <= 2) {
                return { status: 200, body: JSON.stringify(normalReading()) }
            }
            return 'abort'
        })

        const tracker = attachRuntimeErrorTracking(page)
        await bootFreshAppPastOnboarding(page)

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })

        // Wait so the offline kick-in has time to trigger
        await page.waitForTimeout(3000)

        await expectNoCrashPatterns(page)
        // Network errors during sensor polling should be handled gracefully
        expect(tracker.messages).toHaveLength(0)
        tracker.detach()
    })

    test('app handles absurd sensor values (999°C, -50% RH)', async ({ page }) => {
        await interceptSensorEndpoint(page, () => ({
            status: 200,
            body: JSON.stringify(absurdReading()),
        }))

        const tracker = attachRuntimeErrorTracking(page)
        await bootFreshAppPastOnboarding(page)

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await page.waitForTimeout(2000)

        await expectNoCrashPatterns(page)
        expect(tracker.messages).toHaveLength(0)
        tracker.detach()
    })

    test('app handles malformed JSON from sensor endpoint', async ({ page }) => {
        await interceptSensorEndpoint(page, () => ({
            status: 200,
            body: '{ this is not valid json !!!',
        }))

        const tracker = attachRuntimeErrorTracking(page)
        await bootFreshAppPastOnboarding(page)

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await page.waitForTimeout(2000)

        await expectNoCrashPatterns(page)
        // JSON parse errors from mock sensor endpoint are expected — filter them
        const unexpectedErrors = tracker.messages.filter(
            (msg) => !/JSON|Unexpected token|SyntaxError/i.test(msg),
        )
        expect(unexpectedErrors).toHaveLength(0)
        tracker.detach()
    })

    test('app handles sensor endpoint returning HTTP 500', async ({ page }) => {
        await interceptSensorEndpoint(page, () => ({
            status: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        }))

        const tracker = attachRuntimeErrorTracking(page)
        await bootFreshAppPastOnboarding(page)

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await page.waitForTimeout(2000)

        await expectNoCrashPatterns(page)
        expect(tracker.messages).toHaveLength(0)
        tracker.detach()
    })

    test('app handles sensor data with missing fields', async ({ page }) => {
        await interceptSensorEndpoint(page, () => ({
            status: 200,
            body: JSON.stringify({ timestamp: new Date().toISOString() }),
        }))

        const tracker = attachRuntimeErrorTracking(page)
        await bootFreshAppPastOnboarding(page)

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await page.waitForTimeout(2000)

        await expectNoCrashPatterns(page)
        expect(tracker.messages).toHaveLength(0)
        tracker.detach()
    })

    test('app handles intermittent packet loss pattern', async ({ page }) => {
        let requestCount = 0
        await interceptSensorEndpoint(page, () => {
            requestCount += 1
            // Every 3rd request fails (simulating ~33% packet loss)
            if (requestCount % 3 === 0) {
                return 'abort'
            }
            return { status: 200, body: JSON.stringify(normalReading()) }
        })

        const tracker = attachRuntimeErrorTracking(page)
        await bootFreshAppPastOnboarding(page)

        await expect(page.locator('main').first()).toBeVisible({ timeout: 15_000 })
        await page.waitForTimeout(4000)

        await expectNoCrashPatterns(page)
        expect(tracker.messages).toHaveLength(0)
        tracker.detach()
    })

    // NOTE: clampSensorValue and MQTT URL validation are unit-tested in
    // their respective *.test.ts files — no need to duplicate via page.evaluate().
})

test.describe('Sensor Store Resilience', () => {
    test.skip(
        ({ browserName }) => browserName !== 'chromium',
        'IoT mock uses HTTP localhost -- only testable in Chromium',
    )

    test('app navigates to equipment view without sensor crash', async ({ page }) => {
        await interceptSensorEndpoint(page, () => ({
            status: 200,
            body: JSON.stringify(normalReading()),
        }))

        const tracker = attachRuntimeErrorTracking(page)
        await bootFreshAppPastOnboarding(page)

        // Navigate to equipment tab where sensor widgets may appear
        const equipNav = page
            .locator('nav')
            .getByText(/Equipment|Ausrüstung/i)
            .first()
        if (await equipNav.isVisible().catch(() => false)) {
            await equipNav.click()
            await page.waitForTimeout(2000)
        }

        await expectNoCrashPatterns(page)
        expect(tracker.messages).toHaveLength(0)
        tracker.detach()
    })
})
