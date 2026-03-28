import { describe, it, expect, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Minimal fake-indexeddb polyfill for tests
// ---------------------------------------------------------------------------

import 'fake-indexeddb/auto'
import { indexedDB } from 'fake-indexeddb'

// ---------------------------------------------------------------------------

import { timeSeriesService } from './timeSeriesService'
import type { SensorReading } from '@/stores/sensorStore'

const DEVICE = 'test-esp32'

const makeReading = (overrides: Partial<SensorReading> = {}): SensorReading => ({
    temperatureC: 24,
    humidityPercent: 55,
    ph: 6.2,
    receivedAt: Date.now(),
    ...overrides,
})

describe('timeSeriesService', () => {
    afterEach(async () => {
        timeSeriesService.close()
        // Delete the database between tests to avoid data leakage
        await new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase('CannaGuideTimeSeriesDB')
            req.onsuccess = () => resolve()
            req.onerror = () => resolve()
        })
    })

    it('records a reading and retrieves it', async () => {
        const reading = makeReading({ receivedAt: Date.now() })
        await timeSeriesService.recordReading(DEVICE, reading)

        const entries = await timeSeriesService.query({
            deviceId: DEVICE,
            from: reading.receivedAt - 1000,
            to: reading.receivedAt + 1000,
        })

        expect(entries.length).toBe(1)
        expect(entries[0]?.temperatureC).toBe(24)
        expect(entries[0]?.humidityPercent).toBe(55)
        expect(entries[0]?.resolution).toBe('raw')
    })

    it('batch-records multiple readings', async () => {
        const now = Date.now()
        const readings = [
            makeReading({ receivedAt: now - 2000, temperatureC: 22 }),
            makeReading({ receivedAt: now - 1000, temperatureC: 24 }),
            makeReading({ receivedAt: now, temperatureC: 26 }),
        ]

        await timeSeriesService.recordBatch(DEVICE, readings)
        const count = await timeSeriesService.getEntryCount()
        expect(count).toBe(3)
    })

    it('computes aggregated statistics correctly', async () => {
        const now = Date.now()
        await timeSeriesService.recordBatch(DEVICE, [
            makeReading({ receivedAt: now - 2000, temperatureC: 20, humidityPercent: 50, ph: 6.0 }),
            makeReading({ receivedAt: now - 1000, temperatureC: 24, humidityPercent: 60, ph: 6.4 }),
            makeReading({ receivedAt: now, temperatureC: 28, humidityPercent: 70, ph: 6.8 }),
        ])

        const stats = await timeSeriesService.getStats(DEVICE, now - 5000, now + 1000)
        expect(stats.sampleCount).toBe(3)
        expect(stats.avgTemperature).toBe(24)
        expect(stats.avgHumidity).toBe(60)
        expect(stats.minTemperature).toBe(20)
        expect(stats.maxTemperature).toBe(28)
        expect(stats.avgPh).toBeCloseTo(6.4, 1)
    })

    it('selects auto-resolution based on time range', () => {
        const now = Date.now()
        expect(timeSeriesService.autoResolution(now - 3_600_000, now)).toBe('raw')
        expect(timeSeriesService.autoResolution(now - 3 * 86_400_000, now)).toBe('hourly')
        expect(timeSeriesService.autoResolution(now - 14 * 86_400_000, now)).toBe('daily')
    })

    it('clears device data', async () => {
        await timeSeriesService.recordReading(DEVICE, makeReading())
        expect(await timeSeriesService.getEntryCount()).toBeGreaterThan(0)

        await timeSeriesService.clearDevice(DEVICE)
        const entries = await timeSeriesService.query({
            deviceId: DEVICE,
            from: 0,
            to: Date.now() + 10_000,
        })
        expect(entries.length).toBe(0)
    })

    it('aggregates raw readings into hourly buckets', async () => {
        const baseTime = Date.now() - 2 * 86_400_000 // 2 days ago
        const readings: SensorReading[] = []

        // Create 10 readings within the same hour bucket
        for (let i = 0; i < 10; i++) {
            readings.push(
                makeReading({
                    receivedAt: baseTime + i * 60_000,
                    temperatureC: 20 + i,
                }),
            )
        }

        await timeSeriesService.recordBatch(DEVICE, readings)

        // The cutoff is "older than 24h" = Date.now() - 24h
        // Our readings are 2 days old, so they qualify
        const result = await timeSeriesService.runCompaction()
        expect(result.aggregatedHourly).toBe(10)
    })
})
