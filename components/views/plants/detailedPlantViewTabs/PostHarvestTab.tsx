import React from 'react';
import { Plant } from '@/types';
import { Card } from '@/components/common/Card';
import { useTranslations } from '@/hooks/useTranslations';
import { Button } from '@/components/common/Button';
import { useAppDispatch } from '@/stores/store';
import { processPostHarvest as processPostHarvestAction } from '@/stores/slices/simulationSlice';

interface PostHarvestTabProps {
    plant: Plant;
}

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = Math.min(100, (value / max) * 100);
    return (
        <div className="w-full bg-slate-700 rounded-full h-4">
            <div
                className="bg-primary-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

export const PostHarvestTab: React.FC<PostHarvestTabProps> = ({ plant }) => {
    const { t } = useTranslations();
    const dispatch = useAppDispatch();
    const postHarvestData = plant.postHarvest;

    if (!postHarvestData) {
        return <Card><p>{t('common.error')}</p></Card>;
    }

    const handleSimulateNextDay = (action: 'dry' | 'cure' | 'burp' = 'dry') => {
        dispatch(processPostHarvestAction({ plantId: plant.id, action }));
    };

    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('plantsView.postHarvest.title')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Drying Section */}
                    <div className={`space-y-4 p-4 rounded-lg ${plant.stage === 'DRYING' ? 'bg-slate-800' : 'bg-slate-800/50 opacity-60'}`}>
                        <h4 className="font-bold text-lg">{t('plantsView.postHarvest.drying')}</h4>
                        <div>
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-sm font-semibold">{t('plantsView.postHarvest.dryingProgress')}</span>
                                <span className="text-sm">{t('plantsView.postHarvest.days_other', { count: postHarvestData.currentDryDay })} / 10</span>
                            </div>
                            <ProgressBar value={postHarvestData.currentDryDay} max={10} />
                        </div>
                         <Button onClick={() => handleSimulateNextDay('dry')} disabled={plant.stage !== 'DRYING'} className="w-full">
                            {t('plantsView.postHarvest.simulateNextDay')}
                        </Button>
                    </div>

                    {/* Curing Section */}
                     <div className={`space-y-4 p-4 rounded-lg ${plant.stage === 'CURING' ? 'bg-slate-800' : 'bg-slate-800/50 opacity-60'}`}>
                        <h4 className="font-bold text-lg">{t('plantsView.postHarvest.curing')}</h4>
                        <div>
                           <div className="flex justify-between items-baseline mb-1">
                                <span className="text-sm font-semibold">{t('plantsView.postHarvest.curingProgress')}</span>
                                <span className="text-sm">{t('plantsView.postHarvest.days_other', { count: postHarvestData.currentCureDay })} / 21</span>
                            </div>
                             <ProgressBar value={postHarvestData.currentCureDay} max={21} />
                        </div>
                        <div className="flex justify-between items-center bg-slate-700/50 p-2 rounded-md">
                            <span className="text-sm font-semibold">{t('plantsView.postHarvest.jarHumidity')}:</span>
                            <span className="font-mono font-bold">{postHarvestData.jarHumidity.toFixed(1)}%</span>
                        </div>
                         <div className="flex gap-2">
                             <Button onClick={() => handleSimulateNextDay('cure')} disabled={plant.stage !== 'CURING'} className="w-full">
                                {t('plantsView.postHarvest.simulateNextDay')}
                            </Button>
                            <Button onClick={() => handleSimulateNextDay('burp')} disabled={plant.stage !== 'CURING'} variant="secondary" className="w-full">
                                {t('plantsView.postHarvest.burpJars')}
                            </Button>
                         </div>
                    </div>
                </div>

                 <div className="mt-6 text-center">
                    <p className="text-slate-400 uppercase text-sm font-semibold">{t('plantsView.postHarvest.finalQuality')}</p>
                    <p className="text-5xl font-bold text-primary-300 my-2">{postHarvestData.finalQuality.toFixed(1)} <span className="text-3xl">%</span></p>
                </div>
            </Card>
        </div>
    );
};
