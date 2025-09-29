import { Plant, Scenario, ScenarioAction } from '../types';
import { simulationService } from '../services/plantSimulationService';

// This is a simplified version of the main simulation service for the worker
const applyAction = (plant: Plant, action: ScenarioAction): Plant => {
    switch (action) {
        case 'TOP':
            return simulationService.topPlant(plant).updatedPlant;
        case 'LST':
            return simulationService.applyLst(plant).updatedPlant;
        case 'NONE':
        default:
            return plant;
    }
};

self.onmessage = (e: MessageEvent<{ basePlant: Plant; scenario: Scenario }>) => {
    // Deep copy using structuredClone is implicitly handled by the message passing,
    // but we do it again to ensure no mutation of the initial state.
    let plantA = structuredClone(e.data.basePlant);
    let plantB = structuredClone(e.data.basePlant);
    const { scenario } = e.data;

    // Start with fresh history for the simulation branches
    plantA.history = []; 
    plantB.history = [];

    const oneDayInMillis = 24 * 60 * 60 * 1000;

    for (let day = 1; day <= scenario.durationDays; day++) {
        if (day === scenario.plantAModifier.day) {
            plantA = applyAction(plantA, scenario.plantAModifier.action);
        }
        if (day === scenario.plantBModifier.day) {
            plantB = applyAction(plantB, scenario.plantBModifier.action);
        }
        
        // FIX: The method `runDailyCycle` does not exist. The `calculateStateForTimeDelta` method with a 1-day delta performs a daily cycle.
        plantA = simulationService.calculateStateForTimeDelta(plantA, oneDayInMillis).updatedPlant;
        // FIX: The method `runDailyCycle` does not exist. The `calculateStateForTimeDelta` method with a 1-day delta performs a daily cycle.
        plantB = simulationService.calculateStateForTimeDelta(plantB, oneDayInMillis).updatedPlant;
    }

    self.postMessage({
        originalHistory: plantA.history,
        modifiedHistory: plantB.history,
        originalFinalState: plantA,
        modifiedFinalState: plantB,
    });
};