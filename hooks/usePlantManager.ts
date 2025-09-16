import { useCallback } from 'react';
import { Plant, PlantStage, PlantProblem, JournalEntry, Task, PlantProblemType } from '../types';
import { PLANT_STAGE_DETAILS, STAGES_ORDER, PROBLEM_THRESHOLDS, YIELD_FACTORS, SIMULATION_CONSTANTS } from '../constants';
import { useSettings } from './useSettings';
import { useNotifications } from '../context/NotificationContext';
import { useTranslations } from './useTranslations';

const clonePlant = (plant: Plant): Plant => {
    return {
        ...plant,
        strain: { ...plant.strain },
        growSetup: { ...plant.growSetup },
        vitals: { ...plant.vitals },
        environment: { ...plant.environment },
        problems: plant.problems.map(p => ({ ...p })),
        journal: plant.journal.map(j => ({ ...j, details: j.details ? { ...j.details } : undefined })),
        tasks: plant.tasks.map(t => ({ ...t })),
        history: plant.history.map(h => ({ ...h, vitals: { ...h.vitals } })),
    };
};

export const usePlantManager = (
    plants: (Plant | null)[],
    setPlants: React.Dispatch<React.SetStateAction<(Plant | null)[]>>
) => {
    const { settings } = useSettings();
    const { addNotification } = useNotifications();
    const { t } = useTranslations();

    const getProblemDetails = (type: PlantProblemType) => {
        const key = type.charAt(0).toLowerCase() + type.slice(1);
        return {
            message: t(`problemMessages.${key}.message`),
            solution: t(`problemMessages.${key}.solution`)
        };
    };

    const calculateYield = (plant: Plant): number => {
        const baseYield = YIELD_FACTORS.base[plant.strain.agronomic.yield] || YIELD_FACTORS.base.Medium;
        const avgStress = plant.history.reduce((acc, cur) => acc + cur.stressLevel, 0) / plant.history.length || 0;
        
        const stressPenalty = (avgStress / 100) * YIELD_FACTORS.stressModifier;
        const heightBonus = (plant.height / 100) * YIELD_FACTORS.heightModifier;
        
        const setup = plant.growSetup;
        const lightMod = YIELD_FACTORS.setupModifier.light[setup.lightType];
        const potMod = YIELD_FACTORS.setupModifier.potSize[setup.potSize];
        const mediumMod = YIELD_FACTORS.setupModifier.medium[setup.medium];
        const setupMultiplier = lightMod * potMod * mediumMod;

        const finalYield = baseYield * (1 + stressPenalty + heightBonus) * setupMultiplier;
        
        return Math.max(5, finalYield);
    };

    const simulatePlant = useCallback((plant: Plant, targetTimestamp: number): Plant => {
        if (plant.stage === PlantStage.Finished) return plant;

        const timeSinceLastUpdate = targetTimestamp - plant.lastUpdated;
        if (timeSinceLastUpdate <= 0) return plant;
        
        const speedMultiplier = { '1x': 1, '2x': 2, '5x': 5, '10x': 10, '20x': 20 }[settings.simulationSettings.speed];
        const elapsedMs = timeSinceLastUpdate * speedMultiplier;
        const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

        let newPlantState = clonePlant(plant);
        
        const totalElapsedMsFromStart = (newPlantState.lastUpdated - newPlantState.startedAt) + elapsedMs;
        const newAge = Math.floor(totalElapsedMsFromStart / (1000 * 60 * 60 * 24));
        
        if (newAge > newPlantState.age) {
            newPlantState.age = newAge;
            let cumulativeDuration = 0;
            let currentStageReached = false;

            for (const stage of STAGES_ORDER) {
                const stageDetails = PLANT_STAGE_DETAILS[stage];
                if (stageDetails.duration === Infinity) break;

                const nextStageStartsAt = cumulativeDuration + stageDetails.duration;
                if (newPlantState.age >= cumulativeDuration && newPlantState.age < nextStageStartsAt) {
                    if (newPlantState.stage !== stage) {
                         newPlantState.stage = stage;
                         const logMessage = t('plantsView.notifications.stageChange', { stage: t(`plantStages.${stage}`) });
                         newPlantState.journal.push({ id: `sys-${Date.now()}`, timestamp: targetTimestamp, type: 'SYSTEM', notes: logMessage });
                         if (settings.notificationSettings.stageChange) addNotification(`${plant.name}: ${logMessage}`, 'info');
                         if (newPlantState.stage === PlantStage.Harvest && settings.notificationSettings.harvestReady) addNotification(t('plantsView.notifications.harvestReady', { name: plant.name }), 'info');
                    }
                    currentStageReached = true;
                    break;
                }
                cumulativeDuration += stageDetails.duration;
            }

            if (!currentStageReached && newPlantState.stage !== PlantStage.Finished) {
                newPlantState.stage = PlantStage.Finished;
                newPlantState.yield = calculateYield(newPlantState);
                const yieldMessage = t('plantsView.notifications.finalYield', { yield: newPlantState.yield.toFixed(2) });
                newPlantState.journal.push({ id: `sys-${Date.now()+1}`, timestamp: targetTimestamp, type: 'SYSTEM', notes: yieldMessage });
            }
        }
        
        let currentStageInfo = PLANT_STAGE_DETAILS[newPlantState.stage];
        if (![PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(newPlantState.stage)) {
            const isNutrientLockout = newPlantState.vitals.ph < SIMULATION_CONSTANTS.NUTRIENT_LOCKOUT_PH_LOW || newPlantState.vitals.ph > SIMULATION_CONSTANTS.NUTRIENT_LOCKOUT_PH_HIGH;
            const nutrientUptakeMultiplier = isNutrientLockout ? 0.2 : 1;
            newPlantState.vitals.substrateMoisture = Math.max(0, newPlantState.vitals.substrateMoisture - currentStageInfo.waterConsumption * elapsedDays);
            newPlantState.vitals.ec = Math.max(0, newPlantState.vitals.ec - currentStageInfo.nutrientConsumption * nutrientUptakeMultiplier * elapsedDays);
            newPlantState.vitals.ph += (SIMULATION_CONSTANTS.PH_DRIFT_TARGET - newPlantState.vitals.ph) * SIMULATION_CONSTANTS.PH_DRIFT_FACTOR * elapsedDays;
            const growthFactor = 1 - (newPlantState.stressLevel / SIMULATION_CONSTANTS.STRESS_GROWTH_PENALTY_DIVISOR);
            newPlantState.height += currentStageInfo.growthRate * growthFactor * elapsedDays;
        }

        let stressFromProblems = 0;
        const { vitals } = newPlantState;
        if (vitals.substrateMoisture < PROBLEM_THRESHOLDS.moisture.under) stressFromProblems += (PROBLEM_THRESHOLDS.moisture.under - vitals.substrateMoisture) * 0.3;
        const stressDifficultyModifier = { easy: 0.7, normal: 1.0, hard: 1.3 }[settings.simulationSettings.difficulty];
        stressFromProblems *= stressDifficultyModifier;
        const stressDecayFactor = Math.pow(0.9, elapsedDays);
        newPlantState.stressLevel = newPlantState.stressLevel * stressDecayFactor + stressFromProblems * elapsedDays;
        newPlantState.stressLevel = Math.min(100, Math.max(0, newPlantState.stressLevel));

        const newProblems: PlantProblem[] = [];
        if (vitals.substrateMoisture < PROBLEM_THRESHOLDS.moisture.under) newProblems.push({ type: 'Underwatering', ...getProblemDetails('Underwatering') });
        newPlantState.problems = newProblems;

        const hasTask = (title: string) => newPlantState.tasks.some((t: Task) => t.title === title && !t.isCompleted);
        const wateringTaskTitle = t('plantsView.tasks.wateringTask.title');
        if(newPlantState.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATERING_TASK_THRESHOLD && !hasTask(wateringTaskTitle)) {
            newPlantState.tasks.push({id: `task-${Date.now()}`, title: wateringTaskTitle, description: t('plantsView.tasks.wateringTask.description'), priority: 'high', isCompleted: false, createdAt: targetTimestamp });
            if (settings.notificationSettings.newTask) {
                addNotification(`${plant.name}: ${wateringTaskTitle}`, 'info');
            }
        }

        if (newPlantState.age > (plant.history[plant.history.length-1]?.day || -1)) {
            newPlantState.history.push({ day: newPlantState.age, vitals: { ...newPlantState.vitals }, stressLevel: newPlantState.stressLevel, height: newPlantState.height });
        }

        newPlantState.lastUpdated = targetTimestamp;
        return newPlantState;
    }, [settings.simulationSettings, settings.notificationSettings, addNotification, t]);

    const updatePlantState = useCallback((plantIdToUpdate?: string) => {
        setPlants(currentPlants => {
            const now = Date.now();
            return currentPlants.map(p => {
                if (p && (plantIdToUpdate === undefined || p.id === plantIdToUpdate) && p.stage !== PlantStage.Finished) {
                    return simulatePlant(p, now);
                }
                return p;
            });
        });
    }, [simulatePlant, setPlants]);
    
    const advanceDay = useCallback(() => {
        setPlants(currentPlants => currentPlants.map(p => {
            if (p && p.stage !== PlantStage.Finished) {
                const oneDayMs = 24 * 60 * 60 * 1000;
                const speedMultiplier = { '1x': 1, '2x': 2, '5x': 5, '10x': 10, '20x': 20 }[settings.simulationSettings.speed];
                const targetTimestamp = p.lastUpdated + (oneDayMs / speedMultiplier);
                return simulatePlant(p, targetTimestamp);
            }
            return p;
        }));
    }, [simulatePlant, settings.simulationSettings.speed, setPlants]);

    const addJournalEntry = (plantId: string, entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
        updatePlantState(plantId);

        setPlants(prev => prev.map(p => {
            if (p?.id !== plantId) return p;

            let updatedPlant = clonePlant(p);
            updatedPlant.journal.push({ ...entry, id: `manual-${Date.now()}`, timestamp: Date.now() });

            if ((entry.type === 'WATERING' || entry.type === 'FEEDING') && entry.details) {
                const moistureReplenish = (entry.details.waterAmount / (p.growSetup.potSize * SIMULATION_CONSTANTS.ML_PER_LITER)) * SIMULATION_CONSTANTS.WATER_REPLENISH_FACTOR;
                updatedPlant.vitals.substrateMoisture = Math.min(100, p.vitals.substrateMoisture + moistureReplenish);
                updatedPlant.vitals.ph = entry.details.ph || p.vitals.ph;
                
                if (entry.type === 'FEEDING') {
                   updatedPlant.vitals.ec = entry.details.ec || p.vitals.ec;
                }

                const wateringTaskTitle = t('plantsView.tasks.wateringTask.title');
                updatedPlant.tasks = updatedPlant.tasks.map((task: Task) => 
                    task.title === wateringTaskTitle && !task.isCompleted
                        ? { ...task, isCompleted: true, completedAt: Date.now() }
                        : task
                );
            }
            updatedPlant.lastUpdated = Date.now();
            return updatedPlant;
        }));
    };

    const completeTask = (plantId: string, taskId: string) => {
         setPlants(prev => prev.map(p => {
            if (p?.id !== plantId) return p;
            const newTasks = p.tasks.map(t => t.id === taskId ? { ...t, isCompleted: true, completedAt: Date.now() } : t);
            return { ...p, tasks: newTasks };
        }));
    };

    const waterAllPlants = () => {
        updatePlantState();
        const now = Date.now();
        let wateredCount = 0;
        setPlants(currentPlants => currentPlants.map(p => {
            if (p && p.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATER_ALL_THRESHOLD && p.stage !== PlantStage.Finished) {
                wateredCount++;
                let updatedPlant = clonePlant(p);
                const moistureReplenish = (500 / (p.growSetup.potSize * SIMULATION_CONSTANTS.ML_PER_LITER)) * SIMULATION_CONSTANTS.WATER_REPLENISH_FACTOR;
                updatedPlant.vitals.substrateMoisture = Math.min(100, p.vitals.substrateMoisture + moistureReplenish);
                updatedPlant.vitals.ph = SIMULATION_CONSTANTS.PH_DRIFT_TARGET;
                const wateringTaskTitle = t('plantsView.tasks.wateringTask.title');
                updatedPlant.tasks = updatedPlant.tasks.map((task: Task) => 
                    task.title === wateringTaskTitle && !task.isCompleted
                        ? { ...task, isCompleted: true, completedAt: now }
                        : task
                );
                updatedPlant.journal.push({
                    id: `manual-${now}-${p.id}`, timestamp: now, type: 'WATERING', notes: t('plantsView.actionModals.defaultNotes.watering'),
                    details: { waterAmount: 500, ph: SIMULATION_CONSTANTS.PH_DRIFT_TARGET }
                });
                updatedPlant.lastUpdated = now;
                return updatedPlant;
            }
            return p;
        }));
        
        if (wateredCount > 0) {
            addNotification(t('plantsView.notifications.waterAllSuccess', { count: wateredCount }), 'success');
        } else {
            addNotification(t('plantsView.notifications.waterAllNone'), 'info');
        }
    };

    return {
        updatePlantState,
        addJournalEntry,
        completeTask,
        waterAllPlants,
        advanceDay,
    };
};
