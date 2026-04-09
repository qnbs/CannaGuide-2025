import { describe, it, expect, vi, afterEach } from 'vitest'
import { webBluetoothSensorService } from './webBluetoothSensorService'

// Mock i18n
vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

describe('webBluetoothSensorService', () => {
    describe('isSupported', () => {
        const originalBluetooth = (navigator as unknown as Record<string, unknown>).bluetooth

        afterEach(() => {
            if (originalBluetooth !== undefined) {
                Object.defineProperty(navigator, 'bluetooth', {
                    value: originalBluetooth,
                    writable: true,
                    configurable: true,
                })
            }
        })

        it('returns false when navigator.bluetooth is not available', () => {
            // 'in' operator returns true even when value is undefined,
            // so we must fully remove the property
            delete (navigator as unknown as Record<string, unknown>).bluetooth

            expect(webBluetoothSensorService.isSupported()).toBe(false)
        })

        it('returns true when navigator.bluetooth is available', () => {
            Object.defineProperty(navigator, 'bluetooth', {
                value: { requestDevice: vi.fn() },
                writable: true,
                configurable: true,
            })

            expect(webBluetoothSensorService.isSupported()).toBe(true)
        })
    })

    describe('readEsp32EnvironmentalSensor', () => {
        it('throws when bluetooth is not supported', async () => {
            Object.defineProperty(navigator, 'bluetooth', {
                value: undefined,
                writable: true,
                configurable: true,
            })

            await expect(webBluetoothSensorService.readEsp32EnvironmentalSensor()).rejects.toThrow()
        })

        it('reads and clamps sensor values from a mock device', async () => {
            const makeDataView = (value: number): DataView => {
                const buffer = new ArrayBuffer(2)
                const view = new DataView(buffer)
                view.setInt16(0, value, true)
                return view
            }

            const mockCharacteristic = (value: number) => ({
                readValue: vi.fn().mockResolvedValue(makeDataView(value)),
            })

            const tempChar = mockCharacteristic(2400) // 24.00 C
            const humChar = mockCharacteristic(5500) // 55.00 %
            const phChar = mockCharacteristic(620) // 6.20 pH

            const mockService = {
                getCharacteristic: vi.fn().mockImplementation((uuid: number) => {
                    if (uuid === 0x2a6e) return Promise.resolve(tempChar)
                    if (uuid === 0x2a6f) return Promise.resolve(humChar)
                    return Promise.reject(new Error('unknown characteristic'))
                }),
            }

            const mockPhService = {
                getCharacteristic: vi.fn().mockResolvedValue(phChar),
            }

            const mockServer = {
                getPrimaryService: vi.fn().mockImplementation((service: number | string) => {
                    if (service === 0x181a) return Promise.resolve(mockService)
                    if (typeof service === 'string' && service.startsWith('0000fff0'))
                        return Promise.resolve(mockPhService)
                    return Promise.reject(new Error('unknown service'))
                }),
                disconnect: vi.fn(),
            }

            const mockDevice = {
                gatt: { connect: vi.fn().mockResolvedValue(mockServer) },
            }

            Object.defineProperty(navigator, 'bluetooth', {
                value: {
                    requestDevice: vi.fn().mockResolvedValue(mockDevice),
                },
                writable: true,
                configurable: true,
            })

            const reading = await webBluetoothSensorService.readEsp32EnvironmentalSensor()

            expect(reading.temperatureC).toBe(24)
            expect(reading.humidityPercent).toBe(55)
            expect(reading.ph).toBe(6.2)
            expect(reading.receivedAt).toBeGreaterThan(0)
        })

        it('clamps temperature to max 80 and min -40', async () => {
            const makeDataView = (value: number): DataView => {
                const buffer = new ArrayBuffer(2)
                const view = new DataView(buffer)
                view.setInt16(0, value, true)
                return view
            }

            const mockCharacteristic = (value: number) => ({
                readValue: vi.fn().mockResolvedValue(makeDataView(value)),
            })

            // 100.00 C -- should be clamped to 80
            const tempChar = mockCharacteristic(10000)
            const humChar = mockCharacteristic(5000)

            const mockService = {
                getCharacteristic: vi.fn().mockImplementation((uuid: number) => {
                    if (uuid === 0x2a6e) return Promise.resolve(tempChar)
                    if (uuid === 0x2a6f) return Promise.resolve(humChar)
                    return Promise.reject(new Error('unknown'))
                }),
            }

            const mockServer = {
                getPrimaryService: vi.fn().mockImplementation((service: number | string) => {
                    if (service === 0x181a) return Promise.resolve(mockService)
                    return Promise.reject(new Error('no ph service'))
                }),
                disconnect: vi.fn(),
            }

            Object.defineProperty(navigator, 'bluetooth', {
                value: {
                    requestDevice: vi.fn().mockResolvedValue({
                        gatt: { connect: vi.fn().mockResolvedValue(mockServer) },
                    }),
                },
                writable: true,
                configurable: true,
            })

            const reading = await webBluetoothSensorService.readEsp32EnvironmentalSensor()

            expect(reading.temperatureC).toBe(80)
            expect(reading.ph).toBeNull()
        })

        it('returns null pH when pH service is unavailable', async () => {
            const makeDataView = (value: number): DataView => {
                const buffer = new ArrayBuffer(2)
                const view = new DataView(buffer)
                view.setInt16(0, value, true)
                return view
            }

            const mockCharacteristic = (value: number) => ({
                readValue: vi.fn().mockResolvedValue(makeDataView(value)),
            })

            const mockService = {
                getCharacteristic: vi.fn().mockImplementation((uuid: number) => {
                    if (uuid === 0x2a6e) return Promise.resolve(mockCharacteristic(2200))
                    if (uuid === 0x2a6f) return Promise.resolve(mockCharacteristic(6000))
                    return Promise.reject(new Error('unknown'))
                }),
            }

            const mockServer = {
                getPrimaryService: vi.fn().mockImplementation((service: number | string) => {
                    if (service === 0x181a) return Promise.resolve(mockService)
                    return Promise.reject(new Error('no pH'))
                }),
                disconnect: vi.fn(),
            }

            Object.defineProperty(navigator, 'bluetooth', {
                value: {
                    requestDevice: vi.fn().mockResolvedValue({
                        gatt: { connect: vi.fn().mockResolvedValue(mockServer) },
                    }),
                },
                writable: true,
                configurable: true,
            })

            const reading = await webBluetoothSensorService.readEsp32EnvironmentalSensor()

            expect(reading.temperatureC).toBe(22)
            expect(reading.humidityPercent).toBe(60)
            expect(reading.ph).toBeNull()
        })
    })
})
