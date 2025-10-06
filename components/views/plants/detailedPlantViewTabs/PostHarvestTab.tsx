import React from 'react';
import { Plant, PlantStage } from '@/types';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAppDispatch } from '@/stores/store';
import { processPostHarvest } from '@/stores/slices/simulationSlice';
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';

interface PostHarvestTabProps {
    plant: Plant;
}

const ProgressBar: React.FC<{ label: string; progress: number, color?: string }> = ({ label, progress, color = 'bg-primary-500' }) => (
    <div>
        <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-slate-300">{label}</span>
            <span className="text-sm font-medium text-slate-300">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className={`${color} h-2.5 rounded-full transition-all duration-300`} style={{ width: `${progress}%` }}></div>
        </div>
    </div>
);

const BurpCalendar: React.FC<{ currentDay: number; lastBurpDay: number }> = ({ currentDay, lastBurpDay }) => {
    const { t } = useTranslation();
    const days = Array.from({ length: PLANT_STAGE_DETAILS[PlantStage.Curing].duration }, (_, i) => i + 1);
    const isOverdue = currentDay > lastBurpDay + 1;

    return (
        <div>
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-lg text-slate-100 mb-2">{t('plantsView.postHarvest.burpJars')}</h4>
                {isOverdue && <span className="text-sm font-bold text-red-400 animate-pulse">{t('plantsView.postHarvest.burpOverdue')}</span>}
            </div>
            <div className="flex flex-wrap gap-1">
                {days.map(day => {
                    const isBurped = day <= lastBurpDay;
                    const isCurrent = day === currentDay;
                    return (
                        <div key={day} title={`Day ${day}`} className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold ${isCurrent ? 'ring-2 ring-primary-400' : ''} ${isBurped ? 'bg-green-500 text-white' : 'bg-slate-700'}`}>
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


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
    
    const topTerpenes = Object.entries(harvestData.terpeneProfile || {}).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 3);


    return (
        <div className="space-y-6">
            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('plantsView.postHarvest.title')}</h3>
                
                {isFinished ? (
                    <div className="text-center p-8 bg-slate-800 rounded-lg">
                        <h4 className="text-2xl font-bold text-green-400">{t('plantsView.postHarvest.processComplete')}</h4>
                        <p className="text-lg mt-2">{t('plantsView.postHarvest.finalQuality')}: <span className="font-bold">{harvestData.finalQuality.toFixed(1)}/100</span></p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className={`p-4 rounded-lg space-y-4 ${plant.stage === PlantStage.Drying ? 'bg-slate-800' : 'bg-slate-800/50 opacity-70'}`}>
                            <h4 className="font-bold text-lg text-slate-100">{t('plantsView.postHarvest.drying')}</h4>
                            <ProgressBar label={t('plantsView.postHarvest.dryingProgress')} progress={dryingProgress} />
                            <p className="text-sm text-slate-400">{t('plantsView.postHarvest.day')} {harvestData.currentDryDay} / {PLANT_STAGE_DETAILS[PlantStage.Drying].duration}</p>
                            <div className="space-y-2">
                                <ProgressBar label={t('plantsView.postHarvest.terpeneRetention')} progress={harvestData.terpeneRetentionPercent} color="bg-amber-500" />
                                <ProgressBar label={t('plantsView.postHarvest.moldRisk')} progress={harvestData.moldRiskPercent} color="bg-red-500" />
                            </div>
                            <Button size="sm" className="w-full" onClick={() => dispatch(processPostHarvest({ plantId: plant.id, action: 'dry' }))} disabled={plant.stage !== PlantStage.Drying}>
                                {t('plantsView.postHarvest.simulateNextDay')}
                            </Button>
                        </div>

                        <div className={`p-4 rounded-lg space-y-4 ${plant.stage === PlantStage.Curing ? 'bg-slate-800' : 'bg-slate-800/50 opacity-70'}`}>
                            <h4 className="font-bold text-lg text-slate-100">{t('plantsView.postHarvest.curing')}</h4>
                             <BurpCalendar currentDay={harvestData.currentCureDay} lastBurpDay={harvestData.lastBurpDay} />
                            <div className="flex gap-2 mt-4">
                                <Button size="sm" variant="secondary" className="flex-1" onClick={() => dispatch(processPostHarvest({ plantId: plant.id, action: 'burp' }))} disabled={plant.stage !== PlantStage.Curing}>
                                    <PhosphorIcons.Fan className="w-4 h-4 mr-1"/> {t('plantsView.postHarvest.burpJars')}
                                </Button>
                                <Button size="sm" className="flex-1" onClick={() => dispatch(processPostHarvest({ plantId: plant.id, action: 'cure' }))} disabled={plant.stage !== PlantStage.Curing}>
                                    {t('plantsView.postHarvest.simulateNextDay')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            <Card>
                <h3 className="text-xl font-bold font-display text-primary-400 mb-4">{t('plantsView.postHarvest.chemicalProfile')}</h3>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-sm font-semibold text-slate-300">{t('plantsView.postHarvest.chlorophyll')}</p>
                        <p className="text-2xl font-bold text-green-400">{harvestData.chlorophyllPercent.toFixed(1)}%</p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm font-semibold text-slate-300">THC</p>
                        <p className="text-2xl font-bold text-amber-400">{harvestData.cannabinoidProfile.thc.toFixed(2)}%</p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm font-semibold text-slate-300">{t('plantsView.postHarvest.cbn')}</p>
                        <p className="text-2xl font-bold text-indigo-400">{harvestData.cannabinoidProfile.cbn.toFixed(2)}%</p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm font-semibold text-slate-300">{t('plantsView.postHarvest.terpenes')}</p>
                        <div className="text-sm font-bold text-purple-400">
                           {topTerpenes.map(([name, val]) => <div key={name}>{name}: {(val as number).toFixed(2)}%</div>)}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};