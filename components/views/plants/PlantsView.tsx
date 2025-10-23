import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PlantSlot } from './plants/PlantSlot';
import { DetailedPlantView } from './plants/DetailedPlantView';
import { TipOfTheDay } from './plants/TipOfTheDay';
import { DashboardSummary } from './plants/DashboardSummary';
import { TasksAndWarnings } from './plants/TasksAndWarnings';
import { GlobalAdvisorArchiveView } from './plants/GlobalAdvisorArchiveView';
import { InlineStrainSelector } from './plants/InlineStrainSelector';
import { usePlantSlotsData, useGardenSummary, useSelectedPlant } from '@/hooks/useSimulationBridge';
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectIsExpertMode, selectNewGrowFlow } from '@/stores/selectors';
import { startGrowInSlot, selectStrainForGrow, cancelNewGrow, selectSlotForGrow } from '@/stores/slices/uiSlice';
import { setSelectedPlantId } from '@/stores/slices/simulationSlice';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { Task, PlantProblem } from '@/types';

const EmptyPlantSlot: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const { t } = useTranslation();
    return (
        <Card
            onClick={onStart}
            className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-white/30 hover:border-primary-500 hover:bg-primary-900/20 cursor-pointer transition-all card-interactive-glow empty-slot-pulse"
        >
            <PhosphorIcons.PlusCircle className="w-12 h-12 text-slate-600 mb-2" />
            <h3 className="font-semibold text-slate-300">{t('plantsView.emptySlot.title')}</h3>
            <p className="text-sm text-slate-500">{t('plantsView.emptySlot.subtitle')} <span className="hidden md:inline">{t('plantsView.emptySlot.subtitleInline')}</span></p>
        </Card>
    );
};

const PlantSlotsSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="flex flex-col h-full animate-pulse">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-slate-700 rounded"></div>
                        <div className="h-3 w-16 bg-slate-700 rounded"></div>
                    </div>
                    <div className="h-4 w-12 bg-slate-700 rounded-full"></div>
                </div>
                <div className="flex-grow flex items-center justify-center my-4 min-h-[96px]">
                    <div className="w-24 h-24 bg-slate-700 rounded-full"></div>
                </div>
                <div className="flex justify-around items-center border-t border-slate-700/50 pt-3 mt-auto">
                    <div className="h-4 w-8 bg-slate-700 rounded"></div>
                    <div className="h-4 w-8 bg-slate-700 rounded"></div>
                    <div className="h-4 w-8 bg-slate-700 rounded"></div>
                </div>
            </Card>
        ))}
    </div>
);

export const PlantsView: React.FC = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const isExpertMode = useAppSelector(selectIsExpertMode);
    
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    const newGrowFlow = useAppSelector(selectNewGrowFlow);
    
    const { slotsWithData } = usePlantSlotsData();
    const { tasks, problems } = useGardenSummary();
    const selectedPlant = useSelectedPlant();
    
    const showGrowFromStrainBanner = newGrowFlow.strain && newGrowFlow.status === 'selectingSlot';

    const handleEmptySlotClick = (index: number) => {
        if (newGrowFlow.status === 'selectingSlot') {
            dispatch(selectSlotForGrow(index));
        } else {
            dispatch(startGrowInSlot(index));
        }
    };

    return (
        <>
            {/* Detail View - Rendered on top when active */}
            {selectedPlant && <DetailedPlantView plant={selectedPlant} onClose={() => dispatch(setSelectedPlantId(null))} />}

            {/* Main Dashboard View - Hidden when a plant is selected to preserve state */}
            <div style={{ display: selectedPlant ? 'none' : 'block' }}>
                <div className="space-y-6">
                     <div className="text-center mb-6 animate-fade-in">
                        <PhosphorIcons.Plant className="w-16 h-16 mx-auto text-green-400" />
                        <h2 className="text-3xl font-bold font-display text-slate-100 mt-2">{t('nav.plants')}</h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <DashboardSummary />
                            <TipOfTheDay />
                            {showGrowFromStrainBanner && (
                                <Card className="bg-primary-900/40 border-primary-500/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-primary-300">{t('plantsView.inlineSelector.title')}</h3>
                                        <p className="text-sm text-slate-300">{t('plantsView.inlineSelector.subtitle')} {newGrowFlow.strain?.name}.</p>
                                    </div>
                                    <Button variant="secondary" size="sm" onClick={() => dispatch(cancelNewGrow())}>
                                        {t('common.cancel')}
                                    </Button>
                                </Card>
                            )}
                            {isLoading ? (
                                <PlantSlotsSkeleton />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {slotsWithData.map((plant, index) => {
                                        if (newGrowFlow.status === 'selectingStrain' && newGrowFlow.slotIndex === index) {
                                            return (
                                                <InlineStrainSelector 
                                                    key={`selector-${index}`}
                                                    onClose={() => dispatch(cancelNewGrow())}
                                                    onSelectStrain={(strain) => dispatch(selectStrainForGrow(strain))}
                                                />
                                            );
                                        }
                                        return plant ? (
                                            <PlantSlot key={plant.id} plant={plant} onInspect={() => dispatch(setSelectedPlantId(plant.id))} />
                                        ) : (
                                            <EmptyPlantSlot key={`empty-${index}`} onStart={() => handleEmptySlotClick(index)} />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-1 space-y-6">
                            <TasksAndWarnings tasks={tasks} problems={problems} />
                            <GlobalAdvisorArchiveView />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};