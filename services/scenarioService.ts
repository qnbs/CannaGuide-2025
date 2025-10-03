
import { Plant, Scenario, ScenarioAction } from '@/types';
import { simulationService } from '@/services/plantSimulationService';

const scenarios: Record<string, Scenario> = {
    'topping-vs-lst': {
        id: 'topping-vs-lst',
        titleKey: 'scenarios.toppingVsLst.title',
        descriptionKey: 'scenarios.toppingVsLst.description',
        durationDays: 14,
        plantAModifier: { action: 'LST', day: 1 },
        plantBModifier: { action: 'TOP', day: 1 },
    },
    // Add more scenarios here
};

class ScenarioService {
    
    getScenarioById(id: string): Scenario | undefined {
        return scenarios[id];
    }

    applyAction(plant: Plant, action: ScenarioAction): Plant {
        switch (action) {
            case 'TOP':
                return simulationService.topPlant(plant).updatedPlant;
            case 'LST':
                return simulationService.applyLst(plant).updatedPlant;
            case 'NONE':
            default:
                return plant;
        }
    }

    async runComparisonScenario(basePlant: Plant, scenario: Scenario): Promise<{ plantA: Plant, plantB: Plant }> {
        return new Promise(resolve => {
            // Use setTimeout to make it non-blocking, simulating a background process
            setTimeout(() => {
                let plantA = simulationService.clonePlant(basePlant);
                let plantB = simulationService.clonePlant(basePlant);
                
                plantA.name = `${basePlant.name} (A)`;
                plantB.name = `${basePlant.name} (B)`;
                
                const oneDayInMillis = 24 * 60 * 60 * 1000;

                for (let day = 1; day <= scenario.durationDays; day++) {
                    if (day === scenario.plantAModifier.day) {
                        plantA = this.applyAction(plantA, scenario.plantAModifier.action);
                    }
                     if (day === scenario.plantBModifier.day) {
                        plantB = this.applyAction(plantB, scenario.plantBModifier.action);
                    }
                    
                    plantA = simulationService.calculateStateForTimeDelta(plantA, oneDayInMillis).updatedPlant;
                    plantB = simulationService.calculateStateForTimeDelta(plantB, oneDayInMillis).updatedPlant;
                }
                
                resolve({ plantA, plantB });
            }, 500); // Simulate some processing time
        });
    }
}

export const scenarioService = new ScenarioService();