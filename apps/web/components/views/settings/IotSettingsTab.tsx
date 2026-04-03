import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useIotStore, type IotConnectionStatus } from '@/stores/useIotStore'
import { Switch } from '@/components/common/Switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/common/Card'
import { SettingsRow } from './SettingsShared'

const STATUS_DOT: Record<IotConnectionStatus, string> = {
    disconnected: 'bg-slate-500',
    connecting: 'bg-amber-400 animate-pulse',
    connected: 'bg-emerald-400',
    error: 'bg-red-500',
}

const STATUS_LABEL_KEYS: Record<IotConnectionStatus, string> = {
    disconnected: 'settingsView.iot.statusDisconnected',
    connecting: 'settingsView.iot.statusConnecting',
    connected: 'settingsView.iot.statusConnected',
    error: 'settingsView.iot.statusError',
}

const ConnectionStatusBadge: React.FC<{
    status: IotConnectionStatus
    lastError: string | null
}> = memo(({ status, lastError }) => {
    const { t } = useTranslation()
    return (
        <div className="flex items-center gap-2">
            <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`}
                aria-hidden="true"
            />
            <span className="text-sm text-slate-300">
                {t(STATUS_LABEL_KEYS[status], { defaultValue: status })}
            </span>
            {status === 'error' && lastError && (
                <span className="text-xs text-red-400 ml-1">-- {lastError}</span>
            )}
        </div>
    )
})
ConnectionStatusBadge.displayName = 'ConnectionStatusBadge'

const IotSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const [isTesting, setIsTesting] = useState(false)

    const brokerUrl = useIotStore((s) => s.brokerUrl)
    const username = useIotStore((s) => s.username)
    const password = useIotStore((s) => s.password)
    const topicPrefix = useIotStore((s) => s.topicPrefix)
    const isEnabled = useIotStore((s) => s.isEnabled)
    const connectionStatus = useIotStore((s) => s.connectionStatus)
    const lastError = useIotStore((s) => s.lastError)

    const setBrokerUrl = useIotStore((s) => s.setBrokerUrl)
    const setUsername = useIotStore((s) => s.setUsername)
    const setPassword = useIotStore((s) => s.setPassword)
    const setTopicPrefix = useIotStore((s) => s.setTopicPrefix)
    const setEnabled = useIotStore((s) => s.setEnabled)
    const testConnection = useIotStore((s) => s.testConnection)

    const handleTestConnection = useCallback(async () => {
        setIsTesting(true)
        try {
            await testConnection()
        } finally {
            setIsTesting(false)
        }
    }, [testConnection])

    return (
        <Card>
            <div className="space-y-6">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-100">
                        {t('settingsView.iot.title', { defaultValue: 'Hardware & IoT Sensors' })}
                    </h3>
                    <p className="text-sm text-slate-400">
                        {t('settingsView.iot.description', {
                            defaultValue:
                                'Connect ESP32 or other MQTT-compatible sensors via WebSocket to log environment data automatically.',
                        })}
                    </p>
                </div>

                <SettingsRow
                    label={t('settingsView.iot.enableLabel', {
                        defaultValue: 'Enable IoT Sensors',
                    })}
                    description={t('settingsView.iot.enableDesc', {
                        defaultValue:
                            'When enabled, the app will subscribe to MQTT topics for live sensor data.',
                    })}
                >
                    <Switch
                        checked={isEnabled}
                        onChange={setEnabled}
                        aria-label={t('settingsView.iot.enableLabel', {
                            defaultValue: 'Enable IoT Sensors',
                        })}
                    />
                </SettingsRow>

                <SettingsRow
                    label={t('settingsView.iot.statusLabel', {
                        defaultValue: 'Connection Status',
                    })}
                >
                    <ConnectionStatusBadge status={connectionStatus} lastError={lastError} />
                </SettingsRow>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="iot-broker-url"
                            className="block text-sm font-semibold text-slate-200"
                        >
                            {t('settingsView.iot.brokerUrl', {
                                defaultValue: 'MQTT Broker URL',
                            })}
                        </label>
                        <Input
                            id="iot-broker-url"
                            type="url"
                            value={brokerUrl}
                            onChange={(e) => setBrokerUrl(e.target.value)}
                            placeholder="wss://broker.example.com:8884"
                            disabled={!isEnabled}
                        />
                        <p className="text-xs text-slate-500">
                            {t('settingsView.iot.brokerUrlHint', {
                                defaultValue: 'WebSocket URL (ws:// or wss://) of your MQTT broker',
                            })}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label
                                htmlFor="iot-username"
                                className="block text-sm font-semibold text-slate-200"
                            >
                                {t('settingsView.iot.username', {
                                    defaultValue: 'Username (optional)',
                                })}
                            </label>
                            <Input
                                id="iot-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="mqtt_user"
                                autoComplete="username"
                                disabled={!isEnabled}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label
                                htmlFor="iot-password"
                                className="block text-sm font-semibold text-slate-200"
                            >
                                {t('settingsView.iot.password', {
                                    defaultValue: 'Password (optional)',
                                })}
                            </label>
                            <Input
                                id="iot-password"
                                type="password"
                                value={password}
                                onChange={(e) => void setPassword(e.target.value)}
                                placeholder="********"
                                autoComplete="current-password"
                                disabled={!isEnabled}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="iot-topic-prefix"
                            className="block text-sm font-semibold text-slate-200"
                        >
                            {t('settingsView.iot.topicPrefix', {
                                defaultValue: 'Topic Prefix',
                            })}
                        </label>
                        <Input
                            id="iot-topic-prefix"
                            type="text"
                            value={topicPrefix}
                            onChange={(e) => setTopicPrefix(e.target.value)}
                            placeholder="cannaguide/sensors"
                            disabled={!isEnabled}
                        />
                        <p className="text-xs text-slate-500">
                            {t('settingsView.iot.topicPrefixHint', {
                                defaultValue:
                                    'The app subscribes to {prefix}/+/temperature, {prefix}/+/humidity, etc.',
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleTestConnection}
                        disabled={!isEnabled || isTesting || !brokerUrl}
                    >
                        {isTesting
                            ? t('settingsView.iot.testing', { defaultValue: 'Testing...' })
                            : t('settingsView.iot.testConnection', {
                                  defaultValue: 'Test Connection',
                              })}
                    </Button>
                </div>
            </div>
        </Card>
    )
}

export default IotSettingsTab
