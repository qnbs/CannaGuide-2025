import { store } from '@/stores/store';
import { tick } from '@/stores/slices/simulationSlice';

let rafId: number | null = null;
let lastFrameTime = 0;

function loop(now: number) {
    const settings = store.getState().settings.settings.simulationSettings;
    
    if (settings.autoAdvance) {
        if (lastFrameTime === 0) {
            lastFrameTime = now;
        }
        const deltaTime = now - lastFrameTime;
        lastFrameTime = now;
        
        store.dispatch(tick({ deltaTime }));
    }

    rafId = requestAnimationFrame(loop);
}

function start() {
    if (rafId !== null) {
        return;
    }
    console.log('[SimulationLoop] Starting...');
    lastFrameTime = performance.now();
    rafId = requestAnimationFrame(loop);
}

function stop() {
    if (rafId !== null) {
        console.log('[SimulationLoop] Stopping...');
        cancelAnimationFrame(rafId);
        rafId = null;
        lastFrameTime = 0;
    }
}

function initialize() {
    let previousAutoAdvance = store.getState().settings.settings.simulationSettings.autoAdvance;
    
    store.subscribe(() => {
        const currentAutoAdvance = store.getState().settings.settings.simulationSettings.autoAdvance;
        if (previousAutoAdvance !== currentAutoAdvance) {
            if (currentAutoAdvance) {
                start();
            } else {
                stop();
            }
            previousAutoAdvance = currentAutoAdvance;
        }
    });

    if (store.getState().settings.settings.simulationSettings.autoAdvance) {
        start();
    }
}

export const simulationLoop = {
    initialize,
};