declare global {
    interface Navigator {
        bluetooth: {
            requestDevice(options: {
                filters: Array<{ namePrefix?: string }>
                optionalServices?: (number | string)[]
            }): Promise<BluetoothDevice>
        }
    }
    interface BluetoothDevice {
        gatt?: { connect(): Promise<BluetoothRemoteGATTServer> }
    }
    interface BluetoothRemoteGATTServer {
        getPrimaryService(service: number | string): Promise<BluetoothRemoteGATTService>
        disconnect(): void
    }
    interface BluetoothRemoteGATTService {
        getCharacteristic(
            characteristic: number | string,
        ): Promise<BluetoothRemoteGATTCharacteristic>
    }
    interface BluetoothRemoteGATTCharacteristic {
        readValue(): Promise<DataView>
    }
}

export interface SensorReading {
    temperatureC: number
    humidityPercent: number
    receivedAt: number
    ph?: number | null
}
import { getT } from '@/i18n'

const ENVIRONMENTAL_SENSING_SERVICE = 0x181a
const TEMPERATURE_CHARACTERISTIC = 0x2a6e
const HUMIDITY_CHARACTERISTIC = 0x2a6f
const PH_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb'
const PH_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb'

class WebBluetoothSensorService {
    public isSupported(): boolean {
        return typeof navigator !== 'undefined' && 'bluetooth' in navigator
    }

    public async readEsp32EnvironmentalSensor(): Promise<SensorReading> {
        if (!this.isSupported()) {
            throw new Error(getT()('common.bluetooth.notSupported'))
        }

        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'ESP32' }],
            optionalServices: [ENVIRONMENTAL_SENSING_SERVICE, PH_SERVICE_UUID],
        })

        const server = await device.gatt?.connect()
        if (!server) {
            throw new Error(getT()('common.bluetooth.connectionFailed'))
        }

        const service = await server.getPrimaryService(ENVIRONMENTAL_SENSING_SERVICE)
        const temperatureChar = await service.getCharacteristic(TEMPERATURE_CHARACTERISTIC)
        const humidityChar = await service.getCharacteristic(HUMIDITY_CHARACTERISTIC)
        let phValue: number | null = null
        try {
            const phService = await server.getPrimaryService(PH_SERVICE_UUID)
            const phChar = await phService.getCharacteristic(PH_CHARACTERISTIC_UUID)
            const phReading = await phChar.readValue()
            phValue = phReading.getUint16(0, true) / 100
        } catch {
            phValue = null
        }

        const temperatureValue = await temperatureChar.readValue()
        const humidityValue = await humidityChar.readValue()

        const temperatureRaw = temperatureValue.getInt16(0, true)
        const humidityRaw = humidityValue.getUint16(0, true)

        // Clamp to physically plausible ranges to reject garbage sensor data
        const temperatureC = Math.max(-40, Math.min(80, temperatureRaw / 100))
        const humidityPercent = Math.max(0, Math.min(100, humidityRaw / 100))
        const clampedPh = phValue !== null ? Math.max(0, Math.min(14, phValue)) : null

        return {
            temperatureC,
            humidityPercent,
            ph: clampedPh,
            receivedAt: Date.now(),
        }
    }
}

export const webBluetoothSensorService = new WebBluetoothSensorService()
