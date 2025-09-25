import { Plant, PlantStage, PlantVitals, PlantHistoryEntry, PlantShoot, PlantNode } from '@/types';
import { useAppStore } from '@/stores/useAppStore';
import { produce } from 'immer';

// --- STAGE DETAILS CONSTANT ---

interface StageDetails {
    duration: number; // in days
    idealVitals: {
        ph: { min: number; max: number };
        ec: { min: number; max: number };
    };
    heightGain: { min: number; max: number }; // cm per day
    stressFactors: {
        vpd: number;
        ph: number;
        ec: number;
        moisture: number;
    };
}

export const PLANT_STAGE_DETAILS: Record<PlantStage, StageDetails> = {
    [PlantStage.Seed]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 6.5 }, ec: { min: 0.2, max: 0.4 } }, heightGain: { min: 0, max: 0 }, stressFactors: { vpd: 0.1, ph: 0.5, ec: 0.5, moisture: 0.3 } },
    [PlantStage.Germination]: { duration: 5, idealVitals: { ph: { min: 6.0, max: 6.5 }, ec: { min: 0.2, max: 0.4 } }, heightGain: { min: 0.1, max: 0.3 }, stressFactors: { vpd: 0.1, ph: 0.5, ec: 0.5, moisture: 0.3 } },
    [PlantStage.Seedling]: { duration: 14, idealVitals: { ph: { min: 5.8, max: 6.2 }, ec: { min: 0.5, max: 1.0 } }, heightGain: { min: 0.5, max: 1.5 }, stressFactors: { vpd: 0.2, ph: 0.4, ec: 0.4, moisture: 0.2 } },
    [PlantStage.Vegetative]: { duration: 28, idealVitals: { ph: { min: 5.8, max: 6.2 }, ec: { min: 1.2, max: 1.8 } }, heightGain: { min: 1.5, max: 3.0 }, stressFactors: { vpd: 0.3, ph: 0.3, ec: 0.3, moisture: 0.1 } },
    [PlantStage.Flowering]: { duration: 56, idealVitals: { ph: { min: 6.0, max: 6.5 }, ec: { min: 1.8, max: 2.4 } }, heightGain: { min: 0.5, max: 1.5 }, stressFactors: { vpd: 0.4, ph: 0.2, ec: 0.2, moisture: 0.1 } },
    [PlantStage.Harvest]: { duration: 1, idealVitals: { ph: { min: 6.0, max: 6.5 }, ec: { min: 0.0, max: 0.4 } }, heightGain: { min: 0, max: 0 }, stressFactors: { vpd: 0, ph: 0, ec: 0, moisture: 0 } },
    [PlantStage.Drying]: { duration: 10, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } }, heightGain: { min: 0, max: 0 }, stressFactors: { vpd: 0, ph: 0, ec: 0, moisture: 0 } },
    [PlantStage.Curing]: { duration: 14, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } }, heightGain: { min: 0, max: 0 }, stressFactors: { vpd: 0, ph: 0, ec: 0, moisture: 0 } },
    [PlantStage.Finished]: { duration: Infinity, idealVitals: { ph: { min: 0, max: 0 }, ec: { min: 0, max: 0 } }, heightGain: { min: 0, max: 0 }, stressFactors: { vpd: 0, ph: 0, ec: 0, moisture: 0 } },
};

// --- IDEAL HISTORY GENERATOR ---

export const generateIdealHistory = (plant: Plant) => {
    const idealHistory: PlantHistoryEntry[] = [];
    const idealVitalRanges: any[] = [];
    let currentHeight = 0;
    
    Object.values(PlantStage).forEach(stage => {
        const details = PLANT_STAGE_DETAILS[stage];
        if (details.duration === Infinity) return;

        for (let i = 0; i < details.duration; i++) {
            const day = idealHistory.length;
            const heightGain = (details.heightGain.min + details.heightGain.max) / 2;
            currentHeight += heightGain;
            idealHistory.push({
                day: day,
                height: currentHeight,
                stressLevel: 5, // A low, baseline stress
                vitals: {
                    ph: (details.idealVitals.ph.min + details.idealVitals.ph.max) / 2,
                    ec: (details.idealVitals.ec.min + details.idealVitals.ec.max) / 2,
                    substrateMoisture: 60,
                }
            });
        }
    });

    return { idealHistory, idealVitalRanges };
};


// --- SIMULATION SERVICE ---

class SimulationService {
    private timers: Map<string, number> = new Map();

    private runSimulationTick(plantId: string) {
        const { advanceDay } = useAppStore.getState();
        advanceDay(plantId);
    }

    startSimulation(plantId: string) {
        this.stopSimulation(plantId); // Ensure no duplicate timers
        const { simulationSettings } = useAppStore.getState().settings;
        const speedMap = { '1x': 300000, '2x': 150000, '5x': 60000 };
        const interval = simulationSettings.autoAdvance ? (speedMap[simulationSettings.speed as keyof typeof speedMap] || 300000) : 300000;

        const timer = setInterval(() => {
            const state = useAppStore.getState();
            if (state.settings.simulationSettings.autoAdvance) {
                this.runSimulationTick(plantId);
            }
        }, interval);

        this.timers.set(plantId, timer);
    }

