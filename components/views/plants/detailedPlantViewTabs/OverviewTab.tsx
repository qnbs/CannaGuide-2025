import React, { useState, useEffect, useCallback } from 'react';
import { Plant, AIResponse } from '../../../../types';
import { Card } from '../../../common/Card';
import { PlantVisual } from '../PlantVisual';
import { PhosphorIcons } from '../../../icons/PhosphorIcons';
import { geminiService } from '../../../../services/geminiService';
import { SkeletonLoader } from '../../../common/SkeletonLoader';
import { PLANT_STAGE_DETAILS } from '../../../../constants';
import { HistoryChart } from '../HistoryChart';
import { PlantLifecycleTimeline } from '../PlantLifecycleTimeline';
import { useTranslations } from '../../../../hooks/useTranslations';

interface OverviewTabProps {
    plant: Plant;
}

const VitalStat: React.FC<{ label: string, value: number, unit: string, idealMin: number, idealMax: number, color: string }> = ({ label, value, unit, idealMin, idealMax, color }) => {
    const isIdeal = value >= idealMin && value <= idealMax;
    const percentage = Math.min(100, Math.max(0, (value / (idealMax * 1.5)) * 100)); // Simple scale
    
    return (
        <div>
            <div className="flex justify-between items-baseline mb-1">
                <span className="font-semibold text-slate-200">{label}</span>
                <span className={`font-mono text-lg ${isIdeal ? 'text-green-500' : 'text-amber-500'}`}>{value.toFixed(2)}<span className="text-sm ml-1">{unit}</span></span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all duration-300 ${color}`} style={{ width: `${percentage}%` }}></div>
                <div className="relative h-0">
                    <div className="absolute top-[-4px] h-4 w-0.5 bg-slate-500" style={{ left: `${(idealMin / (idealMax * 1.5)) * 100}%` }} title={`Min: ${idealMin}`}></div>
                    <div className="absolute top-[-4px] h-4 w-0.5 bg-slate-500" style={{ left: `${(idealMax / (idealMax * 1.5)) * 100}%` }} title={`Max: ${idealMax}`}></div>
                </div>
            </div>
        </div>
    );
};

const ProactiveAITipCard: React.FC<{ plant: Plant }> = ({ plant }) => {
    const { t, locale } = useTranslations();
    const [aiTip, setAiTip] = useState<AIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTip = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const tip = await geminiService.getProactiveTip(
                plant,
                t('plantsView.detailedView.aiTip'),
                t('plantsView.detailedView.aiTipError'),
                locale
            );
            setAiTip(tip);
        } catch (e) {
            console.error("Failed to fetch proactive tip:", e);
            setError(t('plantsView.detailedView.aiTipError'));
        } finally {
            setIsLoading(false);
        }
    }, [plant, t, locale]);

    useEffect(() => {
        fetchTip();
    }, [fetchTip]);

    return (
        <Card className="bg-amber-500/10 border-l-4 border-amber-400">
            <h4 className="font-bold text-amber-200 flex justify-between items-center">
                <span>{t('plantsView.detailedView.aiTip')}</span>
                <button onClick={fetchTip} disabled={isLoading} className="p-1 rounded-full hover:bg-amber-400/20" aria-label="Refresh tip">
                    <PhosphorIcons.ArrowClockwise className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </h4>
            {isLoading && <SkeletonLoader count={2} className="h-3" />}
            {error && <p className="text-amber-300 text-sm">{error}</p>}
            {aiTip && !isLoading && !error && <p className="text-amber-300 text-sm" dangerouslySetInnerHTML={{ __html: aiTip.content }}></p>}
        </Card>
    );
};

export const OverviewTab: React.FC<OverviewTabProps> = ({ plant }) => {
    const { t } = useTranslations();
    const idealVitals = PLANT_STAGE_DETAILS[plant.stage].idealVitals;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-6">
                <Card>
                     <div className="h-64 flex items-center justify-center">
                        <PlantVisual stage={plant.stage} age={plant.age} stress={plant.stressLevel} water={plant.vitals.substrateMoisture}/>
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-lg font-bold mb-3">{t('plantsView.detailedView.vitals')}</h3>
                    <div className="space-y-4">
                       <VitalStat label={t('plantsView.detailedView.ph')} value={plant.vitals.ph} unit="" idealMin={idealVitals.ph.min} idealMax={idealVitals.ph.max} color="bg-green-500" />
                       <VitalStat label={t('plantsView.detailedView.ec')} value={plant.vitals.ec} unit=" mS/cm" idealMin={idealVitals.ec.min} idealMax={idealVitals.ec.max} color="bg-amber-500" />
                       <VitalStat label={t('plantsView.detailedView.moisture')} value={plant.vitals.substrateMoisture} unit="%" idealMin={30} idealMax={80} color="bg-accent-500" />
                       <VitalStat label={t('plantsView.detailedView.stress')} value={plant.stressLevel} unit="%" idealMin={0} idealMax={20} color="bg-red-500" />
                    </div>
                </Card>
                <ProactiveAITipCard plant={plant} />
            </div>
            <div className="lg:col-span-2 flex flex-col gap-6">
                <Card>
                    <PlantLifecycleTimeline currentStage={plant.stage} currentAge={plant.age} />
                </Card>
                <Card>
                    <h3 className="text-lg font-bold mb-3">{t('plantsView.detailedView.history')}</h3>
                    <div className="h-64">
                        <HistoryChart history={plant.history} />
                    </div>
                </Card>
            </div>
        </div>
    );
};
