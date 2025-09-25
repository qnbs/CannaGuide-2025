import { Plant, PlantStage, PlantVitals, PlantEnvironment, PlantProblem, JournalEntry, PlantHistoryEntry, GrowSetup, Task, PlantStructuralModel } from '@/types';
import { useAppStore } from '@/stores/useAppStore';

type StageDetails = {
    duration: number; // in days, Infinity for final stages
    idealVitals: {
        ph: { min: number; max: number };
        ec: { min: number; max: number };
    };
    idealEnvironment: {
        temperature: { min: number; max: number };
        humidity: { min: number; max: number };
    };
    dailyWaterRequirement: number; // ml per day
    growthRate: number; // cm per day
};

export const PLANT_STAGE_DETAILS: Record<PlantStage, StageDetails> = {
    [PlantStage.Seed]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.4 } }, idealEnvironment: { temperature: { min: 22, max: 25 }, humidity: { min: 70, max: 80 } }, dailyWaterRequirement: 10, growthRate: 0 },
    [PlantStage.Germination]: { duration: 5, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0.2, max: 0.4 } }, idealEnvironment: { temperature: { min: 22, max: 25 }, humidity: { min: 70, max: 80 } }, dailyWaterRequirement: 20, growthRate: 0.1 },
    [PlantStage.Seedling]: { duration: 14, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 0.4, max: 0.8 } }, idealEnvironment: { temperature: { min: 20, max: 25 }, humidity: { min: 60, max: 70 } }, dailyWaterRequirement: 100, growthRate: 0.5 },
    [PlantStage.Vegetative]: { duration: 28, idealVitals: { ph: { min: 5.8, max: 6.5 }, ec: { min: 0.8, max: 1.6 } }, idealEnvironment: { temperature: { min: 22, max: 28 }, humidity: { min: 50, max: 70 } }, dailyWaterRequirement: 500, growthRate: 1.5 },
    [PlantStage.Flowering]: { duration: 56, idealVitals: { ph: { min: 6.0, max: 6.8 }, ec: { min: 1.2, max: 2.2 } }, idealEnvironment: { temperature: { min: 20, max: 26 }, humidity: { min: 40, max: 50 } }, dailyWaterRequirement: 750, growthRate: 0.5 },
    [PlantStage.Harvest]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 7.0 }, ec: { min: 0, max: 0.4 } }, idealEnvironment: { temperature: { min: 18, max: 22 }, humidity: { min: 45, max: 55 } }, dailyWaterRequirement: 0, growthRate: 0 },
    [PlantStage.Drying]: { duration: 10, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } }, idealEnvironment: { temperature: { min: 18, max: 20 }, humidity: { min: 50, max: 60 } }, dailyWaterRequirement: 0, growthRate: 0 },
    [PlantStage.Curing]: { duration: 21, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } }, idealEnvironment: { temperature: { min: 18, max: 20 }, humidity: { min: 58, max: 62 } }, dailyWaterRequirement: 0, growthRate: 0 },
    [PlantStage.Finished]: { duration: Infinity, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } }, idealEnvironment: { temperature: { min: 0, max: 0 }, humidity: { min: 0, max: 0 } }, dailyWaterRequirement: 0, growthRate: 0 },
};

class PlantSimulationService {
    // FIX: NodeJS.Timeout is not available in the browser. The return type of setInterval is number.
    private intervals: Map<string, number> = new Map();

    private getSimulationSpeedMultiplier(): number {
        const speed = useAppStore.getState().settings.simulationSettings.speed;
        switch (speed) {
            case '2x': return 2;
            case '4x': return 4;
            default: return 1;
        }
    }

    public startSimulation(plantId: string) {
        if (this.intervals.has(plantId)) {
            this.stopSimulation(plantId);
        }
        
        const tick = () => {
             const isAutoAdvance = useAppStore.getState().settings.simulationSettings.autoAdvance;
             if (isAutoAdvance) {
                useAppStore.getState().advanceDay(plantId);
             }
        };

        // Simulate one day every 5 minutes in real time. This can be adjusted.
        const baseInterval = 1000 * 60 * 5; 
        const intervalDuration = baseInterval / this.getSimulationSpeedMultiplier();
        
        const intervalId = window.setInterval(tick, intervalDuration);
        this.intervals.set(plantId, intervalId);
    }

    public stopSimulation(plantId: string) {
        if (this.intervals.has(plantId)) {
            clearInterval(this.intervals.get(plantId)!);
            this.intervals.delete(plantId);
        }
    }

    public stopAllSimulations() {
        this.intervals.forEach((intervalId, plantId) => {
            this.stopSimulation(plantId);
        });
    }
}

export const simulationService = new PlantSimulationService();