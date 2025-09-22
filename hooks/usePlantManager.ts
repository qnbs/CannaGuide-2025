

import { useCallback } from 'react';
import { Plant, PlantStage, PlantProblem, JournalEntry, Task, PlantProblemType } from '@/types';
import { PLANT_STAGE_DETAILS, STAGES_ORDER, PROBLEM_THRESHOLDS, YIELD_FACTORS, SIMULATION_CONSTANTS } from '@/constants';
import { useSettings } from '@/hooks/useSettings';
import { useNotifications } from '@/context/NotificationContext';
import { useTranslations } from '@/hooks/useTranslations';

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

// Helper function to update vitals and growth based on elapsed time
const _updateVitalsAndGrowth = (plant: Plant, elapsedDays: number): Plant => {
    const stageInfo = PLANT_STAGE_DETAILS[plant.stage];
    if ([PlantStage.Drying, PlantStage.Curing, PlantStage.Finished].includes(plant.stage)) {
        return plant;
    }

    const isNutrientLockout = plant.vitals.ph < SIMULATION_CONSTANTS.NUTRIENT_LOCKOUT_PH_LOW || plant.vitals.ph > SIMULATION_CONSTANTS.NUTRIENT_LOCKOUT_PH_HIGH;
    const nutrientUptakeMultiplier = isNutrientLockout ? 0.2 : 1;
    
    plant.vitals.substrateMoisture = Math.max(0, plant.vitals.substrateMoisture - stageInfo.waterConsumption * elapsedDays);
    plant.vitals.ec = Math.max(0, plant.vitals.ec - stageInfo.nutrientConsumption * nutrientUptakeMultiplier * elapsedDays);
    plant.vitals.ph += (SIMULATION_CONSTANTS.PH_DRIFT_TARGET - plant.vitals.ph) * SIMULATION_CONSTANTS.PH_DRIFT_FACTOR * elapsedDays;

    const growthFactor = 1 - (plant.stressLevel / SIMULATION_CONSTANTS.STRESS_GROWTH_PENALTY_DIVISOR);
    plant.height += stageInfo.growthRate * growthFactor * elapsedDays;
    
    return plant;
};

// Helper function to calculate stress from environmental/vital deviations
const _calculateStressFromDeviations = (plant: Plant): number => {
    let stress = 0;
    const { vitals, environment } = plant;
    const stageInfo = PLANT_STAGE_DETAILS[plant.stage];
    const { idealEnv, idealVitals } = stageInfo;
    const stressFactors = SIMULATION_CONSTANTS.STRESS_FACTORS;

    if (environment.temperature > idealEnv.temp.max) stress += (environment.temperature - idealEnv.temp.max) * stressFactors.TEMP_HIGH;
    if (environment.temperature < idealEnv.temp.min) stress += (idealEnv.temp.min - environment.temperature) * stressFactors.TEMP_LOW;
    if (environment.humidity > idealEnv.humidity.max) stress += (environment.humidity - idealEnv.humidity.max) * stressFactors.HUMIDITY_HIGH;
    if (environment.humidity < idealEnv.humidity.min) stress += (idealEnv.humidity.min - environment.humidity) * stressFactors.HUMIDITY_LOW;

    if (vitals.ph > idealVitals.ph.max) stress += (vitals.ph - idealVitals.ph.max) * 10 * stressFactors.PH_OFF;
    if (vitals.ph < idealVitals.ph.min) stress += (idealVitals.ph.min - vitals.ph) * 10 * stressFactors.PH_OFF;
    if (vitals.ec > idealVitals.ec.max) stress += (vitals.ec - idealVitals.ec.max) * 10 * stressFactors.EC_HIGH;
    if (vitals.ec < idealVitals.ec.min) stress += (idealVitals.ec.min - vitals.ec) * 10 * stressFactors.EC_LOW;
    
    if (vitals.substrateMoisture < PROBLEM_THRESHOLDS.moisture.under) stress += (PROBLEM_THRESHOLDS.moisture.under - vitals.substrateMoisture) * stressFactors.UNDERWATERING;
    if (vitals.substrateMoisture > PROBLEM_THRESHOLDS.moisture.over) stress += (vitals.substrateMoisture - PROBLEM_THRESHOLDS.moisture.over) * stressFactors.OVERWATERING;

    return stress;
};

