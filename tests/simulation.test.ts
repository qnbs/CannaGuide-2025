import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateVPD as calculateEnvironmentalVPD } from '@/utils/vpdCalculator'
import { calculateVPD as calculateScientificVPD } from '@/lib/vpd/calculator'
import { webBluetoothSensorService } from '@/services/webBluetoothSensorService'

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

const createReading = (value: number, setter: 'setInt16' | 'setUint16'): DataView => {
    const buffer = new ArrayBuffer(2)
    const view = new DataView(buffer)
    view[setter](0, value, true)
    return view
}

const installBluetoothMock = (requestDevice: ReturnType<typeof vi.fn>) => {
    Object.defineProperty(navigator, 'bluetooth', {
        configurable: true,
        value: { requestDevice },
    })
}

const removeBluetoothMock = () => {
    Reflect.deleteProperty(navigator, 'bluetooth')
}

describe('simulation edge cases', () => {
    it('calculates VPD with altitude 0 and explicit leaf offset', () => {
        const vpd = calculateEnvironmentalVPD({
            airTemp: 25,
            rh: 60,
            lightOn: true,
            medium: 'soil',
            airflow: 'medium',
            phase: 'vegetative',
            altitudeM: 0,
            leafTempOffset: -2,
        })

        expect(vpd).toBeCloseTo(calculateScientificVPD(25, 60, -2, 0), 3)
        expect(Number.isFinite(vpd)).toBe(true)
    })

    it('remains finite on challenging humidity and altitude inputs', () => {
        const vpd = calculateEnvironmentalVPD({
            airTemp: 31,
            rh: 1,
            lightOn: true,
            medium: 'coco',
            airflow: 'high',
            phase: 'earlyFlower',
            altitudeM: 1800,
        })

        expect(Number.isFinite(vpd)).toBe(true)
        expect(vpd).toBeGreaterThan(0)
    })
})

describe('webBluetoothSensorService', () => {
    beforeEach(() => {
        removeBluetoothMock()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        removeBluetoothMock()
    })

    it('throws a not-supported error when WebBluetooth is unavailable', async () => {
        removeBluetoothMock()

        await expect(webBluetoothSensorService.readEsp32EnvironmentalSensor()).rejects.toThrow('common.bluetooth.notSupported')
    })

    it('propagates permission denials from requestDevice', async () => {
        const requestDevice = vi.fn().mockRejectedValue(new Error('Permission denied'))
        installBluetoothMock(requestDevice)

        await expect(webBluetoothSensorService.readEsp32EnvironmentalSensor()).rejects.toThrow('Permission denied')
    })

    it('supports a subsequent reconnect after an initial denial', async () => {
        const temperatureChar = { readValue: vi.fn().mockResolvedValue(createReading(2440, 'setInt16')) }
        const humidityChar = { readValue: vi.fn().mockResolvedValue(createReading(6250, 'setUint16')) }
        const phChar = { readValue: vi.fn().mockResolvedValue(createReading(640, 'setUint16')) }
        const environmentalService = { getCharacteristic: vi.fn((characteristic: number) => (characteristic === 0x2a6e ? temperatureChar : humidityChar)) }
        const phService = { getCharacteristic: vi.fn().mockResolvedValue(phChar) }
        const server = { getPrimaryService: vi.fn((serviceUuid: number | string) => (serviceUuid === 0x181a ? Promise.resolve(environmentalService) : Promise.resolve(phService))), disconnect: vi.fn() }
        const device = { gatt: { connect: vi.fn().mockResolvedValue(server) } }

        const requestDevice = vi
            .fn()
            .mockRejectedValueOnce(new Error('Permission denied'))
            .mockResolvedValueOnce(device)

        installBluetoothMock(requestDevice)

        await expect(webBluetoothSensorService.readEsp32EnvironmentalSensor()).rejects.toThrow('Permission denied')

        const reading = await webBluetoothSensorService.readEsp32EnvironmentalSensor()
        expect(reading.temperatureC).toBeCloseTo(24.4, 1)
        expect(reading.humidityPercent).toBeCloseTo(62.5, 1)
        expect(reading.ph).toBeCloseTo(6.4, 1)
        expect(reading.receivedAt).toBeGreaterThan(0)
    })
})