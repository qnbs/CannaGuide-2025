import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { useTranslations } from '../../hooks/useTranslations';

interface OnboardingModalProps {
    onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const { t } = useTranslations();

    const steps = [
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
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };
    
    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
            <Card className="w-full max-w-lg text-center">
                <div className="flex flex-col items-center">
                    <div className="mb-4">{step.icon}</div>
                    <h2 className="text-2xl font-bold text-primary-500 dark:text-primary-300 mb-2">{step.title}</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">{step.text}</p>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                        {steps.map((_, index) => (
                            <div key={index} className={`w-3 h-3 rounded-full transition-colors ${index === currentStep ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                        ))}
                    </div>
                    <Button onClick={handleNext}>
                        {currentStep < steps.length - 1 ? t('common.next') : t('common.start')}
                    </Button>
                </div>
            </Card>
        </div>
    );
};