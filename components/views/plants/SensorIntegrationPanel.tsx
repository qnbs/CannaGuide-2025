import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { webBluetoothSensorService } from '@/services/webBluetoothSensorService'
import type { SensorReading } from '@/services/webBluetoothSensorService'
import { mqttSensorService, type MqttConnectionState } from '@/services/mqttSensorService'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { setGlobalEnvironment } from '@/stores/slices/simulationSlice'
import { addNotification } from '@/stores/slices/uiSlice'
import { selectSettings } from '@/stores/selectors'
import { useTranslation } from 'react-i18next'

type SensorMode = 'ble' | 'mqtt'

const SensorIntegrationPanelComponent: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const [reading, setReading] = useState<SensorReading | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [mode, setMode] = useState<SensorMode>('ble')
    const [mqttState, setMqttState] = useState<MqttConnectionState>('disconnected')
    const [brokerUrl, setBrokerUrl] = useState('ws://localhost:9001')
    const unsubRef = useRef<Array<() => void>>([])

    const applyReading = useCallback(
        (nextReading: SensorReading) => {
            setReading(nextReading)
            dispatch(
                setGlobalEnvironment({
                    temperature: nextReading.temperatureC,
                    humidity: nextReading.humidityPercent,
                    ph: nextReading.ph ?? undefined,
                    simulationSettings: settings.simulation,
                }),
            )
        },
        [dispatch, settings.simulation],
    )

    // Clean up MQTT subscriptions when unmounting or switching modes
    useEffect(() => {
        return () => {
            for (const unsub of unsubRef.current) unsub()
            unsubRef.current = []
        }
    }, [])

    const handleReadBle = async () => {
        setIsConnecting(true)
        try {
            const nextReading = await webBluetoothSensorService.readEsp32EnvironmentalSensor()
            applyReading(nextReading)
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

    const handleMqttToggle = () => {
        // Always clean up existing subscriptions first
        for (const unsub of unsubRef.current) unsub()
        unsubRef.current = []

        if (mqttState === 'connected' || mqttState === 'connecting') {
            mqttSensorService.disconnect()
            setMqttState('disconnected')
            return
        }

        if (!/^wss?:\/\/.+/i.test(brokerUrl)) {
            dispatch(
                addNotification({
                    message: t('plantsView.sensor.mqttError'),
                    type: 'error',
                }),
            )
            return
        }

        mqttSensorService.configure({ brokerUrl })

        const unsubSensor = mqttSensorService.onSensorUpdate((next) => {
            applyReading(next)
        })

        const unsubState = mqttSensorService.onConnectionStateChange((state) => {
            setMqttState(state)
            if (state === 'connected') {
                dispatch(
                    addNotification({
                        message: t('plantsView.sensor.mqttConnected'),
                        type: 'success',
                    }),
                )
            }
            if (state === 'error') {
                dispatch(
                    addNotification({ message: t('plantsView.sensor.mqttError'), type: 'error' }),
                )
            }
        })

        unsubRef.current = [unsubSensor, unsubState]
        mqttSensorService.connect()
    }

    const mqttConnected = mqttState === 'connected'
    const mqttBusy = mqttState === 'connecting'
    let mqttToggleLabel = t('plantsView.sensor.mqttConnect')
    if (mqttBusy) {
        mqttToggleLabel = t('plantsView.sensor.connecting')
    } else if (mqttConnected) {
        mqttToggleLabel = t('plantsView.sensor.mqttDisconnect')
    }

    return (
        <Card>
            <h3 className="text-lg font-bold font-display text-primary-300">
                {t('plantsView.sensor.title')}
            </h3>
            <p className="text-sm text-slate-300 mt-1">{t('plantsView.sensor.description')}</p>

            {/* Mode tabs */}
            <div className="flex gap-2 mt-3">
                <button
                    type="button"
                    aria-pressed={mode === 'ble'}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${mode === 'ble' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    onClick={() => setMode('ble')}
                >
                    <PhosphorIcons.Bluetooth className="w-4 h-4 inline mr-1" />
                    BLE
                </button>
                <button
                    type="button"
                    aria-pressed={mode === 'mqtt'}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${mode === 'mqtt' ? 'bg-primary-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    onClick={() => setMode('mqtt')}
                >
                    <PhosphorIcons.WifiHigh className="w-4 h-4 inline mr-1" />
                    MQTT
                </button>
            </div>

            {/* BLE mode */}
            {mode === 'ble' && (
                <Button
                    onClick={handleReadBle}
                    className="w-full mt-3"
                    disabled={!webBluetoothSensorService.isSupported() || isConnecting}
                >
                    <PhosphorIcons.Bluetooth className="w-5 h-5 mr-2" />
                    {isConnecting
                        ? t('plantsView.sensor.connecting')
                        : t('plantsView.sensor.connect')}
                </Button>
            )}

            {/* MQTT mode */}
            {mode === 'mqtt' && (
                <div className="mt-3 space-y-2">
                    <label className="block text-xs text-slate-400">
                        {t('plantsView.sensor.mqttBrokerUrl')}
                        <input
                            type="text"
                            value={brokerUrl}
                            onChange={(e) => setBrokerUrl(e.target.value)}
                            className="mt-1 w-full rounded-md bg-slate-900 border border-slate-700 text-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                            disabled={mqttConnected || mqttBusy}
                        />
                    </label>
                    <Button onClick={handleMqttToggle} className="w-full" disabled={mqttBusy}>
                        <PhosphorIcons.WifiHigh className="w-5 h-5 mr-2" />
                        {mqttToggleLabel}
                    </Button>
                    {mqttConnected && (
                        <p className="text-xs text-green-400">{t('plantsView.sensor.mqttLive')}</p>
                    )}
                </div>
            )}

            <div className="mt-3 text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3 ring-1 ring-inset ring-white/20">
                {reading ? (
                    <>
                        <p>
                            {t('plantsView.sensor.temperature')}: {reading.temperatureC.toFixed(1)}{' '}
                            °C
                        </p>
                        <p>
                            {t('plantsView.sensor.humidity')}: {reading.humidityPercent.toFixed(1)}%
                        </p>
                        <p>
                            {t('plantsView.sensor.ph')}:{' '}
                            {reading.ph === null || reading.ph === undefined
                                ? t('plantsView.sensor.phUnavailable')
                                : reading.ph.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {t('plantsView.sensor.lastUpdated')}:{' '}
                            {new Date(reading.receivedAt).toLocaleTimeString()}
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
SensorIntegrationPanel.displayName = 'SensorIntegrationPanel'
