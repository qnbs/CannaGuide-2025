import React, { useState, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface RealtimeStatusProps {
    createdAt: number;
}

const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return { days, hours, minutes };
};

export const RealtimeStatus: React.FC<RealtimeStatusProps> = memo(({ createdAt }) => {
    const { t } = useTranslation();
    const [age, setAge] = useState(formatDuration(Date.now() - createdAt));

    useEffect(() => {
        const interval = setInterval(() => {
            setAge(formatDuration(Date.now() - createdAt));
        }, 1000 * 60); // Update every minute

        return () => clearInterval(interval);
    }, [createdAt]);

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-3">{t('plantsView.detailedView.status.title')}</h3>
            <div className="p-3 bg-slate-800/50 rounded-lg">
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-300">{t('plantsView.plantCard.day')}</span>
                        <span className="font-mono text-slate-100">{age.days + 1}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-300">{t('common.units.hours')}</span>
                        <span className="font-mono text-slate-100">{age.hours}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-300">{t('common.units.minutes')}</span>
                        <span className="font-mono text-slate-100">{age.minutes}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-700/50">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-300">{t('plantsView.detailedView.status.syncActive')}</span>
                            <div className="flex items-center gap-1 text-green-400">
                                <PhosphorIcons.CheckCircle weight="fill" />
                                <span>On</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
});