import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Strain, GrowSetup, LightType, VentilationPower, PotType } from '@/types'
import { useAppSelector } from '@/stores/store'
import { selectSettings } from '@/stores/selectors'
import { Card } from '@/components/common/Card'
import { FormSection } from '@/components/ui/form'
import { RangeSlider } from '@/components/common/RangeSlider'
import { Switch } from '@/components/common/Switch'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import {
    activeFloweringMode,
    lightHoursForMode,
    reportedFloweringMode,
    setupForConfirm,
    type FloweringMode,
} from '@/services/simulation/floweringMode'

interface GrowSetupModalProps {
    strain: Strain
    onClose: () => void
    onConfirm: (setup: GrowSetup) => void
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-slate-400">{label}:</span>
        <span className="font-semibold text-slate-100">{value}</span>
    </div>
)

const finitePercent = (value: number, unknown: string): string =>
    Number.isFinite(value) ? `${value}%` : unknown

const finiteWeeks = (value: number, weeks: string, unknown: string): string =>
    Number.isFinite(value) ? `${value} ${weeks}` : unknown

const floweringLabel = (strain: Strain, weeks: string, unknown: string): string => {
    if (strain.floweringTimeRange) return `${strain.floweringTimeRange} ${weeks}`
    return finiteWeeks(strain.floweringTime, weeks, unknown)
}

const difficultyLabel = (difficulty: string | undefined, translate: TFunction): string => {
    if (!difficulty) return translate('common.unknown')
    return translate(`strainsView.difficulty.${difficulty.toLowerCase()}`)
}

const cycleChoices = (mode: FloweringMode | undefined, translate: TFunction) => {
    const options = [
        { value: '18', label: translate('plantsView.setupModal.cycles.veg') },
        { value: '12', label: translate('plantsView.setupModal.cycles.flower') },
        { value: '24', label: translate('plantsView.setupModal.cycles.auto') },
    ]
    if (mode === 'Autoflower') return options
    return options.filter((option) => option.value !== '24')
}

const cycleInfoKey = (mode: FloweringMode | undefined): string => {
    if (mode === 'Photoperiod') return 'plantsView.setupModal.photoperiodInfo'
    if (mode === 'Autoflower') return 'plantsView.setupModal.autoflowerInfo'
    return 'plantsView.setupModal.unknownFloweringInfo'
}

const SetupStrainCard: React.FC<{ strain: Strain }> = ({ strain }) => {
    const { t } = useTranslation()
    const unknown = t('common.unknown')
    return (
        <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(14,116,144,0.16),rgba(15,23,42,0.92))] !p-4">
            <div className="surface-badge mb-3 text-2xs font-semibold uppercase tracking-[0.22em] text-primary-200">
                <PhosphorIcons.Plant className="h-3.5 w-3.5" />
                {t('plantsView.setupModal.title', { strainName: strain.name })}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <InfoRow label={t('common.type')} value={strain.type || unknown} />
                <InfoRow
                    label={t('strainsView.table.thc')}
                    value={finitePercent(strain.thc, unknown)}
                />
                <InfoRow
                    label={t('strainsView.table.flowering')}
                    value={floweringLabel(strain, t('common.units.weeks'), unknown)}
                />
                <InfoRow
                    label={t('strainsView.table.difficulty')}
                    value={difficultyLabel(strain.agronomic?.difficulty, t)}
                />
            </div>
        </Card>
    )
}

const FloweringModeSection: React.FC<{
    reported: FloweringMode | undefined
    chosen: FloweringMode | undefined
    onChoose: (mode: string) => void
}> = ({ reported, chosen, onChoose }) => {
    const { t } = useTranslation()
    if (reported !== undefined) return null
    return (
        <FormSection
            title={t('plantsView.setupModal.floweringModeTitle')}
            icon={<PhosphorIcons.Plant />}
            defaultOpen
        >
            <div className="sm:col-span-2">
                <p className="text-xs text-slate-400 mb-2">
                    {t('plantsView.setupModal.floweringModePrompt')}
                </p>
                <SegmentedControl
                    aria-label={t('plantsView.setupModal.floweringModeTitle')}
                    value={chosen === undefined ? [] : [chosen]}
                    onToggle={onChoose}
                    options={[
                        {
                            value: 'Photoperiod',
                            label: t('plantsView.setupModal.floweringModes.photoperiod'),
                        },
                        {
                            value: 'Autoflower',
                            label: t('plantsView.setupModal.floweringModes.autoflower'),
                        },
                    ]}
                />
            </div>
        </FormSection>
    )
}

const LightingSection: React.FC<{
    setup: GrowSetup
    setSetup: React.Dispatch<React.SetStateAction<GrowSetup>>
    mode: FloweringMode | undefined
}> = ({ setup, setSetup, mode }) => {
    const { t } = useTranslation()
    return (
        <FormSection
            title={t('plantsView.setupModal.lightingTitle')}
            icon={<PhosphorIcons.LightbulbFilament />}
            defaultOpen
        >
            <div className="sm:col-span-2">
                <SegmentedControl
                    value={[setup.lightType || 'LED']}
                    onToggle={(val) =>
                        setSetup((current) => ({ ...current, lightType: val as LightType }))
                    }
                    options={[
                        { value: 'LED', label: t('plantsView.setupModal.lightTypes.led') },
                        { value: 'HPS', label: t('plantsView.setupModal.lightTypes.hps') },
                    ]}
                />
            </div>
            <div className="sm:col-span-2">
                <RangeSlider
                    label={t('plantsView.setupModal.wattage')}
                    min={50}
                    max={1000}
                    step={10}
                    singleValue
                    value={setup.lightWattage || 150}
                    onChange={(val) => setSetup((current) => ({ ...current, lightWattage: val }))}
                    unit="W"
                />
            </div>
            <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-1">
                    {t('plantsView.setupModal.lightCycle')}
                </label>
                <SegmentedControl
                    value={[`${setup.lightHours}`]}
                    onToggle={(val) =>
                        setSetup((current) => ({ ...current, lightHours: Number(val) }))
                    }
                    options={cycleChoices(mode, t)}
                />
                <p className="text-xs text-slate-400 mt-1">{t(cycleInfoKey(mode))}</p>
            </div>
        </FormSection>
    )
}

