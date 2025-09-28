import { Plant, PlantStage, JournalEntry, PlantProblem, ProblemType, Task, GrowSetup, Strain, JournalEntryType } from '@/types';

export const PLANT_STAGE_DETAILS: Record<PlantStage, { duration: number; idealVitals: any }> = {
  [PlantStage.Seed]: { duration: 1, idealVitals: { temp: {min: 22, max: 25}, humidity: {min: 70, max: 80}, ph: {min: 6.0, max: 7.0}, ec: {min: 0, max: 0.4} } },
  [PlantStage.Germination]: { duration: 4, idealVitals: { temp: {min: 22, max: 25}, humidity: {min: 70, max: 80}, ph: {min: 6.0, max: 7.0}, ec: {min: 0, max: 0.4} } },
  [PlantStage.Seedling]: { duration: 14, idealVitals: { temp: {min: 20, max: 26}, humidity: {min: 60, max: 70}, ph: {min: 5.8, max: 6.5}, ec: {min: 0.4, max: 0.8} } },
  [PlantStage.Vegetative]: { duration: 28, idealVitals: { temp: {min: 22, max: 28}, humidity: {min: 50, max: 60}, ph: {min: 5.8, max: 6.5}, ec: {min: 0.8, max: 1.5} } },
  [PlantStage.Flowering]: { duration: 56, idealVitals: { temp: {min: 20, max: 26}, humidity: {min: 40, max: 50}, ph: {min: 6.0, max: 6.8}, ec: {min: 1.2, max: 2.0} } },
  [PlantStage.Harvest]: { duration: 1, idealVitals: {} },
  [PlantStage.Drying]: { duration: 10, idealVitals: {} },
  [PlantStage.Curing]: { duration: 21, idealVitals: {} },
  [PlantStage.Finished]: { duration: Infinity, idealVitals: {} },
};

class SimulationService {
    private _calculateVPD(temp: number, humidity: number): number {
        const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
        return svp * (1 - (humidity / 100));
    }

    createPlant(strain: Strain, setup: GrowSetup, name: string): Plant {
        const id = `plant-${Date.now()}`;
        const vpd = this._calculateVPD(setup.temperature, setup.humidity);
        return {
            id,
            name,
            strain,
            createdAt: Date.now(),
            age: 0,
            stage: PlantStage.Seed,
            height: 0,
            biomass: 0.1,
            health: 100,
            stressLevel: 0,
            problems: [],
            tasks: [],
            journal: [{
                id: `journal-${id}-start`,
                createdAt: Date.now(),
                type: JournalEntryType.System,
                notes: `Grow started for ${name} (${strain.name}).`
            }],
            history: [],
            isTopped: false,
            lstApplied: 0,
            environment: {
                internalTemperature: setup.temperature,
                internalHumidity: setup.humidity,
                vpd: vpd,
            },
            substrate: {
                ph: 6.5,
                ec: 0.2,
                moisture: 100,
            },
            rootSystem: {
                health: 100,
                microbeActivity: 50,
            },
            equipment: {
                light: { wattage: setup.light.wattage, isOn: true },
                fan: { isOn: true, speed: 50 },
            }
        };
    }
    
    // In a real simulation, this would be a complex function.
    // For now, it's a placeholder.
    runDailyCycle(plant: Plant): { updatedPlant: Plant } {
        // This is a simplified placeholder. A real implementation would be much more complex.
        const updatedPlant = { ...plant };
        updatedPlant.age += 1;
        updatedPlant.height += 1; // Simple growth
        updatedPlant.biomass += 0.5;
        
        // Randomly adjust vitals slightly
        updatedPlant.substrate.ph += (Math.random() - 0.5) * 0.1;
        updatedPlant.substrate.ec -= 0.05;
        updatedPlant.substrate.moisture -= 10;
        
        return { updatedPlant };
    }
    
    topPlant(plant: Plant): { updatedPlant: Plant, journalEntry: JournalEntry } {
        const updatedPlant = { ...plant, isTopped: true, stressLevel: Math.min(100, plant.stressLevel + 15) };
        const journalEntry: JournalEntry = {
            id: `journal-${plant.id}-${Date.now()}`,
            createdAt: Date.now(),
            type: JournalEntryType.Training,
            notes: 'Topped the main stem.',
            details: { type: 'Topping' }
        };
        return { updatedPlant, journalEntry };
    }
    
    applyLst(plant: Plant): { updatedPlant: Plant, journalEntry: JournalEntry } {
        const updatedPlant = { ...plant, lstApplied: plant.lstApplied + 1, stressLevel: Math.min(100, plant.stressLevel + 5) };
         const journalEntry: JournalEntry = {
            id: `journal-${plant.id}-${Date.now()}`,
            createdAt: Date.now(),
            type: JournalEntryType.Training,
            notes: 'Applied Low Stress Training.',
            details: { type: 'LST' }
        };
        return { updatedPlant, journalEntry };
    }
    
    clonePlant(plant: Plant): Plant {
        return JSON.parse(JSON.stringify(plant));
    }
}

export const simulationService = new SimulationService();