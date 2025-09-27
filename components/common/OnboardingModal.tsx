import React from 'react';
// FIX: Changed import paths to be relative
import { Modal } from './Modal';
import { Button } from './Button';
import { useTranslations } from '../../hooks/useTranslations';
import { PhosphorIcons } from '../icons/PhosphorIcons';
import { useAppStore } from '../../stores/useAppStore';
import { Language } from '../../types';

interface OnboardingModalProps {
    onClose: () => void;
}

const icons = [
    <PhosphorIcons.Leafy className="w-16 h-16 text-primary-400" />,
    <PhosphorIcons.Plant className="w-16 h-16 text-primary-400" />,
    <PhosphorIcons.Wrench className="w-16 h-16 text-primary-400" />,
    <PhosphorIcons.GraduationCap className="w-16 h-16 text-primary-400" />,
];

const GermanFlag: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" className={className}>
        <rect width="5" height="3" fill="#FFCE00"/>
        <rect width="5" height="2" fill="#D00"/>
        <rect width="5" height="1" fill="#000"/>
    </svg>
);

const UKFlag: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className={className}>
        <clipPath id="uk-clip"><path d="M0 0v30h60V0z"/></clipPath>
        <path d="M0 0v30h60V0z" fill="#012169"/>
        <path d="M0 0l60 30m-60 0L60 0" stroke="#fff" strokeWidth="6" clipPath="url(#uk-clip)"/>
        <path d="M0 0l60 30m-60 0L60 0" stroke="#C8102E" strokeWidth="4" clipPath="url(#uk-clip)"/>
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10"/>
        <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6"/>
    </svg>
);

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const { t } = useTranslations();
    const { onboardingStep, setOnboardingStep, setSetting } = useAppStore(state => ({
        onboardingStep: state.onboardingStep,
        setOnboardingStep: state.setOnboardingStep,
        setSetting: state.setSetting,
    }));
    
    const totalSteps = 4;

    const stepsContent = [
        { title: t('onboarding.step1.title'), text: t('onboarding.step1.text') },
        { title: t('onboarding.step2.title'), text: t('onboarding.step2.text') },
        { title: t('onboarding.step3.title'), text: t('onboarding.step3.text') },
        { title: t('onboarding.step4.title'), text: t('onboarding.step4.text') },
    ];

    const handleLanguageSelect = (lang: Language) => {
        setSetting('language', lang);
        setOnboardingStep(1);
    };

    const handleNext = () => {
        if (onboardingStep < totalSteps) {
            setOnboardingStep(onboardingStep + 1);
        } else {
            setOnboardingStep(0); // Reset for next time
            onClose();
        }
    };
    
    if (onboardingStep === 0) {
        return (
             <Modal isOpen={true} onClose={() => handleLanguageSelect('en')} size="lg">
                 <div className="text-center p-6">
                    <h2 className="text-2xl font-bold font-display text-primary-300 mb-2">
                        {t('onboarding.languageTitle')}
                    </h2>
                    <p className="text-slate-300 mb-8">
                        {t('onboarding.languageSubtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={() => handleLanguageSelect('de')} className="flex flex-col items-center gap-3 p-6 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all border-2 border-transparent hover:border-primary-500 w-full">
                           <GermanFlag className="w-12 h-8 rounded-sm shadow-md" />
                           <span className="font-bold text-lg">{t('onboarding.german')}</span>
                        </button>
                         <button onClick={() => handleLanguageSelect('en')} className="flex flex-col items-center gap-3 p-6 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all border-2 border-transparent hover:border-primary-500 w-full">
                            <UKFlag className="w-12 h-8 rounded-sm shadow-md" />
                           <span className="font-bold text-lg">{t('onboarding.english')}</span>
                        </button>
                    </div>
                </div>
             </Modal>
        );
    }

    return (
        <Modal isOpen={true} onClose={onClose} size="lg">
            <div className="text-center p-6">
                <div className="mx-auto mb-6 flex items-center justify-center h-24">
                    {icons[onboardingStep - 1]}
                </div>
                
                <h2 className="text-2xl font-bold font-display text-primary-300 mb-2">
                    {stepsContent[onboardingStep - 1].title}
                </h2>
                <p className="text-slate-300 mb-8">
                    {stepsContent[onboardingStep - 1].text}
                </p>

                <div className="flex justify-center items-center gap-2 mb-8">
                    {[...Array(totalSteps)].map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i + 1 === onboardingStep ? 'bg-primary-400' : 'bg-slate-600'}`}></div>
                    ))}
                </div>

                <Button onClick={handleNext} className="w-full">
                    {onboardingStep < totalSteps ? t('common.next') : t('onboarding.startGrow')}
                </Button>
            </div>
        </Modal>
    );
};
