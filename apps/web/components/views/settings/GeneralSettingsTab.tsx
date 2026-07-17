import React from 'react'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { View } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { setSetting } from '@/stores/slices/settingsSlice'
import { Switch } from '@/components/common/Switch'
import { FormSection } from '@/components/ui/form'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/common/Card'
import { SettingsRow, SettingsSelect } from './SettingsShared'
import { usePwaInstall } from '@/hooks/usePwaInstall'
import { THEME_SWATCHES } from './settingsConstants'

const GeneralSettingsTab: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const settings = useAppSelector(selectSettings)
    const general = settings.general
    const { deferredPrompt, isInstalled, handleInstallClick } = usePwaInstall()

    const handleSetSetting = (path: string, value: unknown) => {
        dispatch(setSetting({ path: `general.${path}`, value }))
    }

    const colorblindModeOptions = [
        { value: 'none', label: t('settingsView.general.colorblindModes.none') },
        { value: 'protanopia', label: t('settingsView.general.colorblindModes.protanopia') },
        { value: 'deuteranopia', label: t('settingsView.general.colorblindModes.deuteranopia') },
        { value: 'tritanopia', label: t('settingsView.general.colorblindModes.tritanopia') },
    ]

    const themeEntries = [
        'midnight',
        'forest',
        'purpleHaze',
        'desertSky',
        'roseQuartz',
        'rainbowKush',
        'ogKushGreen',
        'runtzRainbow',
        'lemonSkunk',
    ]

    return (
        <div className="space-y-6">
            {/* PWA Status Card */}
            <Card className="border border-primary-500/30 bg-primary-900/10">
                <div className="flex items-start gap-4">
                    <div className="mt-1 rounded-full bg-primary-500/20 p-3">
                        <PhosphorIcons.DownloadSimple className="h-6 w-6 text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-primary-300">
                            {t('settingsView.general.installApp')}
                        </h3>
                        {isInstalled ? (
                            <p className="text-sm text-green-400 mt-1 font-semibold">
                                {t('settingsView.pwa.installed')}
                            </p>
                        ) : deferredPrompt ? (
                            <>
                                <p className="text-sm text-slate-300 mt-1">
                                    {t('settingsView.general.installAppDesc')}
                                </p>
                                <Button onClick={handleInstallClick} className="mt-3">
                                    <PhosphorIcons.DownloadSimple className="mr-2" />
                                    {t('settingsView.pwa.installNow')}
                                </Button>
                            </>
                        ) : (
                            <p className="text-sm text-slate-400 mt-1">
                                {t('settingsView.pwa.notAvailable')}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            <Card>
                <FormSection
                    title={t('settingsView.categories.lookAndFeel')}
                    icon={<PhosphorIcons.Cube />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.general.language')}>
                            <SettingsSelect
                                value={general.language}
                                onChange={(value) => handleSetSetting('language', value)}
                                options={[
                                    { value: 'en', label: t('settingsView.languages.en') },
                                    { value: 'de', label: t('settingsView.languages.de') },
                                    { value: 'es', label: t('settingsView.languages.es') },
                                    { value: 'fr', label: t('settingsView.languages.fr') },
                                    { value: 'nl', label: t('settingsView.languages.nl') },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.general.theme')}>
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                    {themeEntries.map((key) => {
                                        const swatches = THEME_SWATCHES[key]
                                        const isActive = general.theme === key
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleSetSetting('theme', key)}
                                                className={`relative flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 transition-all duration-200 ${
                                                    isActive
                                                        ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-400 scale-[1.03]'
                                                        : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                                                }`}
                                                aria-label={t(`settingsView.general.themes.${key}`)}
                                                aria-pressed={isActive}
                                            >
                                                <div className="flex gap-0.5">
                                                    {swatches?.map((color) => (
                                                        <div
                                                            key={color}
                                                            className="w-4 h-4 rounded-full border border-white/10"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-3xs font-medium text-slate-300 leading-tight text-center">
                                                    {t(`settingsView.general.themes.${key}`)}
                                                </span>
                                                {isActive && (
                                                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary-400 border border-slate-900" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.general.fontSize')}>
                            <SegmentedControl
                                value={[general.fontSize]}
                                onToggle={(val) => handleSetSetting('fontSize', val)}
                                options={[
                                    { value: 'sm', label: t('settingsView.general.fontSizes.sm') },
                                    {
                                        value: 'base',
                                        label: t('settingsView.general.fontSizes.base'),
                                    },
                                    { value: 'lg', label: t('settingsView.general.fontSizes.lg') },
                                ]}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
            <Card>
                <FormSection
                    title={t('settingsView.categories.interactivity')}
                    icon={<PhosphorIcons.GameController />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow label={t('settingsView.general.uiDensity')}>
                            <SegmentedControl
                                value={[general.uiDensity]}
                                onToggle={(val) => handleSetSetting('uiDensity', val)}
                                options={[
                                    {
                                        value: 'comfortable',
                                        label: t('settingsView.general.uiDensities.comfortable'),
                                    },
                                    {
                                        value: 'compact',
                                        label: t('settingsView.general.uiDensities.compact'),
                                    },
                                ]}
                            />
                        </SettingsRow>
                        <SettingsRow label={t('settingsView.general.defaultView')}>
                            <SettingsSelect
                                value={general.defaultView}
                                onChange={(value) => handleSetSetting('defaultView', value)}
                                options={[
                                    { value: View.Plants, label: t('nav.plants') },
                                    { value: View.Strains, label: t('nav.strains') },
                                    { value: View.Equipment, label: t('nav.equipment') },
                                    { value: View.Knowledge, label: t('nav.knowledge') },
                                ]}
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
            <Card>
                <FormSection
                    title={t('settingsView.categories.accessibility')}
                    icon={<PhosphorIcons.Person />}
                    defaultOpen
                >
                    <div className="sm:col-span-2 space-y-6">
                        <SettingsRow
                            label={t('settingsView.general.dyslexiaFont')}
                            description={t('settingsView.general.dyslexiaFontDesc')}
                        >
                            <Switch
                                checked={general.dyslexiaFont}
                                onChange={(val) => handleSetSetting('dyslexiaFont', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.general.reducedMotion')}
                            description={t('settingsView.general.reducedMotionDesc')}
                        >
                            <Switch
                                checked={general.reducedMotion}
                                onChange={(val) => handleSetSetting('reducedMotion', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.general.highContrastMode')}
                            description={t('settingsView.general.highContrastModeDesc')}
                        >
                            <Switch
                                checked={general.highContrastMode}
                                onChange={(val) => handleSetSetting('highContrastMode', val)}
                            />
                        </SettingsRow>
                        <SettingsRow
                            label={t('settingsView.general.colorblindMode')}
                            description={t('settingsView.general.colorblindModeDesc')}
                        >
                            <SettingsSelect
                                value={general.colorblindMode}
                                onChange={(value) => handleSetSetting('colorblindMode', value)}
                                options={
                                    colorblindModeOptions as { value: string; label: string }[]
                                }
                            />
                        </SettingsRow>
                    </div>
                </FormSection>
            </Card>
        </div>
    )
}


export default GeneralSettingsTab