const EnvironmentSection: React.FC<{
    setup: GrowSetup
    setSetup: React.Dispatch<React.SetStateAction<GrowSetup>>
}> = ({ setup, setSetup }) => {
    const { t } = useTranslation()
    return (
        <FormSection
            title={t('plantsView.setupModal.environmentTitle')}
            icon={<PhosphorIcons.Fan />}
        >
            <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-1">
                    {t('plantsView.setupModal.exhaustFanPower')}
                </label>
                <SegmentedControl
                    value={[setup.ventilation || 'medium']}
                    onToggle={(val) =>
                        setSetup((current) => ({
                            ...current,
                            ventilation: val as VentilationPower,
                        }))
                    }
                    options={[
                        { value: 'low', label: t('plantsView.setupModal.ventilationLevels.low') },
                        {
                            value: 'medium',
                            label: t('plantsView.setupModal.ventilationLevels.medium'),
                        },
                        { value: 'high', label: t('plantsView.setupModal.ventilationLevels.high') },
                    ]}
                />
            </div>
            <Switch
                label={t('plantsView.setupModal.circulationFan')}
                checked={Boolean(setup.hasCirculationFan)}
                onChange={(val) => setSetup((current) => ({ ...current, hasCirculationFan: val }))}
            />
        </FormSection>
    )
}

const ContainerSection: React.FC<{
    setup: GrowSetup
    setSetup: React.Dispatch<React.SetStateAction<GrowSetup>>
}> = ({ setup, setSetup }) => {
    const { t } = useTranslation()
    return (
        <FormSection
            title={t('plantsView.setupModal.containerTitle')}
            icon={<PhosphorIcons.Cube />}
        >
            <div className="sm:col-span-2">
                <RangeSlider
                    label={t('plantsView.setupModal.potSize')}
                    min={3}
                    max={50}
                    step={1}
                    singleValue
                    value={setup.potSize}
                    onChange={(val) => setSetup((current) => ({ ...current, potSize: val }))}
                    unit="L"
                />
            </div>
            <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-1">
                    {t('plantsView.setupModal.potType')}
                </label>
                <SegmentedControl
                    value={[setup.potType || 'Fabric']}
                    onToggle={(val) =>
                        setSetup((current) => ({ ...current, potType: val as PotType }))
                    }
                    options={[
                        { value: 'Plastic', label: t('plantsView.setupModal.potTypes.plastic') },
                        { value: 'Fabric', label: t('plantsView.setupModal.potTypes.fabric') },
                    ]}
                />
            </div>
            <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-1">
                    {t('plantsView.setupModal.medium')}
                </label>
                <SegmentedControl
                    value={[setup.medium]}
                    onToggle={(val) =>
                        setSetup((current) => ({ ...current, medium: val as GrowSetup['medium'] }))
                    }
                    options={[
                        { value: 'Soil', label: t('plantsView.mediums.Soil') },
                        { value: 'Coco', label: t('plantsView.mediums.Coco') },
                        { value: 'Hydro', label: t('plantsView.mediums.Hydro') },
                    ]}
                />
            </div>
        </FormSection>
    )
}

export const GrowSetupModal: React.FC<GrowSetupModalProps> = ({ strain, onClose, onConfirm }) => {
    const { t } = useTranslation()
    const settings = useAppSelector(selectSettings)

    const initialSetup = useMemo<GrowSetup>(
        () => ({
            ...settings.defaults.growSetup,
            lightHours: 18,
        }),
        [settings.defaults.growSetup],
    )

    const [setup, setSetup] = useState(initialSetup)
    const [chosenMode, setChosenMode] = useState<FloweringMode | undefined>(undefined)
    const reportedMode = reportedFloweringMode(strain.floweringType)

    useEffect(() => {
        setSetup(initialSetup)
        setChosenMode(undefined)
    }, [initialSetup, strain.id])

    const mode = activeFloweringMode(reportedMode, chosenMode)
    const confirmedSetup = setupForConfirm(setup, reportedMode, chosenMode)

    const chooseMode = (next: string) => {
        const parsed = reportedFloweringMode(next)
        if (parsed === undefined) return
        setChosenMode(parsed)
        setSetup((current) => ({
            ...current,
            lightHours: lightHoursForMode(current.lightHours, parsed),
        }))
    }

    const handleConfirm = () => {
        if (confirmedSetup === undefined) return
        onConfirm(confirmedSetup)
    }

    const footer = (
        <>
            <Button variant="secondary" onClick={onClose}>
                {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirm} glow disabled={confirmedSetup === undefined}>
                {t('plantsView.setupModal.confirm')}
            </Button>
        </>
    )

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={t('plantsView.setupModal.title', { strainName: strain.name })}
            footer={footer}
            size="2xl"
        >
            <div className="space-y-4">
                <SetupStrainCard strain={strain} />
                <FloweringModeSection
                    reported={reportedMode}
                    chosen={chosenMode}
                    onChoose={chooseMode}
                />
                <LightingSection setup={setup} setSetup={setSetup} mode={mode} />
                <EnvironmentSection setup={setup} setSetup={setSetup} />
                <ContainerSection setup={setup} setSetup={setSetup} />
            </div>
        </Modal>
    )
}