// Helper function to update the plant's problems list
const _checkForNewProblems = (plant: Plant, getProblemDetails: (type: PlantProblemType) => { message: string, solution: string }): PlantProblem[] => {
    const newProblems: PlantProblem[] = [];
    const { vitals, environment, stage } = plant;
    const { idealEnv, idealVitals } = PLANT_STAGE_DETAILS[stage];

    if (vitals.substrateMoisture > PROBLEM_THRESHOLDS.moisture.over) newProblems.push({ type: 'Overwatering', ...getProblemDetails('Overwatering') });
    if (vitals.substrateMoisture < PROBLEM_THRESHOLDS.moisture.under) newProblems.push({ type: 'Underwatering', ...getProblemDetails('Underwatering') });
    if (vitals.ec > idealVitals.ec.max) newProblems.push({ type: 'NutrientBurn', ...getProblemDetails('NutrientBurn') });
    if (vitals.ec < idealVitals.ec.min && ![PlantStage.Seed, PlantStage.Germination].includes(stage)) newProblems.push({ type: 'NutrientDeficiency', ...getProblemDetails('NutrientDeficiency') });
    if (vitals.ph > idealVitals.ph.max) newProblems.push({ type: 'PhTooHigh', ...getProblemDetails('PhTooHigh') });
    if (vitals.ph < idealVitals.ph.min) newProblems.push({ type: 'PhTooLow', ...getProblemDetails('PhTooLow') });
    if (environment.temperature > idealEnv.temp.max) newProblems.push({ type: 'TempTooHigh', ...getProblemDetails('TempTooHigh') });
    if (environment.temperature < idealEnv.temp.min) newProblems.push({ type: 'TempTooLow', ...getProblemDetails('TempTooLow') });
    if (environment.humidity > idealEnv.humidity.max) newProblems.push({ type: 'HumidityTooHigh', ...getProblemDetails('HumidityTooHigh') });
    if (environment.humidity < idealEnv.humidity.min) newProblems.push({ type: 'HumidityTooLow', ...getProblemDetails('HumidityTooLow') });
    
    return newProblems;
};

