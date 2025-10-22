import React, { memo, useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectGardenHealthMetrics, selectActivePlants, selectLanguage } from '@/stores/selectors';
import { waterAllPlants, setGlobalEnvironment } from '@/stores/slices/simulationSlice';
import { RangeSlider } from '@/components/common/RangeSlider';
import { VPDGauge } from './VPDGauge';
import { useGetGardenStatusSummaryMutation } from '@/stores/api';
import { AiLoadingIndicator } from '@/components/common/AiLoadingIndicator';
import { Speakable } from '@/components/common/Speakable';

const Stat: React.FC<{ icon: React.ReactNode; value: string; label: string; }> = ({ icon, value, label }) => (
    <div className="text-center min-w-0 bg-slate-800/50 p-2 rounded-lg ring-1 ring-inset ring-white/20 flex flex-col justify-between">
        <div className="mx-auto w-8 h-8 flex items-center justify-center">{icon}</div>
        <p className="text-xl sm:text-2xl font-bold font-display text-slate-100 mt-1">{value}</p>
        <p className="text-[10px] sm:text-xs text-slate-400 break-words">{label}</p>
    </div>
);

export const DashboardSummary: React.FC = memo(() => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { gardenHealth, activePlantsCount, avgTemp, avgHumidity, avgVPD } = useAppSelector(selectGardenHealthMetrics);
    const activePlants = useAppSelector(selectActivePlants);
    const lang = useAppSelector(selectLanguage);
    const hasActiveGrows = activePlantsCount > 0;
    
    const [getGardenStatus, { data: aiStatus, isLoading: isAiLoading, error: aiError, reset: resetAiStatus }] = useGetGardenStatusSummaryMutation();

    const [wateringState, setWateringState] = useState<'idle' | 'pending' | 'success'>('idle');

    useEffect(() => {
        let timer: number;
        if (wateringState === 'success') {
            timer = window.setTimeout(() => setWateringState('idle'), 2000);
        }
        return () => clearTimeout(timer);
    }, [wateringState]);

    const handleWaterAll = () => {
        setWateringState('pending');
        dispatch(waterAllPlants());
        setTimeout(() => setWateringState('success'), 500); // UI feedback delay
    };

    const handleGetAiStatus = () => {
        if(hasActiveGrows) {
            getGardenStatus({ plants: activePlants, lang });
        }
    };

    const renderWaterButtonContent = () => {
        switch (wateringState) {
            case 'pending': return <><PhosphorIcons.Drop className="w-5 h-5 mr-1 animate-pulse" /> {t('plantsView.summary.wateringAll')}</>;
            case 'success': return <><PhosphorIcons.CheckCircle className="w-5 h-5 mr-1" /> {t('plantsView.summary.wateredAll')}</>;
            default: return <><PhosphorIcons.Drop className="w-5 h-5 mr-1" /> {t('plantsView.summary.waterAll')}</>;
        }
    };

    return (
        <Card>
            <h3 className="text-xl font-bold font-display text-primary-300 mb-4">{t('plantsView.gardenVitals.title')}</h3>
            {/* FIX: Add avgTemp and avgHumidity stats and adjust grid layout to display all vital metrics. */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <Stat icon={<PhosphorIcons.Heart weight="fill" className="text-rose-400" />} value={`${Math.round(gardenHealth)}%`} label={t('plantsView.summary.gardenHealth')} />
                <Stat icon={<PhosphorIcons.Plant className="text-green-400" />} value={activePlantsCount.toString()} label={t('plantsView.summary.activeGrows')} />
                <Stat icon={<PhosphorIcons.Thermometer className="text-orange-400" />} value={`${avgTemp.toFixed(1)}°`} label={t('plantsView.gardenVitals.avgTemp')} />
                <Stat icon={<PhosphorIcons.Drop className="text-blue-400" />} value={`${avgHumidity.toFixed(1)}%`} label={t('plantsView.gardenVitals.avgHumidity')} />
            </div>
            <div className="text-center min-w-0 bg-slate-800/50 p-2 rounded-lg ring-1 ring-inset ring-white/20 flex flex-col justify-center items-center mb-4">
                <VPDGauge temperature={avgTemp} humidity={avgHumidity} />
            </div>

            {/* AI Status Section */}
            <div className="p-3 bg-slate-800/50 rounded-lg space-y-3">
                {isAiLoading ? (
                    <AiLoadingIndicator loadingMessage={t('ai.generating')} />
                ) : aiError ? (
                    <div className="text-center text-sm text-red-400">{'message' in aiError ? (aiError as any).data?.message || (aiError as any).message : t('ai.error.unknown')}</div>
                ) : aiStatus ? (
                    <Speakable elementId="garden-status-ai" className="animate-fade-in">
                        <div className="flex justify-between items-start">
                             <h4 className="font-bold text-lg text-primary-300 flex items-center gap-2"><PhosphorIcons.Sparkle/> {aiStatus.title}</h4>
                             <Button size="sm" variant="ghost" className="!p-1" onClick={() => resetAiStatus()}><PhosphorIcons.X/></Button>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiStatus.content }}></div>
                    </Speakable>
                ) : (
                    <Button onClick={handleGetAiStatus} variant="secondary" size="sm" disabled={!hasActiveGrows} className="w-full">
                        <PhosphorIcons.Sparkle className="w-4 h-4 mr-2" /> {t('plantsView.gardenVitals.getAiStatus')}
                    </Button>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/50">
                 <Button onClick={handleWaterAll} variant="secondary" disabled={!hasActiveGrows || wateringState === 'pending'} className="w-full">
                    {renderWaterButtonContent()}
                </Button>
                <details className="group mt-4">
                    <summary className="list-none text-sm font-semibold text-slate-300 cursor-pointer flex items-center justify-between">
                        <span>{t('plantsView.gardenVitals.advancedControls')}</span>
                        <PhosphorIcons.ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 space-y-4">
                        {hasActiveGrows ? (
                            <>
                                <RangeSlider
                                    label={t('plantsView.gardenVitals.avgTemp')}
                                    min={15} max={35} step={0.5}
                                    singleValue={true}
                                    value={avgTemp}
                                    onChange={val => dispatch(setGlobalEnvironment({ temperature: val }))}
                                    unit="°C"
                                    color="green"
                                />
                                <RangeSlider
                                    label={t('plantsView.gardenVitals.avgHumidity')}
                                    min={20} max={90} step={1}
                                    singleValue={true}
                                    value={avgHumidity}
                                    onChange={val => dispatch(setGlobalEnvironment({ humidity: val }))}
                                    unit="%"
                                    color="blue"
                                />
                            </>
                        ) : (
                             <p className="text-xs text-slate-500 text-center">Start a grow to enable advanced controls.</p>
                        )}
                    </div>
                </details>
            </div>
        </Card>
    );
});