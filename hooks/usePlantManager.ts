import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plant, PlantStage, PlantProblem, JournalEntry, Task, JournalEntryType } from '../types';
import { PLANT_STAGE_DETAILS, STAGES_ORDER, PROBLEM_THRESHOLDS, YIELD_FACTORS, SIMULATION_CONSTANTS } from '../constants';
import { useSettings } from './useSettings';
import { useNotifications } from '../context/NotificationContext';

const problemMessages = {
    Overwatering: { message: "Überwässerung.", solution: "Weniger häufig gießen. Substrat austrocknen lassen." },
    Underwatering: { message: "Unterwässerung.", solution: "Pflanze gründlich gießen." },
    NutrientBurn: { message: "Nährstoffverbrennung.", solution: "EC-Wert der Nährlösung reduzieren. Mit klarem Wasser spülen." },
    NutrientDeficiency: { message: "Nährstoffmangel.", solution: "EC-Wert der Nährlösung erhöhen. Düngen." },
    PhTooLow: { message: "pH-Wert ist zu niedrig.", solution: "pH-Wert mit 'pH Up' anheben." },
    PhTooHigh: { message: "pH-Wert ist zu hoch.", solution: "pH-Wert mit 'pH Down' senken." },
    TempTooHigh: { message: "Hitzestress.", solution: "Temperatur senken, für mehr Luftzirkulation sorgen." },
    TempTooLow: { message: "Kältestress.", solution: "Temperatur erhöhen. Wachstum kann verlangsamt sein." },
    HumidityTooHigh: { message: "Luftfeuchtigkeit zu hoch.", solution: "Abluft erhöhen. In der Blütephase besteht Schimmelgefahr!" },
    HumidityTooLow: { message: "Luftfeuchtigkeit zu niedrig.", solution: "Luftbefeuchter einsetzen oder Wasserschalen aufstellen." },
}

