import React, { useMemo, useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { useTranslation } from 'react-i18next'
import { PhosphorIcons } from '../icons/PhosphorIcons'
import { Language } from '@/types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { setSetting } from '@/stores/slices/settingsSlice'
import { setOnboardingStep } from '@/stores/slices/uiSlice'
import { selectOnboardingStep } from '@/stores/selectors'
import { FlagDE, FlagEN, FlagES, FlagFR, FlagNL } from '@/components/icons/Flags'
import { i18nInstance, loadLocale, SupportedLocale } from '@/i18n'
import { CannabisLeafIcon } from '../icons/CannabisLeafIcon'

// Wizard steps: 1–4 are feature slides, 5 = experience, 6 = goal, 7 = setup
const FEATURE_STEP_COUNT = 4
const TOTAL_STEPS = 7

interface OnboardingModalProps {
    onClose: () => void
}

type ExperienceLevel = 'beginner' | 'intermediate' | 'expert'
type GrowGoal = 'medical' | 'recreational' | 'hobbyist'
type SpaceSize = 'small' | 'medium' | 'large'
type Budget = 'low' | 'mid' | 'high'

function ChoiceCard({
    selected,
    onClick,
    label,
    desc,
    icon,
}: Readonly<{
    selected: boolean
    onClick: () => void
    label: string
    desc: string
    icon: React.ReactNode
}>) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full text-left flex items-center gap-3 rounded-xl border p-3 transition-all min-h-[60px] focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:outline-none ${
                selected
                    ? 'border-primary-500 bg-primary-900/40 text-slate-100'
                    : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500'
            }`}
            aria-pressed={selected}
        >
            <span className="shrink-0 text-primary-400">{icon}</span>
            <span>
                <span className="font-semibold block">{label}</span>
                <span className="text-xs text-slate-400">{desc}</span>
            </span>
            {selected && (
                <PhosphorIcons.CheckCircle
                    weight="fill"
                    className="ml-auto shrink-0 w-5 h-5 text-primary-400"
                />
            )}
        </button>
    )
}

export const OnboardingModal: React.FC<Readonly<OnboardingModalProps>> = ({ onClose }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const step = useAppSelector(selectOnboardingStep)

    const [experience, setExperience] = useState<ExperienceLevel>('beginner')
    const [growGoal, setGrowGoal] = useState<GrowGoal>('recreational')
    const [spaceSize, setSpaceSize] = useState<SpaceSize>('medium')
    const [budget, setBudget] = useState<Budget>('mid')
    const stepIndicators = useMemo(
        () => Array.from({ length: TOTAL_STEPS }, (_, idx) => idx + 1),
        [],
    )
    const getStepIndicatorClassName = (stepNumber: number): string =>
        `rounded-full transition-all duration-300 ${stepNumber === step ? 'w-2.5 h-2.5 bg-primary-400' : 'w-2 h-2 bg-slate-600'}`

    const featureSteps = useMemo(
        () => [
            {
                icon: <PhosphorIcons.Leafy className="w-16 h-16 text-primary-400" />,
                title: t('onboarding.step1.title'),
                text: t('onboarding.step1.text'),
            },
            {
                icon: <PhosphorIcons.Plant className="w-16 h-16 text-primary-400" />,
                title: t('onboarding.step2.title'),
                text: t('onboarding.step2.text'),
            },
            {
                icon: <PhosphorIcons.Wrench className="w-16 h-16 text-primary-400" />,
                title: t('onboarding.step3.title'),
                text: t('onboarding.step3.text'),
            },
            {
                icon: <PhosphorIcons.Brain className="w-16 h-16 text-primary-400" />,
                title: t('onboarding.step4.title'),
                text: t('onboarding.step4.text'),
            },
        ],
        [t],
    )

    const handleLanguageSelect = async (lang: Language) => {
        if (!i18nInstance.hasResourceBundle(lang, 'translation')) {
            const translations = await loadLocale(lang as SupportedLocale)
            i18nInstance.addResourceBundle(lang, 'translation', translations)
        }
        await i18nInstance.changeLanguage(lang)
        dispatch(setSetting({ path: 'general.language', value: lang }))
        dispatch(setOnboardingStep(1))
    }

    const handleNext = () => dispatch(setOnboardingStep(step + 1))
    const handleBack = () => dispatch(setOnboardingStep(step - 1))

    const handleFinish = () => {
        const aiTipsExperienceByLevel: Record<
            ExperienceLevel,
            'beginner' | 'intermediate' | 'advanced'
        > = {
            beginner: 'beginner',
            intermediate: 'intermediate',
            expert: 'advanced',
        }

        // Apply wizard choices to settings
        dispatch(setSetting({ path: 'simulation.simulationProfile', value: experience }))
        dispatch(
            setSetting({
                path: 'strainsView.aiTipsDefaultExperience',
                value: aiTipsExperienceByLevel[experience],
            }),
        )
        // Persist goal + space info for future AI personalisation
        try {
            localStorage.setItem('cg.onboarding.growGoal', growGoal)
        } catch {
            /* ignore */
        }
        try {
            localStorage.setItem('cg.onboarding.spaceSize', spaceSize)
        } catch {
            /* ignore */
        }
        try {
            localStorage.setItem('cg.onboarding.budget', budget)
        } catch {
            /* ignore */
        }
        onClose()
    }

    // ---- Step 0: Language picker ----
    if (step === 0) {
        return (
            <Modal
                isOpen={true}
                onClose={() => {}}
                showCloseButton={false}
                title={t('onboarding.languageTitle')}
                description={t('onboarding.languageSubtitle')}
            >
                <div className="text-center p-2">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <CannabisLeafIcon className="w-10 h-10" />
                        <h1 className="text-3xl font-bold font-display text-slate-100">
                            CannaGuide 2025
                        </h1>
                    </div>
                    <h2 className="text-xl font-bold font-display text-primary-300 mb-2">
                        Choose your language
                    </h2>
                    <p className="text-slate-400 mb-6">Select your preferred language</p>
                    <div className="grid grid-cols-2 gap-3 p-2">
                        <Button
                            onClick={() => handleLanguageSelect('de')}
                            className="flex items-center justify-center"
                            variant="secondary"
                        >
                            <FlagDE className="w-6 h-6 mr-2" />
                            Deutsch
                        </Button>
                        <Button
                            onClick={() => handleLanguageSelect('en')}
                            className="flex items-center justify-center"
                            variant="secondary"
                        >
                            <FlagEN className="w-6 h-6 mr-2" />
                            English
                        </Button>
                        <Button
                            onClick={() => handleLanguageSelect('es')}
                            className="flex items-center justify-center"
                            variant="secondary"
                        >
                            <FlagES className="w-6 h-6 mr-2" />
                            Espanol
                        </Button>
                        <Button
                            onClick={() => handleLanguageSelect('fr')}
                            className="flex items-center justify-center"
                            variant="secondary"
                        >
                            <FlagFR className="w-6 h-6 mr-2" />
                            Francais
                        </Button>
                        <Button
                            onClick={() => handleLanguageSelect('nl')}
                            className="col-span-2 flex items-center justify-center"
                            variant="secondary"
                        >
                            <FlagNL className="w-6 h-6 mr-2" />
                            Nederlands
                        </Button>
                    </div>
                </div>
            </Modal>
        )
    }

    // ---- Steps 1–4: Feature slides ----
    if (step >= 1 && step <= FEATURE_STEP_COUNT) {
        const currentStepContent = featureSteps[step - 1]
        const isLastFeatureStep = step === FEATURE_STEP_COUNT
        const footer = (
            <div className="w-full flex justify-between items-center">
                <Button variant="secondary" onClick={handleBack} disabled={step === 1}>
                    {t('common.back')}
                </Button>
                <div className="flex items-center gap-2">
                    {stepIndicators.map((stepNumber) => (
                        <div key={stepNumber} className={getStepIndicatorClassName(stepNumber)} />
                    ))}
                </div>
                <Button onClick={handleNext} glow={isLastFeatureStep}>
                    {t('common.next')}
                </Button>
            </div>
        )
        return (
            <Modal isOpen={true} onClose={() => {}} footer={footer} showCloseButton={false}>
                <div className="text-center p-4">
                    <div className="mb-4">{currentStepContent?.icon}</div>
                    <h3 className="text-2xl font-bold font-display text-slate-100 mb-2">
                        {currentStepContent?.title}
                    </h3>
                    <p className="text-slate-300">{currentStepContent?.text}</p>
                    {isLastFeatureStep && (
                        <p className="text-xs text-green-400/80 mt-4 flex items-center justify-center gap-1.5">
                            <PhosphorIcons.ShieldCheck className="w-4 h-4" />
                            {t('onboarding.localOnlyNote')}
                        </p>
                    )}
                </div>
            </Modal>
        )
    }

    // ---- Step 5: Experience level ----
    if (step === 5) {
        const expOptions: { value: ExperienceLevel; icon: React.ReactNode }[] = [
            { value: 'beginner', icon: <PhosphorIcons.Leafy className="w-6 h-6" /> },
            { value: 'intermediate', icon: <PhosphorIcons.Plant className="w-6 h-6" /> },
            { value: 'expert', icon: <PhosphorIcons.GraduationCap className="w-6 h-6" /> },
        ]
        const footer = (
            <div className="w-full flex justify-between items-center">
                <Button variant="secondary" onClick={handleBack}>
                    {t('common.back')}
                </Button>
                <div className="flex items-center gap-1.5">
                    {stepIndicators.map((stepNumber) => (
                        <div key={stepNumber} className={getStepIndicatorClassName(stepNumber)} />
                    ))}
                </div>
                <Button onClick={handleNext}>{t('common.next')}</Button>
            </div>
        )
        return (
            <Modal isOpen={true} onClose={() => {}} footer={footer} showCloseButton={false}>
                <div className="p-2 space-y-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold font-display text-slate-100">
                            {t('onboarding.wizard.stepExperience.title')}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            {t('onboarding.wizard.stepExperience.text')}
                        </p>
                    </div>
                    <div className="space-y-2">
                        {expOptions.map((opt) => (
                            <ChoiceCard
                                key={opt.value}
                                selected={experience === opt.value}
                                onClick={() => setExperience(opt.value)}
                                label={t(`onboarding.wizard.stepExperience.${opt.value}.label`)}
                                desc={t(`onboarding.wizard.stepExperience.${opt.value}.desc`)}
                                icon={opt.icon}
                            />
                        ))}
                    </div>
                </div>
            </Modal>
        )
    }

    // ---- Step 6: Grow goal ----
    if (step === 6) {
        const goalOptions: { value: GrowGoal; icon: React.ReactNode }[] = [
            { value: 'medical', icon: <PhosphorIcons.FirstAidKit className="w-6 h-6" /> },
            { value: 'recreational', icon: <PhosphorIcons.Cannabis className="w-6 h-6" /> },
            { value: 'hobbyist', icon: <PhosphorIcons.Leafy className="w-6 h-6" /> },
        ]
        const footer = (
            <div className="w-full flex justify-between items-center">
                <Button variant="secondary" onClick={handleBack}>
                    {t('common.back')}
                </Button>
                <div className="flex items-center gap-1.5">
                    {stepIndicators.map((stepNumber) => (
                        <div key={stepNumber} className={getStepIndicatorClassName(stepNumber)} />
                    ))}
                </div>
                <Button onClick={handleNext}>{t('common.next')}</Button>
            </div>
        )
        return (
            <Modal isOpen={true} onClose={() => {}} footer={footer} showCloseButton={false}>
                <div className="p-2 space-y-4">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold font-display text-slate-100">
                            {t('onboarding.wizard.stepGoal.title')}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            {t('onboarding.wizard.stepGoal.text')}
                        </p>
                    </div>
                    <div className="space-y-2">
                        {goalOptions.map((opt) => (
                            <ChoiceCard
                                key={opt.value}
                                selected={growGoal === opt.value}
                                onClick={() => setGrowGoal(opt.value)}
                                label={t(`onboarding.wizard.stepGoal.${opt.value}.label`)}
                                desc={t(`onboarding.wizard.stepGoal.${opt.value}.desc`)}
                                icon={opt.icon}
                            />
                        ))}
                    </div>
                </div>
            </Modal>
        )
    }

    // ---- Step 7: Space + Budget (last wizard step) ----
    const spaceOptions: { value: SpaceSize; icon: React.ReactNode }[] = [
        { value: 'small', icon: <PhosphorIcons.Minus className="w-6 h-6" /> },
        { value: 'medium', icon: <PhosphorIcons.Cube className="w-6 h-6" /> },
        { value: 'large', icon: <PhosphorIcons.Storefront className="w-6 h-6" /> },
    ]
    const budgetOptions: { value: Budget; label: string }[] = [
        { value: 'low', label: t('onboarding.wizard.stepSetup.budgetLow') },
        { value: 'mid', label: t('onboarding.wizard.stepSetup.budgetMid') },
        { value: 'high', label: t('onboarding.wizard.stepSetup.budgetHigh') },
    ]
    const footer = (
        <div className="w-full flex justify-between items-center">
            <Button variant="secondary" onClick={handleBack}>
                {t('common.back')}
            </Button>
            <div className="flex items-center gap-1.5">
                {stepIndicators.map((stepNumber) => (
                    <div key={stepNumber} className={getStepIndicatorClassName(stepNumber)} />
                ))}
            </div>
            <Button onClick={handleFinish} glow={true}>
                {t('onboarding.wizard.finish')}
            </Button>
        </div>
    )
    return (
        <Modal isOpen={true} onClose={() => {}} footer={footer} showCloseButton={false}>
            <div className="p-2 space-y-4">
                <div className="text-center">
                    <h3 className="text-2xl font-bold font-display text-slate-100">
                        {t('onboarding.wizard.stepSetup.title')}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                        {t('onboarding.wizard.stepSetup.text')}
                    </p>
                </div>
                <div className="space-y-2">
                    {spaceOptions.map((opt) => (
                        <ChoiceCard
                            key={opt.value}
                            selected={spaceSize === opt.value}
                            onClick={() => setSpaceSize(opt.value)}
                            label={t(`onboarding.wizard.stepSetup.${opt.value}.label`)}
                            desc={t(`onboarding.wizard.stepSetup.${opt.value}.desc`)}
                            icon={opt.icon}
                        />
                    ))}
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-300 mb-2">
                        {t('onboarding.wizard.stepSetup.budgetLabel')}
                    </p>
                    <div className="flex gap-2">
                        {budgetOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setBudget(opt.value)}
                                aria-pressed={budget === opt.value}
                                className={`flex-1 rounded-lg border py-2 px-1 text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:outline-none ${
                                    budget === opt.value
                                        ? 'border-primary-500 bg-primary-900/40 text-primary-300'
                                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    )
}
