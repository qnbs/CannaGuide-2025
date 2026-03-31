import React, { useEffect, useMemo } from 'react'
import { Strain, StrainType, DifficultyLevel, YieldLevel, HeightLevel } from '@/types'
import { Button } from '@/components/common/Button'
import { useTranslation } from 'react-i18next'
import { useForm } from '@/hooks/useForm'
import { Modal } from '@/components/common/Modal'
import { useAppDispatch } from '@/stores/store'
import { getUISnapshot } from '@/stores/useUIStore'
import { Input, FormSection } from '@/components/ui/form'
import { createStrainObject } from '@/services/strainFactory'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface AddStrainModalProps {
    isOpen: boolean
    onClose: () => void
    onAddStrain: (strain: Strain) => void
    onUpdateStrain: (strain: Strain) => void
    strainToEdit: Strain | null
}

const getSafeStrainType = (value: unknown): StrainType => {
    if (value === StrainType.Sativa || value === StrainType.Indica || value === StrainType.Hybrid) {
        return value
    }

    return StrainType.Hybrid
}

const strainToFormValues = (strain: Partial<Strain>) => ({
    name: strain.name ?? '',
    type: strain.type ?? 'Hybrid',
    typeDetails: strain.typeDetails ?? '',
    genetics: strain.genetics ?? '',
    isAutoflower: strain.floweringType === 'Autoflower',
    thc: strain.thc ?? 20,
    cbd: strain.cbd ?? 1,
    thcRange: strain.thcRange ?? '',
    cbdRange: strain.cbdRange ?? '',
    floweringTime: strain.floweringTime ?? 9,
    floweringTimeRange: strain.floweringTimeRange ?? '',
    description: strain.description ?? '',
    aromasString: (strain.aromas ?? []).join(', '),
    terpenesString: (strain.dominantTerpenes ?? []).join(', '),
    difficulty: strain.agronomic?.difficulty ?? 'Medium',
    yield: strain.agronomic?.yield ?? 'Medium',
    height: strain.agronomic?.height ?? 'Medium',
    yieldIndoor: strain.agronomic?.yieldDetails?.indoor ?? '',
    yieldOutdoor: strain.agronomic?.yieldDetails?.outdoor ?? '',
    heightIndoor: strain.agronomic?.heightDetails?.indoor ?? '',
    heightOutdoor: strain.agronomic?.heightDetails?.outdoor ?? '',
})

const defaultStrainValues = strainToFormValues({
    agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
})

const SINGLE_VALUE_RANGE_RE = /^[<~>]?\s*\d{1,2}(?:\.\d+)?\s*%?$/
const SPAN_RANGE_RE = /^\d{1,2}(?:\.\d+)?\s*-\s*\d{1,2}(?:\.\d+)?\s*%?$/
const isValidRange = (range: string): boolean =>
    SINGLE_VALUE_RANGE_RE.test(range) || SPAN_RANGE_RE.test(range)

const parseCommaSeparatedTokens = (value: string): string[] =>
    value
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean)

const ErrorText: React.FC<{ message?: string | undefined }> = ({ message }) => {
    if (!message) return null
    return <p className="mt-1 text-xs font-medium text-rose-300">{message}</p>
}

const TokenPreview: React.FC<{ title: string; values: string[] }> = ({ title, values }) => (
    <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-3">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
            {title}
        </p>
        <div className="mt-2 flex min-h-8 flex-wrap gap-2">
            {values.length > 0 ? (
                values.map((value) => (
                    <span
                        key={value}
                        className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs text-slate-200"
                    >
                        {value}
                    </span>
                ))
            ) : (
                <span className="text-xs text-slate-500">-</span>
            )}
        </div>
    </div>
)

