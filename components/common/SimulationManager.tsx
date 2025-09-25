import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export const SimulationManager: React.FC = () => {
    const { advanceDay, settings } = useAppStore(state => ({
        advanceDay: state.advanceDay,
        settings: state.settings.simulationSettings
    }));
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (settings.autoAdvance) {
            const speedInMs = {
                '1x': 5 * 60 * 1000, // 5 minutes
                '2x': 2.5 * 60 * 1000,
                '4x': 1.25 * 60 * 1000,
            }[settings.speed] || 5 * 60 * 1000;

            intervalRef.current = window.setInterval(() => {
                console.log('[SimulationManager] Auto-advancing day...');
                advanceDay();
            }, speedInMs);
        }

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
            }
        };
    }, [settings.autoAdvance, settings.speed, advanceDay]);

    return null; // This component does not render any UI
};