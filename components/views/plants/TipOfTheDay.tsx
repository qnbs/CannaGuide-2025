import React, { useState, useEffect, useMemo, memo } from 'react';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';

export const TipOfTheDay: React.FC = memo(() => {
    const { t } = useTranslation();
    const [tip, setTip] = useState('');

    const allTips = useMemo(() => {
        const tipsOrKey = t('tipOfTheDay.tips', { returnObjects: true });
        return Array.isArray(tipsOrKey) ? tipsOrKey : [];
    }, [t]);

    useEffect(() => {
        if (allTips.length > 0) {
            const randomIndex = Math.floor(Math.random() * allTips.length);
            setTip(allTips[randomIndex]);
        }
    }, [allTips]);

    if (!tip) {
        return null;
    }

    return (
        <Card className="bg-primary-500/10 border-l-4 border-primary-400">
            <h3 className="font-bold text-primary-200 flex items-center gap-2 mb-2">
                <PhosphorIcons.LightbulbFilament className="w-5 h-5" />
                {t('tipOfTheDay.title')}
            </h3>
            <p className="text-primary-300 text-sm">{tip}</p>
        </Card>
    );
});