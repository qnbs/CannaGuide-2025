import { StoreSet, StoreGet } from '../useAppStore';
import { Plant, PlantStage } from '@/types';
import { simulationService } from '@/services/plantSimulationService';

// Keep track of the requestAnimationFrame ID
let rafId: number | null = null;

// The base duration of one simulated day in milliseconds at 1x speed
const SIMULATION_DAY_BASE_MS = 5 * 60 * 1000; // 5 minutes

export interface SimulationSlice {
    isCatchingUp: boolean;
    isInitialized: boolean;
    isSimulationRunning: boolean;
    lastFrameTime: number; // For deltaTime calculation
    timeAccumulator: number; // To accumulate real time for simulation ticks
    lastActiveTimestamp: number | null; // For offline progress calculation

    initializeSimulation: () => Promise<void>;
    _simulationLoop: () => void;
    _updateTimer: () => void;
    _saveTimestamp: () => void;
}

export const createSimulationSlice = (set: StoreSet, get: StoreGet): SimulationSlice => ({
    isCatchingUp: false,
    isInitialized: false,
    isSimulationRunning: false,
    lastFrameTime: 0,
    timeAccumulator: 0,
    lastActiveTimestamp: null,

    initializeSimulation: async () => {
        if (get().isInitialized) return;
        set({ isInitialized: true });

        const lastTimestamp = get().lastActiveTimestamp;
        const { settings, plants, advanceMultipleDays } = get();

        if (lastTimestamp && settings.simulationSettings.autoAdvance) {
            const now = Date.now();
            const diffMs = now - lastTimestamp;
            const speedMultiplier = { '1x': 1, '2x': 2, '4x': 4 }[settings.simulationSettings.speed] || 1;
            const effectiveMissedTimeMs = diffMs * speedMultiplier;
            const missedTicks = Math.floor(effectiveMissedTimeMs / SIMULATION_DAY_BASE_MS);
            
            const activePlantsCount = Object.values(plants).filter((p): p is Plant => !!p).filter(p => p.stage !== PlantStage.Finished).length;

            if (missedTicks > 0 && activePlantsCount > 0) {
                console.log(`[SimulationSlice] Catching up on ${missedTicks} missed ticks (days).`);
                set({ isCatchingUp: true });
                await new Promise(resolve => setTimeout(resolve, 50)); // Allow UI to render overlay
                advanceMultipleDays(missedTicks);
                set({ isCatchingUp: false });
            }
        }
        set({ lastActiveTimestamp: null });

        get()._updateTimer();

        window.removeEventListener('visibilitychange', get()._saveTimestamp);
        window.removeEventListener('pagehide', get()._saveTimestamp);
        window.addEventListener('visibilitychange', get()._saveTimestamp);
        window.addEventListener('pagehide', get()._saveTimestamp);
    },

    _saveTimestamp: () => {
        if (document.visibilityState === 'hidden' && get().settings.simulationSettings.autoAdvance) {
            console.log('[SimulationSlice] Window hidden, saving timestamp.');
            set({ lastActiveTimestamp: Date.now() });
        }
    },

    _simulationLoop: () => {
        const now = performance.now();
        const lastFrameTime = get().lastFrameTime || now;
        const deltaTime = now - lastFrameTime;

        set({ lastFrameTime: now });
        
        const { settings, advanceDay, timeAccumulator } = get();
        const { autoAdvance, speed } = settings.simulationSettings;
        
        const activePlantsCount = Object.values(get().plants).filter((p): p is Plant => !!p).filter(p => p.stage !== PlantStage.Finished).length;

        if (!autoAdvance || activePlantsCount === 0) {
            get()._updateTimer(); // This will stop the loop
            return;
        }

        const speedMultiplier = { '1x': 1, '2x': 2, '4x': 4 }[speed] || 1;
        let newAccumulator = timeAccumulator + (deltaTime * speedMultiplier);
        
        // Process accumulated time in ticks
        while (newAccumulator >= SIMULATION_DAY_BASE_MS) {
            advanceDay();
            newAccumulator -= SIMULATION_DAY_BASE_MS;
        }

        set({ timeAccumulator: newAccumulator });
        
        rafId = window.requestAnimationFrame(get()._simulationLoop);
    },
    
    _updateTimer: () => {
        if (rafId !== null) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
        }

        const { settings, plants } = get();
        const { autoAdvance } = settings.simulationSettings;
        const activePlantsCount = Object.values(plants).filter((p): p is Plant => !!p).filter(p => p.stage !== PlantStage.Finished).length;

        if (autoAdvance && activePlantsCount > 0) {
            console.log(`[SimulationSlice] Starting simulation with rAF for ${activePlantsCount} plant(s).`);
            set({ 
                isSimulationRunning: true,
                lastFrameTime: performance.now(),
            });
            rafId = window.requestAnimationFrame(get()._simulationLoop);
        } else {
            console.log('[SimulationSlice] Simulation stopped.');
            set({ isSimulationRunning: false });
        }
    },
});