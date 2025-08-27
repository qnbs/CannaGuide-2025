import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { PhosphorIcons } from '../icons/PhosphorIcons';

interface OnboardingModalProps {
    onClose: () => void;
}

const steps = [
    {
        icon: <PhosphorIcons.Leafy className="w-16 h-16 text-primary-400" />,
        title: 'Willkommen beim Grow Guide!',
        text: 'Entdecke hunderte von Sorten. Finde die perfekte Genetik für deine Bedürfnisse und speichere deine Favoriten.',
    },
    {
        icon: <PhosphorIcons.Plant className="w-16 h-16 text-primary-400" />,
        title: 'Verfolge deine Pflanzen',
        text: 'Starte einen virtuellen Anbau, verfolge das Wachstum deiner Pflanzen, protokolliere Maßnahmen und reagiere auf ihre Bedürfnisse.',
    },
    {
        icon: <PhosphorIcons.Flask className="w-16 h-16 text-primary-400" />,
        title: 'Plane deine Ausrüstung',
        text: 'Nutze den Setup-Konfigurator und praktische Rechner, um deine ideale Ausrüstung zu finden, egal ob Anfänger oder Profi.',
    },
    {
        icon: <PhosphorIcons.GraduationCap className="w-16 h-16 text-primary-400" />,
        title: 'Lerne & Wachse',
        text: 'Folge der interaktiven Anleitung, um die Grundlagen des Anbaus zu meistern und deinen Wissensfortschritt zu verfolgen.',
    },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

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
                        {currentStep < steps.length - 1 ? 'Weiter' : 'Los geht\'s!'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};