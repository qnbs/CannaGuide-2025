import React, { useMemo } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '../icons/PhosphorIcons';
// FIX: Corrected import path for types to use the '@/' alias.
import { Language } from '@/types';
// FIX: Corrected import path for Redux store to use the '@/' alias.
import { useAppDispatch, useAppSelector } from '@/stores/store';
// FIX: Corrected imports for Redux actions and selectors.
import { setSetting } from '@/stores/slices/settingsSlice';
import { setOnboardingStep } from '@/stores/slices/uiSlice';
import { selectOnboardingStep } from '@/stores/selectors';
import { FlagDE, FlagEN } from '@/components/icons/Flags';
import { i18nInstance } from '@/i18n';


interface OnboardingModalProps {
    onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const step = useAppSelector(selectOnboardingStep);
    
    const steps = useMemo(() => [
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
    ], [t]);

    const handleLanguageSelect = async (lang: Language) => {
        // Explicitly await the language change before proceeding
        await i18nInstance.changeLanguage(lang);
        dispatch(setSetting({ path: 'language', value: lang }));
        dispatch(setOnboardingStep(1));
    };

    const handleNext = () => dispatch(setOnboardingStep(step + 1));
    const handleBack = () => dispatch(setOnboardingStep(step - 1));

    if (step === 0) {
        return (
            <Modal isOpen={true} onClose={() => {}} title="Choose your language / Sprache wählen">
                <div className="text-center">
                    <p className="text-slate-400 mb-6">Select your preferred language / Wähle deine bevorzugte Sprache</p>
                    <div className="flex gap-4">
                        <Button onClick={() => handleLanguageSelect('de')} className="flex-1 flex items-center justify-center">
                            <FlagDE className="w-6 h-6 mr-2" />
                            Deutsch
                        </Button>
                        <Button onClick={() => handleLanguageSelect('en')} className="flex-1 flex items-center justify-center">
                            <FlagEN className="w-6 h-6 mr-2" />
                            English
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }

    const currentStepContent = steps[step - 1];
    const isLastStep = step === steps.length;

    const footer = (
        <div className="w-full flex justify-between items-center">
            <Button variant="secondary" onClick={handleBack} disabled={step === 1}>{t('common.back')}</Button>
            <div className="flex items-center gap-2">
                {[...Array(steps.length)].map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i === step - 1 ? 'bg-primary-400' : 'bg-slate-600'}`}></div>
                ))}
            </div>
            <Button onClick={isLastStep ? onClose : handleNext}>
                {isLastStep ? t('onboarding.startGrow') : t('common.next')}
            </Button>
        </div>
    );
    
    return (
        <Modal isOpen={true} onClose={isLastStep ? onClose : () => {}} footer={footer}>
            <div className="text-center p-4">
                <div className="mb-4">{currentStepContent.icon}</div>
                <h3 className="text-2xl font-bold font-display text-slate-100 mb-2">{currentStepContent.title}</h3>
                <p className="text-slate-300">{currentStepContent.text}</p>
            </div>
        </Modal>
    );
};