import React from 'react';
import { Plant, PlantStage } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAppDispatch } from '@/stores/store';
import { processPostHarvest } from '@/stores/slices/simulationSlice';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';

interface PostHarvestTabProps {
    plant: Plant;
}

const ProgressBar: React.FC<{ label: string; progress: number }> = ({ label, progress }) => (
    <div>
        <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-slate-300">{label}</span>
            <span className="text-sm font-medium text-slate-300">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
    </div>
);

export const PostHarvestTab: React.FC<PostHarvestTabProps> = ({ plant }) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const harvestData = plant.harvestData;
    const isFinished = plant.stage === PlantStage.Finished;

    if (!harvestData) {
        return <Card><p>{t('common.error')}</p></Card>;
    }

    const dryingProgress = (harvestData.currentDryDay / PLANT_STAGE_DETAILS[PlantStage.Drying].duration) * 100;
    const curingProgress = (harvestData.currentCureDay / PLANT_STAGE_DETAILS[PlantStage.Curing].duration) * 100;

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('plantsView.postHarvest.title')}</h3>
            
            {isFinished ? (
                 <div className="text-center p-8 bg-slate-800 rounded-lg">
                    <h4 className="text-2xl font-bold text-green-400">{t('plantsView.postHarvest.processComplete')}</h4>
                    <p className="text-lg mt-2">{t('plantsView.postHarvest.finalQuality')}: <span className="font-bold">{harvestData.finalQuality.toFixed(1)}/100</span></p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-4 rounded-lg ${plant.stage === PlantStage.Drying ? 'bg-slate-800' : 'bg-slate-800/50 opacity-70'}`}>
                        <h4 className="font-bold text-lg text-slate-100 mb-3">{t('plantsView.postHarvest.drying')}</h4>
                        <ProgressBar label={t('plantsView.postHarvest.dryingProgress')} progress={dryingProgress} />
                        <p className="text-sm text-slate-400 mt-2">{t('plantsView.postHarvest.day')} {harvestData.currentDryDay} / {PLANT_STAGE_DETAILS[PlantStage.Drying].duration}</p>
                        <Button
                            size="sm"
                            className="w-full mt-4"
                            onClick={() => dispatch(processPostHarvest({ plantId: plant.id, action: 'dry' }))}
                            disabled={plant.stage !== PlantStage.Drying}
                        >
                            {t('plantsView.postHarvest.simulateNextDay')}
                        </Button>
                    </div>

                    <div className={`p-4 rounded-lg ${plant.stage === PlantStage.Curing ? 'bg-slate-800' : 'bg-slate-800/50 opacity-70'}`}>
                        <h4 className="font-bold text-lg text-slate-100 mb-3">{t('plantsView.postHarvest.curing')}</h4>
                        <ProgressBar label={t('plantsView.postHarvest.curingProgress')} progress={curingProgress} />
                        <p className="text-sm text-slate-400 mt-2">{t('plantsView.postHarvest.day')} {harvestData.currentCureDay} / {PLANT_STAGE_DETAILS[PlantStage.Curing].duration}</p>
                        <p className="text-sm text-slate-300 mt-2">{t('plantsView.postHarvest.jarHumidity')}: <span className="font-bold">{harvestData.jarHumidity.toFixed(1)}%</span></p>
                        <div className="flex gap-2 mt-4">
                             <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1"
                                onClick={() => dispatch(processPostHarvest({ plantId: plant.id, action: 'burp' }))}
                                disabled={plant.stage !== PlantStage.Curing}
                            >
                                {t('plantsView.postHarvest.burpJars')}
                            </Button>
                            <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => dispatch(processPostHarvest({ plantId: plant.id, action: 'cure' }))}
                                disabled={plant.stage !== PlantStage.Curing}
                            >
                                {t('plantsView.postHarvest.simulateNextDay')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};