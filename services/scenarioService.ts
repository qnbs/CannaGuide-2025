
import { Plant, Scenario, ScenarioAction } from '@/types';
import { plantSimulationService } from '@/services/plantSimulationService';

const scenarios: Record<string, Scenario> = {
    'topping-vs-lst': {
        id: 'topping-vs-lst',
        titleKey: 'knowledgeView.scenarios.toppingVsLst.title',
        descriptionKey: 'knowledgeView.scenarios.toppingVsLst.description',
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
                return plantSimulationService.topPlant(plant).updatedPlant;
            case 'LST':
                return plantSimulationService.applyLst(plant).updatedPlant;
            case 'NONE':
            default:
                return plant;
        }
    }

    async runComparisonScenario(basePlant: Plant, scenario: Scenario): Promise<{ plantA: Plant, plantB: Plant }> {
        return new Promise(resolve => {
            // Use setTimeout to make it non-blocking, simulating a background process
            setTimeout(() => {
                let plantA = plantSimulationService.clonePlant(basePlant);
                let plantB = plantSimulationService.clonePlant(basePlant);
                
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
                    
                    plantA = plantSimulationService.calculateStateForTimeDelta(plantA, oneDayInMillis).updatedPlant;
                    plantB = plantSimulationService.calculateStateForTimeDelta(plantB, oneDayInMillis).updatedPlant;
                }
                
                resolve({ plantA, plantB });
            }, 500); // Simulate some processing time
        });
    }
}

export const scenarioService = new ScenarioService();