export const AddStrainModal: React.FC<AddStrainModalProps> = ({
    isOpen,
    onAddStrain,
    onUpdateStrain,
    strainToEdit,
    ...props
}) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const isEditMode = !!strainToEdit
    const formInitialValues = useMemo(
        () => (isEditMode && strainToEdit ? strainToFormValues(strainToEdit) : defaultStrainValues),
        [isEditMode, strainToEdit],
    )

    const validate = (values: ReturnType<typeof strainToFormValues>) => {
        const errors: Partial<Record<keyof typeof values, string>> = {}
        if (!values.name?.trim()) errors.name = t('strainsView.addStrainModal.validation.name')

        const thc = Number(values.thc)
        if (Number.isNaN(thc) || thc < 0 || thc > 50)
            errors.thc = t('strainsView.addStrainModal.validation.thc')

        const floweringTime = Number(values.floweringTime)
        if (Number.isNaN(floweringTime) || floweringTime < 4 || floweringTime > 20)
            errors.floweringTime = t('strainsView.addStrainModal.validation.floweringTime')

        if (values.thcRange && !isValidRange(values.thcRange))
            errors.thcRange = t('strainsView.addStrainModal.validation.thcRange')
        if (values.cbdRange && !isValidRange(values.cbdRange))
            errors.cbdRange = t('strainsView.addStrainModal.validation.cbdRange')
        return errors
    }

    const onSubmit = (values: ReturnType<typeof strainToFormValues>) => {
        const safeName = typeof values.name === 'string' ? values.name : ''
        const safeType = getSafeStrainType(values.type)

        const partialStrainData: Partial<Strain> = {
            id: isEditMode
                ? strainToEdit.id
                : `${safeName.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
            name: safeName,
            type: safeType,
            typeDetails: values.typeDetails,
            genetics: values.genetics,
            floweringType: values.isAutoflower ? 'Autoflower' : 'Photoperiod',
            thc: Number(values.thc),
            cbd: Number(values.cbd || 1),
            thcRange: values.thcRange,
            cbdRange: values.cbdRange,
            floweringTime: Number(values.floweringTime),
            floweringTimeRange: values.floweringTimeRange,
            description: values.description,
            aromas: parseCommaSeparatedTokens(values.aromasString),
            dominantTerpenes: parseCommaSeparatedTokens(values.terpenesString),
            agronomic: {
                difficulty: values.difficulty as DifficultyLevel,
                yield: values.yield as YieldLevel,
                height: values.height as HeightLevel,
                yieldDetails: { indoor: values.yieldIndoor, outdoor: values.yieldOutdoor },
                heightDetails: { indoor: values.heightIndoor, outdoor: values.heightOutdoor },
            },
        }

        const finalStrain = createStrainObject(partialStrainData)

        if (isEditMode) {
            onUpdateStrain(finalStrain)
        } else {
            onAddStrain(finalStrain)
        }
    }

    const { values, errors, handleChange, handleSubmit, resetForm } = useForm({
        initialValues: formInitialValues,
        validate,
        onSubmit,
    })

    useEffect(() => {
        if (isOpen) {
            resetForm(formInitialValues)
        }
    }, [formInitialValues, isOpen, resetForm])

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            getUISnapshot().addNotification({
                message: Object.values(errors).join(' '),
                type: 'error',
            })
        }
    }, [errors, dispatch])

    const parsedAromas = useMemo(
        () => parseCommaSeparatedTokens(values.aromasString),
        [values.aromasString],
    )

    const parsedTerpenes = useMemo(
        () => parseCommaSeparatedTokens(values.terpenesString),
        [values.terpenesString],
    )
    const previewType = getSafeStrainType(values.type)
    const previewTypeTranslationKey = `strainsView.${previewType.toLowerCase()}`

    const typeOptions = useMemo(
        () => [
            {
                value: StrainType.Sativa,
                label: t('strainsView.sativa'),
                icon: <PhosphorIcons.ArrowUp className="h-4 w-4" />,
            },
            {
                value: StrainType.Hybrid,
                label: t('strainsView.hybrid'),
                icon: <PhosphorIcons.Sparkle className="h-4 w-4" />,
            },
            {
                value: StrainType.Indica,
                label: t('strainsView.indica'),
                icon: <PhosphorIcons.ArrowDown className="h-4 w-4" />,
            },
        ],
        [t],
    )

    const modalTitle = isEditMode
        ? t('strainsView.addStrainModal.editTitle')
        : t('strainsView.addStrainModal.title')
    const footer = (
        <>
            <Button
                type="button"
                variant="secondary"
                onClick={props.onClose}
                className="min-h-11 w-full sm:w-auto"
            >
                {t('common.cancel')}
            </Button>
            <Button
                type="submit"
                form="add-strain-form"
                glow={true}
                className="min-h-11 w-full sm:w-auto"
            >
                {t('common.save')}
            </Button>
        </>
    )

    return (
        <Modal
            isOpen={isOpen}
            onClose={props.onClose}
            title={modalTitle}
            size="4xl"
            footer={footer}
        >
            <form onSubmit={handleSubmit} id="add-strain-form" className="flex h-full flex-col">
                <div className="space-y-5 pb-4">
                    <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(14,116,144,0.18),rgba(15,23,42,0.92))] !p-0">
                        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)] lg:items-start">
                            <div>
                                <div className="surface-badge mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary-200">
                                    <PhosphorIcons.Flask className="h-3.5 w-3.5" />
                                    {isEditMode
                                        ? t('strainsView.addStrainModal.editTitle')
                                        : t('strainsView.addStrainModal.title')}
                                </div>
                                <p className="max-w-2xl text-sm leading-6 text-slate-300">
                                    {t('strainsView.addStrainModal.description')}
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        {t('strainsView.addStrainModal.quickPreview')}
                                    </p>
                                    <p className="mt-2 truncate text-lg font-bold font-display text-slate-50">
                                        {values.name.trim() || '–'}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-300">
                                        {t(previewTypeTranslationKey)} ·{' '}
                                        {values.isAutoflower
                                            ? t('strainsView.addStrainModal.autoflower')
                                            : t('strainsView.addStrainModal.photoperiod')}
                                    </p>
                                </div>
                                <TokenPreview
                                    title={t('strainsView.addStrainModal.aromasPreview')}
                                    values={parsedAromas.slice(0, 4)}
                                />
                                <TokenPreview
                                    title={t('strainsView.addStrainModal.terpenesPreview')}
                                    values={parsedTerpenes.slice(0, 4)}
                                />
                            </div>
                        </div>
                    </Card>

                    <FormSection
                        title={t('strainsView.addStrainModal.generalInfo')}
                        defaultOpen={true}
                        icon={<PhosphorIcons.Question className="h-5 w-5" />}
                    >
                        <div className="sm:col-span-2">
                            <Input
                                label={`${t('strainsView.addStrainModal.strainName')} *`}
                                value={values.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder={t('strainsView.addStrainModal.strainNamePlaceholder')}
                                required
                            />
                            <ErrorText message={errors.name} />
                        </div>
                        <div className="sm:col-span-2">
                            <p className="mb-2 text-sm font-semibold text-slate-300">
                                {t('strainsView.addStrainModal.typeLegend')}
                            </p>
                            <SegmentedControl
                                aria-label={t('strainsView.addStrainModal.typeLegend')}
                                value={[values.type]}
                                onToggle={(value) => handleChange('type', value as StrainType)}
                                options={typeOptions}
                                buttonClassName="min-h-11"
                            />
                        </div>
                        <Input
                            label={t('common.typeDetails')}
                            value={values.typeDetails}
                            onChange={(e) => handleChange('typeDetails', e.target.value)}
                            placeholder={t('strainsView.addStrainModal.typeDetailsPlaceholder')}
                        />
                        <Input
                            label={t('common.genetics')}
                            value={values.genetics}
                            onChange={(e) => handleChange('genetics', e.target.value)}
                            placeholder={t('strainsView.addStrainModal.geneticsPlaceholder')}
                        />
                        <div className="sm:col-span-2">
                            <p className="mb-2 text-sm font-semibold text-slate-300">
                                {t('strainsView.addStrainModal.floweringTypeLegend')}
                            </p>
                            <SegmentedControl
                                aria-label={t('strainsView.addStrainModal.floweringTypeLegend')}
                                value={[values.isAutoflower ? 'Autoflower' : 'Photoperiod']}
                                onToggle={(value) =>
                                    handleChange('isAutoflower', value === 'Autoflower')
                                }
                                options={[
                                    {
                                        value: 'Photoperiod',
                                        label: t('strainsView.addStrainModal.photoperiod'),
                                        icon: <PhosphorIcons.Sun className="h-4 w-4" />,
                                    },
                                    {
                                        value: 'Autoflower',
                                        label: t('strainsView.addStrainModal.autoflower'),
                                        icon: <PhosphorIcons.Lightning className="h-4 w-4" />,
                                    },
                                ]}
                                buttonClassName="min-h-11"
                            />
                        </div>
                    </FormSection>

                    <FormSection
                        title={t('strainsView.addStrainModal.cannabinoids')}
                        icon={<PhosphorIcons.Drop className="h-5 w-5" />}
                    >
                        <div>
                            <Input
                                label={`${t('strainsView.addStrainModal.thcPercent')} *`}
                                type="number"
                                step="0.1"
                                value={values.thc}
                                onChange={(e) => handleChange('thc', Number(e.target.value))}
                                required
                            />
                            <ErrorText message={errors.thc} />
                        </div>
                        <Input
                            label={t('strainsView.addStrainModal.cbdPercent')}
                            type="number"
                            step="0.1"
                            value={values.cbd}
                            onChange={(e) => handleChange('cbd', Number(e.target.value))}
                        />
                        <div>
                            <Input
                                label={t('strainsView.addStrainModal.thcRange')}
                                value={values.thcRange}
                                onChange={(e) => handleChange('thcRange', e.target.value)}
                                placeholder={t('strainsView.addStrainModal.thcRangePlaceholder')}
                            />
                            <ErrorText message={errors.thcRange} />
                        </div>
                        <div>
                            <Input
                                label={t('strainsView.addStrainModal.cbdRange')}
                                value={values.cbdRange}
                                onChange={(e) => handleChange('cbdRange', e.target.value)}
                                placeholder={t('strainsView.addStrainModal.cbdRangePlaceholder')}
                            />
                            <ErrorText message={errors.cbdRange} />
                        </div>
                    </FormSection>

                    <FormSection
                        title={t('strainsView.addStrainModal.growData')}
                        icon={<PhosphorIcons.ChartLineUp className="h-5 w-5" />}
                    >
                        <div>
                            <Input
                                label={`${t('strainsView.addStrainModal.floweringTimeWeeks')} *`}
                                type="number"
                                step="0.5"
                                value={values.floweringTime}
                                onChange={(e) =>
                                    handleChange('floweringTime', Number(e.target.value))
                                }
                                required
                            />
                            <ErrorText message={errors.floweringTime} />
                        </div>
                        <Input
                            label={t('strainsView.addStrainModal.floweringTimeRange')}
                            value={values.floweringTimeRange}
                            onChange={(e) => handleChange('floweringTimeRange', e.target.value)}
                            placeholder={t(
                                'strainsView.addStrainModal.floweringTimeRangePlaceholder',
                            )}
                        />
                        <div className="sm:col-span-2 grid gap-4 lg:grid-cols-3">
                            <div>
                                <p className="mb-2 text-sm font-semibold text-slate-300">
                                    {t('strainsView.table.difficulty')}
                                </p>
                                <SegmentedControl
                                    aria-label={t('strainsView.table.difficulty')}
                                    value={[values.difficulty]}
                                    onToggle={(value) =>
                                        handleChange('difficulty', value as DifficultyLevel)
                                    }
                                    options={[
                                        { value: 'Easy', label: t('strainsView.difficulty.easy') },
                                        {
                                            value: 'Medium',
                                            label: t('strainsView.difficulty.medium'),
                                        },
                                        { value: 'Hard', label: t('strainsView.difficulty.hard') },
                                    ]}
                                    className="grid grid-cols-3"
                                />
                            </div>
                            <div>
                                <p className="mb-2 text-sm font-semibold text-slate-300">
                                    {t('strainsView.addStrainModal.yield')}
                                </p>
                                <SegmentedControl
                                    aria-label={t('strainsView.addStrainModal.yield')}
                                    value={[values.yield]}
                                    onToggle={(value) => handleChange('yield', value as YieldLevel)}
                                    options={[
                                        {
                                            value: 'Low',
                                            label: t('strainsView.addStrainModal.yields.low'),
                                        },
                                        {
                                            value: 'Medium',
                                            label: t('strainsView.addStrainModal.yields.medium'),
                                        },
                                        {
                                            value: 'High',
                                            label: t('strainsView.addStrainModal.yields.high'),
                                        },
                                    ]}
                                    className="grid grid-cols-3"
                                />
                            </div>
                            <div>
                                <p className="mb-2 text-sm font-semibold text-slate-300">
                                    {t('strainsView.addStrainModal.height')}
                                </p>
                                <SegmentedControl
                                    aria-label={t('strainsView.addStrainModal.height')}
                                    value={[values.height]}
                                    onToggle={(value) =>
                                        handleChange('height', value as HeightLevel)
                                    }
                                    options={[
                                        {
                                            value: 'Short',
                                            label: t('strainsView.addStrainModal.heights.short'),
                                        },
                                        {
                                            value: 'Medium',
                                            label: t('strainsView.addStrainModal.heights.medium'),
                                        },
                                        {
                                            value: 'Tall',
                                            label: t('strainsView.addStrainModal.heights.tall'),
                                        },
                                    ]}
                                    className="grid grid-cols-3"
                                />
                            </div>
                        </div>
                        <Input
                            label={t('strainsView.strainModal.yieldIndoor')}
                            value={values.yieldIndoor}
                            onChange={(e) => handleChange('yieldIndoor', e.target.value)}
                            placeholder={t('strainsView.addStrainModal.yieldIndoorPlaceholder')}
                        />
                        <Input
                            label={t('strainsView.strainModal.yieldOutdoor')}
                            value={values.yieldOutdoor}
                            onChange={(e) => handleChange('yieldOutdoor', e.target.value)}
                            placeholder={t('strainsView.addStrainModal.yieldOutdoorPlaceholder')}
                        />
                        <Input
                            label={t('strainsView.strainModal.heightIndoor')}
                            value={values.heightIndoor}
                            onChange={(e) => handleChange('heightIndoor', e.target.value)}
                            placeholder={t('strainsView.addStrainModal.heightIndoorPlaceholder')}
                        />
                        <Input
                            label={t('strainsView.strainModal.heightOutdoor')}
                            value={values.heightOutdoor}
                            onChange={(e) => handleChange('heightOutdoor', e.target.value)}
                            placeholder={t('strainsView.addStrainModal.heightOutdoorPlaceholder')}
                        />
                    </FormSection>

                    <FormSection
                        title={t('strainsView.addStrainModal.profile')}
                        icon={<PhosphorIcons.Sparkle className="h-5 w-5" />}
                    >
                        <div className="sm:col-span-2">
                            <Input
                                as="textarea"
                                rows={3}
                                label={t('common.description')}
                                value={values.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                            />
                        </div>
                        <Input
                            label={t('strainsView.strainModal.aromas')}
                            value={values.aromasString}
                            onChange={(e) => handleChange('aromasString', e.target.value)}
                            placeholder={t('strainsView.addStrainModal.aromasPlaceholder')}
                        />
                        <Input
                            label={t('strainsView.strainModal.dominantTerpenes')}
                            value={values.terpenesString}
                            onChange={(e) => handleChange('terpenesString', e.target.value)}
                            placeholder={t('strainsView.addStrainModal.terpenesPlaceholder')}
                        />
                    </FormSection>
                </div>
            </form>
        </Modal>
    )
}
