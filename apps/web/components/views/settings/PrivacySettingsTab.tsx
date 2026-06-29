import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { Switch } from '@/components/common/Switch'
import { FormSection } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/common/Card'
import { SettingsRow } from './SettingsShared'

const PrivacySettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const privacy = useAppSelector(selectSettings).privacy
    const [pinDraft, setPinDraft] = useState(privacy.pin ?? '')

    useEffect(() => {
        setPinDraft(privacy.pin ?? '')
    }, [privacy.pin])

    const normalizedPin = pinDraft.replace(/\D/g, '').slice(0, 4)
    const canSavePin = normalizedPin.length === 4 && normalizedPin !== (privacy.pin ?? '')

    return (
        <div className="space-y-6">
            <Card>
                <FormSection
                    title={t('settingsView.privacy.title')}
                    icon={<PhosphorIcons.ShieldCheck />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.privacy.localOnlyMode')}
                            description={t('settingsView.privacy.localOnlyModeDesc')}
                        >
                            <Switch
                                checked={privacy.localOnlyMode}
                                onChange={(value) =>
                                    dispatch(setSetting({ path: 'privacy.localOnlyMode', value }))
                                }
                            />
                        </SettingsRow>
                        {privacy.localOnlyMode && (
                            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-900/10 p-3 text-sm text-amber-300">
                                <PhosphorIcons.Warning className="h-4 w-4 shrink-0" />
                                {t('settingsView.privacy.localOnlyModeActive')}
                            </div>
                        )}
                        <SettingsRow
                            label={t('settingsView.privacy.requirePin')}
                            description={t('settingsView.privacy.requirePinDesc')}
                        >
                            <Switch
                                checked={privacy.requirePinOnLaunch}
                                onChange={(value) =>
                                    dispatch(
                                        setSetting({ path: 'privacy.requirePinOnLaunch', value }),
                                    )
                                }
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.privacy.setPin')}
                            description={t('settingsView.privacy.setPinDesc')}
                        >
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    autoComplete="new-password"
                                    maxLength={4}
                                    value={pinDraft}
                                    onChange={(event) =>
                                        setPinDraft(
                                            event.target.value.replace(/\D/g, '').slice(0, 4),
                                        )
                                    }
                                    placeholder={t('settingsView.privacy.pinPlaceholder')}
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            dispatch(
                                                setSetting({
                                                    path: 'privacy.pin',
                                                    value: normalizedPin,
                                                }),
                                            )
                                        }
                                        disabled={!canSavePin}
                                    >
                                        {t('settingsView.privacy.savePin')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            setPinDraft('')
                                            dispatch(
                                                setSetting({ path: 'privacy.pin', value: null }),
                                            )
                                        }}
                                        disabled={!privacy.pin}
                                    >
                                        {t('settingsView.privacy.clearPin')}
                                    </Button>
                                </div>
                            </div>
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.privacy.clearAiHistory')}
                            description={t('settingsView.privacy.clearAiHistoryDesc')}
                        >
                            <Switch
                                checked={privacy.clearAiHistoryOnExit}
                                onChange={(value) =>
                                    dispatch(
                                        setSetting({ path: 'privacy.clearAiHistoryOnExit', value }),
                                    )
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}

/** Quick-jump entries for the settings search bar. Each maps a search keyword to a tab + optional element ID. */

export default PrivacySettingsTab
