import React, { useEffect, useRef } from 'react';
// FIX: Using both stores is not ideal, but necessary for the transition.
// `useAppStore` is kept for settings, `useAppDispatch` for Redux actions.
import { useAppSelector } from '@/stores/store';
import { useAppDispatch } from '@/stores/store';
import { tick } from '@/stores/slices/simulationSlice';

/**
 * A non-rendering component that manages the core simulation loop.
 * It uses requestAnimationFrame for smooth, efficient updates and is
 * internally reactive to settings changes from the Zustand store.
 */
export const SimulationController: React.FC = () => {
    const { autoAdvance, speed } = useAppSelector(state => state.settings.settings.simulationSettings);
    const dispatch = useAppDispatch();
    const rafId = useRef<number | null>(null);
    const lastFrameTime = useRef(performance.now());

    const loop = (now: number) => {
        const deltaTime = now - lastFrameTime.current;
        lastFrameTime.current = now;

        dispatch(tick({ deltaTime }));

        rafId.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        if (autoAdvance) {
            lastFrameTime.current = performance.now();
            rafId.current = requestAnimationFrame(loop);
        } else {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
        }

        return () => {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, [autoAdvance, speed, dispatch]); // Rerun effect if settings change

    return null; // This component does not render any UI
};