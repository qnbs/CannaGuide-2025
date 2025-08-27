import React, { useMemo } from 'react';
import { Plant, PlantStage } from '../../../types';
import { Card } from '../../common/Card';
import { PlantVisual } from './PlantVisual';
import { PhosphorIcons } from '../../icons/PhosphorIcons';
import { PLANT_STAGE_DETAILS, STAGES_ORDER } from '../../../constants';

interface PlantCardProps {
  plant: Plant;
  onInspect: () => void;
  onWater: () => void;
  onFeed: () => void;
  onLog: () => void;
  onPhoto: () => void;
}

const StatIndicator: React.FC<{ value: string, label: string, icon: React.ReactNode }> = ({ value, label, icon }) => (
    <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300" title={label} aria-label={`${label}: ${value}`}>
        <div className="w-4 h-4 text-slate-500">{icon}</div>
        <span className="font-semibold">{value}</span>
    </div>
);

const VitalBar: React.FC<{ label: string; value: number; max: number; unit: string; color: string }> = ({ label, value, max, unit, color }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="text-sm">
            <div className="flex justify-between items-baseline font-semibold text-slate-600 dark:text-slate-300">
                <span>{label}</span>
                <span>{value.toFixed(label === 'EC' ? 2 : 0)}{unit}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-0.5">
                <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const ActionButton: React.FC<{ label: string; icon: React.ReactNode; onClick: (e: React.MouseEvent) => void }> = ({ label, icon, onClick }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex-1 flex flex-col items-center justify-center p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
    >
      <div className="w-6 h-6">{icon}</div>
      <span className="text-xs">{label}</span>
    </button>
  );

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onInspect, onWater, onFeed, onLog, onPhoto }) => {
    
    const highPriorityTasks = plant.tasks.filter(t => !t.isCompleted && t.priority === 'high').length;
    const isProblem = plant.problems.length > 0 || highPriorityTasks > 0;

    const stageStartDay = useMemo(() => {
        const currentStageIndex = STAGES_ORDER.indexOf(plant.stage);
        if (currentStageIndex === -1) return 0;
        return STAGES_ORDER.slice(0, currentStageIndex).reduce((acc, stage) => acc + (PLANT_STAGE_DETAILS[stage]?.duration || 0), 0);
    }, [plant.stage]);

    const stageDuration = PLANT_STAGE_DETAILS[plant.stage]?.duration || 1;
    const daysInStage = plant.age - stageStartDay;
    const stageProgress = stageDuration === Infinity ? 100 : Math.min(100, Math.max(0, (daysInStage / stageDuration) * 100));

    const handleActionClick = (action: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
        e.stopPropagation();
        action(e);
    };

    return (
        <Card 
            className={`flex flex-col h-full border-2 transition-all duration-300 cursor-pointer hover:shadow-xl hover:border-primary-500/50 ${isProblem ? 'border-red-500/50' : 'border-transparent'}`}
            onClick={onInspect}
        >
            <div className="text-center mb-2 relative">
                {isProblem && (
                  <div className="absolute top-0 right-0 text-red-500 animate-pulse" title={`${plant.problems.length} Probleme, ${highPriorityTasks} dringende Aufgaben`}>
                    <PhosphorIcons.WarningCircle className="w-6 h-6" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-primary-600 dark:text-primary-300 truncate">{plant.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{plant.strain.name}</p>
                 <p className="text-slate-400 dark:text-slate-500 text-xs">{plant.stage} - Tag {plant.age}</p>
            </div>

            <div className="flex-grow flex items-center justify-center my-4 min-h-[150px]">
               <PlantVisual stage={plant.stage} age={plant.age} stress={plant.stressLevel} water={plant.vitals.substrateMoisture}/>
            </div>
            
            <div className="mb-4">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>{plant.stage}</span>
                    <span>{`Tag ${daysInStage} von ${stageDuration === Infinity ? '∞' : stageDuration}`}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${stageProgress}%` }}></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-md">
                 <StatIndicator value={plant.vitals.ph.toFixed(1)} label="pH" icon={<span className="font-bold text-sm">pH</span>} />
                 <StatIndicator value={`${plant.environment.temperature.toFixed(0)}°C`} label="Temperatur" icon={<PhosphorIcons.ThermometerSimple />} />
                 <VitalBar label="Feuchtigkeit" value={plant.vitals.substrateMoisture} max={100} unit="%" color="bg-blue-500" />
                 <VitalBar label="EC" value={plant.vitals.ec} max={3.0} unit="" color="bg-amber-500" />
            </div>

            <div className="flex justify-around items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                <ActionButton label="Gießen" icon={<PhosphorIcons.Drop />} onClick={handleActionClick(() => onWater())} />
                <ActionButton label="Düngen" icon={<PhosphorIcons.TestTube />} onClick={handleActionClick(() => onFeed())} />
                <ActionButton label="Beobachtung" icon={<PhosphorIcons.MagnifyingGlass />} onClick={handleActionClick(() => onLog())} />
                <ActionButton label="Foto" icon={<PhosphorIcons.Camera />} onClick={handleActionClick(() => onPhoto())} />
            </div>
        </Card>
    );
};