export interface SensorReading {
    temperatureC: number
    humidityPercent: number
    receivedAt: number
}

const ENVIRONMENTAL_SENSING_SERVICE = 0x181a
const TEMPERATURE_CHARACTERISTIC = 0x2a6e
const HUMIDITY_CHARACTERISTIC = 0x2a6f

class WebBluetoothSensorService {
    public isSupported(): boolean {
        return typeof navigator !== 'undefined' && 'bluetooth' in navigator
    }

    public async readEsp32EnvironmentalSensor(): Promise<SensorReading> {
        if (!this.isSupported()) {
            throw new Error('WebBluetooth is not supported in this browser.')
        }

        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'ESP32' }],
            optionalServices: [ENVIRONMENTAL_SENSING_SERVICE],
        })

        const server = await device.gatt?.connect()
        if (!server) {
            throw new Error('Could not connect to ESP32 device.')
        }

        const service = await server.getPrimaryService(ENVIRONMENTAL_SENSING_SERVICE)
        const temperatureChar = await service.getCharacteristic(TEMPERATURE_CHARACTERISTIC)
        const humidityChar = await service.getCharacteristic(HUMIDITY_CHARACTERISTIC)

        const temperatureValue = await temperatureChar.readValue()
        const humidityValue = await humidityChar.readValue()

        const temperatureRaw = temperatureValue.getInt16(0, true)
        const humidityRaw = humidityValue.getUint16(0, true)

        return {
            temperatureC: temperatureRaw / 100,
            humidityPercent: humidityRaw / 100,
            receivedAt: Date.now(),
        }
    }
}

export const webBluetoothSensorService = new WebBluetoothSensorService()
