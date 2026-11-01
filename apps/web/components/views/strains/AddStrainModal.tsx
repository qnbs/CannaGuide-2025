import React, { useEffect, useMemo } from 'react'
import { Strain, StrainType } from '@/types'
import { Button } from '@/components/common/Button'
import { useTranslation, type TFunction } from 'react-i18next'
import { useForm } from '@/hooks/useForm'
import { Modal } from '@/components/common/Modal'
import { Input, FormSection } from '@/components/ui/form'
import { SegmentedControl } from '@/components/common/SegmentedControl'
import {
    buildStrainDraft,
    defaultStrainValues,
    parseCommaSeparatedTokens,
    strainToFormValues,
    strainTypeOf,
    type StrainFormValues,
} from './addStrainDraft'
import { Card } from '@/components/common/Card'
import { PhosphorIcons } from '@/components/icons/PhosphorIcons'

interface AddStrainModalProps {
    isOpen: boolean
    onClose: () => void
    onAddStrain: (strain: Strain) => void
    onUpdateStrain: (strain: Strain) => void
    strainToEdit: Strain | null
}

const readOptionalNumber = (raw: string): number | '' => (raw === '' ? '' : Number(raw))

const SINGLE_VALUE_RANGE_RE = /^[<~>]?\s*\d{1,2}(?:\.\d+)?\s*%?$/
const SPAN_RANGE_RE = /^\d{1,2}(?:\.\d+)?\s*-\s*\d{1,2}(?:\.\d+)?\s*%?$/
const isValidRange = (range: string): boolean =>
    SINGLE_VALUE_RANGE_RE.test(range) || SPAN_RANGE_RE.test(range)

const nameError = (name: string, message: string): string | undefined => {
    if (!name.trim()) return message
    return undefined
}

const boundedNumberError = (
    value: number | '',
    min: number,
    max: number,
    message: string,
): string | undefined => {
    if (value === '') return undefined
    if (Number.isNaN(Number(value)) || value < min || value > max) return message
    return undefined
}

const rangeError = (range: string, message: string): string | undefined => {
    if (range && !isValidRange(range)) return message
    return undefined
}

const assignError = (
    errors: Partial<Record<keyof StrainFormValues, string>>,
    key: keyof StrainFormValues,
    message: string | undefined,
) => {
    if (message) errors[key] = message
}

const strainFormErrors = (values: StrainFormValues, translate: TFunction) => {
    const errors: Partial<Record<keyof StrainFormValues, string>> = {}
    assignError(
        errors,
        'name',
        nameError(values.name, translate('strainsView.addStrainModal.validation.name')),
    )
    assignError(
        errors,
        'thc',
        boundedNumberError(
            values.thc,
            0,
            50,
            translate('strainsView.addStrainModal.validation.thc'),
        ),
    )
    assignError(
        errors,
        'floweringTime',
        boundedNumberError(
            values.floweringTime,
            4,
            20,
            translate('strainsView.addStrainModal.validation.floweringTime'),
        ),
    )
    assignError(
        errors,
        'thcRange',
        rangeError(values.thcRange, translate('strainsView.addStrainModal.validation.thcRange')),
    )
    assignError(
        errors,
        'cbdRange',
        rangeError(values.cbdRange, translate('strainsView.addStrainModal.validation.cbdRange')),
    )
    return errors
}

const floweringChoiceLabel = (floweringType: string, translate: TFunction): string => {
    if (floweringType === 'Autoflower') return translate('strainsView.addStrainModal.autoflower')
    if (floweringType === 'Photoperiod') return translate('strainsView.addStrainModal.photoperiod')
    return translate('common.unknown')
}

const TokenPreview: React.FC<{ title: string; values: string[] }> = ({ title, values }) => (
    <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
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
                <span className="text-xs text-muted">-</span>
            )}
        </div>
    </div>
)

const DraftPreview: React.FC<{
    values: StrainFormValues
    aromas: string[]
    terpenes: string[]
}> = ({ values, aromas, terpenes }) => {
    const { t } = useTranslation()
    const previewType = strainTypeOf(values.type)
    const typeLabel = previewType
        ? t(`strainsView.${previewType.toLowerCase()}`)
        : t('common.unknown')
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-3">
                <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('strainsView.addStrainModal.quickPreview')}
                </p>
                <p className="mt-2 truncate text-lg font-bold font-display text-slate-50">
                    {values.name.trim() || '–'}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                    {typeLabel} · {floweringChoiceLabel(values.floweringType, t)}
                </p>
            </div>
            <TokenPreview
                title={t('strainsView.addStrainModal.aromasPreview')}
                values={aromas.slice(0, 4)}
            />
            <TokenPreview
                title={t('strainsView.addStrainModal.terpenesPreview')}
                values={terpenes.slice(0, 4)}
            />
        </div>
    )
}

