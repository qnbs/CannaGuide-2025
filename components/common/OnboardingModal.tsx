import React, { useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslations } from '@/hooks/useTranslations';
import { useSettings } from '@/hooks/useSettings';
import { Language } from '@/types';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface OnboardingModalProps {
    onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const { t } = useTranslations();
    const { setSetting } = useSettings();
    const modalRef = useFocusTrap(true);

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
            icon: <PhosphorIcons.Flask className="w-16 h-16 text-primary-400" />,
            title: t('onboarding.step3.title'),
            text: t('onboarding.step3.text'),
        },
        {
            icon: <PhosphorIcons.GraduationCap className="w-16 h-16 text-primary-400" />,
            title: t('onboarding.step4.title'),
            text: t('onboarding.step4.text'),
        },
    ], [t]);

    const handleLanguageSelect = (lang: Language) => {
        setSetting('language', lang);
        setCurrentStep(1);
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };
    
    const step = currentStep > 0 ? steps[currentStep - 1] : null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[999] p-4 modal-overlay-animate">
            <Card ref={modalRef} className="w-full max-w-lg text-center modal-content-animate">
                {currentStep === 0 ? (
                    <div>
                        <PhosphorIcons.Globe className="w-16 h-16 text-primary-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold font-display text-primary-300 mb-2">Choose your language / Sprache wählen</h2>
                        <p className="text-slate-300 mb-6">Select your preferred language to continue.</p>
                        <div className="flex gap-4 justify-center">
                            <Button size="lg" onClick={() => handleLanguageSelect('de')}>Deutsch</Button>
                            <Button size="lg" onClick={() => handleLanguageSelect('en')}>English</Button>
                        </div>
                    </div>
                ) : step ? (
                    <>
                        <div className="flex flex-col items-center">
                            <div className="mb-4">{step.icon}</div>
                            <h2 className="text-2xl font-bold font-display text-primary-300 mb-2">{step.title}</h2>
                            <p className="text-slate-300 mb-6">{step.text}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex gap-2">
                                {steps.map((_, index) => (
                                    <div key={index} className={`w-3 h-3 rounded-full transition-colors ${index === currentStep - 1 ? 'bg-primary-500' : 'bg-slate-700'}`}></div>
                                ))}
                            </div>
                            <Button onClick={handleNext}>
                                {currentStep < steps.length ? t('common.next') : t('common.start')}
                            </Button>
                        </div>
                    </>
                ) : null}
            </Card>
        </div>
    );
};