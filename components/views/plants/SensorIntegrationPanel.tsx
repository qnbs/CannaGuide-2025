import React, { memo, useState } from 'react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { webBluetoothSensorService, SensorReading } from '@/services/webBluetoothSensorService'
import { useAppDispatch } from '@/stores/store'
import { setGlobalEnvironment } from '@/stores/slices/simulationSlice'
import { addNotification } from '@/stores/slices/uiSlice'

const SensorIntegrationPanelComponent: React.FC = () => {
    const dispatch = useAppDispatch()
    const [reading, setReading] = useState<SensorReading | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)

    const handleReadSensor = async () => {
        setIsConnecting(true)
        try {
            const nextReading = await webBluetoothSensorService.readEsp32EnvironmentalSensor()
            setReading(nextReading)
            dispatch(
                setGlobalEnvironment({
                    temperature: nextReading.temperatureC,
                    humidity: nextReading.humidityPercent,
                }),
            )
            dispatch(addNotification({ message: 'Sensorwerte ubernommen.', type: 'success' }))
        } catch (error) {
            dispatch(
                addNotification({
                    message: error instanceof Error ? error.message : 'Sensorverbindung fehlgeschlagen.',
                    type: 'error',
                }),
            )
        } finally {
            setIsConnecting(false)
        }
    }

    return (
        <Card>
            <h3 className="text-lg font-bold font-display text-primary-300">ESP32 Sensor Hub</h3>
            <p className="text-sm text-slate-300 mt-1">
                WebBluetooth-Integration fur Temperatur-/Feuchte-Sensoren. Unterstutzt ESP32 (Environmental Sensing).
            </p>

            <Button
                onClick={handleReadSensor}
                className="w-full mt-3"
                disabled={!webBluetoothSensorService.isSupported() || isConnecting}
            >
                <PhosphorIcons.Bluetooth className="w-5 h-5 mr-2" />
                {isConnecting ? 'Verbinde...' : 'Sensor lesen'}
            </Button>

            <div className="mt-3 text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3 ring-1 ring-inset ring-white/20">
                {reading ? (
                    <>
                        <p>Temperatur: {reading.temperatureC.toFixed(1)} C</p>
                        <p>Feuchte: {reading.humidityPercent.toFixed(1)}%</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Zuletzt aktualisiert: {new Date(reading.receivedAt).toLocaleTimeString()}
                        </p>
                    </>
                ) : (
                    <p>Noch keine Sensordaten.</p>
                )}
            </div>
        </Card>
    )
}

export const SensorIntegrationPanel = memo(SensorIntegrationPanelComponent)
