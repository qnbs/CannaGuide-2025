import React, { useEffect, useMemo } from 'react'
import { Strain, StrainType } from '@/types'
import { Button } from '@/components/common/Button'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
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

const BannerCopy: React.FC<{ title: string; body: string }> = ({ title, body }) => (
    <div>
        <div className="surface-badge mb-3 text-2xs font-semibold uppercase tracking-[0.24em] text-primary-200">
            <PhosphorIcons.Flask className="h-3.5 w-3.5" />
            {title}
        </div>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">{body}</p>
    </div>
)

const StrainFormBanner: React.FC<{
    isEditMode: boolean
    values: StrainFormValues
    aromas: string[]
    terpenes: string[]
}> = ({ isEditMode, values, aromas, terpenes }) => {
    const { t } = useTranslation()
    const title = isEditMode
        ? t('strainsView.addStrainModal.editTitle')
        : t('strainsView.addStrainModal.title')
    return (
        <Card className="overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(14,116,144,0.18),rgba(15,23,42,0.92))] !p-0">
            <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.9fr)] lg:items-start">
                <BannerCopy title={title} body={t('strainsView.addStrainModal.description')} />
                <DraftPreview values={values} aromas={aromas} terpenes={terpenes} />
            </div>
        </Card>
    )
}

const GrowChoiceGrid: React.FC<{
    values: StrainFormValues
    onChange: (key: 'difficulty' | 'yield' | 'height', value: string) => void
}> = ({ values, onChange }) => {
    const { t } = useTranslation()
    return (
        <div className="grid gap-4 sm:col-span-2 lg:grid-cols-3">
            <div>
                <p className="mb-2 text-sm font-semibold text-slate-300">
                    {t('strainsView.table.difficulty')}
                </p>
                <SegmentedControl
                    aria-label={t('strainsView.table.difficulty')}
                    value={choiceValue(values.difficulty)}
                    onToggle={(value) =>
                        onChange('difficulty', nextChoice(values.difficulty, value))
                    }
                    options={[
                        { value: 'Easy', label: t('strainsView.difficulty.easy') },
                        { value: 'Medium', label: t('strainsView.difficulty.medium') },
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
                    value={choiceValue(values.yield)}
                    onToggle={(value) => onChange('yield', nextChoice(values.yield, value))}
                    options={[
                        { value: 'Low', label: t('strainsView.addStrainModal.yields.low') },
                        { value: 'Medium', label: t('strainsView.addStrainModal.yields.medium') },
                        { value: 'High', label: t('strainsView.addStrainModal.yields.high') },
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
                    value={choiceValue(values.height)}
                    onToggle={(value) => onChange('height', nextChoice(values.height, value))}
                    options={[
                        { value: 'Short', label: t('strainsView.addStrainModal.heights.short') },
                        { value: 'Medium', label: t('strainsView.addStrainModal.heights.medium') },
                        { value: 'Tall', label: t('strainsView.addStrainModal.heights.tall') },
                    ]}
                    className="grid grid-cols-3"
                />
            </div>
        </div>
    )
}

type StrainFieldChange = <K extends keyof StrainFormValues>(
    key: K,
    value: StrainFormValues[K],
) => void

const choiceValue = (current: string): string[] => (current === '' ? [] : [current])

const nextChoice = (current: string, picked: string): string => (current === picked ? '' : picked)

type StrainFieldErrors = Partial<Record<keyof StrainFormValues, string>>

type StrainTypeOption = { value: StrainType; label: string; icon: React.ReactNode }

const GeneralInfoSection: React.FC<{
    values: StrainFormValues
    errors: StrainFieldErrors
    typeOptions: StrainTypeOption[]
    onChange: StrainFieldChange
}> = ({ values, errors, typeOptions, onChange }) => {
    const { t } = useTranslation()
    return (
        <FormSection
            title={t('strainsView.addStrainModal.generalInfo')}
            defaultOpen
            icon={<PhosphorIcons.Question className="h-5 w-5" />}
        >
            <div className="sm:col-span-2">
                <Input
                    label={`${t('strainsView.addStrainModal.strainName')} *`}
                    value={values.name}
                    onChange={(e) => onChange('name', e.target.value)}
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
                    value={choiceValue(values.type)}
                    onToggle={(value) => onChange('type', nextChoice(values.type, value))}
                    options={typeOptions}
                    buttonClassName="min-h-11"
                />
            </div>
            <Input
                label={t('common.typeDetails')}
                value={values.typeDetails}
                onChange={(e) => onChange('typeDetails', e.target.value)}
                placeholder={t('strainsView.addStrainModal.typeDetailsPlaceholder')}
            />
            <Input
                label={t('common.genetics')}
                value={values.genetics}
                onChange={(e) => onChange('genetics', e.target.value)}
                placeholder={t('strainsView.addStrainModal.geneticsPlaceholder')}
            />
            <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-semibold text-slate-300">
                    {t('strainsView.addStrainModal.floweringTypeLegend')}
                </p>
                <SegmentedControl
                    aria-label={t('strainsView.addStrainModal.floweringTypeLegend')}
                    value={choiceValue(values.floweringType)}
                    onToggle={(value) =>
                        onChange('floweringType', nextChoice(values.floweringType, value))
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
    )
}

const CannabinoidSection: React.FC<{
    values: StrainFormValues
    errors: StrainFieldErrors
    onChange: StrainFieldChange
}> = ({ values, errors, onChange }) => {
    const { t } = useTranslation()
    return (
        <FormSection
            title={t('strainsView.addStrainModal.cannabinoids')}
            icon={<PhosphorIcons.Drop className="h-5 w-5" />}
        >
            <Input
                label={t('strainsView.addStrainModal.thcPercent')}
                type="number"
                step="0.1"
                value={values.thc}
                onChange={(e) => onChange('thc', readOptionalNumber(e.target.value))}
                error={errors.thc}
            />
            <Input
                label={t('strainsView.addStrainModal.cbdPercent')}
                type="number"
                step="0.1"
                value={values.cbd}
                onChange={(e) => onChange('cbd', readOptionalNumber(e.target.value))}
            />
            <Input
                label={t('strainsView.addStrainModal.thcRange')}
                value={values.thcRange}
                onChange={(e) => onChange('thcRange', e.target.value)}
                placeholder={t('strainsView.addStrainModal.thcRangePlaceholder')}
                error={errors.thcRange}
            />
            <Input
                label={t('strainsView.addStrainModal.cbdRange')}
                value={values.cbdRange}
                onChange={(e) => onChange('cbdRange', e.target.value)}
                placeholder={t('strainsView.addStrainModal.cbdRangePlaceholder')}
                error={errors.cbdRange}
            />
        </FormSection>
    )
}

const GrowDataSection: React.FC<{
    values: StrainFormValues
    errors: StrainFieldErrors
    onChange: StrainFieldChange
}> = ({ values, errors, onChange }) => {
    const { t } = useTranslation()
    return (
        <FormSection
            title={t('strainsView.addStrainModal.growData')}
            icon={<PhosphorIcons.ChartLineUp className="h-5 w-5" />}
        >
            <Input
                label={t('strainsView.addStrainModal.floweringTimeWeeks')}
                type="number"
                step="0.5"
                value={values.floweringTime}
                onChange={(e) => onChange('floweringTime', readOptionalNumber(e.target.value))}
                error={errors.floweringTime}
            />
            <Input
                label={t('strainsView.addStrainModal.floweringTimeRange')}
                value={values.floweringTimeRange}
                onChange={(e) => onChange('floweringTimeRange', e.target.value)}
                placeholder={t('strainsView.addStrainModal.floweringTimeRangePlaceholder')}
            />
            <GrowChoiceGrid values={values} onChange={(key, value) => onChange(key, value)} />
            <Input
                label={t('strainsView.strainModal.yieldIndoor')}
                value={values.yieldIndoor}
                onChange={(e) => onChange('yieldIndoor', e.target.value)}
                placeholder={t('strainsView.addStrainModal.yieldIndoorPlaceholder')}
            />
            <Input
                label={t('strainsView.strainModal.yieldOutdoor')}
                value={values.yieldOutdoor}
                onChange={(e) => onChange('yieldOutdoor', e.target.value)}
                placeholder={t('strainsView.addStrainModal.yieldOutdoorPlaceholder')}
            />
            <Input
                label={t('strainsView.strainModal.heightIndoor')}
                value={values.heightIndoor}
                onChange={(e) => onChange('heightIndoor', e.target.value)}
                placeholder={t('strainsView.addStrainModal.heightIndoorPlaceholder')}
            />
            <Input
                label={t('strainsView.strainModal.heightOutdoor')}
                value={values.heightOutdoor}
                onChange={(e) => onChange('heightOutdoor', e.target.value)}
                placeholder={t('strainsView.addStrainModal.heightOutdoorPlaceholder')}
            />
        </FormSection>
    )
}

const ProfileSection: React.FC<{
    values: StrainFormValues
    onChange: StrainFieldChange
}> = ({ values, onChange }) => {
    const { t } = useTranslation()
    return (
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
                    onChange={(e) => onChange('description', e.target.value)}
                />
            </div>
            <Input
                label={t('strainsView.strainModal.aromas')}
                value={values.aromasString}
                onChange={(e) => onChange('aromasString', e.target.value)}
                placeholder={t('strainsView.addStrainModal.aromasPlaceholder')}
            />
            <Input
                label={t('strainsView.strainModal.dominantTerpenes')}
                value={values.terpenesString}
                onChange={(e) => onChange('terpenesString', e.target.value)}
                placeholder={t('strainsView.addStrainModal.terpenesPlaceholder')}
            />
        </FormSection>
    )
}

const AddStrainFormBody: React.FC<{
    isEditMode: boolean
    values: StrainFormValues
    errors: StrainFieldErrors
    aromas: string[]
    terpenes: string[]
    typeOptions: StrainTypeOption[]
    onChange: StrainFieldChange
}> = ({ isEditMode, values, errors, aromas, terpenes, typeOptions, onChange }) => (
    <div className="space-y-5 pb-4">
        <StrainFormBanner
            isEditMode={isEditMode}
            values={values}
            aromas={aromas}
            terpenes={terpenes}
        />
        <GeneralInfoSection
            values={values}
            errors={errors}
            typeOptions={typeOptions}
            onChange={onChange}
        />
        <CannabinoidSection values={values} errors={errors} onChange={onChange} />
        <GrowDataSection values={values} errors={errors} onChange={onChange} />
        <ProfileSection values={values} onChange={onChange} />
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
            <Button type="submit" form="add-strain-form" glow className="min-h-11 w-full sm:w-auto">
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
                <AddStrainFormBody
                    isEditMode={isEditMode}
                    values={values}
                    errors={errors}
                    aromas={parsedAromas}
                    terpenes={parsedTerpenes}
                    typeOptions={typeOptions}
                    onChange={handleChange}
                />
            </form>
        </Modal>
    )
}