export const AddStrainModal: React.FC<AddStrainModalProps> = ({
    isOpen,
    onAddStrain,
    onUpdateStrain,
    strainToEdit,
    ...props
}) => {
    const { t } = useTranslation()
    const isEditMode = !!strainToEdit
    const formInitialValues = useMemo(
        () => (isEditMode && strainToEdit ? strainToFormValues(strainToEdit) : defaultStrainValues),
        [isEditMode, strainToEdit],
    )

    const validate = (values: StrainFormValues) => strainFormErrors(values, t)

    const onSubmit = (values: StrainFormValues) => {
        const draft = buildStrainDraft(values, strainToEdit)
        if (strainToEdit) onUpdateStrain(draft)
        else onAddStrain(draft)
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

    const parsedAromas = useMemo(
        () => parseCommaSeparatedTokens(values.aromasString),
        [values.aromasString],
    )

    const parsedTerpenes = useMemo(
        () => parseCommaSeparatedTokens(values.terpenesString),
        [values.terpenesString],
    )
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
                                <div className="surface-badge mb-3 text-2xs font-semibold uppercase tracking-[0.24em] text-primary-200">
                                    <PhosphorIcons.Flask className="h-3.5 w-3.5" />
                                    {isEditMode
                                        ? t('strainsView.addStrainModal.editTitle')
                                        : t('strainsView.addStrainModal.title')}
                                </div>
                                <p className="max-w-2xl text-sm leading-6 text-slate-300">
                                    {t('strainsView.addStrainModal.description')}
                                </p>
                            </div>
                            <DraftPreview
                                values={values}
                                aromas={parsedAromas}
                                terpenes={parsedTerpenes}
                            />
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
                                error={errors.name}
                                required
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <p className="mb-2 text-sm font-semibold text-slate-300">
                                {t('strainsView.addStrainModal.typeLegend')}
                            </p>
                            <SegmentedControl
                                aria-label={t('strainsView.addStrainModal.typeLegend')}
                                value={[values.type]}
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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
                                value={[values.floweringType]}
                                onToggle={(value) => handleChange('floweringType', value)}
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
                                label={t('strainsView.addStrainModal.thcPercent')}
                                type="number"
                                step="0.1"
                                value={values.thc}
                                onChange={(e) =>
                                    handleChange('thc', readOptionalNumber(e.target.value))
                                }
                                error={errors.thc}
                            />
                        </div>
                        <Input
                            label={t('strainsView.addStrainModal.cbdPercent')}
                            type="number"
                            step="0.1"
                            value={values.cbd}
                            onChange={(e) =>
                                handleChange('cbd', readOptionalNumber(e.target.value))
                            }
                        />
                        <div>
                            <Input
                                label={t('strainsView.addStrainModal.thcRange')}
                                value={values.thcRange}
                                onChange={(e) => handleChange('thcRange', e.target.value)}
                                placeholder={t('strainsView.addStrainModal.thcRangePlaceholder')}
                                error={errors.thcRange}
                            />
                        </div>
                        <div>
                            <Input
                                label={t('strainsView.addStrainModal.cbdRange')}
                                value={values.cbdRange}
                                onChange={(e) => handleChange('cbdRange', e.target.value)}
                                placeholder={t('strainsView.addStrainModal.cbdRangePlaceholder')}
                                error={errors.cbdRange}
                            />
                        </div>
                    </FormSection>

                    <FormSection
                        title={t('strainsView.addStrainModal.growData')}
                        icon={<PhosphorIcons.ChartLineUp className="h-5 w-5" />}
                    >
                        <div>
                            <Input
                                label={t('strainsView.addStrainModal.floweringTimeWeeks')}
                                type="number"
                                step="0.5"
                                value={values.floweringTime}
                                onChange={(e) =>
                                    handleChange(
                                        'floweringTime',
                                        readOptionalNumber(e.target.value),
                                    )
                                }
                                error={errors.floweringTime}
                            />
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
                                    onToggle={(value) => handleChange('difficulty', value)}
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
                                    onToggle={(value) => handleChange('yield', value)}
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
                                    onToggle={(value) => handleChange('height', value)}
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
