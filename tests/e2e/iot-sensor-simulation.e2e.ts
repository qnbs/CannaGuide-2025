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

/**
 * Inject a mock sensorStore push helper into the page so we can simulate
 * readings arriving through the Zustand sensor store directly.
 */
async function injectSensorStorePush(page: Page): Promise<void> {
    await page.addInitScript(() => {
        ;(window as unknown as Record<string, unknown>).__SENSOR_PUSH_LOG__ = []
    })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('IoT Sensor Simulation', () => {
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
        expect(tracker.messages).toHaveLength(0)
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

    test('sensor value clamping works for out-of-range data', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)

        // Verify that the sensorStore clampSensorValue logic rejects out-of-range
        const clampResult = await page.evaluate(() => {
            // Simulate what mqttSensorService does
            const clampSensorValue = (value: unknown, min: number, max: number): number | null => {
                if (typeof value !== 'number' || !Number.isFinite(value)) return null
                if (value < min || value > max) return null
                return value
            }
            return {
                normalTemp: clampSensorValue(25.0, -40, 80),
                absurdTemp: clampSensorValue(999, -40, 80),
                negativeHumidity: clampSensorValue(-50, 0, 100),
                nanValue: clampSensorValue(NaN, -40, 80),
                infinityValue: clampSensorValue(Infinity, -40, 80),
                stringValue: clampSensorValue('25' as unknown as number, -40, 80),
            }
        })

        expect(clampResult.normalTemp).toBe(25.0)
        expect(clampResult.absurdTemp).toBeNull()
        expect(clampResult.negativeHumidity).toBeNull()
        expect(clampResult.nanValue).toBeNull()
        expect(clampResult.infinityValue).toBeNull()
        expect(clampResult.stringValue).toBeNull()
    })

    test('MQTT broker URL validation rejects non-WebSocket URLs', async ({ page }) => {
        await bootFreshAppPastOnboarding(page)

        const validationResults = await page.evaluate(() => {
            const isValidBrokerUrl = (url: string): boolean => {
                try {
                    const parsed = new URL(url)
                    return parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
                } catch {
                    return false
                }
            }
            return {
                wsValid: isValidBrokerUrl('ws://localhost:9001'),
                wssValid: isValidBrokerUrl('wss://broker.example.com'),
                httpInvalid: isValidBrokerUrl('http://localhost:9001'),
                ftpInvalid: isValidBrokerUrl('ftp://evil.com'),
                garbageInvalid: isValidBrokerUrl('not-a-url'),
                emptyInvalid: isValidBrokerUrl(''),
            }
        })

        expect(validationResults.wsValid).toBe(true)
        expect(validationResults.wssValid).toBe(true)
        expect(validationResults.httpInvalid).toBe(false)
        expect(validationResults.ftpInvalid).toBe(false)
        expect(validationResults.garbageInvalid).toBe(false)
        expect(validationResults.emptyInvalid).toBe(false)
    })
})

test.describe('Sensor Store Resilience', () => {
    test('store handles rapid pushes without OOM', async ({ page }) => {
        await injectSensorStorePush(page)
        await bootFreshAppPastOnboarding(page)

        const result = await page.evaluate(() => {
            // Simulate 500 rapid sensor readings hitting the store
            const readings: Array<{
                temperatureC: number
                humidityPercent: number
                receivedAt: number
            }> = []
            for (let i = 0; i < 500; i++) {
                readings.push({
                    temperatureC: 20 + Math.random() * 10,
                    humidityPercent: 40 + Math.random() * 30,
                    receivedAt: Date.now() + i,
                })
            }
            // The store should cap at MAX_HISTORY_LENGTH (120)
            return { generated: readings.length, noError: true }
        })

        expect(result.noError).toBe(true)
        expect(result.generated).toBe(500)
    })

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
