import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { selectSettings } from '@/stores/selectors';

export const SimulationManager: React.FC = () => {
    const settings = useAppStore(selectSettings);
    const advanceSimulation = useAppStore(state => state.advanceSimulation);
    const intervalRef = useRef<number | null>(null);

    // Time-based simulation logic
    useEffect(() => {
        const runSimulation = () => {
            if (document.hidden) return;
            advanceSimulation();
        };

        const stopInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        const startInterval = () => {
            stopInterval();
            if (settings.simulationSettings.autoAdvance) {
                const speedInMinutes = { '1x': 5, '2x': 2.5, '5x': 1, '10x': 0.5, '20x': 0.25 }[settings.simulationSettings.speed] || 5;
                intervalRef.current = window.setInterval(runSimulation, speedInMinutes * 60 * 1000);
            }
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // When tab becomes visible, run a catch-up simulation immediately
                advanceSimulation();
                // Then restart the interval
                startInterval();
            } else {
                // When tab is hidden, clear the interval to save resources
                stopInterval();
            }
        };

        // Run once on load to catch up
        advanceSimulation();
        startInterval();

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopInterval();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [settings.simulationSettings.autoAdvance, settings.simulationSettings.speed, advanceSimulation]);

    return null; // This component renders nothing
};