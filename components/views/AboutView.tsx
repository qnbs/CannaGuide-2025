import React from 'react';
import { Card } from '../common/Card';
import { useTranslations } from '../../hooks/useTranslations';

export const AboutView: React.FC = () => {
    const { t } = useTranslations();

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-primary-600 dark:text-primary-400">{t('about.title')}</h1>
            <Card>
                <div className="space-y-4 text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">{t('about.appName')}</h2>
                        <span className="text-sm font-mono bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{t('about.appVersion')}</span>
                    </div>
                    <p>{t('about.description')}</p>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">{t('about.creditsTitle')}</h3>
                        <p>{t('about.creditsText')}</p>
                    </div>

                    <div>
                         <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">{t('about.privacyTitle')}</h3>
                        <p>{t('about.privacyText')}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};