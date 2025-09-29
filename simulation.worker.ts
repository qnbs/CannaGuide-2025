import { Plant } from './types';
import { simulationService } from './services/plantSimulationService';

self.onmessage = (e: MessageEvent<{ plants: Record<string, Plant>, deltaTime: number }>) => {
    const { plants, deltaTime } = e.data;
    const updatedPlants: Plant[] = [];

    if (deltaTime > 0) {
        for (const plantId in plants) {
            const plant = plants[plantId];
            const { updatedPlant } = simulationService.calculateStateForTimeDelta(plant, deltaTime);

            const daysSimulated = updatedPlant.age - plant.age;
            if (daysSimulated > 0) {
                const simulatedMilliseconds = daysSimulated * 24 * 60 * 60 * 1000;
                updatedPlant.lastUpdated = plant.lastUpdated + simulatedMilliseconds;
            }
            
            updatedPlants.push(updatedPlant);
        }
    } else {
        // If no time has passed, just return the original plants to avoid unnecessary updates
        updatedPlants.push(...Object.values(plants));
    }
    
    self.postMessage(updatedPlants);
};
