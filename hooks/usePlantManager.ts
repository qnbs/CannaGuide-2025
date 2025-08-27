import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plant, PlantStage, PlantProblem, JournalEntry, Task, JournalEntryType } from '../types';
import { PLANT_STAGE_DETAILS, STAGES_ORDER, PROBLEM_THRESHOLDS, YIELD_FACTORS } from '../constants';
import { useSettings } from './useSettings';
import { useNotifications } from '../context/NotificationContext';

const problemMessages = {
    PhTooLow: { message: "pH-Wert ist zu niedrig.", solution: "pH-Wert mit 'pH Up' anheben." },
    PhTooHigh: { message: "pH-Wert ist zu hoch.", solution: "pH-Wert mit 'pH Down' senken." },
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
                const isNutrientLockout = newPlantState.vitals.ph < 5.8 || newPlantState.vitals.ph > 7.0;
                const nutrientUptakeMultiplier = isNutrientLockout ? 0.2 : 1;

                newPlantState.vitals.substrateMoisture = Math.max(0, newPlantState.vitals.substrateMoisture - currentStageInfo.waterConsumption * elapsedDays);
                newPlantState.vitals.ec = Math.max(0, newPlantState.vitals.ec - currentStageInfo.nutrientConsumption * nutrientUptakeMultiplier * elapsedDays);
                
                // pH tends to drift towards neutral
                newPlantState.vitals.ph += (6.5 - newPlantState.vitals.ph) * 0.05 * elapsedDays;

                // Growth
                const growthFactor = 1 - (newPlantState.stressLevel / 150); // Stress reduces growth
                newPlantState.height += currentStageInfo.growthRate * growthFactor * elapsedDays;
            }

            // Stress and Problems
            let stressFromProblems = 0;
            const ideal = { ...currentStageInfo.idealEnv, ...currentStageInfo.idealVitals };

            if (Math.abs(newPlantState.vitals.ph - (ideal.ph.min + ideal.ph.max)/2) > 0.5) stressFromProblems += 5;
            if (newPlantState.vitals.ec > ideal.ec.max) stressFromProblems += (newPlantState.vitals.ec - ideal.ec.max) * 10;
            if (newPlantState.vitals.substrateMoisture < 30) stressFromProblems += (30 - newPlantState.vitals.substrateMoisture) * 0.2;

            const stressDecayFactor = Math.pow(0.9, elapsedDays);
            newPlantState.stressLevel = newPlantState.stressLevel * stressDecayFactor + stressFromProblems * elapsedDays;
            newPlantState.stressLevel = Math.min(100, Math.max(0, newPlantState.stressLevel));

            // Generate new problems and tasks
            let newProblems: PlantProblem[] = [];
            if(newPlantState.vitals.ph < PROBLEM_THRESHOLDS.ph.low) newProblems.push({type: 'PhTooLow', message: problemMessages.PhTooLow.message, solution: problemMessages.PhTooLow.solution});
            if(newPlantState.vitals.ph > PROBLEM_THRESHOLDS.ph.high) newProblems.push({type: 'PhTooHigh', message: problemMessages.PhTooHigh.message, solution: problemMessages.PhTooHigh.solution});

            newPlantState.problems = newProblems; // Simple replacement for now

            // Task generation
            const hasTask = (title: string) => newPlantState.tasks.some((t: Task) => t.title === title && !t.isCompleted);
            const wateringTaskTitle = 'Gießen erforderlich';
            if(newPlantState.vitals.substrateMoisture < 30 && !hasTask(wateringTaskTitle)) {
                newPlantState.tasks.push({id: `task-${Date.now()}`, title: wateringTaskTitle, description: 'Das Substrat ist zu trocken.', priority: 'high', isCompleted: false, createdAt: now });
            }
             const checkPhTaskTitle = 'pH-Wert prüfen';
             if((newPlantState.vitals.ph < 5.8 || newPlantState.vitals.ph > 7.0) && !hasTask(checkPhTaskTitle)) {
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
                const moistureReplenish = (entry.details.waterAmount / (p.growSetup.potSize * 1000)) * 200;
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
            if (p && p.vitals.substrateMoisture < 50 && p.stage !== PlantStage.Finished) {
                wateredCount++;
                const updatedPlant = JSON.parse(JSON.stringify(p));
                
                const moistureReplenish = (500 / (p.growSetup.potSize * 1000)) * 200;
                updatedPlant.vitals.substrateMoisture = Math.min(100, p.vitals.substrateMoisture + moistureReplenish);
                updatedPlant.vitals.ph = 6.5; 

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
                    details: { waterAmount: 500, ph: 6.5 }
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