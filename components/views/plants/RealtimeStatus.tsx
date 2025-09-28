import React, { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Card } from '@/components/common/Card';

interface RealtimeStatusProps {
    createdAt: number;
    isSimulationActive: boolean;
}

const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
};

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ createdAt, isSimulationActive }) => {
    const { t } = useTranslations();
    const [duration, setDuration] = useState(formatDuration(Date.now() - createdAt));

    useEffect(() => {
        const timer = setInterval(() => {
            setDuration(formatDuration(Date.now() - createdAt));
        }, 1000);
        return () => clearInterval(timer);
    }, [createdAt]);

    return (
        <Card className="h-full">
            <h3 className="text-xl font-bold font-display text-primary-400 mb-3">{t('plantsView.detailedView.status.title')}</h3>
            <div className="text-center">
                <div className="font-mono text-3xl font-bold tracking-widest text-slate-100">
                    <span>{String(duration.days).padStart(2, '0')}</span>:
                    <span>{String(duration.hours).padStart(2, '0')}</span>:
                    <span>{String(duration.minutes).padStart(2, '0')}</span>:
                    <span className="text-2xl text-slate-300">{String(duration.seconds).padStart(2, '0')}</span>
                </div>
                <div className="flex justify-center gap-x-6 text-xs text-slate-400 mt-1">
                    <span>{t('common.units.days')}</span>
                    <span>{t('common.units.hours')}</span>
                    <span>{t('common.units.minutes')}</span>
                    <span>{t('common.units.seconds')}</span>
                </div>
            </div>
            {isSimulationActive && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-400">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    {t('plantsView.detailedView.status.syncActive')}
                </div>
            )}
        </Card>
    );
};