export const usePlantManager = (
    initialPlants: (Plant | null)[],
    setGlobalPlants: React.Dispatch<React.SetStateAction<(Plant | null)[]>>
) => {
    const { settings } = useSettings();
    const { addNotification } = useNotifications();
    const [plants, setPlants] = useState(initialPlants);

    const calculateYield = (plant: Plant): number => {
        const baseYield = YIELD_FACTORS.base[plant.strain.agronomic.yield] || YIELD_FACTORS.base.Medium;
        const avgStress = plant.history.reduce((acc, cur) => acc + cur.stressLevel, 0) / plant.history.length || 0;
        
        const stressPenalty = (avgStress / 100) * YIELD_FACTORS.stressModifier;
        const heightBonus = (plant.height / 100) * YIELD_FACTORS.heightModifier; // Assume 100cm is a good baseline height
        
        const setup = plant.growSetup;
        const lightMod = YIELD_FACTORS.setupModifier.light[setup.lightType];
        const potMod = YIELD_FACTORS.setupModifier.potSize[setup.potSize];
        const mediumMod = YIELD_FACTORS.setupModifier.medium[setup.medium];
        const setupMultiplier = lightMod * potMod * mediumMod;

        const finalYield = baseYield * (1 + stressPenalty + heightBonus) * setupMultiplier;
        
        return Math.max(5, finalYield);
    };

    const updatePlantState = useCallback((plantId: string): Plant | null => {
        let updatedPlant: Plant | null = null;
        setPlants(currentPlants => {
            const newPlants = currentPlants.map(p => p ? {...p} : null);
            const plantIndex = newPlants.findIndex(p => p?.id === plantId);
            if (plantIndex === -1) return currentPlants;
            
            const plant = newPlants[plantIndex];
            if (!plant || plant.stage === PlantStage.Finished) {
                updatedPlant = plant;
                return currentPlants;
            }

            const now = Date.now();
            const elapsedMs = now - plant.lastUpdated;
            if (elapsedMs <= 1000) { // Only update if significant time has passed
                 updatedPlant = plant;
                 return currentPlants;
            }
            
            const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

            let newPlantState = JSON.parse(JSON.stringify(plant)); // Deep copy
            
            const totalElapsedMsFromStart = now - newPlantState.startedAt;
            newPlantState.age = Math.floor(totalElapsedMsFromStart / (1000 * 60 * 60 * 24));

            let currentStageInfo = PLANT_STAGE_DETAILS[newPlantState.stage];
            const stageProgress = STAGES_ORDER.slice(0, STAGES_ORDER.indexOf(newPlantState.stage)).reduce((acc, stage) => acc + PLANT_STAGE_DETAILS[stage].duration, 0);

            if (currentStageInfo.next && (newPlantState.age - stageProgress) >= currentStageInfo.duration) {
                newPlantState.stage = currentStageInfo.next;
                currentStageInfo = PLANT_STAGE_DETAILS[newPlantState.stage];
                const logMessage = `Neue Phase erreicht: ${newPlantState.stage}`;
                newPlantState.journal.push({ id: `sys-${Date.now()}`, timestamp: now, type: 'SYSTEM', notes: logMessage });
                if (settings.notificationSettings.stageChange) addNotification(`${plant.name}: ${logMessage}`, 'info');
                if (newPlantState.stage === PlantStage.Harvest && settings.notificationSettings.harvestReady) addNotification(`${plant.name} ist bereit zur Ernte!`, 'info');
                if(newPlantState.stage === PlantStage.Finished) {
                    newPlantState.yield = calculateYield(newPlantState);
                    const yieldMessage = `Endgültiger Ertrag nach Aushärtung: ${newPlantState.yield.toFixed(2)}g`;
                    newPlantState.journal.push({ id: `sys-${Date.now()+1}`, timestamp: now, type: 'SYSTEM', notes: yieldMessage });
                }
            }

            // Vitals simulation
            if (newPlantState.stage !== PlantStage.Drying && newPlantState.stage !== PlantStage.Curing && newPlantState.stage !== PlantStage.Finished) {
                const isNutrientLockout = newPlantState.vitals.ph < SIMULATION_CONSTANTS.NUTRIENT_LOCKOUT_PH_LOW || newPlantState.vitals.ph > SIMULATION_CONSTANTS.NUTRIENT_LOCKOUT_PH_HIGH;
                const nutrientUptakeMultiplier = isNutrientLockout ? 0.2 : 1;

                newPlantState.vitals.substrateMoisture = Math.max(0, newPlantState.vitals.substrateMoisture - currentStageInfo.waterConsumption * elapsedDays);
                newPlantState.vitals.ec = Math.max(0, newPlantState.vitals.ec - currentStageInfo.nutrientConsumption * nutrientUptakeMultiplier * elapsedDays);
                
                // pH tends to drift towards neutral
                newPlantState.vitals.ph += (SIMULATION_CONSTANTS.PH_DRIFT_TARGET - newPlantState.vitals.ph) * SIMULATION_CONSTANTS.PH_DRIFT_FACTOR * elapsedDays;

                // Growth
                const growthFactor = 1 - (newPlantState.stressLevel / SIMULATION_CONSTANTS.STRESS_GROWTH_PENALTY_DIVISOR); // Stress reduces growth
                newPlantState.height += currentStageInfo.growthRate * growthFactor * elapsedDays;
            }

            // Stress and Problems
            let stressFromProblems = 0;
            const idealVitals = currentStageInfo.idealVitals;
            const idealEnv = currentStageInfo.idealEnv;
            
            const { vitals, environment } = newPlantState;

            if (Math.abs(vitals.ph - (idealVitals.ph.min + idealVitals.ph.max)/2) > 0.5) stressFromProblems += 5;
            if (vitals.ec > idealVitals.ec.max * 1.2) stressFromProblems += (vitals.ec - idealVitals.ec.max) * 10;
            if (vitals.substrateMoisture < PROBLEM_THRESHOLDS.moisture.under) stressFromProblems += (PROBLEM_THRESHOLDS.moisture.under - vitals.substrateMoisture) * 0.3;
            if (vitals.substrateMoisture > PROBLEM_THRESHOLDS.moisture.over) stressFromProblems += (vitals.substrateMoisture - PROBLEM_THRESHOLDS.moisture.over) * 0.3;
            
            if (environment.temperature > idealEnv.temp.max) {
                stressFromProblems += (environment.temperature - idealEnv.temp.max) * 2;
            } else if (environment.temperature < idealEnv.temp.min) {
                stressFromProblems += (idealEnv.temp.min - environment.temperature) * 1.5;
            }
            if (environment.humidity > idealEnv.humidity.max) {
                stressFromProblems += (environment.humidity - idealEnv.humidity.max) * 1;
            } else if (environment.humidity < idealEnv.humidity.min) {
                stressFromProblems += (idealEnv.humidity.min - environment.humidity) * 1;
            }


            const stressDecayFactor = Math.pow(0.9, elapsedDays);
            newPlantState.stressLevel = newPlantState.stressLevel * stressDecayFactor + stressFromProblems * elapsedDays;
            newPlantState.stressLevel = Math.min(100, Math.max(0, newPlantState.stressLevel));

            // Generate new problems and tasks
            const newProblems: PlantProblem[] = [];
            const humidityThresholds = newPlantState.stage === PlantStage.Flowering ? PROBLEM_THRESHOLDS.humidity.flowering : PROBLEM_THRESHOLDS.humidity.vegetative;

            if (vitals.ph < PROBLEM_THRESHOLDS.ph.low) newProblems.push({ type: 'PhTooLow', ...problemMessages.PhTooLow });
            if (vitals.ph > PROBLEM_THRESHOLDS.ph.high) newProblems.push({ type: 'PhTooHigh', ...problemMessages.PhTooHigh });
            if (vitals.substrateMoisture > PROBLEM_THRESHOLDS.moisture.over) newProblems.push({ type: 'Overwatering', ...problemMessages.Overwatering });
            if (vitals.substrateMoisture < PROBLEM_THRESHOLDS.moisture.under) newProblems.push({ type: 'Underwatering', ...problemMessages.Underwatering });
            if (vitals.ec > idealVitals.ec.max * 1.5) newProblems.push({ type: 'NutrientBurn', ...problemMessages.NutrientBurn });
            if (vitals.ec < PROBLEM_THRESHOLDS.ec.under && [PlantStage.Seedling, PlantStage.Vegetative, PlantStage.Flowering].includes(newPlantState.stage)) {
                newProblems.push({ type: 'NutrientDeficiency', ...problemMessages.NutrientDeficiency });
            }
            if (environment.temperature > PROBLEM_THRESHOLDS.temp.high) newProblems.push({ type: 'TempTooHigh', ...problemMessages.TempTooHigh });
            if (environment.temperature < PROBLEM_THRESHOLDS.temp.low) newProblems.push({ type: 'TempTooLow', ...problemMessages.TempTooLow });
            if (environment.humidity > humidityThresholds.high) newProblems.push({ type: 'HumidityTooHigh', ...problemMessages.HumidityTooHigh });
            if (environment.humidity < humidityThresholds.low) newProblems.push({ type: 'HumidityTooLow', ...problemMessages.HumidityTooLow });


            newPlantState.problems = newProblems; // Simple replacement for now

            // Task generation
            const hasTask = (title: string) => newPlantState.tasks.some((t: Task) => t.title === title && !t.isCompleted);
            
            const wateringTaskTitle = 'Gießen erforderlich';
            if(newPlantState.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATERING_TASK_THRESHOLD && !hasTask(wateringTaskTitle)) {
                newPlantState.tasks.push({id: `task-${Date.now()}`, title: wateringTaskTitle, description: 'Das Substrat ist zu trocken.', priority: 'high', isCompleted: false, createdAt: now });
            }

            const feedingTaskTitle = 'Düngung erforderlich';
            if (newPlantState.vitals.ec < PROBLEM_THRESHOLDS.ec.under && !hasTask(feedingTaskTitle) && [PlantStage.Seedling, PlantStage.Vegetative, PlantStage.Flowering].includes(newPlantState.stage)) {
                newPlantState.tasks.push({id: `task-${Date.now() + 1}`, title: feedingTaskTitle, description: 'Die Nährstoffkonzentration ist zu niedrig.', priority: 'high', isCompleted: false, createdAt: now });
            }

             const checkPhTaskTitle = 'pH-Wert prüfen';
             if((newPlantState.vitals.ph < SIMULATION_CONSTANTS.NUTRIENT_LOCKOUT_PH_LOW || newPlantState.vitals.ph > SIMULATION_CONSTANTS.NUTRIENT_LOCKOUT_PH_HIGH) && !hasTask(checkPhTaskTitle)) {
                newPlantState.tasks.push({id: `task-${Date.now()}`, title: checkPhTaskTitle, description: 'Der pH-Wert liegt außerhalb des optimalen Bereichs.', priority: 'medium', isCompleted: false, createdAt: now });
            }

            if (newPlantState.age > (plant.history[plant.history.length-1]?.day || -1)) {
                newPlantState.history.push({ day: newPlantState.age, vitals: { ...newPlantState.vitals }, stressLevel: newPlantState.stressLevel, height: newPlantState.height });
            }

            newPlantState.lastUpdated = now;
            newPlants[plantIndex] = newPlantState;
            updatedPlant = newPlantState;
            return newPlants;
        });

        return updatedPlant;
    }, [settings.notificationSettings, addNotification]);

    useEffect(() => {
        const updateInterval = setInterval(() => {
            plants.forEach(p => p && updatePlantState(p.id));
        }, 5000); // Standard update interval
        return () => clearInterval(updateInterval);
    }, [plants, updatePlantState]);

    useEffect(() => {
        setPlants(initialPlants);
    }, [initialPlants]);

    useEffect(() => {
        setGlobalPlants(plants);
    }, [plants, setGlobalPlants]);

    const addJournalEntry = (plantId: string, entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
        setPlants(prev => prev.map(p => {
            if (p?.id !== plantId) return p;

            const updatedPlant = JSON.parse(JSON.stringify(p));
            updatedPlant.journal.push({ ...entry, id: `manual-${Date.now()}`, timestamp: Date.now() });

            // If watering/feeding, update vitals and complete tasks
            if ((entry.type === 'WATERING' || entry.type === 'FEEDING') && entry.details) {
                // Replenish moisture based on pot size, assuming waterAmount is for a standard pot.
                const moistureReplenish = (entry.details.waterAmount / (p.growSetup.potSize * SIMULATION_CONSTANTS.ML_PER_LITER)) * SIMULATION_CONSTANTS.WATER_REPLENISH_FACTOR;
                updatedPlant.vitals.substrateMoisture = Math.min(100, p.vitals.substrateMoisture + moistureReplenish);
                updatedPlant.vitals.ph = entry.details.ph || p.vitals.ph;
                
                if (entry.type === 'FEEDING') {
                   updatedPlant.vitals.ec = entry.details.ec || p.vitals.ec;
                }

                // Auto-complete watering task
                const wateringTaskTitle = 'Gießen erforderlich';
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

    const waterAllPlants = (): number => {
        let wateredCount = 0;
        const now = Date.now();

        setPlants(currentPlants => currentPlants.map(p => {
            if (p && p.vitals.substrateMoisture < SIMULATION_CONSTANTS.WATER_ALL_THRESHOLD && p.stage !== PlantStage.Finished) {
                wateredCount++;
                const updatedPlant = JSON.parse(JSON.stringify(p));
                
                const moistureReplenish = (500 / (p.growSetup.potSize * SIMULATION_CONSTANTS.ML_PER_LITER)) * SIMULATION_CONSTANTS.WATER_REPLENISH_FACTOR;
                updatedPlant.vitals.substrateMoisture = Math.min(100, p.vitals.substrateMoisture + moistureReplenish);
                updatedPlant.vitals.ph = SIMULATION_CONSTANTS.PH_DRIFT_TARGET;

                const wateringTaskTitle = 'Gießen erforderlich';
                updatedPlant.tasks = updatedPlant.tasks.map((task: Task) => 
                    task.title === wateringTaskTitle && !task.isCompleted
                        ? { ...task, isCompleted: true, completedAt: now }
                        : task
                );

                updatedPlant.journal.push({
                    id: `manual-${now}-${p.id}`,
                    timestamp: now,
                    type: 'WATERING',
                    notes: 'Bewässerung',
                    details: { waterAmount: 500, ph: SIMULATION_CONSTANTS.PH_DRIFT_TARGET }
                });
                
                updatedPlant.lastUpdated = now;
                return updatedPlant;
            }
            return p;
        }));
        
        return wateredCount;
    };

    return {
        plants,
        updatePlantState,
        addJournalEntry,
        completeTask,
        waterAllPlants,
    };
};