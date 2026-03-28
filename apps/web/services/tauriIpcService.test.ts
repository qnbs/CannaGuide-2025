import { describe, it, expect } from 'vitest'
import {
    isTauriEnvironment,
    processImageBinary,
    decodeSensorBinary,
    getSystemInfo,
} from '@/services/tauriIpcService'

describe('tauriIpcService', () => {
    describe('isTauriEnvironment', () => {
        it('returns false in browser/test environment', () => {
            expect(isTauriEnvironment()).toBe(false)
        })
    })

    describe('processImageBinary', () => {
        it('returns null in non-Tauri environment', async () => {
            const result = await processImageBinary(new Uint8Array([1, 2, 3]))
            expect(result).toBeNull()
        })
    })

    describe('getSystemInfo', () => {
        it('returns null in non-Tauri environment', async () => {
            const result = await getSystemInfo()
            expect(result).toBeNull()
        })
    })

    describe('decodeSensorBinary — browser fallback', () => {
        it('returns empty array for empty input', async () => {
            const result = await decodeSensorBinary(new Uint8Array([]))
            expect(result).toEqual([])
        })

        it('returns empty array for misaligned input', async () => {
            const result = await decodeSensorBinary(new Uint8Array([1, 2, 3, 4, 5]))
            expect(result).toEqual([])
        })

        it('decodes a single sensor reading (12 bytes)', async () => {
            // Build one reading: temp=22.5, hum=55.0, ph=6.5
            const buffer = new ArrayBuffer(12)
            const view = new DataView(buffer)
            view.setFloat32(0, 22.5, true) // temperature
            view.setFloat32(4, 55.0, true) // humidity
            view.setFloat32(8, 6.5, true) // pH

            const readings = await decodeSensorBinary(new Uint8Array(buffer))
            expect(readings).toHaveLength(1)
            expect(readings[0]?.temperatureC).toBeCloseTo(22.5)
            expect(readings[0]?.humidityPercent).toBeCloseTo(55.0)
            expect(readings[0]?.ph).toBeCloseTo(6.5)
            expect(readings[0]?.timestamp).toBeTypeOf('number')
        })

        it('treats pH=0 as null', async () => {
            const buffer = new ArrayBuffer(12)
            const view = new DataView(buffer)
            view.setFloat32(0, 20.0, true)
            view.setFloat32(4, 60.0, true)
            view.setFloat32(8, 0.0, true) // pH absent

            const readings = await decodeSensorBinary(new Uint8Array(buffer))
            expect(readings).toHaveLength(1)
            expect(readings[0]?.ph).toBeNull()
        })

        it('decodes multiple readings with correct timestamps', async () => {
            const buffer = new ArrayBuffer(24) // 2 readings × 12 bytes
            const view = new DataView(buffer)
            // Reading 0
            view.setFloat32(0, 21.0, true)
            view.setFloat32(4, 50.0, true)
            view.setFloat32(8, 6.0, true)
            // Reading 1
            view.setFloat32(12, 23.0, true)
            view.setFloat32(16, 65.0, true)
            view.setFloat32(20, 7.0, true)

            const intervalMs = 2000
            const readings = await decodeSensorBinary(new Uint8Array(buffer), intervalMs)
            expect(readings).toHaveLength(2)
            expect(readings[0]?.temperatureC).toBeCloseTo(21.0)
            expect(readings[1]?.temperatureC).toBeCloseTo(23.0)
            // Second reading should be later than first
            const timeDiff = (readings[1]?.timestamp ?? 0) - (readings[0]?.timestamp ?? 0)
            expect(timeDiff).toBe(intervalMs)
        })
    })
})
