import React, { memo, useState } from 'react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { webBluetoothSensorService, SensorReading } from '@/services/webBluetoothSensorService'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { setGlobalEnvironment } from '@/stores/slices/simulationSlice'
import { addNotification } from '@/stores/slices/uiSlice'
import { selectSettings } from '@/stores/selectors'
import { useTranslation } from 'react-i18next'

const SensorIntegrationPanelComponent: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
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
                    simulationSettings: settings.simulation,
                }),
            )
            dispatch(addNotification({ message: t('plantsView.sensor.success'), type: 'success' }))
        } catch (error) {
            dispatch(
                addNotification({
                    message: error instanceof Error ? error.message : t('plantsView.sensor.error'),
                    type: 'error',
                }),
            )
        } finally {
            setIsConnecting(false)
        }
    }

    return (
        <Card>
            <h3 className="text-lg font-bold font-display text-primary-300">{t('plantsView.sensor.title')}</h3>
            <p className="text-sm text-slate-300 mt-1">
                {t('plantsView.sensor.description')}
            </p>

            <Button
                onClick={handleReadSensor}
                className="w-full mt-3"
                disabled={!webBluetoothSensorService.isSupported() || isConnecting}
            >
                <PhosphorIcons.Bluetooth className="w-5 h-5 mr-2" />
                {isConnecting ? t('plantsView.sensor.connecting') : t('plantsView.sensor.connect')}
            </Button>

            <div className="mt-3 text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3 ring-1 ring-inset ring-white/20">
                {reading ? (
                    <>
                        <p>{t('plantsView.sensor.temperature')}: {reading.temperatureC.toFixed(1)} °C</p>
                        <p>{t('plantsView.sensor.humidity')}: {reading.humidityPercent.toFixed(1)}%</p>
                        <p className="text-xs text-slate-400 mt-1">
                            {t('plantsView.sensor.lastUpdated')}: {new Date(reading.receivedAt).toLocaleTimeString()}
                        </p>
                    </>
                ) : (
                    <p>{t('plantsView.sensor.noData')}</p>
                )}
            </div>
        </Card>
    )
}

export const SensorIntegrationPanel = memo(SensorIntegrationPanelComponent)