export const usePlantManager = (
    plants: (Plant | null)[],
    setPlants: React.Dispatch<React.SetStateAction<(Plant | null)[]>>
) => {
    const { settings } = useSettings();
    const { addNotification } = useNotifications();
    const { t } = useTranslations();

    const getProblemDetails = useCallback((type: PlantProblemType) => {
        const key = type.charAt(0).toLowerCase() + type.slice(1);
        return {
            message: t(`problemMessages.${key}.message`),
            solution: t(`problemMessages.${key}.solution`)
        };
    }, [t]);

    const calculateYield = (plant: Plant): number => {
        const baseYield = YIELD_FACTORS.base[plant.strain.agronomic.yield] || YIELD_FACTORS.base.Medium;
        
        const floweringStartDay = STAGES_ORDER.slice(0, STAGES_ORDER.indexOf(PlantStage.Flowering))
            .reduce((acc, stage) => acc + PLANT_STAGE_DETAILS[stage].duration, 0);

        const vegHistory = plant.history.filter(h => h.day < floweringStartDay);
        const flowerHistory = plant.history.filter(h => h.day >= floweringStartDay);

        const avgVegStress = vegHistory.length > 0 ? vegHistory.reduce((acc, cur) => acc + cur.stressLevel, 0) / vegHistory.length : 0;
        const avgFlowerStress = flowerHistory.length > 0 ? flowerHistory.reduce((acc, cur) => acc + cur.stressLevel, 0) / flowerHistory.length : 0;
        
        const weightedAvgStress = (avgVegStress * 0.3) + (avgFlowerStress * 0.7);
        const avgStress = weightedAvgStress > 0 ? weightedAvgStress : (plant.history.reduce((acc, cur) => acc + cur.stressLevel, 0) / plant.history.length || 0);
        
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
            for (const stage of STAGES_ORDER) {
                const stageDetails = PLANT_STAGE_DETAILS[stage];
                if (stageDetails.duration === Infinity) break;
                const nextStageStartsAt = cumulativeDuration + stageDetails.duration;
                if (newPlantState.age >= cumulativeDuration && newPlantState.age < nextStageStartsAt && newPlantState.stage !== stage) {
                     newPlantState.stage = stage;
                     const logMessage = t('plantsView.notifications.stageChange', { stage: t(`plantStages.${stage}`) });
                     if (settings.simulationSettings.autoJournaling.stageChanges) {
                       newPlantState.journal.push({ id: `sys-${Date.now()}`, timestamp: targetTimestamp, type: 'SYSTEM', notes: logMessage });
                     }
                     if (settings.notificationSettings.stageChange) addNotification(`${plant.name}: ${logMessage}`, 'info');
                     if (newPlantState.stage === PlantStage.Harvest && settings.notificationSettings.harvestReady) addNotification(t('plantsView.notifications.harvestReady', { name: plant.name }), 'info');
                }
                cumulativeDuration += stageDetails.duration;
            }

            if (newPlantState.age >= cumulativeDuration && newPlantState.stage !== PlantStage.Finished) {
                newPlantState.stage = PlantStage.Finished;
                newPlantState.yield = calculateYield(newPlantState);
                const yieldMessage = t('plantsView.notifications.finalYield', { yield: newPlantState.yield.toFixed(2) });
                newPlantState.journal.push({ id: `sys-${Date.now()+1}`, timestamp: targetTimestamp, type: 'SYSTEM', notes: yieldMessage });
            }
        }
        
        newPlantState = _updateVitalsAndGrowth(newPlantState, elapsedDays);

        const stressFromProblems = _calculateStressFromDeviations(newPlantState);
        
        let stressDifficultyModifier = { easy: 0.7, normal: 1.0, hard: 1.3 }[settings.simulationSettings.difficulty] || 1.0;
        if (settings.simulationSettings.difficulty === 'custom') {
            const { pestPressure, nutrientSensitivity, environmentalStability } = settings.simulationSettings.customDifficultyModifiers;
            stressDifficultyModifier = (pestPressure + nutrientSensitivity + environmentalStability) / 3;
        }

        const stressToAdd = stressFromProblems * stressDifficultyModifier * elapsedDays;
        const stressDecayFactor = Math.pow(0.9, elapsedDays);
        newPlantState.stressLevel = newPlantState.stressLevel * stressDecayFactor + stressToAdd;
        newPlantState.stressLevel = Math.min(100, Math.max(0, newPlantState.stressLevel));

        const newProblems = _checkForNewProblems(newPlantState, getProblemDetails);
        const oldProblemTypes = new Set(newPlantState.problems.map(p => p.type));
        newPlantState.problems = newProblems;
        
        if (settings.simulationSettings.autoJournaling.problems) {
            newProblems.forEach(problem => {
                if (!oldProblemTypes.has(problem.type)) {
                    newPlantState.journal.push({ id: `sys-prob-${Date.now()}`, timestamp: targetTimestamp, type: 'SYSTEM', notes: t('plantsView.journal.problemDetected', { message: problem.message }) });
                }
            });
        }
        
        const wateringTaskTitle = t('plantsView.tasks.wateringTask.title');
        if(newPlantState.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATERING_TASK_THRESHOLD && !newPlantState.tasks.some(t => t.title === wateringTaskTitle && !t.isCompleted)) {
            const newTask: Task = {id: `task-${Date.now()}`, title: wateringTaskTitle, description: t('plantsView.tasks.wateringTask.description'), priority: 'high', isCompleted: false, createdAt: targetTimestamp };
            newPlantState.tasks.push(newTask);
            if (settings.simulationSettings.autoJournaling.tasks) {
                newPlantState.journal.push({ id: `sys-task-${Date.now()}`, timestamp: targetTimestamp, type: 'SYSTEM', notes: t('plantsView.journal.newTask', { title: newTask.title }) });
            }
            if (settings.notificationSettings.newTask) addNotification(`${plant.name}: ${newTask.title}`, 'info');
        }

        if (newPlantState.age > (plant.history[plant.history.length-1]?.day || -1)) {
            newPlantState.history.push({ day: newPlantState.age, vitals: { ...newPlantState.vitals }, stressLevel: newPlantState.stressLevel, height: newPlantState.height });
        }

        newPlantState.lastUpdated = targetTimestamp;
        return newPlantState;
    }, [settings, addNotification, t, getProblemDetails, calculateYield]);

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
                
                if (entry.details.ph) {
                    const newPh = entry.details.ph;
                    updatedPlant.vitals.ph = (updatedPlant.vitals.ph * SIMULATION_CONSTANTS.PH_BUFFER_FACTOR) + (newPh * (1 - SIMULATION_CONSTANTS.PH_BUFFER_FACTOR));
                }
                
                if (entry.type === 'FEEDING' && entry.details.ec) {
                   updatedPlant.vitals.ec = entry.details.ec;
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