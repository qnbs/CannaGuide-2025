import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PhosphorIcons } from '@/components/icons/PhosphorIcons';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PlantSlot } from './plants/PlantSlot';
import { DetailedPlantView } from './plants/DetailedPlantView';
import { TipOfTheDay } from './plants/TipOfTheDay';
import { GardenVitals } from './plants/DashboardSummary';
import { TasksAndWarnings } from './plants/TasksAndWarnings';
import { GlobalAdvisorArchiveView } from './plants/GlobalAdvisorArchiveView';
import { InlineStrainSelector } from './plants/InlineStrainSelector';
import { GrowSetupModal } from './plants/GrowSetupModal';
import { GrowConfirmationModal } from './plants/GrowConfirmationModal';
import { usePlantSlotsData, useGardenSummary, useSelectedPlant } from '@/hooks/useSimulationBridge';
// FIX: Corrected import path for Redux store to use the '@/' alias.
import { useAppDispatch, useAppSelector } from '@/stores/store';
import { selectUi } from '@/stores/selectors';
import { startGrowInSlot, selectStrainForGrow, confirmSetupAndShowConfirmation, cancelNewGrow } from '@/stores/slices/uiSlice';
import { setSelectedPlantId } from '@/stores/slices/simulationSlice';
import { SkeletonLoader } from '../common/SkeletonLoader';

const EmptyPlantSlot: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    const { t } = useTranslation();
    return (
        <Card
            onClick={onStart}
            className="flex flex-col items-center justify-center h-full text-center border-2 border-dashed border-slate-700 hover:border-primary-500 hover:bg-slate-800/50 cursor-pointer transition-all card-interactive-glow"
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
            <Card key={i} className="flex flex-col h-full skeleton-pulse">
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
    
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, []);

    const { 
        initiatingGrowForSlot,
        strainForNewGrow,
        isGrowSetupModalOpen,
        isConfirmationModalOpen
    } = useAppSelector(selectUi);
    
    const { slotsWithData } = usePlantSlotsData();
    const { tasks, problems } = useGardenSummary();
    const selectedPlant = useSelectedPlant();

    const selectedPlantId = useAppSelector(state => state.simulation.selectedPlantId);
    
    const plantData = useMemo(() => {
        if (!selectedPlantId) return null;
        return slotsWithData.flat().find(p => p?.id === selectedPlantId) || null;
    }, [selectedPlantId, slotsWithData]);

    if (plantData) {
        return <DetailedPlantView plant={plantData} onClose={() => dispatch(setSelectedPlantId(null))} />;
    }

    const showGrowFromStrainBanner = strainForNewGrow && initiatingGrowForSlot === null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {isGrowSetupModalOpen && strainForNewGrow && (
                <GrowSetupModal
                    strain={strainForNewGrow}
                    onClose={() => dispatch(cancelNewGrow())}
                    onConfirm={(setup) => dispatch(confirmSetupAndShowConfirmation(setup))}
                />
            )}
            {isConfirmationModalOpen && (
                <GrowConfirmationModal />
            )}

            <div className="lg:col-span-2 space-y-6">
                <GardenVitals 
                    openTasksCount={tasks.length}
                />
                <TipOfTheDay />
                {showGrowFromStrainBanner && (
                    <Card className="bg-primary-900/40 border-primary-500/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex-grow">
                            <h3 className="font-bold text-primary-300">{t('plantsView.inlineSelector.title')}</h3>
                            <p className="text-sm text-slate-300">{t('plantsView.inlineSelector.subtitle')} {strainForNewGrow.name}.</p>
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
                            if (initiatingGrowForSlot === index) {
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
                                <EmptyPlantSlot key={`empty-${index}`} onStart={() => dispatch(startGrowInSlot(index))} />
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
    );
};