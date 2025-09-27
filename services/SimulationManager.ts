import { useAppStore } from '@/stores/useAppStore';
import { Plant, PlantStage } from '@/types';

const SIMULATION_DAY_BASE_MS = 5 * 60 * 1000; // 5 minutes for 1x speed

class SimulationManager {
    private rafId: number | null = null;
    private lastFrameTime: number = 0;
    private timeAccumulator: number = 0;
    private isRunning: boolean = false;

    constructor() {
        this.simulationLoop = this.simulationLoop.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.saveTimestamp = this.saveTimestamp.bind(this);
    }

    public async initialize() {
        if (useAppStore.getState().isInitialized) return;
        useAppStore.getState().setIsInitialized(true);

        const lastTimestamp = useAppStore.getState().lastActiveTimestamp;
        const { settings, plants, advanceMultipleDays } = useAppStore.getState();

        if (lastTimestamp && settings.simulationSettings.autoAdvance) {
            const now = Date.now();
            const diffMs = now - lastTimestamp;
            const speedMultiplier = { '1x': 1, '2x': 2, '4x': 4 }[settings.simulationSettings.speed] || 1;
            const effectiveMissedTimeMs = diffMs * speedMultiplier;
            const missedTicks = Math.floor(effectiveMissedTimeMs / SIMULATION_DAY_BASE_MS);
            
            const activePlantsCount = Object.values(plants).filter((p): p is Plant => !!p).filter(p => p.stage !== PlantStage.Finished).length;

            if (missedTicks > 0 && activePlantsCount > 0) {
                console.log(`[SimulationManager] Catching up on ${missedTicks} missed ticks (days).`);
                useAppStore.getState().setIsCatchingUp(true);
                await new Promise(resolve => setTimeout(resolve, 50));
                advanceMultipleDays(missedTicks);
                useAppStore.getState().setIsCatchingUp(false);
            }
        }
        useAppStore.getState().setLastActiveTimestamp(null);

        window.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('pagehide', this.saveTimestamp);
        this.update();
    }

    private saveTimestamp() {
        if (useAppStore.getState().settings.simulationSettings.autoAdvance) {
            console.log('[SimulationManager] Page hidden, saving timestamp.');
            useAppStore.getState().setLastActiveTimestamp(Date.now());
        }
    }

    private handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            this.saveTimestamp();
        } else {
            this.update();
        }
    }

    private simulationLoop(now: number) {
        if (!this.isRunning) return;

        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        const { settings, advanceDay } = useAppStore.getState();
        const { speed } = settings.simulationSettings;

        const speedMultiplier = { '1x': 1, '2x': 2, '4x': 4 }[speed] || 1;
        this.timeAccumulator += (deltaTime * speedMultiplier);
        
        while (this.timeAccumulator >= SIMULATION_DAY_BASE_MS) {
            advanceDay();
            this.timeAccumulator -= SIMULATION_DAY_BASE_MS;
        }
        
        this.rafId = requestAnimationFrame(this.simulationLoop);
    }
    
    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.rafId = requestAnimationFrame(this.simulationLoop);
    }

    public stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    public update() {
         const { settings, plants } = useAppStore.getState();
         const { autoAdvance } = settings.simulationSettings;
         const activePlantsCount = Object.values(plants).filter((p): p is Plant => !!p).filter(p => p.stage !== PlantStage.Finished).length;
         
         if(autoAdvance && activePlantsCount > 0) {
             console.log('[SimulationManager] Starting/updating simulation.');
             this.start();
         } else {
             console.log('[SimulationManager] Stopping simulation.');
             this.stop();
         }
    }
}

export const simulationManager = new SimulationManager();