    stopSimulation(plantId: string) {
        if (this.timers.has(plantId)) {
            clearInterval(this.timers.get(plantId));
            this.timers.delete(plantId);
        }
    }

    stopAllSimulations() {
        this.timers.forEach(timer => clearInterval(timer));
        this.timers.clear();
    }
    
    // --- Structural Growth and Training Logic ---

    private findShoot(shoot: PlantShoot, shootId: string): PlantShoot | null {
        if (shoot.id === shootId) return shoot;
        for (const node of shoot.nodes) {
            for (const childShoot of node.shoots) {
                const found = this.findShoot(childShoot, shootId);
                if (found) return found;
            }
        }
        return null;
    }

    private updateLightExposure(plant: Plant): Plant {
      return produce(plant, draft => {
          const traverse = (shoot: PlantShoot, parentExposure: number) => {
              const angleModifier = Math.cos(shoot.angle * (Math.PI / 180));
              let occlusion = 0;
              
              const sortedNodes = shoot.nodes.slice().sort((a,b) => a.position - b.position);

              for (const node of sortedNodes) {
                  node.lightExposure = Math.max(0, parentExposure - occlusion);
                  occlusion += 0.1 * angleModifier; // Nodes above cast shadow downwards
                  
                  for (const childShoot of node.shoots) {
                      traverse(childShoot, node.lightExposure);
                  }
              }
          };
          traverse(draft.structuralModel, 1.0);
      });
    }

    calculateGrowth(plant: Plant): Plant {
        const grownPlant = produce(plant, draft => {
            let growthEnergy = (draft.health / 100) * 0.5; // cm of growth per day in ideal conditions
            const FLOWERING_STRETCH_DAYS = 14;
            const STRETCH_MULTIPLIER = 2.0;

            if (draft.stage === PlantStage.Flowering && draft.daysInFlowering <= FLOWERING_STRETCH_DAYS) {
                growthEnergy *= STRETCH_MULTIPLIER;
            } else if (draft.stage === PlantStage.Flowering && draft.daysInFlowering > FLOWERING_STRETCH_DAYS) {
                growthEnergy *= 0.2; // Slow down vertical growth after stretch
            }

            if (growthEnergy <= 0) return;
            if (draft.stage !== PlantStage.Vegetative && draft.stage !== PlantStage.Flowering) return;

            const grow = (shoot: PlantShoot, energy: number, isMain: boolean) => {
                const topNode = shoot.nodes[shoot.nodes.length - 1];
                
                if (topNode && topNode.isTopped) {
                    if (topNode.shoots.length > 0) {
                        const energyPerShoot = energy / topNode.shoots.length;
                        topNode.shoots.forEach(sideShoot => grow(sideShoot, energyPerShoot, false));
                    }
                } else {
                    const oldLength = shoot.length;
                    // Apical dominance: main stem grows more
                    const energyToApply = isMain ? energy : energy * 0.7; 
                    shoot.length += energyToApply;

                    const nodeCreationThreshold = 5; // cm
                    if (Math.floor(shoot.length / nodeCreationThreshold) > Math.floor(oldLength / nodeCreationThreshold)) {
                        const newNodePosition = shoot.nodes.length;
                        shoot.nodes.push({
                            id: `node-${draft.id}-${shoot.id}-${newNodePosition}`,
                            position: newNodePosition,
                            lightExposure: 1, // Will be recalculated
                            isTopped: false,
                            shoots: [],
                        });
                    }
                }
            };
            
            grow(draft.structuralModel, growthEnergy, true);

            // Recalculate total height from the main stem's length and angle
            const mainStem = draft.structuralModel;
            draft.height = parseFloat((mainStem.length * Math.cos(mainStem.angle * (Math.PI / 180))).toFixed(2));
        });
        
        return this.updateLightExposure(grownPlant);
    }

    topPlant(plant: Plant): Plant {
      return produce(plant, draft => {
          const mainStem = draft.structuralModel;
          if (!mainStem.isMainStem || mainStem.nodes.length === 0) return;

          const topNode = mainStem.nodes.slice().sort((a, b) => b.position - a.position)[0];
          
          if (topNode && !topNode.isTopped) {
              topNode.isTopped = true;
              
              if (topNode.shoots.length === 0) {
                   topNode.shoots.push({
                      id: `shoot-${draft.id}-${topNode.id}-L`,
                      length: 0.1,
                      nodes: [],
                      isMainStem: false,
                      angle: 45,
                  });
                   topNode.shoots.push({
                      id: `shoot-${draft.id}-${topNode.id}-R`,
                      length: 0.1,
                      nodes: [],
                      isMainStem: false,
                      angle: -45,
                  });
              }
          }
      });
    }
    
    applyLST(plant: Plant, shootId: string, angle: number): Plant {
        const updatedPlant = produce(plant, draft => {
            const shoot = this.findShoot(draft.structuralModel, shootId);
            if (shoot) {
                shoot.angle = angle;
            }
        });
        return this.updateLightExposure(updatedPlant);
    }
}

export const simulationService = new SimulationService();